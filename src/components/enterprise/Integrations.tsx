import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { 
  Plus, 
  Settings, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  Users,
  MessageSquare,
  Zap
} from 'lucide-react';

const integrations = [
  {
    id: '1',
    name: 'WhatsApp Business',
    description: 'Conecta tu chatbot con WhatsApp Business API',
    icon: '📱',
    status: 'connected',
    color: 'from-green-500 to-green-600'
  },
  {
    id: '2',
    name: 'Telegram Bot',
    description: 'Integración completa con Telegram Bot API',
    icon: '✈️',
    status: 'connected',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: '3',
    name: 'Facebook Messenger',
    description: 'Conecta con Facebook Messenger Platform',
    icon: '💬',
    status: 'disconnected',
    color: 'from-blue-600 to-purple-600'
  },
  {
    id: '4',
    name: 'Zapier',
    description: 'Automatiza workflows con más de 5000 apps',
    icon: '⚡',
    status: 'connected',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: '5',
    name: 'Custom Webhooks',
    description: 'Integra con cualquier API mediante webhooks',
    icon: '🔗',
    status: 'connected',
    color: 'from-purple-500 to-pink-500'
  }
];

const whatsappMetrics = {
  messages: 12453,
  users: 3421,
  avgResponse: '2.3m'
};

export function Integrations() {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status: string) => {
    return status === 'connected' ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <AlertCircle className="w-5 h-5 text-orange-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Integraciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Conecta tu chatbot con múltiples plataformas y servicios
          </p>
        </div>
        <Button className="gradient-primary hover-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Integración
        </Button>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="p-6 shadow-elegant hover-scale">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 bg-gradient-to-br ${integration.color} rounded-xl`}>
                <span className="text-2xl">{integration.icon}</span>
              </div>
              {getStatusIcon(integration.status)}
            </div>
            
            <h3 className="font-semibold text-lg mb-2">{integration.name}</h3>
            <p className="text-muted-foreground text-sm mb-4">{integration.description}</p>
            
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${
                integration.status === 'connected' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
              }`}>
                {integration.status === 'connected' ? 'Conectado' : 'Desconectado'}
              </span>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* WhatsApp Integration Detail */}
      <Card className="p-6 shadow-elegant">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <span className="text-2xl">📱</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">WhatsApp Business</h2>
              <p className="text-muted-foreground">Configuración y métricas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Activo</span>
            <Switch checked={true} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Resumen
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'config'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span className="font-medium">Mensajes</span>
              </div>
              <p className="text-2xl font-bold">{whatsappMetrics.messages.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total enviados</p>
            </div>
            
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-medium">Usuarios</span>
              </div>
              <p className="text-2xl font-bold">{whatsappMetrics.users.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Usuarios únicos</p>
            </div>
            
            <div className="bg-muted rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-medium">Tiempo Promedio</span>
              </div>
              <p className="text-2xl font-bold">{whatsappMetrics.avgResponse}</p>
              <p className="text-sm text-muted-foreground">Respuesta promedio</p>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="https://api.cognibot.com/webhook/whatsapp"
                    readOnly
                    className="flex-1 px-3 py-2 bg-muted border rounded-lg text-sm"
                  />
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Token de Verificación</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value="••••••••••••••••"
                    readOnly
                    className="flex-1 px-3 py-2 bg-muted border rounded-lg text-sm"
                  />
                  <Button variant="outline" size="sm">
                    Ver
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Acciones Rápidas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  Ver Logs
                </Button>
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reportes
                </Button>
                <Button variant="outline" className="justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Gestionar Usuarios
                </Button>
                <Button variant="outline" className="justify-start">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Configuración Avanzada
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Analytics Detallados</h3>
            <p className="text-muted-foreground mb-4">
              Próximamente tendrás acceso a métricas detalladas y reportes avanzados
            </p>
            <Button className="gradient-primary">
              Solicitar Acceso Beta
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
