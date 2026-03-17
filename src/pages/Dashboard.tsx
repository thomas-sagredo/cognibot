import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

const Dashboard = () => {
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => apiService.getProfile(), enabled: !!localStorage.getItem('token') });

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>
      {profile ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded bg-card/90">
            <div className="text-sm text-muted-foreground">Chatbots</div>
            <div className="text-2xl font-bold">{profile.limites.chatbots_creados}/{profile.limites.max_chatbots}</div>
          </div>
          <div className="p-4 border rounded bg-card/90">
            <div className="text-sm text-muted-foreground">Nodos</div>
            <div className="text-2xl font-bold">{profile.limites.max_nodos}</div>
          </div>
          <div className="p-4 border rounded bg-card/90">
            <div className="text-sm text-muted-foreground">Plan</div>
            <div className="text-2xl font-bold capitalize">{profile.usuario.plan}</div>
          </div>
        </div>
      ) : (
        <div>Cargando...</div>
      )}
    </div>
  );
};

export default Dashboard;


