import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  Users,
  Plus,
  MoreHorizontal,
  Star
} from 'lucide-react';

const conversationsData = [
  {
    id: '1',
    user: {
      name: 'María González',
      avatar: '👩',
      lastSeen: '1h ago'
    },
    lastMessage: '¿Cuándo estará disponible el producto X?',
    timestamp: '10:30 AM',
    status: 'active',
    platform: 'whatsapp',
    unread: 2
  },
  {
    id: '2',
    user: {
      name: 'Carlos Ruiz',
      avatar: '👨',
      lastSeen: '2h ago'
    },
    lastMessage: 'Perfecto, muchas gracias por la información',
    timestamp: '9:15 AM',
    status: 'resolved',
    platform: 'telegram',
    unread: 0
  },
  {
    id: '3',
    user: {
      name: 'Ana Martínez',
      avatar: '👩‍💼',
      lastSeen: '3h ago'
    },
    lastMessage: 'Necesito ayuda con mi pedido',
    timestamp: '8:45 AM',
    status: 'pending',
    platform: 'messenger',
    unread: 1
  },
  {
    id: '4',
    user: {
      name: 'Jorge López',
      avatar: '👨‍💻',
      lastSeen: '5h ago'
    },
    lastMessage: 'Tienen descuentos?',
    timestamp: '7:20 AM',
    status: 'active',
    platform: 'whatsapp',
    unread: 3
  },
  {
    id: '5',
    user: {
      name: 'Laura Sánchez',
      avatar: '👩‍🎨',
      lastSeen: '1d ago'
    },
    lastMessage: 'Perfecto, muchas gracias',
    timestamp: 'Yesterday',
    status: 'resolved',
    platform: 'telegram',
    unread: 0
  }
];

const currentConversation = [
  {
    id: '1',
    sender: 'user',
    message: '¡Hola! Sr, tenemos disponible el producto X que preguntaste. ¿Te gustaría conocer más detalles?',
    timestamp: '10:15 AM'
  },
  {
    id: '2',
    sender: 'bot',
    message: '¡Hola! Vienen disponible el producto X?',
    timestamp: '10:17 AM'
  },
  {
    id: '3',
    sender: 'user',
    message: 'El precio es $299 y el tiempo de entrega es de 2-4 días hábiles. Las entregas realizan el producto?',
    timestamp: '10:18 AM'
  },
  {
    id: '4',
    sender: 'bot',
    message: '¿Cuál es el precio y el tiempo de entrega?',
    timestamp: '10:20 AM'
  },
  {
    id: '5',
    sender: 'user',
    message: '¿Cuándo estará disponible el producto X?',
    timestamp: '10:30 AM'
  }
];

export function Conversations() {
  const [selectedConversation, setSelectedConversation] = useState(conversationsData[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-500';
      case 'pending': return 'bg-orange-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'whatsapp': return '📱';
      case 'telegram': return '✈️';
      case 'messenger': return '💬';
      default: return '💬';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Conversaciones
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona y responde las conversaciones de tus clientes
          </p>
        </div>
        <Button className="gradient-primary hover-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Conversación
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 gradient-primary text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Activas</p>
              <p className="text-3xl font-bold">247</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Pendientes</p>
              <p className="text-3xl font-bold">45</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Resueltas Hoy</p>
              <p className="text-3xl font-bold">128</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Tiempo Promedio</p>
              <p className="text-3xl font-bold">2.3m</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="p-4 shadow-elegant">
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4" />
              </Button>
            </div>

            {/* Conversations List */}
            <div className="space-y-2 overflow-y-auto max-h-[500px]">
              {conversationsData.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-3 rounded-xl cursor-pointer transition-all hover:bg-muted/50 ${
                    selectedConversation.id === conversation.id ? 'bg-muted' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                        {conversation.user.avatar}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${getStatusColor(conversation.status)} border-2 border-background`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm truncate">{conversation.user.name}</h4>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{getPlatformIcon(conversation.platform)}</span>
                          <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{conversation.user.lastSeen}</span>
                        {conversation.unread > 0 && (
                          <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Chat Messages */}
        <Card className="lg:col-span-2 p-4 shadow-elegant flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                {selectedConversation.user.avatar}
              </div>
              <div>
                <h3 className="font-semibold">{selectedConversation.user.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.user.lastSeen}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Star className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {currentConversation.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-xl ${
                    message.sender === 'user'
                      ? 'gradient-primary text-white'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <p className="text-sm">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Escribe tu mensaje..."
                className="flex-1"
              />
              <Button className="gradient-primary">
                Enviar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
