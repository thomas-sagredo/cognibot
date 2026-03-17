import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode } from './BaseNode';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Play, 
  File,
  Sticker,
  Type,
} from 'lucide-react';
import { NodeData } from '@/types/builder';
import { cn } from '@/lib/utils';

interface ImprovedMessageNodeProps extends NodeProps {
  data: NodeData;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onAddNode?: () => void;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export const ImprovedMessageNode: React.FC<ImprovedMessageNodeProps> = (props) => {
  const { data } = props;
  
  const getContentIcon = () => {
    switch (data.subtype) {
      case 'text': return Type;
      case 'image': return ImageIcon;
      case 'audio': return Mic;
      case 'video': return Play;
      case 'document': return File;
      case 'sticker': return Sticker;
      default: return MessageSquare;
    }
  };

  const getContentPreview = () => {
    if (!data.text) {
      return (
        <div className="text-gray-400 dark:text-gray-500 text-sm italic">
          Haz clic para agregar contenido
        </div>
      );
    }

    switch (data.subtype) {
      case 'text':
        return (
          <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {data.text}
          </div>
        );
      
      case 'image':
        return (
          <div className="space-y-2">
            {data.fileUrl ? (
              <div className="relative">
                <img 
                  src={data.fileUrl} 
                  alt="Preview" 
                  className="w-full h-20 object-cover rounded border"
                />
                <Badge className="absolute top-1 right-1 text-xs">
                  Imagen
                </Badge>
              </div>
            ) : (
              <div className="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            {data.text && (
              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                Caption: {data.text}
              </div>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <Mic className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700 dark:text-blue-300">
                {data.fileName || 'Audio sin título'}
              </span>
            </div>
            {data.text && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {data.text}
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            {data.fileUrl ? (
              <div className="relative">
                <video 
                  src={data.fileUrl} 
                  className="w-full h-20 object-cover rounded border"
                  muted
                />
                <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <Play className="w-6 h-6 text-gray-400" />
              </div>
            )}
            {data.text && (
              <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                Caption: {data.text}
              </div>
            )}
          </div>
        );
      
      case 'document':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <File className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700 dark:text-green-300 truncate">
                {data.fileName || 'Documento sin título'}
              </span>
            </div>
            {data.text && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {data.text}
              </div>
            )}
          </div>
        );
      
      case 'sticker':
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <Sticker className="w-8 h-8 text-yellow-600" />
            </div>
            {data.text && (
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                {data.text}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {data.text}
          </div>
        );
    }
  };

  const ContentIcon = getContentIcon();

  return (
    <BaseNode 
      {...props}
      className={cn(
        "message-node",
        data.subtype === 'image' && "border-blue-200 dark:border-blue-800",
        data.subtype === 'audio' && "border-purple-200 dark:border-purple-800",
        data.subtype === 'video' && "border-red-200 dark:border-red-800",
        data.subtype === 'document' && "border-green-200 dark:border-green-800",
        data.subtype === 'sticker' && "border-yellow-200 dark:border-yellow-800",
      )}
    >
      <div className="space-y-3">
        {/* Tipo de contenido */}
        <div className="flex items-center gap-2">
          <ContentIcon className="w-4 h-4 text-gray-500" />
          <Badge variant="outline" className="text-xs">
            {data.subtype === 'text' && 'Texto'}
            {data.subtype === 'image' && 'Imagen'}
            {data.subtype === 'audio' && 'Audio'}
            {data.subtype === 'video' && 'Video'}
            {data.subtype === 'document' && 'Documento'}
            {data.subtype === 'sticker' && 'Sticker'}
          </Badge>
        </div>

        {/* Preview del contenido */}
        <div className="min-h-[40px]">
          {getContentPreview()}
        </div>

        {/* Información adicional */}
        {(data.delayTime && data.delayTime > 0) && (
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded px-2 py-1">
            Esperar {data.delayTime}s antes de enviar
          </div>
        )}
      </div>
    </BaseNode>
  );
};
