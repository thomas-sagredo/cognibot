import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Send,
  Facebook,
  Zap,
  Webhook,
  CheckCircle2,
  XCircle,
  Settings,
  Activity,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
} from 'lucide-react';

const integrations = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: MessageSquare,
    color: 'from-green-500 to-green-600',
    connected: true,
    stats: { messages: 12453, users: 3421, avgResponse: '2.3m' },
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    icon: Send,
    color: 'from-blue-500 to-blue-600',
    connected: true,
    stats: { messages: 8234, users: 1876, avgResponse: '1.8m' },
  },
  {
    id: 'messenger',
    name: 'Facebook Messenger',
    icon: Facebook,
    color: 'from-blue-600 to-indigo-600',
    connected: false,
    stats: { messages: 0, users: 0, avgResponse: '-' },
  },
  {
    id: 'zapier',
    name: 'Zapier',
    icon: Zap,
    color: 'from-orange-500 to-orange-600',
    connected: true,
    stats: { triggers: 234, actions: 567, workflows: 12 },
  },
  {
    id: 'webhook',
    name: 'Custom Webhooks',
    icon: Webhook,
    color: 'from-purple-500 to-purple-600',
    connected: true,
    stats: { endpoints: 5, requests: 45678, errors: 12 },
  },
];

export function Integrations() {
  const [selectedIntegration, setSelectedIntegration] = useState(integrations[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Integraciones
          </h2>
          <p className="text-muted-foreground mt-1">
            Conecta tu chatbot con múltiples plataformas y servicios
          </p>
        </div>
        <Button className="gradient-primary shadow-glow">
          <Webhook className="w-4 h-4 mr-2" />
          Nueva Integración
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integrations List */}
        <div className="lg:col-span-1 space-y-3">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card
                key={integration.id}
                className={`p-4 cursor-pointer transition-all hover-scale ${
                  selectedIntegration.id === integration.id
                    ? 'border-primary shadow-glow'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedIntegration(integration)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${integration.color} flex items-center justify-center shadow-elegant`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {integration.connected ? 'Conectado' : 'Desconectado'}
                      </p>
                    </div>
                  </div>
                  {integration.connected ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Integration Details */}
        <Card className="lg:col-span-2 p-6 shadow-elegant">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="config">Configuración</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedIntegration.color} flex items-center justify-center shadow-elegant`}
                  >
                    {(() => {
                      const Icon = selectedIntegration.icon;
                      return <Icon className="w-8 h-8 text-white" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedIntegration.name}</h3>
                    <Badge
                      variant={selectedIntegration.connected ? 'default' : 'secondary'}
                      className="mt-1"
                    >
                      {selectedIntegration.connected ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
                <Switch checked={selectedIntegration.connected} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(selectedIntegration.stats).map(([key, value]) => (
                  <Card key={key} className="p-4 bg-gradient-to-br from-card to-muted/20">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Activity className="w-4 h-4" />
                      {key === 'messages' && 'Mensajes'}
                      {key === 'users' && 'Usuarios'}
                      {key === 'avgResponse' && 'Resp. Promedio'}
                      {key === 'triggers' && 'Triggers'}
                      {key === 'actions' && 'Acciones'}
                      {key === 'workflows' && 'Workflows'}
                      {key === 'endpoints' && 'Endpoints'}
                      {key === 'requests' && 'Requests'}
                      {key === 'errors' && 'Errores'}
                    </div>
                    <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                  </Card>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Acciones Rápidas
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="justify-start">
                    <Activity className="w-4 h-4 mr-2" />
                    Ver Logs
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Reportes
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Gestionar Usuarios
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Configuración Avanzada
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input type="password" placeholder="••••••••••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder="https://api.example.com/webhook"
                    value="https://cognibot.app/webhook/abc123"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label>Token de Verificación</Label>
                  <Input type="password" placeholder="••••••••••••••••" />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-medium">Activar respuestas automáticas</p>
                    <p className="text-sm text-muted-foreground">
                      Responder automáticamente fuera de horario
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div>
                    <p className="font-medium">Notificaciones en tiempo real</p>
                    <p className="text-sm text-muted-foreground">
                      Recibir alertas de nuevos mensajes
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Button className="w-full gradient-primary">
                  Guardar Configuración
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Crecimiento Mensual
                  </div>
                  <p className="text-3xl font-bold text-green-500">+23.5%</p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    Uptime
                  </div>
                  <p className="text-3xl font-bold text-primary">99.9%</p>
                </Card>
              </div>
              <div className="h-48 bg-muted/20 rounded-xl flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de rendimiento</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
