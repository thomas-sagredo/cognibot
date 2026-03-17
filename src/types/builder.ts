// Tipos para el Constructor de Chatbots

export interface NodeOption {
  label: string;
  value: string;
}

export interface NodeData {
  label?: string; // Opcional para compatibilidad con ReactFlow
  text?: string;
  options?: NodeOption[];
  subtype?: string;
  delay?: number;
  variableName?: string;
  variableValue?: string;
  saveToVariable?: string;
  validation?: 'none' | 'email' | 'phone' | 'number' | 'text';
  actionType?: 'set_variable' | 'api_call' | 'notify';
  delayTime?: number;
  waitingMessage?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface CustomNodeData extends NodeData {
  [key: string]: unknown;
}

export interface FlowValidationError {
  nodeId: string;
  nodeLabel: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface FlowStats {
  totalNodes: number;
  messageNodes: number;
  optionNodes: number;
  actionNodes: number;
  conditionNodes: number;
  inputNodes: number;
  delayNodes: number;
  totalConnections: number;
  orphanNodes: number;
  emptyNodes: number;
}

export interface AddNodeEvent extends CustomEvent {
  detail: {
    sourceNodeId: string;
  };
}

export type NodeSubtype = 
  | 'text' 
  | 'audio' 
  | 'image' 
  | 'video' 
  | 'document' 
  | 'sticker' 
  | 'location' 
  | 'contact'
  | 'list' 
  | 'buttons' 
  | 'question' 
  | 'flow'
  | 'set_variable' 
  | 'api_call' 
  | 'notify'
  | 'delay'
  | 'if'
  | 'schedule';

export interface NodeCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'orange' | 'yellow' | 'purple' | 'teal';
  options: NodeCategoryOption[];
}

export interface NodeCategoryOption {
  type: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  subtype: NodeSubtype;
  disabled?: boolean;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MAX_OPTIONS_BUTTONS = 3;
export const MAX_OPTIONS_LIST = 10;
export const MAX_DELAY_SECONDS = 300;
export const MIN_DELAY_SECONDS = 1;
export const AUTO_SAVE_INTERVAL = 30000; // 30 segundos
