// services/api.ts
import { UserProfile, Chatbot, Variable } from '@/types/chatbot';

const inferredHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL as string | undefined || `http://${inferredHost}:8000`;

class ApiService {
  private async getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      // Manejo especial para 401 - sesión expirada
      if (response.status === 401) {
        // Limpiar autenticación y redirigir al login
        localStorage.removeItem('token');
        localStorage.removeItem('auth-storage');
        window.location.href = '/login.html';
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }

      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getChatbots(): Promise<Chatbot[]> {
    const response = await fetch(`${API_BASE_URL}/api/chatbots`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getChatbot(id: number): Promise<Chatbot> {
    const response = await fetch(`${API_BASE_URL}/api/chatbots/${id}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async saveChatbot(data: { nombre: string; descripcion?: string; configuracion: { nodes: unknown[]; edges: unknown[]; variables?: Variable[]; settings: { nombre: string; descripcion?: string } } }): Promise<{ id: number, mensaje: string }> {
    const response = await fetch(`${API_BASE_URL}/api/chatbots`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async updateChatbot(id: number, data: { nombre?: string; descripcion?: string; configuracion?: { nodes: unknown[]; edges: unknown[]; variables?: Variable[]; settings: { nombre: string; descripcion?: string } } }): Promise<{ mensaje: string }> {
    const response = await fetch(`${API_BASE_URL}/api/chatbots/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getVariables(): Promise<{ variables: Variable[]; actualizado_en: string | null }> {
    const response = await fetch(`${API_BASE_URL}/api/variables`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async saveVariables(variables: Variable[]): Promise<{ mensaje: string }> {
    const response = await fetch(`${API_BASE_URL}/api/variables`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify({ variables })
    });
    return this.handleResponse(response);
  }

  // WhatsApp Integration methods
  async setupWhatsAppIntegration(chatbotId: number, data: { phone_number_id: string; access_token: string; verify_token: string }): Promise<{ mensaje: string; webhook_url: string; verify_token: string }> {
    const response = await fetch(`${API_BASE_URL}/api/whatsapp/setup/${chatbotId}`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return this.handleResponse(response);
  }

  async getWhatsAppStatus(chatbotId: number): Promise<{ configurado: boolean; activo?: boolean; phone_number_id?: string; webhook_url?: string; creado_en?: string; mensaje?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/whatsapp/status/${chatbotId}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getWhatsAppIntegration(chatbotId: number): Promise<{ configurado: boolean; activo?: boolean; phone_number_id?: string; verify_token?: string; webhook_url?: string }> {
    const response = await fetch(`${API_BASE_URL}/api/whatsapp/integration/${chatbotId}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getConversations(chatbotId: number): Promise<{ id: number; user_phone: string; user_name: string; platform: string; estado: string; message_count: number; iniciado_en: string; actualizado_en: string }[]> {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${chatbotId}`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }

  async getConversationMessages(conversationId: number): Promise<{ id: number; sender_type: string; content_type: string; content: string; node_id?: string; enviado_en: string }[]> {
    const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}/messages`, {
      headers: await this.getAuthHeaders()
    });
    return this.handleResponse(response);
  }
}

export const apiService = new ApiService();