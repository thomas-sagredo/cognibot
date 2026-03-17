import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Settings, 
  Phone, 
  CheckCircle, 
  XCircle, 
  Copy,
  ExternalLink,
  Users,
  MessageCircle,
  Loader2
} from 'lucide-react';
import { apiService } from '@/services/api';

interface WhatsAppIntegrationProps {
  chatbotId: number;
  chatbotName: string;
}

interface WhatsAppStatus {
  configurado: boolean;
  activo?: boolean;
  phone_number_id?: string;
  webhook_url?: string;
  creado_en?: string;
  mensaje?: string;
}

interface Conversation {
  id: number;
  user_phone: string;
  user_name: string;
  platform: string;
  estado: string;
  message_count: number;
  iniciado_en: string;
  actualizado_en: string;
}

interface Message {
  id: number;
  sender_type: 'user' | 'bot';
  content_type: string;
  content: string;
  node_id?: string;
  enviado_en: string;
}

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({
  chatbotId,
  chatbotName
}) => {
  const queryClient = useQueryClient();
  const [setupForm, setSetupForm] = useState({
    phone_number_id: '',
    access_token: '',
    verify_token: ''
  });
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);

  // Query para obtener el estado de WhatsApp
  const { data: whatsappStatus, isLoading: statusLoading } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp-status', chatbotId],
    queryFn: () => apiService.getWhatsAppStatus(chatbotId),
    refetchInterval: 30000 // Refrescar cada 30 segundos
  });

  // Query para obtener conversaciones
  const { data: conversations, isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations', chatbotId],
    queryFn: () => apiService.getConversations(chatbotId),
    enabled: whatsappStatus?.configurado === true,
    refetchInterval: 5000 // Refrescar cada 5 segundos
  });

  // Query para obtener mensajes de conversación seleccionada
  const { data: messages, isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ['conversation-messages', selectedConversation],
    queryFn: () => apiService.getConversationMessages(selectedConversation!),
    enabled: !!selectedConversation,
    refetchInterval: 2000 // Refrescar cada 2 segundos
  });

  // Mutation para configurar WhatsApp
  const setupMutation = useMutation({
    mutationFn: (data: typeof setupForm) => apiService.setupWhatsAppIntegration(chatbotId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-status', chatbotId] });
      toast.success('WhatsApp configurado exitosamente');
      setSetupForm({ phone_number_id: '', access_token: '', verify_token: '' });
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleSetupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!setupForm.phone_number_id || !setupForm.access_token || !setupForm.verify_token) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    setupMutation.mutate(setupForm);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const generateVerifyToken = () => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setSetupForm(prev => ({ ...prev, verify_token: token }));
  };

  if (statusLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Cargando estado de WhatsApp...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Compacto */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            WhatsApp
          </h3>
          {whatsappStatus?.configurado && (
            <Badge variant={whatsappStatus.activo ? "default" : "secondary"} className="flex items-center gap-1">
              {whatsappStatus.activo ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {whatsappStatus.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Configuración de WhatsApp Business API
        </p>
      </div>

      <Tabs defaultValue={whatsappStatus?.configurado ? "conversations" : "setup"} className="space-y-3">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup" className="text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Config
          </TabsTrigger>
          {whatsappStatus?.configurado && (
            <TabsTrigger value="conversations" className="text-xs">
              <MessageCircle className="w-3 h-3 mr-1" />
              Chat ({conversations?.length || 0})
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab de Configuración */}
        <TabsContent value="setup" className="space-y-3">
          {!whatsappStatus?.configurado ? (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Configurar WhatsApp Business API</h4>
              <form onSubmit={handleSetupSubmit} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="phone_number_id" className="text-xs">Phone Number ID</Label>
                  <Input
                    id="phone_number_id"
                    placeholder="123456789012345"
                    className="text-xs"
                    value={setupForm.phone_number_id}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, phone_number_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="access_token" className="text-xs">Access Token</Label>
                  <Input
                    id="access_token"
                    type="password"
                    placeholder="Token de acceso..."
                    className="text-xs"
                    value={setupForm.access_token}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, access_token: e.target.value }))}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="verify_token" className="text-xs">Verify Token</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={generateVerifyToken}
                    >
                      Generar
                    </Button>
                  </div>
                  <Input
                    id="verify_token"
                    placeholder="Token de verificación..."
                    className="text-xs"
                    value={setupForm.verify_token}
                    onChange={(e) => setSetupForm(prev => ({ ...prev, verify_token: e.target.value }))}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-xs h-8"
                  disabled={setupMutation.isPending}
                >
                  {setupMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Phone className="w-3 h-3 mr-1" />
                  )}
                  {setupMutation.isPending ? 'Configurando...' : 'Configurar'}
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-medium">WhatsApp Configurado</h4>
              </div>
              
              <div className="space-y-2">
                <div>
                  <Label className="text-xs font-medium">Phone Number ID</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <code className="text-xs bg-muted px-1 py-0.5 rounded flex-1 truncate">
                      {whatsappStatus.phone_number_id?.slice(0, 10)}...
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(whatsappStatus.phone_number_id!)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-medium">Webhook URL</Label>
                  <div className="flex items-center gap-1 mt-1">
                    <code className="text-xs bg-muted px-1 py-0.5 rounded flex-1 truncate">
                      ...webhook/{whatsappStatus.webhook_url?.split('/').pop()}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(whatsappStatus.webhook_url!)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-2 rounded text-xs">
                <p className="font-medium mb-1">✅ Configurado</p>
                <p className="text-muted-foreground">Ve a Meta for Developers para configurar el webhook con la URL de arriba.</p>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab de Conversaciones */}
        {whatsappStatus?.configurado && (
          <TabsContent value="conversations" className="space-y-3">
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" />
                Conversaciones Recientes
              </h4>
              
              {conversationsLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              ) : conversations && conversations.length > 0 ? (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {conversations.slice(0, 5).map((conv) => (
                      <div
                        key={conv.id}
                        className="p-2 rounded border hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => setSelectedConversation(conv.id)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {conv.user_name || conv.user_phone.slice(-4)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {conv.estado}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {conv.message_count} mensajes
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center p-4">
                  <MessageCircle className="w-6 h-6 text-muted-foreground mb-2 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    No hay conversaciones aún
                  </p>
                </div>
              )}
              
              {/* Vista rápida de mensajes si hay conversación seleccionada */}
              {selectedConversation && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium">Mensajes:</h5>
                  <ScrollArea className="h-32 border rounded p-2">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </div>
                    ) : messages && messages.length > 0 ? (
                      <div className="space-y-2">
                        {messages.slice(-5).map((message) => (
                          <div
                            key={message.id}
                            className={`text-xs p-1 rounded ${
                              message.sender_type === 'user'
                                ? 'bg-primary/10 text-right'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="truncate">{message.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center">
                        No hay mensajes
                      </p>
                    )}
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
