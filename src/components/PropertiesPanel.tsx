import React from 'react';
import { Node } from '@xyflow/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { ChatbotNode } from '@/types/chatbot';

interface PropertiesPanelProps {
  selectedNode: Node | undefined;
  onUpdateNode: (nodeId: string, newData: Partial<ChatbotNode['data']>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedNode,
  onUpdateNode,
}) => {
  if (!selectedNode) {
    return (
      <div className="p-6 h-full flex items-center justify-center fade-in">
        <div className="text-center text-muted-foreground">
          <div className="p-4 bg-cognibot-primary/10 rounded-2xl inline-block mb-4">
            <Settings className="w-12 h-12 text-cognibot-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Panel de Propiedades</h3>
          <p className="text-sm">Selecciona un nodo en el canvas para editar sus propiedades y configuraciones</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: any) => {
    onUpdateNode(selectedNode.id, { [field]: value });
  };

  const renderNodeProperties = () => {
    switch (selectedNode.type) {
      case 'start':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="welcome-message">Mensaje de Bienvenida</Label>
              <Textarea
                id="welcome-message"
                placeholder="¡Hola! ¿En qué puedo ayudarte?"
                value={(selectedNode.data.welcomeMessage as string) || ''}
                onChange={(e) => handleInputChange('welcomeMessage', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="message-text">Texto del Mensaje</Label>
              <Textarea
                id="message-text"
                placeholder="Ingresa el mensaje..."
                value={(selectedNode.data.text as string) || ''}
                onChange={(e) => handleInputChange('text', e.target.value)}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="has-image">Imagen (Opcional)</Label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has-image"
                    checked={(selectedNode.data.hasImage as boolean) || false}
                    onChange={(e) => handleInputChange('hasImage', e.target.checked)}
                  />
                  <Label htmlFor="has-image" className="text-sm">Incluir imagen</Label>
                </div>
                {selectedNode.data.hasImage && (
                  <Input
                    placeholder="URL de la imagen"
                    value={(selectedNode.data.imageUrl as string) || ''}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'option':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="option-text">Texto de la Pregunta</Label>
              <Textarea
                id="option-text"
                placeholder="¿Qué necesitas?"
                value={(selectedNode.data.text as string) || ''}
                onChange={(e) => handleInputChange('text', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Opciones</Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const currentOptions = (selectedNode.data.options as any[]) || [];
                    const newOptions = [...currentOptions, { text: 'Nueva opción', value: '' }];
                    handleInputChange('options', newOptions);
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {((selectedNode.data.options as any[]) || []).map((option: any, index: number) => (
                  <div key={index} className="flex gap-2 p-2 border rounded">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Texto de la opción"
                        value={option.text}
                        onChange={(e) => {
                          const newOptions = [...((selectedNode.data.options as any[]) || [])];
                          newOptions[index] = { ...option, text: e.target.value };
                          handleInputChange('options', newOptions);
                        }}
                      />
                      <Input
                        placeholder="Valor"
                        value={option.value}
                        onChange={(e) => {
                          const newOptions = [...((selectedNode.data.options as any[]) || [])];
                          newOptions[index] = { ...option, value: e.target.value };
                          handleInputChange('options', newOptions);
                        }}
                      />
                      <Input
                        placeholder="ID nodo destino (opcional)"
                        value={option.targetNodeId || ''}
                        onChange={(e) => {
                          const newOptions = [...((selectedNode.data.options as any[]) || [])];
                          newOptions[index] = { ...option, targetNodeId: e.target.value };
                          handleInputChange('options', newOptions);
                        }}
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newOptions = ((selectedNode.data.options as any[]) || []).filter((_: any, i: number) => i !== index);
                        handleInputChange('options', newOptions);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'action':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="action-type">Tipo de Acción</Label>
              <Select
                value={(selectedNode.data.actionType as string) || 'set_variable'}
                onValueChange={(value) => handleInputChange('actionType', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecciona una acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set_variable">Establecer Variable</SelectItem>
                  <SelectItem value="get_variable">Obtener Variable</SelectItem>
                  <SelectItem value="api_call">Llamada API</SelectItem>
                  <SelectItem value="transfer_human">Transferir a Humano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedNode.data.actionType === 'set_variable' || selectedNode.data.actionType === 'get_variable') && (
              <>
                <div>
                  <Label htmlFor="variable-name">Nombre de Variable</Label>
                  <Input
                    id="variable-name"
                    placeholder="usuario_nombre"
                    value={(selectedNode.data.variableName as string) || ''}
                    onChange={(e) => handleInputChange('variableName', e.target.value)}
                    className="mt-2"
                  />
                </div>
                {selectedNode.data.actionType === 'set_variable' && (
                  <div>
                    <Label htmlFor="variable-value">Valor</Label>
                    <Input
                      id="variable-value"
                      placeholder="Valor de la variable"
                      value={(selectedNode.data.variableValue as string) || ''}
                      onChange={(e) => handleInputChange('variableValue', e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </>
            )}

            {selectedNode.data.actionType === 'api_call' && (
              <>
                <div>
                  <Label htmlFor="api-endpoint">Endpoint API</Label>
                  <Input
                    id="api-endpoint"
                    placeholder="https://api.ejemplo.com/data"
                    value={(selectedNode.data.apiEndpoint as string) || ''}
                    onChange={(e) => handleInputChange('apiEndpoint', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="api-method">Método</Label>
                  <Select
                    value={(selectedNode.data.apiMethod as string) || 'GET'}
                    onValueChange={(value) => handleInputChange('apiMethod', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="action-message">Mensaje (Opcional)</Label>
              <Textarea
                id="action-message"
                placeholder="Mensaje a mostrar después de la acción"
                value={(selectedNode.data.message as string) || ''}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="condition-variable">Variable a Evaluar</Label>
              <Input
                id="condition-variable"
                placeholder="usuario_edad"
                value={(selectedNode.data.variableName as string) || ''}
                onChange={(e) => handleInputChange('variableName', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="condition-operator">Operador</Label>
              <Select
                value={(selectedNode.data.operator as string) || '=='}
                onValueChange={(value) => handleInputChange('operator', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="==">Igual a (==)</SelectItem>
                  <SelectItem value="!=">Diferente de (!=)</SelectItem>
                  <SelectItem value=">">Mayor que (&gt;)</SelectItem>
                  <SelectItem value="<">Menor que (&lt;)</SelectItem>
                  <SelectItem value=">=">Mayor o igual (&gt;=)</SelectItem>
                  <SelectItem value="<=">Menor o igual (&lt;=)</SelectItem>
                  <SelectItem value="contains">Contiene</SelectItem>
                  <SelectItem value="exists">Existe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition-value">Valor</Label>
              <Input
                id="condition-value"
                placeholder="18"
                value={(selectedNode.data.value as string) || ''}
                onChange={(e) => handleInputChange('value', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 'end':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="end-type">Tipo de Finalización</Label>
              <Select
                value={(selectedNode.data.endType as string) || 'completion'}
                onValueChange={(value) => handleInputChange('endType', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completion">Conversación Completada</SelectItem>
                  <SelectItem value="transfer_human">Transferir a Humano</SelectItem>
                  <SelectItem value="restart">Reiniciar Chatbot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="end-message">Mensaje Final</Label>
              <Textarea
                id="end-message"
                placeholder="¡Gracias por usar nuestro servicio!"
                value={(selectedNode.data.message as string) || ''}
                onChange={(e) => handleInputChange('message', e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        );

      default:
        return <div>Tipo de nodo no reconocido</div>;
    }
  };

  return (
    <div className="p-6 fade-in">
      <div className="bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl shadow-professional overflow-hidden">
        <div className="bg-gradient-to-r from-cognibot-primary/10 via-transparent to-transparent p-6 border-b border-border/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cognibot-primary/20 rounded-xl">
              <Settings className="w-5 h-5 text-cognibot-primary" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Propiedades del Nodo</h3>
              <p className="text-xs text-muted-foreground">Configuración avanzada</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`font-medium ${
                selectedNode.type === 'start' ? 'bg-node-start-border/20 text-node-start-border border-node-start-border/30' :
                selectedNode.type === 'message' ? 'bg-node-message-border/20 text-node-message-border border-node-message-border/30' :
                selectedNode.type === 'option' ? 'bg-node-option-border/20 text-node-option-border border-node-option-border/30' :
                selectedNode.type === 'action' ? 'bg-node-action-border/20 text-node-action-border border-node-action-border/30' :
                selectedNode.type === 'condition' ? 'bg-node-condition-border/20 text-node-condition-border border-node-condition-border/30' :
                'bg-node-end-border/20 text-node-end-border border-node-end-border/30'
              }`}
            >
              {selectedNode.type}
            </Badge>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              ID: {selectedNode.id}
            </span>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="node-label" className="text-sm font-semibold">Etiqueta del Nodo</Label>
              <Input
                id="node-label"
                value={(selectedNode.data.label as string) || ''}
                onChange={(e) => handleInputChange('label', e.target.value)}
                className="mt-2 border-border/50 focus:border-cognibot-primary/50 focus:ring-cognibot-primary/20"
                placeholder="Nombre descriptivo del nodo..."
              />
            </div>

            <Separator className="my-4" />

            <div className="slide-in">
              {renderNodeProperties()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};