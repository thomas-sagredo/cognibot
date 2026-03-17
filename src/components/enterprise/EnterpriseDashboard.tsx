import { Card } from '../ui/card';
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
  { hora: '12:00', respuestas: 480, usuarios: 180 },
  { hora: '16:00', respuestas: 420, usuarios: 160 },
  { hora: '20:00', respuestas: 280, usuarios: 90 },
];

const satisfactionData = [
  { dia: 'Lun', satisfaccion: 4.2 },
  { dia: 'Mar', satisfaccion: 4.5 },
  { dia: 'Mié', satisfaccion: 4.8 },
  { dia: 'Jue', satisfaccion: 4.3 },
  { dia: 'Vie', satisfaccion: 4.7 },
  { dia: 'Sáb', satisfaccion: 4.1 },
  { dia: 'Dom', satisfaccion: 4.4 },
];

export function EnterpriseDashboard() {
  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 gradient-primary text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Conversaciones</p>
              <p className="text-3xl font-bold">2,847</p>
              <p className="text-white/80 text-xs mt-1">+12% vs mes anterior</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 gradient-secondary text-white shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm font-medium">Usuarios Activos</p>
              <p className="text-3xl font-bold">1,254</p>
              <p className="text-white/80 text-xs mt-1">+8% vs mes anterior</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-foreground">2.3 min</p>
              <p className="text-muted-foreground text-xs mt-1">-15% vs mes anterior</p>
            </div>
            <div className="p-3 bg-muted rounded-xl">
              <Clock className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card shadow-elegant">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Satisfacción</p>
              <p className="text-3xl font-bold text-foreground">95.8%</p>
              <p className="text-muted-foreground text-xs mt-1">+3% vs mes anterior</p>
            </div>
            <div className="p-3 bg-muted rounded-xl">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Conversaciones por Día */}
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
                <linearGradient id="conversationsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 10px 30px -10px hsl(222 47% 11% / 0.2)'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="conversaciones" 
                stroke="hsl(262 83% 58%)" 
                strokeWidth={3}
                fill="url(#conversationsGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Temas Principales */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Temas Principales</h3>
              <p className="text-sm text-muted-foreground">Distribución de conversaciones</p>
            </div>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topicsData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        {/* Rendimiento por Hora */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Rendimiento por Hora</h3>
              <p className="text-sm text-muted-foreground">Actividad en tiempo real</p>
            </div>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="hora" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="respuestas" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="usuarios" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Satisfacción del Usuario */}
        <Card className="p-6 shadow-elegant">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Satisfacción del Usuario</h3>
              <p className="text-sm text-muted-foreground">Puntuación promedio semanal</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="dia" className="text-xs" />
              <YAxis domain={[0, 5]} className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="satisfaccion" 
                stroke="hsl(190 95% 60%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(190 95% 60%)', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: 'hsl(190 95% 60%)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 shadow-elegant">
        <h3 className="text-lg font-semibold mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
            <div className="p-2 gradient-primary rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium">Crear Nuevo Bot</p>
              <p className="text-sm text-muted-foreground">Configurar asistente</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
            <div className="p-2 gradient-secondary rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium">Ver Reportes</p>
              <p className="text-sm text-muted-foreground">Análisis detallado</p>
            </div>
          </button>
          
          <button className="flex items-center gap-3 p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors">
            <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-medium">Optimizar</p>
              <p className="text-sm text-muted-foreground">Mejorar rendimiento</p>
            </div>
          </button>
        </div>
      </Card>
    </div>
  );
}
