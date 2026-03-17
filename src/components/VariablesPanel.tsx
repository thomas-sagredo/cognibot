// components/VariablesPanel.tsx
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

interface Variable {
  name: string;
  type: string;
  initialValue: string;
  description: string;
}

interface VariablesPanelProps {
  variables: Variable[];
  onVariablesChange: (variables: Variable[]) => void;
}

export const VariablesPanel: React.FC<VariablesPanelProps> = ({ 
  variables, 
  onVariablesChange 
}) => {
  const [localVariables, setLocalVariables] = useState<Variable[]>(variables);

  useEffect(() => {
    // Sincronizar al abrir la pestaña desde backend
    apiService.getVariables().then(({ variables }) => {
      if (variables && Array.isArray(variables)) {
        setLocalVariables(variables);
        onVariablesChange(variables);
      }
    }).catch(() => {
      // Silencio errores de carga inicial
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addVariable = () => {
    const newVariable: Variable = {
      name: '',
      type: 'text',
      initialValue: '',
      description: ''
    };
    setLocalVariables([...localVariables, newVariable]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    const updated = [...localVariables];
    updated[index] = { ...updated[index], [field]: value };
    
    // Validar nombre único
    if (field === 'name') {
      const nameCount = updated.filter(v => v.name === value).length;
      if (nameCount > 1) {
        alert('Los nombres de variables deben ser únicos');
        return;
      }
    }
    
    setLocalVariables(updated);
  };

  const removeVariable = (index: number) => {
    setLocalVariables(localVariables.filter((_, i) => i !== index));
  };

  const saveVariables = () => {
    // Validar variables antes de guardar
    const hasEmptyNames = localVariables.some(v => !v.name.trim());
    const hasDuplicates = new Set(localVariables.map(v => v.name)).size !== localVariables.length;
    
    if (hasEmptyNames) {
      alert('Todas las variables deben tener un nombre');
      return;
    }
    
    if (hasDuplicates) {
      alert('Hay nombres de variables duplicados');
      return;
    }

    onVariablesChange(localVariables);
    apiService.saveVariables(localVariables)
      .then(() => toast.success('✅ Variables guardadas correctamente'))
      .catch((e) => toast.error(`Error guardando variables: ${e.message}`));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Variables del Chatbot</span>
          <Button onClick={addVariable} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Agregar Variable
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {localVariables.map((variable, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-sm font-medium">Nombre *</label>
                    <Input
                      value={variable.name}
                      onChange={(e) => updateVariable(index, 'name', e.target.value)}
                      placeholder="nombre_variable"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tipo</label>
                    <select 
                      value={variable.type}
                      onChange={(e) => updateVariable(index, 'type', e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="boolean">Sí/No</option>
                      <option value="array">Lista</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Valor Inicial</label>
                    <Input
                      value={variable.initialValue}
                      onChange={(e) => updateVariable(index, 'initialValue', e.target.value)}
                      placeholder="Valor por defecto"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium">Descripción</label>
                    <Input
                      value={variable.description}
                      onChange={(e) => updateVariable(index, 'description', e.target.value)}
                      placeholder="Para qué se usa esta variable"
                    />
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeVariable(index)}
                  className="ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          
          {localVariables.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay variables definidas</p>
              <p className="text-sm">Agrega variables para almacenar datos durante las conversaciones</p>
            </div>
          )}
          
          {localVariables.length > 0 && (
            <Button onClick={saveVariables} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Guardar Variables
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};