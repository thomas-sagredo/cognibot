import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCheck,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Archive,
  Star,
  UserPlus,
} from 'lucide-react';

const conversations = [
  {
    id: '1',
    user: 'María González',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    lastMessage: '¿Cuándo estará disponible el producto?',
    timestamp: '2m',
    unread: 3,
    status: 'active',
    channel: 'whatsapp',
  },
  {
    id: '2',
    user: 'Carlos Ruiz',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    lastMessage: 'Gracias por la información',
    timestamp: '15m',
    unread: 0,
    status: 'resolved',
    channel: 'telegram',
  },
  {
    id: '3',
    user: 'Ana Martínez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    lastMessage: 'Necesito ayuda con mi pedido',
    timestamp: '1h',
    unread: 1,
    status: 'pending',
    channel: 'messenger',
  },
  {
    id: '4',
    user: 'Jorge López',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jorge',
    lastMessage: '¿Tienen descuentos?',
    timestamp: '2h',
    unread: 0,
    status: 'active',
    channel: 'whatsapp',
  },
  {
    id: '5',
    user: 'Laura Sánchez',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura',
    lastMessage: 'Perfecto, muchas gracias!',
    timestamp: '3h',
    unread: 0,
    status: 'resolved',
    channel: 'telegram',
  },
];

const messages = [
  {
    id: '1',
    sender: 'user',
    text: 'Hola, ¿tienen disponible el producto X?',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    sender: 'bot',
    text: '¡Hola! Sí, tenemos el producto X disponible. ¿Te gustaría conocer más detalles?',
    timestamp: '10:30 AM',
  },
  {
    id: '3',
    sender: 'user',
    text: '¿Cuál es el precio y el tiempo de entrega?',
    timestamp: '10:31 AM',
  },
  {
    id: '4',
    sender: 'bot',
    text: 'El precio es $299 y el tiempo de entrega es de 2-3 días hábiles. ¿Te gustaría realizar el pedido?',
    timestamp: '10:31 AM',
  },
  {
    id: '5',
    sender: 'user',
    text: '¿Cuándo estará disponible el producto?',
    timestamp: '10:32 AM',
  },
];

export function Conversations() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [messageText, setMessageText] = useState('');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Conversaciones
          </h2>
          <p className="text-muted-foreground mt-1">
            Gestiona y responde las conversaciones de tus clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button className="gradient-primary shadow-glow">
            <UserPlus className="w-4 h-4 mr-2" />
            Nueva Conversación
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 gradient-primary text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Activas</p>
              <p className="text-3xl font-bold mt-1">247</p>
            </div>
            <MessageSquare className="w-8 h-8 opacity-80" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Pendientes</p>
              <p className="text-3xl font-bold mt-1">45</p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Resueltas Hoy</p>
              <p className="text-3xl font-bold mt-1">128</p>
            </div>
            <CheckCheck className="w-8 h-8 opacity-80" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Tiempo Promedio</p>
              <p className="text-3xl font-bold mt-1">2.3m</p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-4 p-4 shadow-elegant">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`p-3 cursor-pointer transition-all hover-scale ${
                      selectedConversation.id === conversation.id
                        ? 'border-primary shadow-glow'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.avatar} />
                          <AvatarFallback>{conversation.user[0]}</AvatarFallback>
                        </Avatar>
                        {conversation.unread > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {conversation.unread}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold truncate">{conversation.user}</p>
                          <span className="text-xs text-muted-foreground">
                            {conversation.timestamp}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessage}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge
                            variant={
                              conversation.status === 'active'
                                ? 'default'
                                : conversation.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-xs"
                          >
                            {conversation.status === 'active' && 'Activa'}
                            {conversation.status === 'pending' && 'Pendiente'}
                            {conversation.status === 'resolved' && 'Resuelta'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {conversation.channel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-8 shadow-elegant flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedConversation.avatar} />
                <AvatarFallback>{selectedConversation.user[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedConversation.user}</p>
                <p className="text-xs text-muted-foreground">En línea</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Star className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Archive className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'gradient-primary text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user'
                          ? 'text-white/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Escribe un mensaje..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon">
                <Smile className="w-5 h-5" />
              </Button>
              <Button className="gradient-primary shadow-glow">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
