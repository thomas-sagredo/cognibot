/**
 * ChatbotFlowBuilder — Constructor visual de flujos de chatbot
 * 
 * Diseño tipo diagrama de flujo (Treble.ai-style):
 * - Nodos arrastrables, zoom, pan
 * - Nodos de opciones con handles POR OPCIÓN para ramificación real
 * - Panel de propiedades por tipo de nodo
 * - Vista previa estilo WhatsApp
 * - Carga y guarda en la API
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, addEdge,
    Controls, Background, BackgroundVariant, MiniMap,
    Connection, Edge, Node, MarkerType, Handle, Position, NodeProps,
    EdgeLabelRenderer, BaseEdge, getSmoothStepPath, EdgeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { WhatsAppSetupPanel } from './WhatsAppSetupPanel';
import {
    Bot, Save, Play, X, Plus, Loader2, Check,
    AlertCircle, Send, RotateCcw, Trash2,
    Download, Upload, Shuffle, Copy, Undo2, Redo2, ChevronDown,
    Globe, StickyNote, Zap, CheckCircle2, XCircle,
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

// ─── TIPOS ─────────────────────────────────────────────────────────────────────
interface FlowOption { id: string; label: string }
interface FND {
    label: string;
    text?: string;
    options?: FlowOption[];
    variableName?: string;
    variableValue?: string;
    delaySeconds?: number;
    // Webhook
    webhookUrl?: string;
    webhookMethod?: 'GET' | 'POST';
    webhookResponseVar?: string;
    webhookBody?: string;
    // WA specific
    waButtons?: Array<{ id: string; label: string }>;
    waListTitle?: string;
    waListSections?: Array<{ title: string; items: Array<{ id: string; label: string }> }>;
    imageUrl?: string;
    // Note
    noteColor?: string;
    noteText?: string;
    [key: string]: unknown;
}

// ─── TEMA ──────────────────────────────────────────────────────────────────────
const THEME: Record<string, { bg: string; border: string; icon: string; light: string }> = {
    start: { bg: '#2563eb', border: '#93c5fd', icon: '🤖', light: '#eff6ff' },
    message: { bg: '#0284c7', border: '#7dd3fc', icon: '💬', light: '#f0f9ff' },
    option: { bg: '#16a34a', border: '#86efac', icon: '📋', light: '#f0fdf4' },
    input: { bg: '#0d9488', border: '#5eead4', icon: '⌨️', light: '#f0fdfa' },
    condition: { bg: '#d97706', border: '#fcd34d', icon: '🔀', light: '#fffbeb' },
    action: { bg: '#ea580c', border: '#fdba74', icon: '⚡', light: '#fff7ed' },
    delay: { bg: '#7c3aed', border: '#c4b5fd', icon: '⏳', light: '#faf5ff' },
    end: { bg: '#dc2626', border: '#fca5a5', icon: '🏁', light: '#fef2f2' },
    // Nuevos tipos
    wa_buttons: { bg: '#128C7E', border: '#25d366', icon: '🔘', light: '#f0fdf4' },
    wa_list: { bg: '#075E54', border: '#34B7F1', icon: '📑', light: '#eff9ff' },
    webhook: { bg: '#6d28d9', border: '#c4b5fd', icon: '🌐', light: '#f5f3ff' },
    note: { bg: '#ca8a04', border: '#fde68a', icon: '📝', light: '#fefce8' },
};

// ─── i18n (ES/EN) ──────────────────────────────────────────────────────────────
type Lang = 'es' | 'en';
const I18N: Record<Lang, Record<string, string>> = {
    es: {
        save: 'Guardar', update: 'Actualizar', preview: 'Vista previa',
        addBlock: 'Agregar bloque', blockName: 'Nombre del bloque',
        welcome: 'Mensaje de bienvenida', closing: 'Mensaje de cierre', message: 'Mensaje',
        question: 'Pregunta', options: 'Opciones', addOpt: 'Agregar',
        freeAnswer: 'Pregunta libre', saveVar: 'Guardar respuesta en variable',
        condition: 'Condición', variable: 'Variable', expected: 'Valor esperado',
        action: 'Acción', assign: 'Asignar variable', value: 'Valor',
        delay: 'Segundos de espera', done: 'Listo', configure: 'Configurar bloque',
        noOptions: 'Sin opciones — hacé clic en Agregar',
        validFlow: 'Flujo válido ✓', sortDiagram: 'Ordenar diagrama',
        noConn: 'sin conectar', saved: 'Guardado',
        webhookUrl: 'URL del webhook', webhookMethod: 'Método HTTP',
        webhookResponseVar: 'Variable para guardar respuesta', webhookBody: 'Cuerpo (JSON)',
        waButtons: 'Botones WA (máx. 3)', waListTitle: 'Título de la lista',
        noteContent: 'Contenido de la nota', noteColor: 'Color de fondo',
        validate: 'Validar flujo', imageUrl: 'URL de imagen',
        validationOk: 'Flujo sin errores ✓',
        noStart: '⚠ No hay nodo de inicio',
        noEnd: '⚠ No hay nodo de fin',
        orphan: 'Nodo inalcanzable',
        noExit: 'Nodo sin salida',
    },
    en: {
        save: 'Save', update: 'Update', preview: 'Preview',
        addBlock: 'Add block', blockName: 'Block name',
        welcome: 'Welcome message', closing: 'Closing message', message: 'Message',
        question: 'Question', options: 'Options', addOpt: 'Add',
        freeAnswer: 'Free answer', saveVar: 'Save answer in variable',
        condition: 'Condition', variable: 'Variable', expected: 'Expected value',
        action: 'Action', assign: 'Assign variable', value: 'Value',
        delay: 'Wait seconds', done: 'Done', configure: 'Configure block',
        noOptions: 'No options — click Add',
        validFlow: 'Valid flow ✓', sortDiagram: 'Sort diagram',
        noConn: 'unconnected', saved: 'Saved',
        webhookUrl: 'Webhook URL', webhookMethod: 'HTTP Method',
        webhookResponseVar: 'Variable to save response', webhookBody: 'Body (JSON)',
        waButtons: 'WA Buttons (max 3)', waListTitle: 'List title',
        noteContent: 'Note content', noteColor: 'Background color',
        validate: 'Validate flow', imageUrl: 'Image URL',
        validationOk: 'No flow errors ✓',
        noStart: '⚠ No start node',
        noEnd: '⚠ No end node',
        orphan: 'Unreachable node',
        noExit: 'Node without output',
    },
};

// Alturas fijas para calcular posición de handles en opción
const OPTION_HEADER_H = 38;  // header del nodo
const OPTION_BODY_PAD = 10;  // padding top del body
const OPTION_ROW_H = 32;     // altura de cada fila de opción

// ─── NODO DE FLUJO ─────────────────────────────────────────────────────────────
const FlowNode: React.FC<NodeProps> = ({ data, id, type, selected }) => {
    const d = data as FND;
    const th = THEME[type || 'message'] || THEME.message;
    const isStart = type === 'start';
    const isEnd = type === 'end';
    const isOption = type === 'option';
    const opts: FlowOption[] = isOption && Array.isArray(d.options) ? d.options : [];

    const onAdd = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('flow:add', { detail: { srcId: id } }));
    };
    const onDel = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('flow:del', { detail: { id } }));
    };

    return (
        // Wrapper EXTERNO — sin overflow oculto, para que los handles sean detectables
        <div className="relative" style={{ minWidth: 220 }}>

            {/* HANDLE DE ENTRADA — fuera del card con overflow-hidden */}
            {!isStart && (
                <Handle
                    type="target"
                    position={Position.Top}
                    style={{ width: 12, height: 12, background: '#475569', border: '2px solid white', top: -6 }}
                />
            )}

            {/* ── TARJETA ─────────────────────────────────────────────────────── */}
            <div
                style={{ border: `2px solid ${th.border}`, borderRadius: 12, background: 'white', overflow: 'hidden' }}
                className={`shadow-md transition-all ${selected ? 'shadow-xl ring-2 ring-offset-2 ring-blue-400' : 'hover:shadow-lg'}`}
            >
                {/* Header */}
                <div style={{ background: th.bg, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 8, height: OPTION_HEADER_H }}>
                    <span style={{ fontSize: 16 }}>{th.icon}</span>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.label}
                    </span>
                    {!isStart && !isEnd && (
                        <button onClick={onDel} style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1 }} className="hover:text-white transition-colors">
                            <X size={13} />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div style={{ padding: OPTION_BODY_PAD, background: 'white' }}>
                    {!isOption && (
                        d.text
                            ? <p style={{ fontSize: 13, color: '#374151', margin: 0 }} className="line-clamp-3 whitespace-pre-wrap">{d.text}</p>
                            : <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic', margin: 0 }}>
                                {selected ? 'Configurá en el panel →' : 'Clic para configurar'}
                            </p>
                    )}

                    {isOption && (
                        <>
                            {d.text && <p style={{ fontSize: 13, color: '#374151', marginBottom: 6 }}>{d.text}</p>}
                            {opts.length === 0
                                ? <p style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Sin opciones — configurá en el panel</p>
                                : opts.map((opt, i) => (
                                    <div
                                        key={opt.id}
                                        style={{
                                            height: OPTION_ROW_H,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            borderRadius: 8,
                                            background: '#f0fdf4',
                                            padding: '0 8px',
                                            marginBottom: i < opts.length - 1 ? 4 : 0,
                                            border: '1px solid #86efac',
                                        }}
                                    >
                                        <span style={{
                                            width: 18, height: 18, borderRadius: '50%', background: th.bg,
                                            color: 'white', fontSize: 10, fontWeight: 700,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>{i + 1}</span>
                                        <span style={{ fontSize: 12, color: '#166534', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {opt.label || <em>Opción {i + 1}</em>}
                                        </span>
                                        <span style={{ fontSize: 10, color: '#86efac' }}>─○</span>
                                    </div>
                                ))
                            }
                        </>
                    )}

                    {type === 'delay' && d.delaySeconds !== undefined && (
                        <p style={{ fontSize: 12, color: th.bg, fontWeight: 600, margin: 0 }}>⏱ {d.delaySeconds}s de espera</p>
                    )}

                    {type === 'wa_buttons' && (
                        <div>
                            {d.text && <p style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>{d.text}</p>}
                            {(d.waButtons || []).slice(0, 3).map(btn => (
                                <div key={btn.id} style={{ border: '1px solid #25D366', borderRadius: 6, padding: '4px 10px', marginBottom: 3, fontSize: 12, color: '#075E54', fontWeight: 600, textAlign: 'center' }}>{btn.label}</div>
                            ))}
                            {!(d.waButtons?.length) && <p style={{ fontSize: 11, color: '#9ca3af', fontStyle: 'italic' }}>Sin botones configurados</p>}
                        </div>
                    )}

                    {type === 'wa_list' && (
                        <div>
                            {d.text && <p style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>{d.text}</p>}
                            <div style={{ border: '1px solid #34B7F1', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#075E54' }}>
                                📑 {d.waListTitle || 'Lista de opciones'}
                            </div>
                        </div>
                    )}

                    {type === 'webhook' && (
                        <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#6d28d9', marginBottom: 2 }}>
                                {d.webhookMethod || 'POST'} 🌐
                            </div>
                            <p style={{ fontSize: 11, color: '#374151', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                                {d.webhookUrl || <em style={{ color: '#9ca3af' }}>URL no configurada</em>}
                            </p>
                            {d.webhookResponseVar && <p style={{ fontSize: 10, color: '#7c3aed', margin: '3px 0 0' }}>→ {`{{${d.webhookResponseVar}}}`}</p>}
                        </div>
                    )}
                </div>
            </div>
            {/* ── FIN TARJETA ────────────────────────────────────────────────── */}

            {/* HANDLES POR OPCION — Position.Bottom con left% es más confiable para drag */}
            {isOption && opts.length > 0 && opts.map((opt, i) => {
                const total = opts.length;
                const leftPct = total === 1 ? 50 : 10 + Math.round((i * 80) / (total - 1));
                return (
                    <Handle
                        key={opt.id}
                        type="source"
                        position={Position.Bottom}
                        id={opt.id}
                        title={`Conectar: ${opt.label || `Opción ${i + 1}`}`}
                        style={{
                            width: 14,
                            height: 14,
                            background: th.bg,
                            border: '2px solid white',
                            left: `${leftPct}%`,
                            bottom: -7,
                            zIndex: 10,
                        }}
                    />
                );
            })}

            {/* HANDLE DE SALIDA ESTÁNDAR + botón + (para todo excepto end y option) */}
            {!isEnd && !isOption && (
                <div
                    className="flex flex-col items-center"
                    style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
                >
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        style={{ width: 12, height: 12, background: '#475569', border: '2px solid white', position: 'relative', top: 'auto', left: 'auto', transform: 'none' }}
                    />
                    <button
                        onClick={onAdd}
                        className="flex items-center justify-center hover:opacity-80 hover:scale-110 transition-all"
                        style={{ marginTop: 4, width: 24, height: 24, borderRadius: '50%', background: th.bg, color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                        title="Agregar siguiente bloque"
                    >
                        <Plus size={12} />
                    </button>
                </div>
            )}

            {/* Botón + para option (agregar nodo genérico después de las opciones) */}
            {isOption && (
                <div className="flex justify-center" style={{ marginTop: 6 }}>
                    <button
                        onClick={onAdd}
                        className="flex items-center justify-center hover:opacity-80 hover:scale-110 transition-all"
                        style={{ width: 24, height: 24, borderRadius: '50%', background: th.bg, color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                        title="Agregar bloque siguiente"
                    >
                        <Plus size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};

// ─── NODO DE NOTA (sin handles) ───────────────────────────────────────────────
const NoteNode: React.FC<NodeProps> = ({ data, selected }) => {
    const d = data as FND;
    const bg = (d.noteColor as string) || '#fef9c3';
    return (
        <div style={{
            background: bg, border: `2px solid ${selected ? '#ca8a04' : '#fde68a'}`,
            borderRadius: 10, padding: 12, minWidth: 180, maxWidth: 280,
            boxShadow: selected ? '0 0 0 3px #fcd34d55' : '2px 3px 8px rgba(0,0,0,0.12)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>📝</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nota</span>
            </div>
            <p style={{ fontSize: 13, color: '#78350f', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {(d.noteText as string) || (d.text as string) || <em style={{ opacity: 0.5 }}>Clic para escribir...</em>}
            </p>
        </div>
    );
};

// ─── PANEL DE PROPIEDADES ─────────────────────────────────────────────────────
const PropertiesPanel: React.FC<{
    node: Node | null;
    onUpdate: (id: string, data: Partial<FND>) => void;
    onClose: () => void;
}> = ({ node, onUpdate, onClose }) => {
    const [d, setD] = useState<FND>({ label: '' });
    useEffect(() => { if (node) setD((node.data as FND) || { label: '' }); }, [node?.id]);
    if (!node) return null;

    const t = node.type || 'message';
    const th = THEME[t] || THEME.message;

    const ch = (key: keyof FND, val: unknown) => {
        const next = { ...d, [key]: val } as FND;
        setD(next);
        onUpdate(node.id, next);
    };

    const addOpt = () => {
        const opts = [...(d.options || [])];
        if (opts.length >= 10) return toast.warning('Máximo 10 opciones');
        opts.push({ id: `opt-${Date.now()}`, label: '' });
        ch('options', opts);
    };
    const delOpt = (i: number) => { const o = [...(d.options || [])]; o.splice(i, 1); ch('options', o); };
    const updOpt = (i: number, label: string) => {
        const o = (d.options || []).map((x, j) => j === i ? { ...x, label } : x);
        ch('options', o);
    };

    const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 mt-1';
    const textareaCls = `${inputCls} resize-none`;
    const labelCls = 'text-xs font-semibold text-gray-500 uppercase tracking-wide';

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl overflow-hidden" style={{ width: 300, flexShrink: 0 }}>
            <div style={{ background: th.bg }} className="px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-xs text-white/70 font-medium">Configurar bloque</p>
                    <p className="text-white font-bold text-sm">{th.icon} {d.label}</p>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-all">
                    <X size={16} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Nombre */}
                <div>
                    <label className={labelCls}>Nombre del bloque</label>
                    <input className={inputCls} value={d.label || ''} onChange={e => ch('label', e.target.value)} placeholder="Ej: Bienvenida" />
                </div>

                {/* Texto para start/message/end */}
                {(t === 'start' || t === 'message' || t === 'end') && (
                    <div>
                        <label className={labelCls}>
                            {t === 'start' ? 'Mensaje de bienvenida' : t === 'end' ? 'Mensaje de cierre' : 'Mensaje'}
                        </label>
                        <textarea className={textareaCls} rows={5} value={d.text || ''} onChange={e => ch('text', e.target.value)}
                            placeholder="Escribe el mensaje que verá el usuario..." />
                        <p className="text-xs text-gray-400 mt-1">{(d.text || '').length} caracteres</p>
                    </div>
                )}

                {/* Opciones */}
                {t === 'option' && (
                    <>
                        <div>
                            <label className={labelCls}>Pregunta</label>
                            <textarea className={textareaCls} rows={3} value={d.text || ''} onChange={e => ch('text', e.target.value)} placeholder="¿Qué opción elegís?" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelCls}>Opciones ({(d.options || []).length}/10)</label>
                                <button onClick={addOpt} className="text-xs text-green-600 font-bold flex items-center gap-1 hover:underline">
                                    <Plus size={12} /> Agregar
                                </button>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700 mb-3">
                                💡 Cada opción tiene un <b>punto de conexión verde</b> (círculo a la derecha del nodo). Arrastrá desde ahí para conectar cada opción a un bloque distinto.
                            </div>
                            {(d.options || []).map((opt, i) => (
                                <div key={opt.id} className="flex items-center gap-2 mb-2">
                                    <span className="w-5 h-5 rounded-full text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                        style={{ background: th.bg }}>{i + 1}</span>
                                    <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                        value={opt.label} onChange={e => updOpt(i, e.target.value)} placeholder={`Opción ${i + 1}`} />
                                    <button onClick={() => delOpt(i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><X size={13} /></button>
                                </div>
                            ))}
                            {(d.options || []).length === 0 && (
                                <p className="text-xs text-gray-400 text-center py-2 border-2 border-dashed rounded-lg">Sin opciones — hacé clic en Agregar</p>
                            )}
                        </div>
                    </>
                )}

                {/* Input abierto */}
                {t === 'input' && (
                    <>
                        <div>
                            <label className={labelCls}>Pregunta al usuario</label>
                            <textarea className={textareaCls} rows={3} value={d.text || ''} onChange={e => ch('text', e.target.value)} placeholder="¿Cuál es tu nombre?" />
                        </div>
                        <div>
                            <label className={labelCls}>Guardar respuesta en variable</label>
                            <input className={inputCls} value={d.variableName || ''} onChange={e => ch('variableName', e.target.value)} placeholder="nombre_usuario" />
                        </div>
                    </>
                )}

                {/* Condición */}
                {t === 'condition' && (
                    <>
                        <div><label className={labelCls}>Variable</label>
                            <input className={inputCls} value={d.variableName || ''} onChange={e => ch('variableName', e.target.value)} placeholder="nombre_variable" /></div>
                        <div><label className={labelCls}>Valor esperado</label>
                            <input className={inputCls} value={d.variableValue || ''} onChange={e => ch('variableValue', e.target.value)} placeholder="sí" /></div>
                    </>
                )}

                {/* Acción */}
                {t === 'action' && (
                    <>
                        <div><label className={labelCls}>Asignar variable</label>
                            <input className={inputCls} value={d.variableName || ''} onChange={e => ch('variableName', e.target.value)} placeholder="nombre_variable" /></div>
                        <div><label className={labelCls}>Valor</label>
                            <input className={inputCls} value={d.variableValue || ''} onChange={e => ch('variableValue', e.target.value)} placeholder="valor" /></div>
                    </>
                )}

                {/* Delay */}
                {t === 'delay' && (
                    <div>
                        <label className={labelCls}>Segundos de espera</label>
                        <input type="number" min={1} max={300} className={inputCls}
                            value={d.delaySeconds ?? 3} onChange={e => ch('delaySeconds', parseInt(e.target.value) || 3)} />
                    </div>
                )}

                {/* Webhook */}
                {t === 'webhook' && (
                    <>
                        <div>
                            <label className={labelCls}>Método HTTP</label>
                            <select className={inputCls} value={d.webhookMethod || 'GET'} onChange={e => ch('webhookMethod', e.target.value)}>
                                <option>GET</option><option>POST</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>URL del webhook</label>
                            <input className={inputCls} value={d.webhookUrl || ''} onChange={e => ch('webhookUrl', e.target.value)} placeholder="https://api.ejemplo.com/datos" />
                        </div>
                        {(d.webhookMethod === 'POST' || !d.webhookMethod) && (
                            <div>
                                <label className={labelCls}>Cuerpo (JSON)</label>
                                <textarea className={textareaCls} rows={3} value={d.webhookBody || ''}
                                    onChange={e => ch('webhookBody', e.target.value)} placeholder='{"clave":"valor"}' />
                            </div>
                        )}
                        <div>
                            <label className={labelCls}>Guardar respuesta en variable</label>
                            <input className={inputCls} value={d.webhookResponseVar || ''} onChange={e => ch('webhookResponseVar', e.target.value)} placeholder="respuesta_api" />
                            <p className="text-xs text-purple-500 mt-1">Usa <b>{'{{respuesta_api}}'}</b> en mensajes siguientes</p>
                        </div>
                    </>
                )}

                {/* WA Buttons */}
                {t === 'wa_buttons' && (
                    <>
                        <div>
                            <label className={labelCls}>Mensaje del bot</label>
                            <textarea className={textareaCls} rows={3} value={d.text || ''} onChange={e => ch('text', e.target.value)} placeholder="¿Qué necesitás hacer?" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className={labelCls}>Botones WA (máx. 3)</label>
                                <button onClick={() => { const b = [...(d.waButtons || [])]; if (b.length >= 3) return; b.push({ id: `btn-${Date.now()}`, label: '' }); ch('waButtons', b); }}
                                    className="text-xs text-green-600 font-bold flex items-center gap-1 hover:underline">
                                    <Plus size={12} /> Agregar
                                </button>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-xs text-green-700 mb-2">
                                🔘 Botones interactivos nativos de WhatsApp Business
                            </div>
                            {(d.waButtons || []).map((btn: { id: string; label: string }, i: number) => (
                                <div key={btn.id} className="flex items-center gap-2 mb-2">
                                    <input className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                        value={btn.label} placeholder={`Botón ${i + 1}`}
                                        onChange={e => { const b = (d.waButtons || []).map((x: { id: string; label: string }, j: number) => j === i ? { ...x, label: e.target.value } : x); ch('waButtons', b); }} />
                                    <button onClick={() => { const b = [...(d.waButtons || [])]; b.splice(i, 1); ch('waButtons', b); }} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* WA List */}
                {t === 'wa_list' && (
                    <>
                        <div>
                            <label className={labelCls}>Mensaje del bot</label>
                            <textarea className={textareaCls} rows={3} value={d.text || ''} onChange={e => ch('text', e.target.value)} placeholder="Por favor seleccioná una opción:" />
                        </div>
                        <div>
                            <label className={labelCls}>Título del botón de lista</label>
                            <input className={inputCls} value={d.waListTitle || ''} onChange={e => ch('waListTitle', e.target.value)} placeholder="Ver opciones" />
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-700">
                            📑 Lista interactiva de WhatsApp — permite hasta 10 ítems en secciones
                        </div>
                    </>
                )}

                {/* Note */}
                {t === 'note' && (
                    <>
                        <div>
                            <label className={labelCls}>Contenido de la nota</label>
                            <textarea className={textareaCls} rows={5} value={(d.noteText as string) || d.text || ''}
                                onChange={e => { ch('noteText', e.target.value); ch('text', e.target.value); }}
                                placeholder="Escribí tu anotación..." />
                        </div>
                        <div>
                            <label className={labelCls}>Color de fondo</label>
                            <div className="flex gap-2 mt-1 flex-wrap">
                                {['#fef9c3', '#dcfce7', '#dbeafe', '#fce7f3', '#ffe4e6', '#f3e8ff'].map(c => (
                                    <button key={c} onClick={() => ch('noteColor', c)}
                                        style={{ width: 28, height: 28, background: c, border: `3px solid ${(d.noteColor as string) === c ? '#374151' : '#e5e7eb'}`, borderRadius: 6 }} />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="px-4 py-3 border-t bg-gray-50 flex-shrink-0">
                <button onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 text-white rounded-lg py-2 text-sm font-semibold transition-colors"
                    style={{ background: th.bg }}>
                    <Check size={14} /> Listo
                </button>
            </div>
        </div>
    );
};

// ─── MENÚ AGREGAR NODO ─────────────────────────────────────────────────────────
const MENU_CATEGORIES = [
    {
        label: 'Básicos',
        color: '#2563eb',
        badge: 'bg-blue-100 text-blue-700',
        items: [
            { type: 'message', label: 'Mensaje', desc: 'El bot envía texto', icon: '💬', color: '#0284c7' },
            { type: 'option', label: 'Opciones', desc: 'El usuario elige una opción', icon: '📋', color: '#16a34a' },
            { type: 'input', label: 'Pregunta libre', desc: 'El usuario escribe su respuesta', icon: '⌨️', color: '#0d9488' },
            { type: 'end', label: 'Finalizar', desc: 'Termina la conversación', icon: '🏁', color: '#dc2626' },
        ],
    },
    {
        label: 'Lógica',
        color: '#d97706',
        badge: 'bg-amber-100 text-amber-700',
        items: [
            { type: 'condition', label: 'Condición', desc: 'Bifurca según una variable', icon: '🔀', color: '#d97706' },
            { type: 'action', label: 'Acción', desc: 'Asigna o modifica una variable', icon: '⚡', color: '#ea580c' },
            { type: 'delay', label: 'Esperar', desc: 'Pausa el flujo N segundos', icon: '⏳', color: '#7c3aed' },
            { type: 'webhook', label: 'Webhook', desc: 'Llama una API externa', icon: '🌐', color: '#6d28d9' },
        ],
    },
    {
        label: 'WhatsApp',
        color: '#128C7E',
        badge: 'bg-green-100 text-green-800',
        items: [
            { type: 'wa_buttons', label: 'Botones WA', desc: 'Hasta 3 botones interactivos', icon: '🔘', color: '#128C7E' },
            { type: 'wa_list', label: 'Lista WA', desc: 'Menú desplegable interactivo', icon: '📑', color: '#075E54' },
        ],
    },
    {
        label: 'Canvas',
        color: '#ca8a04',
        badge: 'bg-yellow-100 text-yellow-800',
        items: [
            { type: 'note', label: 'Nota', desc: 'Anotación visual (no afecta el flujo)', icon: '📝', color: '#ca8a04' },
        ],
    },
];

// Flat list para compatibilidad con handleAddNode
const MENU_ITEMS = MENU_CATEGORIES.flatMap(c => c.items);

const AddMenu: React.FC<{
    pos: { x: number; y: number };
    onAdd: (t: string, l: string) => void;
    onClose: () => void;
}> = ({ pos, onAdd, onClose }) => {
    // Detectar si el menu entra por debajo o por la derecha
    const menuH = 520;
    const menuW = 280;
    const left = Math.min(pos.x, window.innerWidth - menuW - 8);
    const top = Math.min(pos.y, window.innerHeight - menuH - 8);

    return (
        <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            style={{ left, top, width: menuW, maxHeight: menuH }}
        >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between flex-shrink-0">
                <div>
                    <p className="text-white font-bold text-sm leading-none">Agregar bloque</p>
                    <p className="text-blue-200 text-xs mt-0.5">Arrastrá o hacé clic para agregar</p>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all">
                    <X size={14} />
                </button>
            </div>

            {/* Categorias */}
            <div className="overflow-y-auto flex-1 py-2">
                {MENU_CATEGORIES.map(cat => (
                    <div key={cat.label} className="mb-1">
                        {/* Category label */}
                        <div className="px-3 py-1.5 flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${cat.badge}`}>
                                {cat.label}
                            </span>
                            <div className="flex-1 h-px bg-gray-100" />
                        </div>
                        {/* Items */}
                        {cat.items.map(item => (
                            <button
                                key={item.type}
                                onClick={() => { onAdd(item.type, item.label); onClose(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left group"
                            >
                                {/* Color bar */}
                                <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ background: item.color }} />
                                {/* Icon */}
                                <span className="text-lg w-7 text-center flex-shrink-0" role="img">{item.icon}</span>
                                {/* Text */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors leading-tight">{item.label}</p>
                                    <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">{item.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── SIMULADOR ESTILO WHATSAPP ─────────────────────────────────────────────────
interface SimMsg { id: string; from: 'bot' | 'user'; text: string; opts?: FlowOption[] }

const WhatsAppPreview: React.FC<{ nodes: Node[]; edges: Edge[]; onClose: () => void }> = ({ nodes, edges, onClose }) => {
    const [msgs, setMsgs] = useState<SimMsg[]>([]);
    const [input, setInput] = useState('');
    const [currentId, setCurrentId] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [vars, setVars] = useState<Record<string, string>>({});
    const [waitingInput, setWaitingInput] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const processingRef = useRef(false);

    const scroll = () => setTimeout(() => scrollRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 60);

    const pushMsg = useCallback((msg: Omit<SimMsg, 'id'>) => {
        const m: SimMsg = { ...msg, id: `${Date.now()}-${Math.random()}` };
        setMsgs(p => [...p, m]);
        scroll();
    }, []);

    const findNext = (nodeId: string, handle?: string) =>
        edges.find(e => e.source === nodeId && (handle ? e.sourceHandle === handle : !e.sourceHandle));

    // Reemplaza {{variable}} con valores capturados
    const interpolate = (text: string, v: Record<string, string>) =>
        text.replace(/\{\{(\w+)\}\}/g, (_, key) => v[key] !== undefined ? v[key] : `{{${key}}}`);

    const processNode = useCallback((nodeId: string, currentVars: Record<string, string> = {}) => {
        if (processingRef.current) return;
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;
        const d = node.data as FND;
        setCurrentId(nodeId);

        if (node.type === 'start' || node.type === 'message') {
            pushMsg({ from: 'bot', text: interpolate(d.text || '(sin mensaje)', currentVars) });
            const ne = findNext(nodeId);
            if (ne) setTimeout(() => processNode(ne.target, currentVars), 800);

        } else if (node.type === 'option') {
            pushMsg({ from: 'bot', text: interpolate(d.text || '¿Qué opción elegís?', currentVars), opts: d.options || [] });
            // Espera que el usuario haga clic

        } else if (node.type === 'input') {
            pushMsg({ from: 'bot', text: interpolate(d.text || 'Ingresá tu respuesta:', currentVars) });
            setWaitingInput(true);
            // Espera que el usuario escriba

        } else if (node.type === 'delay') {
            const secs = Math.min((d.delaySeconds || 3) * 1000, 2500);
            pushMsg({ from: 'bot', text: `⏳ Esperá ${d.delaySeconds || 3} segundos...` });
            const ne = findNext(nodeId);
            if (ne) setTimeout(() => processNode(ne.target, currentVars), secs);

        } else if (node.type === 'action') {
            const newVars = { ...currentVars };
            if (d.variableName) newVars[d.variableName] = interpolate(d.variableValue || '', currentVars);
            setVars(newVars);
            const ne = findNext(nodeId);
            if (ne) setTimeout(() => processNode(ne.target, newVars), 300);

        } else if (node.type === 'condition') {
            const varVal = (currentVars[d.variableName || ''] || '').toLowerCase();
            const expected = (d.variableValue || '').toLowerCase();
            const isTrue = varVal === expected;
            // Intentar por handle 'true'/'false', si no el primero disponible
            const ne = edges.find(e => e.source === nodeId && e.sourceHandle === (isTrue ? 'true' : 'false'))
                || findNext(nodeId);
            if (ne) setTimeout(() => processNode(ne.target, currentVars), 300);

        } else if (node.type === 'end') {
            pushMsg({ from: 'bot', text: interpolate(d.text || 'Conversación finalizada. ¡Hasta luego! 👋', currentVars) });
            setDone(true);

        } else if (node.type === 'wa_buttons') {
            // Botones interactivos WhatsApp → los mostramos como opciones en el preview
            const btns: FlowOption[] = (d.waButtons as Array<{ id: string; label: string }> || []).map(b => ({ id: b.id, label: b.label }));
            pushMsg({ from: 'bot', text: interpolate(d.text || '¿Qué necesitás hacer?', currentVars), opts: btns });
            // La lógica de clic es igual a option

        } else if (node.type === 'wa_list') {
            // Lista interactiva → mostramos opciones simuladas
            const listOpts: FlowOption[] = [{ id: 'list-item', label: `📑 ${d.waListTitle || 'Ver opciones'}` }];
            pushMsg({ from: 'bot', text: interpolate(d.text || 'Seleccioná una opción:', currentVars), opts: listOpts });

        } else if (node.type === 'webhook') {
            pushMsg({ from: 'bot', text: `🌐 Consultando API... (${d.webhookMethod || 'GET'} ${d.webhookUrl || 'URL'})` });
            const newVars = { ...currentVars };
            // En preview: intentar llamada real o usar mock
            const doFetch = async () => {
                try {
                    const opts: RequestInit = { method: d.webhookMethod || 'GET' };
                    if (d.webhookMethod === 'POST' && d.webhookBody) {
                        opts.headers = { 'Content-Type': 'application/json' };
                        opts.body = interpolate(d.webhookBody, currentVars);
                    }
                    const url = interpolate(d.webhookUrl || '', currentVars);
                    const res = await fetch(url, opts);
                    const json = await res.json();
                    const val = typeof json === 'object' ? JSON.stringify(json).slice(0, 200) : String(json);
                    if (d.webhookResponseVar) newVars[d.webhookResponseVar] = val;
                    pushMsg({ from: 'bot', text: `✅ Respuesta recibida${d.webhookResponseVar ? ` → {{${d.webhookResponseVar}}}` : ''}` });
                } catch {
                    // Mock fallback en preview
                    if (d.webhookResponseVar) newVars[d.webhookResponseVar] = '(respuesta simulada)';
                    pushMsg({ from: 'bot', text: '⚠ No se pudo llamar la API en vista previa — usando valor simulado' });
                }
                setVars(newVars);
                const ne = findNext(nodeId);
                if (ne) setTimeout(() => processNode(ne.target, newVars), 400);
            };
            doFetch();
        }
    }, [nodes, edges, pushMsg]);

    const startSim = useCallback(() => {
        setMsgs([]); setDone(false); setVars({}); setCurrentId(null); setWaitingInput(false);
        processingRef.current = false;
        const start = nodes.find(n => n.type === 'start');
        if (start) setTimeout(() => processNode(start.id, {}), 400);
    }, [nodes, processNode]);

    useEffect(() => { startSim(); }, []);

    const handleOptionClick = (opt: FlowOption) => {
        pushMsg({ from: 'user', text: opt.label });
        const ne = edges.find(e => e.source === currentId && e.sourceHandle === opt.id)
            || findNext(currentId ?? '');
        if (ne) setTimeout(() => processNode(ne.target, vars), 500);
    };

    const handleSend = () => {
        if (!input.trim() || !waitingInput) return;
        const txt = input.trim();
        pushMsg({ from: 'user', text: txt });
        setInput('');
        setWaitingInput(false);
        const curNode = nodes.find(n => n.id === currentId);
        const newVars = { ...vars };
        if (curNode?.type === 'input' && (curNode.data as FND).variableName) {
            newVars[(curNode.data as FND).variableName!] = txt;
            setVars(newVars);
        }
        const ne = findNext(currentId ?? '');
        if (ne) setTimeout(() => processNode(ne.target, newVars), 500);
    };

    const lastMsg = msgs[msgs.length - 1];
    const showOpts = lastMsg?.opts && lastMsg.opts.length > 0 && !done && !waitingInput;

    return (
        <div className="h-full flex flex-col shadow-xl" style={{ width: 340, flexShrink: 0, borderLeft: '1px solid #e5e7eb' }}>
            {/* Header WhatsApp */}
            <div style={{ background: '#075E54', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
                <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>Vista previa — Chatbot</p>
                    <p style={{ color: '#aeccc6', fontSize: 12, margin: 0 }}>● en línea</p>
                </div>
                <button onClick={startSim} title="Reiniciar" style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <RotateCcw size={16} />
                </button>
                <button onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={16} />
                </button>
            </div>

            {/* Mensajes */}
            <div
                ref={scrollRef}
                style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#ddd' }}
            >
                {msgs.map(m => (
                    <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                        <div style={{
                            maxWidth: '80%', borderRadius: m.from === 'bot' ? '0 12px 12px 12px' : '12px 0 12px 12px',
                            padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
                            background: m.from === 'bot' ? 'white' : '#dcf8c6',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        }}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {msgs.length === 0 && (
                    <p style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 16 }}>Iniciando...</p>
                )}
                {done && (
                    <div style={{ textAlign: 'center' }}>
                        <button onClick={startSim} style={{ fontSize: 12, color: '#075E54', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
                            🔄 Reiniciar conversación
                        </button>
                    </div>
                )}
            </div>

            {/* Opciones o input */}
            <div style={{ background: '#efefef', borderTop: '1px solid #ccc', flexShrink: 0 }}>
                {showOpts ? (
                    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {lastMsg.opts!.map(opt => (
                            <button key={opt.id} onClick={() => handleOptionClick(opt)}
                                style={{ background: 'white', border: '1px solid #25D366', color: '#075E54', borderRadius: 20, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                        <input
                            style={{ flex: 1, background: 'white', borderRadius: 24, padding: '8px 14px', fontSize: 13, border: 'none', outline: 'none', opacity: waitingInput ? 1 : 0.5 }}
                            placeholder={waitingInput ? 'Escribe tu respuesta...' : '(esperando...)'}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={!waitingInput || done}
                        />
                        <button onClick={handleSend} disabled={!input.trim() || !waitingInput}
                            style={{ width: 36, height: 36, borderRadius: '50%', background: '#25D366', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: !input.trim() || !waitingInput ? 0.5 : 1 }}>
                            <Send size={15} color="white" />
                        </button>
                    </div>
                )}
            </div>

            {/* Panel de variables capturadas */}
            {Object.keys(vars).length > 0 && (
                <div style={{ background: '#f0fdf4', borderTop: '1px solid #bbf7d0', padding: '6px 10px', flexShrink: 0 }}>
                    <p style={{ fontSize: 10, color: '#15803d', fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚡ Variables capturadas</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {Object.entries(vars).map(([k, v]) => (
                            <span key={k} style={{ fontSize: 11, background: 'white', border: '1px solid #86efac', borderRadius: 12, padding: '2px 8px', color: '#166534' }}>
                                <b>{`{{${k}}}`}</b> = {v}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── MENÚ CONTEXTUAL (click derecho) ─────────────────────────────────────────
const ContextMenu: React.FC<{
    x: number; y: number; nodeId: string;
    onDuplicate: (id: string) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}> = ({ x, y, nodeId, onDuplicate, onDelete, onClose }) => {
    useEffect(() => {
        const close = () => onClose();
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, [onClose]);

    return (
        <div
            className="fixed z-[9999] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden"
            style={{ left: Math.min(x, window.innerWidth - 180), top: Math.min(y, window.innerHeight - 120), width: 170 }}
            onClick={e => e.stopPropagation()}
        >
            <button
                onClick={() => { onDuplicate(nodeId); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
            >
                <Copy size={14} className="text-blue-500" /> Duplicar nodo
            </button>
            <div className="h-px bg-gray-100 dark:bg-gray-700" />
            <button
                onClick={() => { onDelete(nodeId); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
            >
                <Trash2 size={14} /> Eliminar nodo
            </button>
        </div>
    );
};

// ─── TIPOS REACTFLOW ───────────────────────────────────────────────────────────
const nodeTypes = {
    start: FlowNode, message: FlowNode, option: FlowNode,
    input: FlowNode, condition: FlowNode, action: FlowNode,
    delay: FlowNode, end: FlowNode,
    wa_buttons: FlowNode, wa_list: FlowNode, webhook: FlowNode,
    note: NoteNode,
};

const INIT_NODES: Node[] = [{
    id: 'start',
    type: 'start',
    position: { x: 300, y: 60 },
    data: { label: 'Inicio', text: '¡Hola! 👋 Soy tu asistente. ¿En qué puedo ayudarte hoy?' },
    deletable: false,
}];

// ─── BUILDER PRINCIPAL ─────────────────────────────────────────────────────────
const BuilderContent: React.FC = () => {
    const { user } = useAuth();
    const [nodes, setNodes, onNodesChange] = useNodesState(INIT_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selected, setSelected] = useState<Node | null>(null);
    const [menu, setMenu] = useState<{ open: boolean; srcId: string | null; pos: { x: number; y: number } }>({ open: false, srcId: null, pos: { x: 0, y: 0 } });
    const [name, setName] = useState('Mi Chatbot');
    // ── i18n / idioma
    const [lang, setLang] = useState<Lang>('es');
    const t = (key: string) => I18N[lang][key] || key;
    const [chatbotId, setChatbotId] = useState<number | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [showWASetup, setShowWASetup] = useState(false);
    // ── Nuevos estado ──────────────────────────────────────────────────────
    const [chatbotList, setChatbotList] = useState<Array<{ id: number; nombre: string }>>([]);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
    const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);
    const importRef = useRef<HTMLInputElement>(null);
    const loaded = useRef(false);

    // Undo helpers
    const pushHistory = useCallback((ns: Node[], es: Edge[]) => {
        setHistory(h => [...h.slice(0, historyIdx + 1), { nodes: ns, edges: es }].slice(-50));
        setHistoryIdx(i => Math.min(i + 1, 49));
    }, [historyIdx]);
    const undo = useCallback(() => {
        if (historyIdx <= 0) return;
        const p = history[historyIdx - 1]; setNodes(p.nodes); setEdges(p.edges); setHistoryIdx(i => i - 1);
    }, [history, historyIdx, setNodes, setEdges]);
    const redo = useCallback(() => {
        if (historyIdx >= history.length - 1) return;
        const p = history[historyIdx + 1]; setNodes(p.nodes); setEdges(p.edges); setHistoryIdx(i => i + 1);
    }, [history, historyIdx, setNodes, setEdges]);

    // Keyboard Ctrl+Z / Ctrl+Y
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
        };
        window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
    }, [undo, redo]);

    // Auto-layout BFS
    const autoLayout = useCallback(() => {
        const NODE_W = 280, NODE_H = 160, GAP_X = 60, GAP_Y = 80;
        const levels = new Map<string, number>();
        const q: Array<{ id: string; lv: number }> = [{ id: 'start', lv: 0 }];
        const seen = new Set<string>();
        while (q.length) {
            const { id, lv } = q.shift()!;
            if (seen.has(id)) continue; seen.add(id);
            levels.set(id, Math.max(levels.get(id) ?? 0, lv));
            edges.filter(e => e.source === id).forEach(e => { if (!seen.has(e.target)) q.push({ id: e.target, lv: lv + 1 }); });
        }
        nodes.filter(n => !levels.has(n.id)).forEach((n, i) => levels.set(n.id, 99 + i));
        const byLv = new Map<number, string[]>();
        levels.forEach((lv, id) => { if (!byLv.has(lv)) byLv.set(lv, []); byLv.get(lv)!.push(id); });
        const pos = new Map<string, { x: number; y: number }>();
        byLv.forEach((ids, lv) => {
            const total = ids.length * NODE_W + (ids.length - 1) * GAP_X;
            ids.forEach((id, i) => pos.set(id, { x: -total / 2 + i * (NODE_W + GAP_X) + NODE_W / 2, y: lv * (NODE_H + GAP_Y) + 60 }));
        });
        const newN = nodes.map(n => ({ ...n, position: pos.get(n.id) ?? n.position }));
        setNodes(newN); pushHistory(newN, edges); toast.success('Diagrama ordenado ✓');
    }, [nodes, edges, setNodes, pushHistory]);

    // Export JSON
    const exportJSON = useCallback(() => {
        const data = {
            version: '1.0', nombre: name,
            nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
            edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null })),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${name.replace(/\s+/g, '_')}.json`; a.click();
        URL.revokeObjectURL(url); toast.success('Flujo exportado');
    }, [nodes, edges, name]);

    // Import JSON
    const importJSON = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if (data.nodes) { setNodes(data.nodes as Node[]); setEdges((data.edges || []) as Edge[]); }
                if (data.nombre) setName(data.nombre);
                setChatbotId(null); toast.success(`"${data.nombre || 'Flujo'}" importado`);
            } catch { toast.error('JSON inválido'); }
        };
        reader.readAsText(file); e.target.value = '';
    }, [setNodes, setEdges]);

    // Duplicate node
    const duplicateNode = useCallback((nodeId: string) => {
        const node = nodes.find(n => n.id === nodeId); if (!node) return;
        const newNode: Node = { ...node, id: `${node.type}-${Date.now()}`, position: { x: node.position.x + 30, y: node.position.y + 40 }, data: { ...(node.data as object) }, selected: false };
        const newN = [...nodes, newNode]; setNodes(newN); pushHistory(newN, edges); toast.success('Nodo duplicado');
    }, [nodes, edges, setNodes, pushHistory]);

    // Validar flujo
    const validateFlow = useCallback(() => {
        const issues: string[] = [];
        const flowNodes = nodes.filter(n => n.type !== 'note');
        if (!flowNodes.find(n => n.type === 'start')) issues.push(t('noStart'));
        if (!flowNodes.find(n => n.type === 'end')) issues.push(t('noEnd'));
        // BFS desde start para detectar inalcanzables
        const reachable = new Set<string>();
        const q: string[] = ['start'];
        while (q.length) {
            const id = q.shift()!;
            if (reachable.has(id)) continue;
            reachable.add(id);
            edges.filter(e => e.source === id).forEach(e => q.push(e.target));
        }
        flowNodes.forEach(n => {
            if (!reachable.has(n.id)) issues.push(`${t('orphan')}: "${(n.data as FND).label}"`);
        });
        // Nodos sin salida (excepto end, note, wa_buttons, wa_list, option)
        const noExitTypes = ['end', 'note'];
        flowNodes.filter(n => !noExitTypes.includes(n.type || '')).forEach(n => {
            const hasOut = edges.some(e => e.source === n.id);
            if (!hasOut) issues.push(`${t('noExit')}: "${(n.data as FND).label}"`);
        });
        if (issues.length) {
            toast.error(`${issues.length} problemas encontrados`, { description: issues.slice(0, 3).join(' | ') });
        } else {
            toast.success(t('validationOk'));
        }
        return issues;
    }, [nodes, edges, t]);


    // Cargar chatbot por objeto
    const loadChatbot = useCallback((cb: { id: number; nombre: string; configuracion?: { nodes?: unknown[]; edges?: unknown[] } }) => {
        const cfg = cb.configuracion;
        if (cfg?.nodes?.length) {
            setChatbotId(cb.id); setName(cb.nombre);
            setNodes(cfg.nodes as Node[]); setEdges((cfg.edges || []) as Edge[]);
            setHistory([]); setHistoryIdx(-1); toast.success(`"${cb.nombre}" cargado`);
        }
    }, [setNodes, setEdges]);

    // Cargar lista de chatbots al montar
    useEffect(() => {
        if (loaded.current) return; loaded.current = true;
        apiService.getChatbots().then((list: Array<{ id: number; nombre: string; configuracion?: { nodes?: unknown[]; edges?: unknown[] } }>) => {
            setChatbotList(list.map(c => ({ id: c.id, nombre: c.nombre })));
            if (list.length) loadChatbot(list[list.length - 1]);
        }).catch(() => { });
    }, [loadChatbot]);


    // Listeners de eventos de nodos
    useEffect(() => {
        const onAdd = (e: Event) => {
            const { srcId } = (e as CustomEvent).detail;
            const el = document.querySelector(`[data-id="${srcId}"]`);
            const rect = el?.getBoundingClientRect();
            setMenu({ open: true, srcId, pos: rect ? { x: rect.left + rect.width / 2 - 130, y: rect.bottom + 10 } : { x: 300, y: 300 } });
        };
        const onDel = (e: Event) => {
            const { id } = (e as CustomEvent).detail;
            setNodes(ns => ns.filter(n => n.id !== id));
            setEdges(es => es.filter(e => e.source !== id && e.target !== id));
            if (selected?.id === id) setSelected(null);
            toast.success('Bloque eliminado');
        };
        window.addEventListener('flow:add', onAdd);
        window.addEventListener('flow:del', onDel);
        return () => { window.removeEventListener('flow:add', onAdd); window.removeEventListener('flow:del', onDel); };
    }, [nodes, selected]);

    const handleAddNode = useCallback((type: string, label: string) => {
        const src = nodes.find(n => n.id === menu.srcId);
        const position = src ? { x: src.position.x, y: src.position.y + 200 } : { x: 300, y: 300 };
        const newNode: Node = {
            id: `${type}-${Date.now()}`,
            type,
            position,
            data: { label, text: '', options: type === 'option' ? [] : undefined },
        };
        setNodes(ns => [...ns, newNode]);
        if (menu.srcId) {
            setEdges(es => addEdge({
                id: `e-${menu.srcId}-${newNode.id}`,
                source: menu.srcId!,
                target: newNode.id,
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            }, es));
        }
        setTimeout(() => setSelected(newNode), 60);
    }, [nodes, menu.srcId, setNodes, setEdges]);

    const onConnect = useCallback((params: Connection) => {
        setEdges(es => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#3b82f6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' } }, es));
    }, [setEdges]);

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => setSelected(node), []);

    const updateNode = useCallback((id: string, data: Partial<FND>) => {
        setNodes(ns => ns.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
        setSelected(prev => prev?.id === id ? { ...prev, data: { ...prev.data, ...data } } : prev);
    }, [setNodes]);

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                nombre: name,
                descripcion: `Chatbot de ${user?.nombre || 'usuario'}`,
                configuracion: {
                    nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })),
                    edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null })),
                    settings: { nombre: name },
                },
            };
            if (chatbotId) return apiService.updateChatbot(chatbotId, payload);
            return apiService.saveChatbot(payload);
        },
        onSuccess: (res) => {
            if (!chatbotId && res && 'id' in res) setChatbotId((res as { id: number }).id);
            setLastSaved(new Date());
            toast.success('✅ Chatbot guardado');
        },
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
    });

    const unconnected = nodes.filter(n => n.id !== 'start' && !edges.some(e => e.target === n.id)).length;

    return (
        <div className="h-full flex flex-col dark:bg-gray-900">
            {/* ── Hidden file input for import ─── */}
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importJSON} />

            {/* ── Topbar ── */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border-b dark:border-gray-800 shadow-sm z-10 flex-wrap">
                <Bot size={18} color="#2563eb" className="flex-shrink-0" />

                {/* Selector de chatbot */}
                {chatbotList.length > 1 && (
                    <select
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={chatbotId ?? ''}
                        onChange={e => {
                            const found = (chatbotList as Array<{ id: number; nombre: string }>).find(c => c.id === parseInt(e.target.value));
                            if (found) {
                                apiService.getChatbots().then((list: Array<{ id: number; nombre: string; configuracion?: { nodes?: unknown[]; edges?: unknown[] } }>) => {
                                    const cb = list.find(c => c.id === found.id);
                                    if (cb) loadChatbot(cb);
                                });
                            }
                        }}
                    >
                        {chatbotList.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                )}

                {/* Nombre del chatbot */}
                <input
                    className="font-semibold text-gray-800 dark:text-gray-100 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none transition-colors text-sm flex-1 min-w-[120px]"
                    value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del chatbot"
                />

                {unconnected > 0 && (
                    <div className="flex items-center gap-1 text-orange-500 text-xs font-medium">
                        <AlertCircle size={13} />{unconnected} {t('noConn')}
                    </div>
                )}
                {lastSaved && <span className="text-xs text-gray-400 dark:text-gray-500 hidden lg:block">Guardado {lastSaved.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>}

                {/* ── Bot\u00f3n principal Agregar bloque ── */}
                <button
                    onClick={() => setMenu({ open: true, srcId: null, pos: { x: 80, y: 54 } })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}
                    title="Agregar nuevo bloque al flujo"
                >
                    <Plus size={14} strokeWidth={2.5} />
                    <span className="hidden sm:inline">Agregar</span>
                </button>

                {/* Separador */}
                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

                {/* Undo / Redo */}
                <button onClick={undo} disabled={historyIdx <= 0} title="Deshacer (Ctrl+Z)" className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-all">
                    <Undo2 size={15} />
                </button>
                <button onClick={redo} disabled={historyIdx >= history.length - 1} title="Rehacer (Ctrl+Y)" className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-all">
                    <Redo2 size={15} />
                </button>

                {/* Auto-layout */}
                <button onClick={autoLayout} title="Ordenar diagrama" className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <Shuffle size={15} />
                </button>

                {/* Export / Import */}
                <button onClick={exportJSON} title="Exportar JSON" className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <Download size={15} />
                </button>
                <button onClick={() => importRef.current?.click()} title="Importar JSON" className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all">
                    <Upload size={15} />
                </button>

                {/* Validar flujo */}
                <button onClick={validateFlow} title={t('validate')}
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all">
                    <CheckCircle2 size={15} />
                </button>

                {/* Toggle idioma */}
                <button
                    onClick={() => setLang(l => l === 'es' ? 'en' : 'es')}
                    title={lang === 'es' ? 'Switch to English' : 'Cambiar a Español'}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all border border-gray-200 dark:border-gray-700"
                >
                    <Globe size={12} /> {lang.toUpperCase()}
                </button>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

                {/* ── WhatsApp Integration ── */}
                <button
                    onClick={() => { setShowWASetup(p => !p); setShowPreview(false); }}
                    style={{ background: showWASetup ? '#128C7E' : 'transparent', color: showWASetup ? 'white' : '#128C7E', border: '1px solid #128C7E' }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all"
                    title="Configurar integración WhatsApp"
                >
                    <span style={{ fontSize: 13 }}>📱</span>
                    <span className="hidden sm:inline">WhatsApp</span>
                </button>

                {/* Vista previa */}
                <button
                    onClick={() => setShowPreview(p => !p)}
                    style={{ background: showPreview ? '#16a34a' : 'transparent', color: showPreview ? 'white' : '', border: `1px solid ${showPreview ? '#16a34a' : '#d1d5db'}` }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all text-gray-600 dark:text-gray-300 dark:border-gray-700"
                >
                    <Play size={13} /> <span className="hidden sm:inline">Vista previa</span>
                </button>

                {/* Guardar */}
                <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-60"
                >
                    {saveMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {chatbotId ? 'Actualizar' : 'Guardar'}
                </button>
            </div>

            {/* ── Canvas + paneles ── */}
            <div className="flex-1 flex overflow-hidden">
                <ReactFlow
                    nodes={nodes} edges={edges}
                    onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                    onConnect={onConnect} onNodeClick={onNodeClick}
                    onNodeContextMenu={(e, node) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id }); }}
                    onPaneClick={() => { setSelected(null); setMenu(m => ({ ...m, open: false })); setContextMenu(null); }}
                    nodeTypes={nodeTypes}
                    fitView panOnDrag zoomOnScroll nodesDraggable
                    minZoom={0.1} maxZoom={3}
                    style={{ background: '#f8fafc' }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#cbd5e1" />
                    <Controls showInteractive={false} />
                    <MiniMap style={{ height: 100 }} nodeColor={n => THEME[n.type || 'message']?.bg || '#94a3b8'} maskColor="rgba(0,0,0,0.04)" />
                </ReactFlow>

                {selected && (
                    <PropertiesPanel node={selected} onUpdate={updateNode} onClose={() => setSelected(null)} />
                )}
                {showPreview && (
                    <WhatsAppPreview nodes={nodes} edges={edges} onClose={() => setShowPreview(false)} />
                )}
                {showWASetup && (
                    <div className="h-full flex flex-col bg-white border-l border-gray-200 shadow-xl overflow-hidden" style={{ width: 400, flexShrink: 0 }}>
                        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ background: '#128C7E' }}>
                            <div>
                                <p className="text-xs text-white/70 font-medium">Integración</p>
                                <p className="text-white font-bold text-sm">📱 WhatsApp Business API</p>
                            </div>
                            <button onClick={() => setShowWASetup(false)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/20 transition-all">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <WhatsAppSetupPanel chatbotId={chatbotId} />
                        </div>
                    </div>
                )}
            </div>

            {menu.open && <AddMenu pos={menu.pos} onAdd={handleAddNode} onClose={() => setMenu(m => ({ ...m, open: false }))} />}

            {/* Menú contextual click derecho */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x} y={contextMenu.y} nodeId={contextMenu.nodeId}
                    onDuplicate={duplicateNode}
                    onDelete={(id) => { window.dispatchEvent(new CustomEvent('flow:del', { detail: { id } })); }}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    );
};

export const ChatbotFlowBuilder: React.FC = () => (
    <ReactFlowProvider>
        <BuilderContent />
    </ReactFlowProvider>
);
