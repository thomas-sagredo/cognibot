/**
 * WhatsAppSetupPanel — Panel de integración Meta Cloud API
 *
 * Permite al usuario configurar:
 *  - Phone Number ID
 *  - Access Token de la app de Meta
 *  - Verify Token (auto-generado)
 *
 * Muestra el Webhook URL listo para pegar en Meta Business Suite.
 */
import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, XCircle, Copy, Eye, EyeOff,
    RefreshCw, ExternalLink, Loader2, Wifi, WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/services/api';

interface WAIntegration {
    configurado: boolean;
    activo?: boolean;
    phone_number_id?: string;
    verify_token?: string;
    webhook_url?: string;
}

interface Props {
    chatbotId: number | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const WhatsAppSetupPanel: React.FC<Props> = ({ chatbotId }) => {
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [verifyToken, setVerifyToken] = useState(genToken());
    const [showToken, setShowToken] = useState(false);
    const [integration, setIntegration] = useState<WAIntegration | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    function genToken() {
        return 'cognibot_' + Math.random().toString(36).slice(2, 14);
    }

    const webhookUrl = chatbotId
        ? `${API_BASE}/api/whatsapp/webhook/${chatbotId}`
        : '(guardá el chatbot primero)';

    // Cargar config existente
    useEffect(() => {
        if (!chatbotId) return;
        setLoading(true);
        apiService.getWhatsAppIntegration(chatbotId)
            .then((data) => {
                setIntegration(data);
                if (data.configurado) {
                    setPhoneNumberId(data.phone_number_id || '');
                    setVerifyToken(data.verify_token || verifyToken);
                }
            })
            .catch(() => setIntegration({ configurado: false }))
            .finally(() => setLoading(false));
    }, [chatbotId]);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copiado ✓`);
    };

    const handleSave = async () => {
        if (!chatbotId) return toast.error('Primero guardá el chatbot');
        if (!phoneNumberId.trim()) return toast.error('Phone Number ID requerido');
        if (!accessToken.trim()) return toast.error('Access Token requerido');

        setSaving(true);
        try {
            await apiService.setupWhatsAppIntegration(chatbotId, {
                phone_number_id: phoneNumberId.trim(),
                access_token: accessToken.trim(),
                verify_token: verifyToken,
            });
            toast.success('✅ Integración de WhatsApp configurada');
            setIntegration({
                configurado: true, activo: true,
                phone_number_id: phoneNumberId,
                verify_token: verifyToken,
                webhook_url: webhookUrl,
            });
        } catch (e: unknown) {
            toast.error(`Error: ${e instanceof Error ? e.message : 'Error desconocido'}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-40 text-gray-400">
            <Loader2 className="animate-spin mr-2" size={18} /> Cargando...
        </div>
    );

    const isOk = integration?.configurado && integration?.activo;

    return (
        <div className="p-5 space-y-5 max-w-lg">
            {/* Estado */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${isOk ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                {isOk
                    ? <><CheckCircle2 size={18} className="text-green-600 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-green-800">WhatsApp conectado ✓</p>
                            <p className="text-xs text-green-600">Phone ID: {integration?.phone_number_id}</p>
                        </div></>
                    : <><WifiOff size={18} className="text-gray-400 shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-700">Sin configurar</p>
                            <p className="text-xs text-gray-400">Completá los campos debajo</p>
                        </div></>
                }
            </div>

            {/* Guía rápida */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                <p className="font-bold text-sm">📋 Pasos para conectar Meta Cloud API</p>
                <ol className="list-decimal list-inside space-y-0.5 leading-5">
                    <li>Entrá a <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline font-medium">developers.facebook.com <ExternalLink size={10} className="inline" /></a></li>
                    <li>Creá una app → WhatsApp → Cloud API</li>
                    <li>Copiá tu <b>Phone Number ID</b> y <b>Access Token</b></li>
                    <li>Configuralo acá abajo y guardá</li>
                    <li>Pegá el <b>Webhook URL</b> y el <b>Verify Token</b> en Meta</li>
                </ol>
            </div>

            {/* Webhook URL */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Webhook URL (para Meta)</label>
                <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 truncate">
                        {webhookUrl}
                    </code>
                    <button onClick={() => copyToClipboard(webhookUrl, 'URL')}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all">
                        <Copy size={13} />
                    </button>
                </div>
            </div>

            {/* Verify Token */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Verify Token</label>
                <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 truncate">
                        {verifyToken}
                    </code>
                    <button onClick={() => copyToClipboard(verifyToken, 'Verify Token')}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all">
                        <Copy size={13} />
                    </button>
                    <button onClick={() => setVerifyToken(genToken())} title="Regenerar"
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all">
                        <RefreshCw size={13} />
                    </button>
                </div>
            </div>

            {/* Phone Number ID */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number ID *</label>
                <input
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-green-400"
                    value={phoneNumberId}
                    onChange={e => setPhoneNumberId(e.target.value)}
                    placeholder="Ej: 123456789012345"
                />
            </div>

            {/* Access Token */}
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Access Token *</label>
                <div className="flex items-center gap-2 mt-1">
                    <input
                        type={showToken ? 'text' : 'password'}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        value={accessToken}
                        onChange={e => setAccessToken(e.target.value)}
                        placeholder="EAA..."
                    />
                    <button onClick={() => setShowToken(s => !s)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all">
                        {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Token permanente de la Meta Business API</p>
            </div>

            {/* Botón guardar */}
            <button
                onClick={handleSave}
                disabled={saving || !chatbotId}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-50"
                style={{ background: '#128C7E' }}
            >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Wifi size={15} />}
                {saving ? 'Guardando...' : 'Guardar integración WhatsApp'}
            </button>
        </div>
    );
};
