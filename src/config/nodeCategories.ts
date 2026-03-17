import {
  Bot,
  MessageSquare,
  Mic,
  Image as ImageIcon,
  Play,
  File,
  Sticker,
  MessageCircle,
  ListOrdered,
  SquareStack,
  FormInput,
  Cpu,
  Zap,
  Timer,
  GitBranch,
  Keyboard,
} from 'lucide-react';
import { NodeCategory } from '@/types/builder';

export const nodeCategories: NodeCategory[] = [
  {
    id: 'bot-response',
    label: 'Respuestas del Bot',
    icon: Bot,
    color: 'blue',
    options: [
      { 
        type: 'message', 
        label: 'Mensaje de texto', 
        icon: MessageSquare, 
        description: 'Envía un mensaje de texto simple',
        subtype: 'text' 
      },
      { 
        type: 'message', 
        label: 'Mensaje de audio', 
        icon: Mic, 
        description: 'Envía un mensaje de audio o nota de voz',
        subtype: 'audio' 
      },
      { 
        type: 'message', 
        label: 'Imagen', 
        icon: ImageIcon, 
        description: 'Envía una imagen con caption opcional',
        subtype: 'image' 
      },
      { 
        type: 'message', 
        label: 'Video', 
        icon: Play, 
        description: 'Envía un video con caption opcional',
        subtype: 'video' 
      },
      { 
        type: 'message', 
        label: 'Documento', 
        icon: File, 
        description: 'Envía un archivo o documento',
        subtype: 'document' 
      },
      { 
        type: 'message', 
        label: 'Sticker', 
        icon: Sticker, 
        description: 'Envía un sticker animado',
        subtype: 'sticker' 
      },
    ],
  },
  {
    id: 'user-input',
    label: 'Entrada del Usuario',
    icon: Keyboard,
    color: 'green',
    options: [
      { 
        type: 'input', 
        label: 'Texto libre', 
        icon: MessageCircle, 
        description: 'Captura cualquier texto del usuario',
        subtype: 'text' 
      },
      { 
        type: 'option', 
        label: 'Lista de opciones', 
        icon: ListOrdered, 
        description: 'Hasta 10 opciones en lista desplegable',
        subtype: 'list' 
      },
      { 
        type: 'option', 
        label: 'Botones rápidos', 
        icon: SquareStack, 
        description: 'Hasta 3 botones de respuesta rápida',
        subtype: 'buttons' 
      },
      { 
        type: 'input', 
        label: 'Pregunta', 
        icon: FormInput, 
        description: 'Hace una pregunta y guarda la respuesta',
        subtype: 'question' 
      },
    ],
  },
  {
    id: 'actions',
    label: 'Acciones',
    icon: Zap,
    color: 'orange',
    options: [
      { 
        type: 'action', 
        label: 'Asignar variable', 
        icon: Cpu, 
        description: 'Asigna un valor a una variable del sistema',
        subtype: 'set_variable' 
      },
      { 
        type: 'action', 
        label: 'Llamar API', 
        icon: Zap, 
        description: 'Realiza una llamada a una API externa',
        subtype: 'api_call' 
      },
      { 
        type: 'delay', 
        label: 'Esperar', 
        icon: Timer, 
        description: 'Pausa el flujo por un tiempo determinado',
        subtype: 'delay' 
      },
    ],
  },
  {
    id: 'conditions',
    label: 'Condiciones',
    icon: GitBranch,
    color: 'yellow',
    options: [
      { 
        type: 'condition', 
        label: 'Condición', 
        icon: GitBranch, 
        description: 'Bifurca el flujo según una condición',
        subtype: 'if' 
      },
    ],
  },
];

export const getNodeCategoryById = (id: string): NodeCategory | undefined => {
  return nodeCategories.find(category => category.id === id);
};

export const getNodeOptionByType = (type: string, subtype?: string) => {
  for (const category of nodeCategories) {
    const option = category.options.find(opt => 
      opt.type === type && (!subtype || opt.subtype === subtype)
    );
    if (option) return option;
  }
  return null;
};
