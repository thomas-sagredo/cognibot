# whatsapp_service.py — Motor de flujos CogniBot
import re
import requests
import json
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from models import WhatsAppIntegration, Conversation, Message, Chatbot, Analytics
from datetime import datetime


# ─── INTERPOLACIÓN DE VARIABLES ──────────────────────────────────────────────
def interpolate(text: str, variables: Dict[str, str]) -> str:
    """Reemplaza {{variable}} con su valor en el diccionario de sesión."""
    def replacer(match):
        key = match.group(1)
        return variables.get(key, f"{{{{{key}}}}}")
    return re.sub(r'\{\{(\w+)\}\}', replacer, text or '')


# ─── NAVEGACIÓN POR EDGES ─────────────────────────────────────────────────────
def find_next_node(current_node_id: str, edges: List[Dict], nodes: List[Dict],
                   source_handle: Optional[str] = None) -> Optional[Dict]:
    """
    Encuentra el siguiente nodo. Si se especifica source_handle,
    busca el edge de esa opción específica (para nodos de opciones con ramificación).
    """
    if source_handle:
        edge = next(
            (e for e in edges
             if e.get("source") == current_node_id and e.get("sourceHandle") == source_handle),
            None
        )
    else:
        edge = next((e for e in edges if e.get("source") == current_node_id), None)

    if not edge:
        return None
    return next((n for n in nodes if n["id"] == edge["target"]), None)


# ─── CLASE PRINCIPAL ─────────────────────────────────────────────────────────
class WhatsAppService:
    def __init__(self):
        self.api_base_url = "https://graph.facebook.com/v19.0"

    # ── Envío de mensajes ──────────────────────────────────────────────────

    def send_message(self, phone_number_id: str, access_token: str,
                     to: str, message_data: Dict) -> bool:
        """Envía un mensaje a través de WhatsApp Business API."""
        url = f"{self.api_base_url}/{phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }
        payload = {"messaging_product": "whatsapp", "to": to, **message_data}
        try:
            response = requests.post(url, headers=headers, json=payload, timeout=(5, 10))
            if response.status_code == 200:
                print(f"✅ Mensaje enviado a {to}")
                return True
            else:
                print(f"❌ Error enviando mensaje: {response.status_code} — {response.text}")
                return False
        except requests.Timeout:
            print(f"⏱️ Timeout enviando mensaje a {to}")
            return False
        except Exception as e:
            print(f"💥 Error en send_message: {e}")
            return False

    def send_text_message(self, phone_number_id: str, access_token: str,
                          to: str, text: str) -> bool:
        """Envía un mensaje de texto simple."""
        return self.send_message(phone_number_id, access_token, to, {
            "type": "text",
            "text": {"body": text}
        })

    def send_interactive_buttons(self, phone_number_id: str, access_token: str,
                                 to: str, text: str, buttons: List[Dict]) -> bool:
        """
        Envía un mensaje con hasta 3 botones interactivos (wa_buttons / option).
        Cada button: {"id": "opt-xxx", "label": "Texto"}
        """
        wa_buttons = []
        for btn in buttons[:3]:
            wa_buttons.append({
                "type": "reply",
                "reply": {
                    "id": btn.get("id", f"btn_{len(wa_buttons)}"),
                    "title": (btn.get("label") or btn.get("text") or f"Opción {len(wa_buttons)+1}")[:20]
                }
            })
        return self.send_message(phone_number_id, access_token, to, {
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": text},
                "action": {"buttons": wa_buttons}
            }
        })

    def send_list_message(self, phone_number_id: str, access_token: str,
                          to: str, text: str, button_title: str,
                          options: List[Dict]) -> bool:
        """Envía un mensaje con lista interactiva (wa_list)."""
        rows = [
            {"id": opt.get("id", f"item_{i}"), "title": (opt.get("label") or opt.get("text") or f"Item {i}")[:24]}
            for i, opt in enumerate(options[:10])
        ]
        return self.send_message(phone_number_id, access_token, to, {
            "type": "interactive",
            "interactive": {
                "type": "list",
                "body": {"text": text},
                "action": {
                    "button": button_title[:20] or "Ver opciones",
                    "sections": [{"rows": rows}]
                }
            }
        })

    # ── Procesamiento de mensajes entrantes ───────────────────────────────

    def process_incoming_message(self, webhook_data: Dict, db: Session) -> bool:
        """Procesa un mensaje entrante de WhatsApp (payload del webhook de Meta)."""
        try:
            entry = webhook_data.get("entry", [{}])[0]
            changes = entry.get("changes", [{}])[0]
            value = changes.get("value", {})

            messages = value.get("messages", [])
            if not messages:
                return True  # Puede ser status update, ignorar

            message = messages[0]
            from_number = message.get("from")
            message_id = message.get("id")

            # Extraer texto del mensaje (texto directo o respuesta de botón/lista)
            msg_type = message.get("type", "text")
            if msg_type == "text":
                message_text = message.get("text", {}).get("body", "")
                button_reply_id = None
            elif msg_type == "interactive":
                interactive = message.get("interactive", {})
                if interactive.get("type") == "button_reply":
                    button_reply_id = interactive["button_reply"].get("id")
                    message_text = interactive["button_reply"].get("title", "")
                elif interactive.get("type") == "list_reply":
                    button_reply_id = interactive["list_reply"].get("id")
                    message_text = interactive["list_reply"].get("title", "")
                else:
                    button_reply_id = None
                    message_text = ""
            else:
                message_text = ""
                button_reply_id = None

            phone_number_id = value.get("metadata", {}).get("phone_number_id")

            # Buscar integración activa
            integration = db.query(WhatsAppIntegration).filter(
                WhatsAppIntegration.phone_number_id == phone_number_id,
                WhatsAppIntegration.activo == True
            ).first()
            if not integration:
                print(f"❌ No se encontró integración para phone_number_id={phone_number_id}")
                return False

            # Buscar o crear conversación activa
            conversation = db.query(Conversation).filter(
                Conversation.chatbot_id == integration.chatbot_id,
                Conversation.user_phone == from_number,
                Conversation.estado == "active"
            ).first()

            if not conversation:
                conversation = Conversation(
                    chatbot_id=integration.chatbot_id,
                    user_phone=from_number,
                    user_name=value.get("contacts", [{}])[0].get("profile", {}).get("name", "Usuario"),
                    current_node_id=None,
                    session_variables={}
                )
                db.add(conversation)
                db.commit()
                db.refresh(conversation)

            # Guardar mensaje del usuario
            db.add(Message(
                conversation_id=conversation.id,
                message_id=message_id,
                sender_type="user",
                content=message_text
            ))

            # Ejecutar motor de flujo
            self.process_chatbot_flow(conversation, message_text, button_reply_id, db)

            db.commit()
            return True

        except Exception as e:
            print(f"💥 Error procesando mensaje entrante: {e}")
            import traceback; traceback.print_exc()
            db.rollback()
            return False

    # ── Motor de flujos ───────────────────────────────────────────────────

    def process_chatbot_flow(self, conversation: Conversation, user_input: str,
                              button_reply_id: Optional[str], db: Session):
        """
        Motor principal. Avanza el flujo según el nodo actual y la entrada del usuario.
        """
        try:
            chatbot = db.query(Chatbot).filter(Chatbot.id == conversation.chatbot_id).first()
            if not chatbot or not chatbot.configuracion:
                return

            nodes: List[Dict] = chatbot.configuracion.get("nodes", [])
            edges: List[Dict] = chatbot.configuracion.get("edges", [])
            vars_: Dict[str, str] = conversation.session_variables or {}

            # ── Primera interacción: ir al nodo start ─────────────────────
            if not conversation.current_node_id:
                start = next((n for n in nodes if n.get("type") == "start"), None)
                if start:
                    conversation.current_node_id = start["id"]
                    self._execute_node(conversation, start, nodes, edges, vars_, db)
                return

            # ── Nodo actual ───────────────────────────────────────────────
            current = next((n for n in nodes if n["id"] == conversation.current_node_id), None)
            if not current:
                return

            node_type = current.get("type")

            # ── Nodo input: guardar respuesta en variable ─────────────────
            if node_type == "input":
                var_name = current.get("data", {}).get("variableName")
                if var_name and user_input:
                    vars_[var_name] = user_input
                    conversation.session_variables = dict(vars_)
                next_node = find_next_node(current["id"], edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            # ── Nodo option / wa_buttons: usuario eligió una opción ───────
            elif node_type in ("option", "wa_buttons"):
                options = current.get("data", {}).get("options") or current.get("data", {}).get("waButtons") or []
                matched_option = None

                # Primero intentar matching por ID (respuesta de botón)
                if button_reply_id:
                    matched_option = next((o for o in options if o.get("id") == button_reply_id), None)

                # Fallback: matching por texto (case-insensitive)
                if not matched_option and user_input:
                    matched_option = next(
                        (o for o in options
                         if user_input.strip().lower() == (o.get("label") or o.get("text") or "").strip().lower()),
                        None
                    )
                    # Matching parcial si aún no encontró
                    if not matched_option:
                        matched_option = next(
                            (o for o in options
                             if user_input.strip().lower() in (o.get("label") or o.get("text") or "").strip().lower()),
                            None
                        )

                if matched_option:
                    # Navegar por el edge con el sourceHandle correcto
                    next_node = find_next_node(current["id"], edges, nodes, source_handle=matched_option["id"])
                    if not next_node:
                        next_node = find_next_node(current["id"], edges, nodes)
                    if next_node:
                        conversation.current_node_id = next_node["id"]
                        self._execute_node(conversation, next_node, nodes, edges, vars_, db)
                else:
                    # Opción inválida → re-enviar el mismo nodo
                    self._execute_node(conversation, current, nodes, edges, vars_, db)

            # ── Nodo wa_list: lista interactiva ───────────────────────────
            elif node_type == "wa_list":
                next_node = find_next_node(current["id"], edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            # ── Otros nodos que esperan entrada del usuario ───────────────
            else:
                next_node = find_next_node(current["id"], edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

        except Exception as e:
            print(f"💥 Error en process_chatbot_flow: {e}")
            import traceback; traceback.print_exc()

    def _execute_node(self, conversation: Conversation, node: Dict,
                      nodes: List[Dict], edges: List[Dict],
                      vars_: Dict[str, str], db: Session):
        """
        Ejecuta un nodo: envía el mensaje correspondiente y avanza al siguiente
        si no necesita esperar respuesta del usuario.
        """
        try:
            integration = db.query(WhatsAppIntegration).filter(
                WhatsAppIntegration.chatbot_id == conversation.chatbot_id,
                WhatsAppIntegration.activo == True
            ).first()
            if not integration:
                print("❌ No hay integración activa")
                return

            pid = integration.phone_number_id
            tok = integration.access_token
            to = conversation.user_phone
            d = node.get("data", {})
            ntype = node.get("type")
            nid = node["id"]

            # ──────────────────────────────────────────────────────────────
            if ntype in ("start", "message"):
                text = interpolate(d.get("text") or "¡Hola! ¿En qué puedo ayudarte?", vars_)
                self.send_text_message(pid, tok, to, text)
                self._save_bot_msg(conversation, text, nid, db)
                # Avanzar automáticamente
                next_node = find_next_node(nid, edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            elif ntype in ("option", "wa_buttons"):
                text = interpolate(d.get("text") or "¿Qué opción elegís?", vars_)
                options = d.get("options") or d.get("waButtons") or []
                if options:
                    self.send_interactive_buttons(pid, tok, to, text, options)
                else:
                    self.send_text_message(pid, tok, to, text)
                self._save_bot_msg(conversation, text, nid, db)
                # Esperar entrada del usuario → no avanzar

            elif ntype == "wa_list":
                text = interpolate(d.get("text") or "Seleccioná una opción:", vars_)
                btn_title = d.get("waListTitle") or "Ver opciones"
                # Armar opciones simples de la lista
                list_opts = [{"id": "list-1", "label": btn_title}]
                self.send_list_message(pid, tok, to, text, btn_title, list_opts)
                self._save_bot_msg(conversation, text, nid, db)
                # Esperar entrada del usuario

            elif ntype == "input":
                text = interpolate(d.get("text") or "Por favor escribí tu respuesta:", vars_)
                self.send_text_message(pid, tok, to, text)
                self._save_bot_msg(conversation, text, nid, db)
                # Esperar entrada del usuario → no avanzar

            elif ntype == "action":
                # Asignar variable
                var_name = d.get("variableName")
                var_value = interpolate(d.get("variableValue") or "", vars_)
                if var_name:
                    vars_[var_name] = var_value
                    conversation.session_variables = dict(vars_)
                # Avanzar automáticamente
                next_node = find_next_node(nid, edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            elif ntype == "condition":
                var_val = vars_.get(d.get("variableName") or "", "").lower()
                expected = (d.get("variableValue") or "").lower()
                is_true = var_val == expected
                # Buscar edge con sourceHandle "true" o "false"
                handle = "true" if is_true else "false"
                next_node = find_next_node(nid, edges, nodes, source_handle=handle)
                if not next_node:
                    next_node = find_next_node(nid, edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            elif ntype == "delay":
                # En producción real haría un sleep async; aquí simplemente avanzamos
                secs = d.get("delaySeconds") or 1
                text = f"⏳ (pausa de {secs}s)"
                self._save_bot_msg(conversation, text, nid, db)
                next_node = find_next_node(nid, edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            elif ntype == "webhook":
                url = interpolate(d.get("webhookUrl") or "", vars_)
                method = d.get("webhookMethod") or "GET"
                response_var = d.get("webhookResponseVar")
                self._save_bot_msg(conversation, f"🌐 Consultando {url}...", nid, db)
                try:
                    if method == "POST":
                        body_str = interpolate(d.get("webhookBody") or "{}", vars_)
                        resp = requests.post(url, json=json.loads(body_str), timeout=8)
                    else:
                        resp = requests.get(url, timeout=8)
                    result = resp.text[:500]
                    if response_var:
                        vars_[response_var] = result
                        conversation.session_variables = dict(vars_)
                    self._save_bot_msg(conversation, f"✅ API respondió correctamente", nid, db)
                except Exception as we:
                    print(f"⚠ Webhook error: {we}")
                    if response_var:
                        vars_[response_var] = "(error en API)"
                        conversation.session_variables = dict(vars_)
                next_node = find_next_node(nid, edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            elif ntype == "end":
                text = interpolate(d.get("text") or "Conversación finalizada. ¡Hasta luego! 👋", vars_)
                self.send_text_message(pid, tok, to, text)
                self._save_bot_msg(conversation, text, nid, db)
                conversation.estado = "completed"

            elif ntype == "note":
                # Las notas son decorativas — se ignoran en ejecución
                next_node = find_next_node(nid, edges, nodes)
                if next_node:
                    conversation.current_node_id = next_node["id"]
                    self._execute_node(conversation, next_node, nodes, edges, vars_, db)

            # Analytics
            db.add(Analytics(
                chatbot_id=conversation.chatbot_id,
                metric_type=f"node_executed_{ntype}",
                extra_data={"node_id": nid, "conversation_id": conversation.id}
            ))

        except Exception as e:
            print(f"💥 Error ejecutando nodo {node.get('id')}: {e}")
            import traceback; traceback.print_exc()

    def _save_bot_msg(self, conversation: Conversation, content: str, node_id: str, db: Session):
        """Persiste un mensaje del bot en la base de datos."""
        db.add(Message(
            conversation_id=conversation.id,
            sender_type="bot",
            content=content,
            node_id=node_id
        ))


# Instancia global
whatsapp_service = WhatsAppService()
