/**
 * InboxPanel — Bandeja de conversaciones de CogniBot
 *
 * Muestra todas las conversaciones activas y completadas para el chatbot
 * seleccionado. Permite ver el historial de mensajes de cada una.
 *
 * Sección izquierda: Lista de conversaciones con polling automático.
 * Sección derecha: Historial de mensajes estilo WhatsApp.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    MessageSquare, RefreshCw, Search, CheckCircle2, Clock,
    User, Bot, Phone, ChevronRight, Loader2, Inbox,
    Circle, XCircle, ArrowLeft,
} from 'lucide-react';
import { apiService } from '@/services/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Conversation {
    id: number;
    user_phone: string;
    user_name: string;
    platform: string;
    estado: 'active' | 'completed' | 'waiting';
    message_count: number;
    iniciado_en: string;
    actualizado_en: string;
}

interface Message {
    id: number;
    sender_type: 'bot' | 'user';
    content_type: string;
    content: string;
    node_id?: string;
    enviado_en: string;
}

interface Chatbot {
    id: number;
    nombre: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'ahora';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
}

function fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_CONFIG = {
    active: { label: 'Activa', color: '#22c55e', Icon: Circle },
    completed: { label: 'Finalizada', color: '#94a3b8', Icon: CheckCircle2 },
    waiting: { label: 'Esperando', color: '#f59e0b', Icon: Clock },
};

// ── ConversationRow ────────────────────────────────────────────────────────────
const ConversationRow: React.FC<{
    conv: Conversation;
    selected: boolean;
    onClick: () => void;
}> = ({ conv, selected, onClick }) => {
    const cfg = STATUS_CONFIG[conv.estado as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.active;

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-gray-100 last:border-0
                ${selected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}`}
        >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
                style={{ background: `hsl(${(conv.user_name.charCodeAt(0) * 37) % 360}, 60%, 50%)` }}>
                {conv.user_name.charAt(0).toUpperCase()}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{conv.user_name}</p>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(conv.actualizado_en)}</span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                        <Phone size={9} /> {conv.user_phone}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <cfg.Icon size={9} style={{ color: cfg.color }} fill={cfg.color} />
                        <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
                    </div>
                </div>
            </div>
        </button>
    );
};

// ── MessageBubble ──────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ msg: Message }> = ({ msg }) => {
    const isBot = msg.sender_type === 'bot';
    return (
        <div className={`flex gap-2 mb-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
            {isBot && (
                <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 self-end mb-1">
                    <Bot size={14} className="text-white" />
                </div>
            )}
            <div className={`max-w-[70%] ${isBot ? '' : 'items-end flex flex-col'}`}>
                <div
                    className="px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm"
                    style={{
                        background: isBot ? 'white' : '#dcf8c6',
                        borderRadius: isBot ? '0 16px 16px 16px' : '16px 0 16px 16px',
                        color: '#1a1a1a',
                    }}
                >
                    {msg.content}
                </div>
                <span className="text-[10px] text-gray-400 mt-0.5 px-1">{fmtTime(msg.enviado_en)}</span>
            </div>
            {!isBot && (
                <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 self-end mb-1">
                    <User size={14} className="text-white" />
                </div>
            )}
        </div>
    );
};

// ── Main InboxPanel ────────────────────────────────────────────────────────────
export const InboxPanel: React.FC = () => {
    const [chatbots, setChatbots] = useState<Chatbot[]>([]);
    const [selectedChatbot, setSelectedChatbot] = useState<number | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
    const [search, setSearch] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(false);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cargar chatbots
    useEffect(() => {
        apiService.getChatbots().then(list => {
            setChatbots(list);
            if (list.length > 0) setSelectedChatbot(list[0].id);
        }).catch(() => { });
    }, []);

    // Cargar conversaciones cuando cambia chatbot seleccionado
    const loadConversations = useCallback(async () => {
        if (!selectedChatbot) return;
        setLoadingConvs(true);
        try {
            const list = await apiService.getConversations(selectedChatbot);
            setConversations(list as Conversation[]);
        } catch { /* ignore */ } finally {
            setLoadingConvs(false);
        }
    }, [selectedChatbot]);

    useEffect(() => {
        loadConversations();
        // Polling cada 10s para conversaciones activas
        pollRef.current = setInterval(loadConversations, 10000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [loadConversations]);

    // Cargar mensajes cuando se selecciona conversación
    useEffect(() => {
        if (!selectedConv) return;
        setLoadingMsgs(true);
        apiService.getConversationMessages(selectedConv.id)
            .then(msgs => setMessages(msgs as Message[]))
            .catch(() => { })
            .finally(() => setLoadingMsgs(false));
    }, [selectedConv]);

    // Scroll al fondo cuando llegan mensajes
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Filtrado
    const filtered = conversations.filter(c => {
        if (filterStatus !== 'all' && c.estado !== filterStatus) return false;
        if (search) {
            const q = search.toLowerCase();
            return c.user_name.toLowerCase().includes(q) || c.user_phone.includes(q);
        }
        return true;
    });

    const activeCount = conversations.filter(c => c.estado === 'active').length;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="h-full flex flex-col" style={{ background: '#f0f2f5' }}>

            {/* ── Top bar ── */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                <Inbox size={18} className="text-blue-600" />
                <div className="flex-1">
                    <h1 className="text-sm font-bold text-gray-900">Bandeja de Conversaciones</h1>
                    <p className="text-xs text-gray-400">
                        {activeCount > 0
                            ? <><span className="text-green-600 font-semibold">{activeCount} activas</span> · {conversations.length} total</>
                            : `${conversations.length} conversaciones`}
                    </p>
                </div>

                {/* Selector de chatbot */}
                {chatbots.length > 1 && (
                    <select
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={selectedChatbot ?? ''}
                        onChange={e => { setSelectedChatbot(Number(e.target.value)); setSelectedConv(null); }}
                    >
                        {chatbots.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                )}

                <button onClick={loadConversations} title="Actualizar"
                    className={`p-2 rounded-lg hover:bg-gray-100 transition-all ${loadingConvs ? 'animate-spin text-blue-500' : 'text-gray-400'}`}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── Left: conversation list ── */}
                <div className={`flex flex-col bg-white border-r border-gray-200 overflow-hidden
                    ${selectedConv && mobileShowChat ? 'hidden md:flex' : 'flex'}
                    w-full md:w-80 lg:w-96 flex-shrink-0`}>

                    {/* Search + filters */}
                    <div className="px-3 py-2 border-b border-gray-100 space-y-2">
                        <div className="relative">
                            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                placeholder="Buscar por nombre o número..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-1">
                            {(['all', 'active', 'completed'] as const).map(s => (
                                <button key={s}
                                    onClick={() => setFilterStatus(s)}
                                    className={`flex-1 py-1 text-[10px] font-semibold rounded-lg transition-all ${filterStatus === s ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    {s === 'all' ? 'Todas' : s === 'active' ? '🟢 Activas' : '⚫ Finaliz.'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingConvs && conversations.length === 0 ? (
                            <div className="flex items-center justify-center h-32 text-gray-400">
                                <Loader2 className="animate-spin mr-2" size={16} /> Cargando...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400 px-4 text-center">
                                <MessageSquare size={32} className="mb-2 opacity-40" />
                                <p className="text-sm font-medium">
                                    {conversations.length === 0
                                        ? 'Aún no hay conversaciones'
                                        : 'No hay resultados para tu búsqueda'}
                                </p>
                                <p className="text-xs mt-1 opacity-70">
                                    {conversations.length === 0
                                        ? 'Las conversaciones aparecerán aquí cuando alguien escriba al bot'
                                        : 'Probá con otro nombre o número'}
                                </p>
                            </div>
                        ) : (
                            filtered.map(conv => (
                                <ConversationRow
                                    key={conv.id}
                                    conv={conv}
                                    selected={selectedConv?.id === conv.id}
                                    onClick={() => { setSelectedConv(conv); setMobileShowChat(true); }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── Right: message detail ── */}
                <div className={`flex-1 flex flex-col overflow-hidden
                    ${!selectedConv || (selectedConv && !mobileShowChat) ? 'hidden md:flex' : 'flex'}`}>

                    {selectedConv ? (
                        <>
                            {/* Conversation header */}
                            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
                                {/* Back button (mobile) */}
                                <button
                                    onClick={() => setMobileShowChat(false)}
                                    className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
                                    style={{ background: `hsl(${(selectedConv.user_name.charCodeAt(0) * 37) % 360}, 60%, 50%)` }}>
                                    {selectedConv.user_name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-900">{selectedConv.user_name}</p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Phone size={9} /> {selectedConv.user_phone}
                                    </p>
                                </div>
                                {/* Status badge */}
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                                    ${selectedConv.estado === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {selectedConv.estado === 'active'
                                        ? <><Circle size={7} fill="#22c55e" className="text-green-500" /> Activa</>
                                        : <><XCircle size={11} /> Finalizada</>
                                    }
                                </div>
                                <div className="text-right text-xs text-gray-400">
                                    <p>{selectedConv.message_count} msgs</p>
                                    <p>{timeAgo(selectedConv.actualizado_en)}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                className="flex-1 overflow-y-auto px-4 py-4"
                                style={{ background: '#eae6df' }}
                            >
                                {/* WA-style watermark */}
                                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000\' fill-opacity=\'1\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")' }} />

                                {loadingMsgs ? (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <Loader2 className="animate-spin mr-2" size={18} /> Cargando mensajes...
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <MessageSquare size={40} className="mb-2 opacity-30" />
                                        <p className="text-sm">Sin mensajes registrados</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Date separator */}
                                        <div className="flex items-center gap-2 my-3">
                                            <div className="flex-1 h-px bg-gray-300/50" />
                                            <span className="text-[10px] bg-white/80 text-gray-500 px-2 py-0.5 rounded-full shadow-sm">
                                                {new Date(messages[0].enviado_en).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                                            </span>
                                            <div className="flex-1 h-px bg-gray-300/50" />
                                        </div>

                                        {messages.map(msg => (
                                            <MessageBubble key={msg.id} msg={msg} />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                            {/* Footer — read only notice */}
                            <div className="flex-shrink-0 px-4 py-2.5 bg-white border-t border-gray-200 flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs text-gray-400 flex items-center gap-2">
                                    <Bot size={12} className="text-gray-400" />
                                    <span>
                                        {selectedConv.estado === 'active'
                                            ? 'Conversación activa — el bot responde automáticamente'
                                            : 'Conversación finalizada'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        setLoadingMsgs(true);
                                        apiService.getConversationMessages(selectedConv.id)
                                            .then(msgs => setMessages(msgs as Message[]))
                                            .catch(() => { })
                                            .finally(() => setLoadingMsgs(false));
                                    }}
                                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-all"
                                    title="Actualizar mensajes"
                                >
                                    <RefreshCw size={13} />
                                </button>
                            </div>
                        </>
                    ) : (
                        /* Empty state */
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400"
                            style={{ background: '#eae6df' }}>
                            <div className="bg-white rounded-2xl p-8 shadow-sm text-center max-w-xs">
                                <MessageSquare size={48} className="mx-auto mb-3 text-green-500 opacity-70" />
                                <h2 className="text-base font-bold text-gray-700 mb-1">Seleccioná una conversación</h2>
                                <p className="text-sm text-gray-400">Elegí un contacto de la lista para ver el historial de mensajes</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
