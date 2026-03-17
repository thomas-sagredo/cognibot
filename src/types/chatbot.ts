// types/chatbot.ts
// Centralized chatbot-related types used across the app

export interface ChatbotConfig {
  // Use React Flow node and edge types for diagram data
  nodes: import('@xyflow/react').Node[];
  edges: import('@xyflow/react').Edge[];
  settings: {
    nombre: string;
    descripcion?: string;
  };
  // Optional variables stored with the chatbot
  variables?: Variable[];
}

export interface Chatbot {
  id: number;
  nombre: string;
  descripcion?: string;
  configuracion: ChatbotConfig;
  creado_en: string;
  actualizado_en: string;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  plan: string;
}

export interface UserProfile {
  usuario: User;
  limites: {
    max_chatbots: number;
    max_nodos: number;
    chatbots_creados: number;
  };
  caracteristicas: Record<string, boolean>;
}

export interface Plan {
  id: number;
  nombre: string;
  max_chatbots: number;
  max_nodos_por_chatbot: number;
  precio_mensual: number;
  caracteristicas: Record<string, boolean>;
}

export type NodeType = 'start' | 'message' | 'option' | 'action' | 'condition' | 'end' | 'input' | 'delay';

export interface ChatbotNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    [key: string]: unknown;
  };
}

// Variables used by the builder and saved within chatbot configuration
export interface Variable {
  name: string;
  type: string;
  initialValue: string;
  description: string;
}

// Chat simulator message and conversation state
export interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  text: string;
  timestamp: Date | string;
  nodeId?: string;
}

export interface ConversationState {
  currentNodeId?: string;
  variables: Record<string, unknown>;
  messages: ChatMessage[];
  isCompleted: boolean;
}