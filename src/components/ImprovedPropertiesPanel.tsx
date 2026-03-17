import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Plus, 
  Trash2, 
  X, 
  Smile,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  Eye,
  MousePointer,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { NodeData, NodeOption, MAX_OPTIONS_BUTTONS, MAX_OPTIONS_LIST } from '@/types/builder';
import { EmojiPicker } from './EmojiPicker';

interface ImprovedPropertiesPanelProps {
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, newData: Partial<NodeData>) => void;
  onClose: () => void;
}

export const ImprovedPropertiesPanel: React.FC<ImprovedPropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
  onClose,
}) => {
  const [localData, setLocalData] = useState<NodeData>({} as NodeData);
  const [showPreview, setShowPreview] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setLocalData(selectedNode.data as NodeData || {} as NodeData);
    } else {
      // Limpiar estado al cerrar
      setLocalData({} as NodeData);
      setShowPreview(false);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Selecciona un bloque para editarlo</p>
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof NodeData, value: unknown) => {
    const newData = { ...localData, [field]: value };
    setLocalData(newData);
    if (selectedNode) {
      onUpdateNode(selectedNode.id, newData);
    }
  };

  const handleAddOption = () => {
    const options = Array.isArray(localData.options) ? localData.options : [];
    
    // Determinar límite según subtipo
    const maxOptions = localData.subtype === 'buttons' ? MAX_OPTIONS_BUTTONS : MAX_OPTIONS_LIST;
    
    if (options.length >= maxOptions) {
      toast.warning(
        `Máximo ${maxOptions} opciones permitidas para ${localData.subtype === 'buttons' ? 'botones' : 'listas'}`,
        {
          description: localData.subtype === 'buttons' 
            ? 'Los botones de WhatsApp permiten hasta 3 opciones'
            : 'Las listas de WhatsApp permiten hasta 10 opciones'
        }
      );
      return;
    }
    
    const newOptions: NodeOption[] = [...options, { 
      label: `Opción ${options.length + 1}`, 
      value: `option_${options.length + 1}` 
    }];
    handleChange('options', newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const options = Array.isArray(localData.options) ? [...localData.options] : [];
    options.splice(index, 1);
    handleChange('options', options);
  };

  const handleOptionChange = (index: number, field: keyof NodeOption, value: string) => {
    const options = Array.isArray(localData.options) ? [...localData.options] : [];
    if (options[index]) {
      options[index] = { ...options[index], [field]: value };
      handleChange('options', options);
    }
  };

  const renderMessageEditor = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="message-text">Mensaje</Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="w-4 h-4 mr-2" />
            {showPreview ? 'Ocultar' : 'Vista previa'}
          </Button>
        </div>
        <Textarea
          id="message-text"
          value={localData.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="Escribe tu mensaje aquí..."
          rows={6}
          className="resize-none dark:bg-gray-800"
        />
        <div className="flex gap-2 mt-2 relative">
          <Button 
            variant="outline" 
            size="sm" 
            title="Agregar emoji"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" title="Agregar imagen">
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" title="Agregar enlace">
            <LinkIcon className="w-4 h-4" />
          </Button>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                const newText = (localData.text || '') + emoji;
                handleChange('text', newText);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>
      </div>

      {showPreview && localData.text && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Vista previa:</div>
          <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {localData.text}
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="delay">Delay (segundos)</Label>
        <Input
          id="delay"
          type="number"
          value={localData.delay || 0}
          onChange={(e) => handleChange('delay', parseInt(e.target.value) || 0)}
          min="0"
          max="60"
          className="dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500 mt-1">
          Tiempo de espera antes de enviar el mensaje
        </p>
      </div>
    </div>
  );

  const renderOptionsEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question-text">Pregunta</Label>
        <Textarea
          id="question-text"
          value={localData.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="¿Cuál es tu pregunta?"
          rows={3}
          className="dark:bg-gray-800"
        />
      </div>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <Label>Opciones</Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Array.isArray(localData.options) ? localData.options.length : 0} / {localData.subtype === 'buttons' ? MAX_OPTIONS_BUTTONS : MAX_OPTIONS_LIST}
            </p>
          </div>
          <Button
            onClick={handleAddOption}
            size="sm"
            variant="outline"
            disabled={Array.isArray(localData.options) && localData.options.length >= (localData.subtype === 'buttons' ? MAX_OPTIONS_BUTTONS : MAX_OPTIONS_LIST)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar opción
          </Button>
        </div>

        <div className="space-y-3">
          {Array.isArray(localData.options) && localData.options.length > 0 ? (
            localData.options.map((option: NodeOption, index: number) => (
              <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Texto de la opción"
                    value={typeof option === 'string' ? option : (option.label || '')}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    className="dark:bg-gray-700 font-medium"
                  />
                  <Input
                    placeholder="Valor (opcional)"
                    value={typeof option === 'string' ? '' : (option.value || '')}
                    onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                    className="text-sm dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOption(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
              <MousePointer className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No hay opciones</p>
              <p className="text-xs mt-1">Haz clic en "Agregar opción" para comenzar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderActionEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="action-type">Tipo de acción</Label>
        <select
          id="action-type"
          value={localData.actionType || 'set_variable'}
          onChange={(e) => handleChange('actionType', e.target.value)}
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="set_variable">Asignar variable</option>
          <option value="api_call">Llamar API</option>
          <option value="notify">Enviar notificación</option>
        </select>
      </div>

      <div>
        <Label htmlFor="variable-name">Nombre de variable</Label>
        <Input
          id="variable-name"
          value={localData.variableName || ''}
          onChange={(e) => handleChange('variableName', e.target.value)}
          placeholder="nombre_variable"
          className="dark:bg-gray-800"
        />
      </div>

      <div>
        <Label htmlFor="variable-value">Valor</Label>
        <Input
          id="variable-value"
          value={localData.variableValue || ''}
          onChange={(e) => handleChange('variableValue', e.target.value)}
          placeholder="valor"
          className="dark:bg-gray-800"
        />
      </div>
    </div>
  );

  const renderInputEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="input-question">Pregunta</Label>
        <Textarea
          id="input-question"
          value={localData.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          placeholder="¿Qué información necesitas?"
          rows={3}
          className="dark:bg-gray-800"
        />
      </div>

      <div>
        <Label htmlFor="save-to">Guardar en variable</Label>
        <Input
          id="save-to"
          value={localData.saveToVariable || ''}
          onChange={(e) => handleChange('saveToVariable', e.target.value)}
          placeholder="nombre_variable"
          className="dark:bg-gray-800"
        />
      </div>

      <div>
        <Label htmlFor="validation">Validación</Label>
        <select
          id="validation"
          value={localData.validation || 'none'}
          onChange={(e) => handleChange('validation', e.target.value)}
          className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="none">Sin validación</option>
          <option value="email">Email</option>
          <option value="phone">Teléfono</option>
          <option value="number">Número</option>
          <option value="text">Texto</option>
        </select>
      </div>
    </div>
  );

  const renderDelayEditor = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="delay-time">Tiempo de espera (segundos)</Label>
        <Input
          id="delay-time"
          type="number"
          value={localData.delayTime || 1}
          onChange={(e) => handleChange('delayTime', parseInt(e.target.value) || 1)}
          min="1"
          max="300"
          className="dark:bg-gray-800"
        />
        <p className="text-xs text-gray-500 mt-1">
          El flujo se pausará durante este tiempo
        </p>
      </div>

      <div>
        <Label htmlFor="delay-message">Mensaje mientras espera (opcional)</Label>
        <Input
          id="delay-message"
          value={localData.waitingMessage || ''}
          onChange={(e) => handleChange('waitingMessage', e.target.value)}
          placeholder="Procesando..."
          className="dark:bg-gray-800"
        />
      </div>
    </div>
  );

  const renderEditor = () => {
    switch (selectedNode.type) {
      case 'message':
        return renderMessageEditor();
      case 'option':
        return renderOptionsEditor();
      case 'action':
        return renderActionEditor();
      case 'input':
        return renderInputEditor();
      case 'delay':
        return renderDelayEditor();
      default:
        return renderMessageEditor();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Editar Bloque
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {selectedNode.type?.charAt(0).toUpperCase() + selectedNode.type?.slice(1)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="node-label">Nombre del bloque</Label>
            <Input
              id="node-label"
              value={localData.label || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              placeholder="Nombre descriptivo"
              className="dark:bg-gray-800"
            />
          </div>

          <Separator />

          {renderEditor()}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => {
              // Los cambios ya se guardan en tiempo real
              onClose();
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            Listo
          </Button>
        </div>
      </div>
    </div>
  );
};
