import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  Bot, 
  MessageSquare, 
  MousePointer, 
  Cpu, 
  GitBranch, 
  StopCircle,
  Plus,
  Timer,
  Keyboard
} from 'lucide-react';

const iconMap = {
  start: Bot,
  message: MessageSquare,
  input: Keyboard,
  option: MousePointer,
  action: Cpu,
  condition: GitBranch,
  delay: Timer,
  end: StopCircle,
};

const colorMap = {
  start: 'from-purple-500 to-purple-600',
  message: 'from-blue-500 to-blue-600',
  input: 'from-green-500 to-green-600',
  option: 'from-cyan-500 to-cyan-600',
  action: 'from-violet-500 to-violet-600',
  condition: 'from-yellow-500 to-yellow-600',
  delay: 'from-pink-500 to-pink-600',
  end: 'from-red-500 to-red-600',
};

const nodeTypeOptions = [
  { type: 'message', icon: MessageSquare, label: 'Mensaje', color: 'from-blue-500 to-blue-600' },
  { type: 'input', icon: Keyboard, label: 'Entrada', color: 'from-green-500 to-green-600' },
  { type: 'option', icon: MousePointer, label: 'Opciones', color: 'from-cyan-500 to-cyan-600' },
  { type: 'action', icon: Cpu, label: 'Acción', color: 'from-violet-500 to-violet-600' },
  { type: 'condition', icon: GitBranch, label: 'Condición', color: 'from-yellow-500 to-yellow-600' },
  { type: 'delay', icon: Timer, label: 'Delay', color: 'from-pink-500 to-pink-600' },
  { type: 'end', icon: StopCircle, label: 'Final', color: 'from-red-500 to-red-600' },
];

export const RadialChatbotNode = memo(({ data, id, positionAbsoluteX, positionAbsoluteY }: NodeProps) => {
  const [showRadialMenu, setShowRadialMenu] = useState(false);
  const Icon = iconMap[data.type as keyof typeof iconMap] || Bot;
  const gradientColor = colorMap[data.type as keyof typeof colorMap] || 'from-gray-500 to-gray-600';

  const handleAddNode = (type: string) => {
    const onAddNode = data.onAddNode as ((type: string, position: { x: number; y: number }, sourceId: string) => void) | undefined;
    if (onAddNode && typeof positionAbsoluteX === 'number' && typeof positionAbsoluteY === 'number') {
      onAddNode(type, { x: positionAbsoluteX, y: positionAbsoluteY + 150 }, id);
    }
    setShowRadialMenu(false);
  };

  return (
    <div className="group relative">
      {/* Node Content */}
      <div className={`
        relative min-w-[240px] rounded-xl shadow-lg transition-all duration-300
        bg-white border-2 border-gray-200
        group-hover:shadow-xl group-hover:scale-[1.02]
      `}>
        {/* Top Handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
        />

        {/* Header */}
        <div className={`bg-gradient-to-r ${gradientColor} p-3 rounded-t-xl flex items-center gap-2`}>
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">{String(data.label || 'Nodo')}</span>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <p className="text-sm text-gray-700 leading-relaxed">
            {String(data.message || 'Configura este nodo...')}
          </p>
          
          {Array.isArray(data.options) && data.options.length > 0 && (
            <div className="space-y-1 mt-3">
              {data.options.map((option: string, i: number) => (
                <div key={i} className="text-xs px-2 py-1 bg-gray-100 rounded flex items-center gap-1">
                  <MousePointer className="w-3 h-3 text-purple-500" />
                  <span>{String(option)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-purple-500 !border-2 !border-white"
        />
      </div>

      {/* Radial Menu Button */}
      {data.type !== 'end' && (
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-50">
          <button
            className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group-hover:animate-pulse"
            onClick={(e) => {
              e.stopPropagation();
              setShowRadialMenu(!showRadialMenu);
            }}
          >
            <Plus className={`w-5 h-5 text-white transition-transform duration-300 ${showRadialMenu ? 'rotate-45' : ''}`} />
          </button>

          {/* Radial Menu */}
          {showRadialMenu && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-in fade-in zoom-in duration-200">
              <div className="relative w-[280px] h-[280px]">
                {nodeTypeOptions.map((option, index) => {
                  const angle = (index * 360) / nodeTypeOptions.length - 90;
                  const radius = 90;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  const OptionIcon = option.icon;

                  return (
                    <button
                      key={option.type}
                      className={`absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-br ${option.color} rounded-full shadow-lg hover:shadow-xl hover:scale-125 transition-all duration-300 flex items-center justify-center group/item`}
                      style={{
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddNode(option.type);
                      }}
                    >
                      <OptionIcon className="w-5 h-5 text-white" />
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-lg border">
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

RadialChatbotNode.displayName = 'RadialChatbotNode';
