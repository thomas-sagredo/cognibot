// Tipos avanzados con genéricos y utility types

// Utility types para el builder
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Tipos base con genéricos
export interface BaseNodeData<T = Record<string, unknown>> {
  id: string;
  type: string;
  label?: string;
  description?: string;
  metadata: T;
  validation?: ValidationResult;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos específicos de nodos con discriminated unions
export type NodeType = 
  | 'message'
  | 'input' 
  | 'option'
  | 'action'
  | 'condition'
  | 'delay';

export interface MessageNodeData extends BaseNodeData<{
  text: string;
  mediaType?: 'text' | 'image' | 'audio' | 'video';
  mediaUrl?: string;
  variables?: string[];
}> {
  type: 'message';
}

export interface InputNodeData extends BaseNodeData<{
  inputType: 'text' | 'number' | 'email' | 'phone';
  placeholder?: string;
  validation?: InputValidation;
  saveToVariable?: string;
}> {
  type: 'input';
}

export interface OptionNodeData extends BaseNodeData<{
  options: Array<{
    id: string;
    label: string;
    value: string;
    nextNodeId?: string;
  }>;
  maxSelections?: number;
  displayType: 'buttons' | 'list' | 'carousel';
}> {
  type: 'option';
}

export interface ActionNodeData extends BaseNodeData<{
  actionType: 'api_call' | 'set_variable' | 'send_email' | 'webhook';
  config: ApiCallConfig | VariableConfig | EmailConfig | WebhookConfig;
  onSuccess?: string; // Next node ID
  onError?: string;   // Error node ID
}> {
  type: 'action';
}

export interface ConditionNodeData extends BaseNodeData<{
  conditions: Array<{
    variable: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
    nextNodeId: string;
  }>;
  defaultNextNodeId?: string;
}> {
  type: 'condition';
}

// Union type discriminada para todos los tipos de nodos
export type AnyNodeData = 
  | MessageNodeData
  | InputNodeData
  | OptionNodeData
  | ActionNodeData
  | ConditionNodeData;

// Tipos para configuraciones específicas
export interface ApiCallConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  timeout?: number;
}

export interface VariableConfig {
  variableName: string;
  value: string | number | boolean;
  scope: 'session' | 'user' | 'global';
}

export interface EmailConfig {
  to: string;
  subject: string;
  template: string;
  variables?: Record<string, string>;
}

export interface WebhookConfig {
  url: string;
  payload: Record<string, unknown>;
  retries?: number;
}

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning';
}

export interface InputValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: (value: string) => ValidationResult;
}

// Tipos para el estado del builder con genéricos
export interface BuilderState<TNode extends AnyNodeData = AnyNodeData> {
  nodes: Array<BuilderNode<TNode>>;
  edges: BuilderEdge[];
  selectedNodeId: string | null;
  clipboard: Array<BuilderNode<TNode>> | null;
  history: HistoryState<TNode>;
  ui: UIState;
  config: BuilderConfig;
}

export interface BuilderNode<T extends AnyNodeData = AnyNodeData> {
  id: string;
  type: T['type'];
  position: { x: number; y: number };
  data: T;
  selected?: boolean;
  dragging?: boolean;
}

export interface BuilderEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  label?: string;
}

export interface HistoryState<TNode extends AnyNodeData> {
  past: Array<{
    nodes: Array<BuilderNode<TNode>>;
    edges: BuilderEdge[];
  }>;
  present: {
    nodes: Array<BuilderNode<TNode>>;
    edges: BuilderEdge[];
  };
  future: Array<{
    nodes: Array<BuilderNode<TNode>>;
    edges: BuilderEdge[];
  }>;
}

export interface UIState {
  sidebarCollapsed: boolean;
  activePanel: 'nodes' | 'properties' | 'variables' | 'settings' | null;
  darkMode: boolean;
  zoom: number;
  viewport: { x: number; y: number };
  showMinimap: boolean;
  showControls: boolean;
}

export interface BuilderConfig {
  maxNodes: number;
  autoSave: boolean;
  autoSaveInterval: number;
  validationEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
  theme: 'light' | 'dark' | 'auto';
}

// Tipos para operaciones del builder
export interface BuilderOperations<TNode extends AnyNodeData = AnyNodeData> {
  // Operaciones de nodos
  addNode: <T extends TNode>(
    type: T['type'], 
    position: { x: number; y: number }, 
    data?: Partial<T>
  ) => string;
  
  updateNode: <T extends TNode>(
    id: string, 
    updates: DeepPartial<BuilderNode<T>>
  ) => void;
  
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => string | null;
  
  // Operaciones de edges
  addEdge: (source: string, target: string, options?: Partial<BuilderEdge>) => void;
  deleteEdge: (id: string) => void;
  
  // Operaciones de selección
  selectNode: (id: string | null) => void;
  selectMultiple: (ids: string[]) => void;
  
  // Operaciones de historial
  undo: () => void;
  redo: () => void;
  
  // Operaciones de clipboard
  copy: (nodeIds: string[]) => void;
  paste: (position?: { x: number; y: number }) => void;
  
  // Validación
  validateNode: (id: string) => ValidationResult;
  validateFlow: () => ValidationResult;
}

// Tipos para eventos del builder
export interface BuilderEvents {
  onNodeAdd: (node: BuilderNode) => void;
  onNodeUpdate: (node: BuilderNode) => void;
  onNodeDelete: (nodeId: string) => void;
  onNodeSelect: (nodeId: string | null) => void;
  onEdgeAdd: (edge: BuilderEdge) => void;
  onEdgeDelete: (edgeId: string) => void;
  onValidationChange: (result: ValidationResult) => void;
  onSave: (state: BuilderState) => void;
  onLoad: (state: BuilderState) => void;
}

// Helper types para extraer tipos específicos
export type ExtractNodeType<T extends AnyNodeData, K extends NodeType> = 
  T extends { type: K } ? T : never;

export type NodeDataByType<K extends NodeType> = ExtractNodeType<AnyNodeData, K>;

// Tipos para props de componentes
export interface NodeComponentProps<T extends AnyNodeData = AnyNodeData> {
  node: BuilderNode<T>;
  selected: boolean;
  onUpdate: (updates: DeepPartial<T>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  validation?: ValidationResult;
}

// Tipos para el contexto del builder
export interface BuilderContextValue<TNode extends AnyNodeData = AnyNodeData> {
  state: BuilderState<TNode>;
  operations: BuilderOperations<TNode>;
  events: Partial<BuilderEvents>;
}

// Tipos para configuración de nodos
export interface NodeTypeConfig<T extends AnyNodeData = AnyNodeData> {
  type: T['type'];
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  defaultData: Omit<T, 'id' | 'type' | 'createdAt' | 'updatedAt'>;
  component: React.ComponentType<NodeComponentProps<T>>;
  validation?: (data: T) => ValidationResult;
}

// Registro de tipos de nodos
export type NodeTypeRegistry = {
  [K in NodeType]: NodeTypeConfig<NodeDataByType<K>>;
};

// Tipos para plugins del builder
export interface BuilderPlugin {
  name: string;
  version: string;
  install: (builder: BuilderContextValue) => void;
  uninstall: () => void;
}

// Tipos para serialización
export interface SerializedBuilderState {
  version: string;
  nodes: Array<Omit<BuilderNode, 'selected' | 'dragging'>>;
  edges: BuilderEdge[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
  };
}
