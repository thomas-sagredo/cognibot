import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Settings,
  Database,
  Zap,
  Workflow,
  Code,
  List,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { nodeCategories } from '@/config/nodeCategories';
import { NodeType } from '@/types/chatbot';

interface BuilderSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  activeSidebarItem: string | null;
  setActiveSidebarItem: (item: string | null) => void;
  addNode: (type: NodeType, subtype?: string, label?: string) => void;
  variables: any[];
  darkMode: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

const sidebarItems = [
  { id: 'nodes', label: 'Nodos', icon: Palette },
  { id: 'variables', label: 'Variables', icon: Database },
  { id: 'integrations', label: 'Integraciones', icon: Zap },
  { id: 'settings', label: 'Configuración', icon: Settings },
  { id: 'code', label: 'Código', icon: Code },
  { id: 'flows', label: 'Flujos', icon: Workflow },
];

export const BuilderSidebar: React.FC<BuilderSidebarProps> = ({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeSidebarItem,
  setActiveSidebarItem,
  addNode,
  variables,
  darkMode,
  isMobile = false,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['bot-response']);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleNodeAdd = (type: NodeType, subtype?: string, label?: string) => {
    addNode(type, subtype, label);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const filteredCategories = nodeCategories.map(category => ({
    ...category,
    options: category.options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.options.length > 0);

  if (sidebarCollapsed && !isMobile) {
    return (
      <div className="w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Toggle button */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(false)}
            className="w-full p-2"
            title="Expandir sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Iconos de navegación */}
        <div className="flex-1 py-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSidebarItem === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setActiveSidebarItem(item.id);
                  setSidebarCollapsed(false);
                }}
                className="w-full p-3 mb-1 mx-1"
                title={item.label}
              >
                <Icon className="w-4 h-4" />
              </Button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full",
      isMobile ? "w-full" : "w-80"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Herramientas
          </h2>
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(true)}
              className="p-2"
              title="Colapsar sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Navegación por pestañas */}
        <div className="flex flex-wrap gap-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeSidebarItem === item.id ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveSidebarItem(item.id)}
                className="flex items-center gap-2 text-xs px-2 py-1.5"
              >
                <Icon className="w-3 h-3" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {/* Panel de Nodos */}
          {activeSidebarItem === 'nodes' && (
            <div className="space-y-4">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar nodos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categorías de nodos */}
              <div className="space-y-3">
                {filteredCategories.map((category) => {
                  const CategoryIcon = category.icon;
                  const isExpanded = expandedCategories.includes(category.id);
                  
                  return (
                    <Collapsible
                      key={category.id}
                      open={isExpanded}
                      onOpenChange={() => toggleCategory(category.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              category.color === 'blue' && "bg-blue-100 dark:bg-blue-900/20",
                              category.color === 'green' && "bg-green-100 dark:bg-green-900/20",
                              category.color === 'orange' && "bg-orange-100 dark:bg-orange-900/20",
                              category.color === 'yellow' && "bg-yellow-100 dark:bg-yellow-900/20"
                            )}>
                              <CategoryIcon className={cn(
                                "w-4 h-4",
                                category.color === 'blue' && "text-blue-600 dark:text-blue-400",
                                category.color === 'green' && "text-green-600 dark:text-green-400",
                                category.color === 'orange' && "text-orange-600 dark:text-orange-400",
                                category.color === 'yellow' && "text-yellow-600 dark:text-yellow-400"
                              )} />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">{category.label}</div>
                              <div className="text-xs text-gray-500">
                                {category.options.length} opciones
                              </div>
                            </div>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform",
                            isExpanded && "transform rotate-180"
                          )} />
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="space-y-2 mt-2 ml-4">
                        {category.options.map((option) => {
                          const OptionIcon = option.icon;
                          return (
                            <Button
                              key={`${option.type}-${option.subtype}`}
                              variant="ghost"
                              onClick={() => handleNodeAdd(option.type as NodeType, option.subtype, option.label)}
                              className="w-full justify-start p-3 h-auto hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            >
                              <div className="flex items-start gap-3 text-left">
                                <OptionIcon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                    {option.description}
                                  </div>
                                </div>
                                <Plus className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              </div>
                            </Button>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No se encontraron nodos</p>
                  <p className="text-xs">Intenta con otros términos</p>
                </div>
              )}
            </div>
          )}

          {/* Panel de Variables */}
          {activeSidebarItem === 'variables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Variables del Sistema</h3>
                <Button size="sm" variant="outline" className="text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Nueva
                </Button>
              </div>
              
              <div className="space-y-2">
                {variables.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay variables definidas</p>
                    <p className="text-xs">Crea variables para almacenar datos</p>
                  </div>
                ) : (
                  variables.map((variable, index) => (
                    <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{variable.name}</div>
                          <div className="text-xs text-gray-500">{variable.type}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {variable.scope || 'Global'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Otros paneles */}
          {activeSidebarItem === 'integrations' && (
            <div className="space-y-4">
              <h3 className="font-medium">Integraciones</h3>
              <p className="text-sm text-gray-500">Configurar integraciones con servicios externos</p>
            </div>
          )}

          {activeSidebarItem === 'settings' && (
            <div className="space-y-4">
              <h3 className="font-medium">Configuración</h3>
              <p className="text-sm text-gray-500">Ajustes del constructor</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
