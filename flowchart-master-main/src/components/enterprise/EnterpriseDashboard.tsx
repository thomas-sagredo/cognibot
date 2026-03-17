import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock,
  BarChart3,
  Activity,
  Bot,
  Zap
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const conversationsData = [
  { name: 'Lun', conversaciones: 240, satisfaccion: 95 },
  { name: 'Mar', conversaciones: 380, satisfaccion: 92 },
  { name: 'Mié', conversaciones: 520, satisfaccion: 97 },
  { name: 'Jue', conversaciones: 450, satisfaccion: 94 },
  { name: 'Vie', conversaciones: 680, satisfaccion: 96 },
  { name: 'Sáb', conversaciones: 390, satisfaccion: 93 },
  { name: 'Dom', conversaciones: 320, satisfaccion: 95 },
];

const topicsData = [
  { name: 'Ventas', value: 35, color: 'hsl(262 83% 58%)' },
  { name: 'Soporte', value: 28, color: 'hsl(217 91% 60%)' },
  { name: 'Consultas', value: 22, color: 'hsl(190 95% 60%)' },
  { name: 'Otros', value: 15, color: 'hsl(220 13% 65%)' },
];

const performanceData = [
  { hora: '00:00', respuestas: 120, usuarios: 45 },
  { hora: '04:00', respuestas: 80, usuarios: 30 },
  { hora: '08:00', respuestas: 350, usuarios: 120 },
  { hora: '12:00', respuestas: 520, usuarios: 180 },
  { hora: '16:00', respuestas: 480, usuarios: 160 },
  { hora: '20:00', respuestas: 290, usuarios: 95 },
];

export function EnterpriseDashboard() {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 gradient-primary hover-glow hover-scale">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Conversaciones</p>
              <p className="text-3xl font-bold text-white">2,847</p>
              <div className="flex items-center text-xs text-white/60">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>+12.5% vs mes anterior</span>
              </div>
            </div>
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 gradient-secondary hover-glow hover-scale">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Usuarios Activos</p>
              <p className="text-3xl font-bold text-white">1,254</p>
              <div className="flex items-center text-xs text-white/60">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>+8.2% esta semana</span>
              </div>
            </div>
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-2 border-primary/20 hover-scale">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-foreground">2.3 min</p>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>-15% más rápido</span>
              </div>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Clock className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card border-2 border-secondary/20 hover-scale">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Satisfacción</p>
              <p className="text-3xl font-bold text-foreground">95.8%</p>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>+2.1% este mes</span>
              </div>
            </div>
            <div className="p-3 bg-secondary/10 rounded-lg">
              <Activity className="w-6 h-6 text-secondary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Conversaciones por Día</h3>
              <p className="text-sm text-muted-foreground">Últimos 7 días</p>
            </div>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={conversationsData}>
              <defs>
                <linearGradient id="colorConversaciones" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="conversaciones" 
                stroke="hsl(262 83% 58%)" 
                strokeWidth={2}
                fill="url(#colorConversaciones)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Temas Principales</h3>
              <p className="text-sm text-muted-foreground">Distribución de conversaciones</p>
            </div>
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topicsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {topicsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Rendimiento por Hora</h3>
              <p className="text-sm text-muted-foreground">Actividad en tiempo real</p>
            </div>
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="respuestas" fill="hsl(262 83% 58%)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="usuarios" fill="hsl(217 91% 60%)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Line Chart Multi */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Satisfacción del Usuario</h3>
              <p className="text-sm text-muted-foreground">Tasa de satisfacción semanal</p>
            </div>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={conversationsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" domain={[90, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="satisfaccion" 
                stroke="hsl(217 91% 60%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(217 91% 60%)', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 shadow-elegant">
        <h3 className="text-lg font-semibold mb-4">Actividad Reciente</h3>
        <div className="space-y-4">
          {[
            { user: 'Usuario #1523', action: 'Completó conversación sobre ventas', time: 'Hace 2 minutos', status: 'success' },
            { user: 'Usuario #1524', action: 'Solicitó soporte técnico', time: 'Hace 5 minutos', status: 'pending' },
            { user: 'Usuario #1525', action: 'Consulta de precios finalizada', time: 'Hace 8 minutos', status: 'success' },
            { user: 'Usuario #1526', action: 'Conversación en curso', time: 'Hace 12 minutos', status: 'active' },
          ].map((activity, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'pending' ? 'bg-yellow-500' :
                  'bg-blue-500 animate-pulse'
                }`} />
                <div>
                  <p className="font-medium">{activity.user}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{activity.time}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}