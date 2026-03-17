import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Bot, User, RotateCcw, Send } from 'lucide-react';
import { ChatMessage, ConversationState } from '@/types/chatbot';

interface ChatSimulatorProps {
  nodes: Node[];
  edges: Edge[];
  isOpen: boolean;
  onClose: () => void;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({
  nodes,
  edges,
  isOpen,
  onClose,
}) => {
  const [conversation, setConversation] = useState<ConversationState>({
    currentNodeId: undefined,
    variables: {},
    messages: [],
    isCompleted: false,
  });
  
  const [userInput, setUserInput] = useState('');
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize conversation with start node
      const startNode = nodes.find(node => node.type === 'start');
      if (startNode) {
        processNode(startNode.id);
      }
    }
  }, [isOpen, nodes]);

  const resetConversation = () => {
    setConversation({
      currentNodeId: undefined,
      variables: {},
      messages: [],
      isCompleted: false,
    });
    setUserInput('');
    setIsWaitingForInput(false);
    
    const startNode = nodes.find(node => node.type === 'start');
    if (startNode) {
      processNode(startNode.id);
    }
  };

  const processNode = async (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setConversation(prev => ({ ...prev, currentNodeId: nodeId }));

    switch (node.type) {
      case 'start':
        addBotMessage((node.data.welcomeMessage as string) || '¡Hola! ¿En qué puedo ayudarte?', nodeId);
        // Move to next connected node
        moveToNextNode(nodeId);
        break;

      case 'message':
        addBotMessage((node.data.text as string) || 'Mensaje', nodeId);
        moveToNextNode(nodeId);
        break;

      case 'option':
        addBotMessage((node.data.text as string) || '¿Qué opción prefieres?', nodeId);
        if (node.data.options && (node.data.options as any[]).length > 0) {
          setIsWaitingForInput(true);
        } else {
          moveToNextNode(nodeId);
        }
        break;

      case 'action':
        await processAction(node);
        if (node.data.message) {
          addBotMessage((node.data.message as string), nodeId);
        }
        moveToNextNode(nodeId);
        break;

      case 'input': {
        // Solicita un valor y guarda en variable
        const promptText = (node.data.prompt as string) || 'Ingresa un valor:';
        const variableName = (node.data.variableName as string) || 'input_value';
        addBotMessage(promptText, nodeId);
        setIsWaitingForInput(true);
        // Guardar variable al recibir respuesta en handleUserResponse
        break;
      }

      case 'delay': {
        const ms = Number(node.data.ms || 1000);
        await new Promise((res) => setTimeout(res, isNaN(ms) ? 1000 : ms));
        moveToNextNode(nodeId);
        break;
      }

      case 'condition':
        const conditionResult = evaluateCondition(node);
        // Try to route using edges with sourceHandle 'true' or 'false'
        const handleId = conditionResult ? 'true' : 'false';
        const handledEdge = edges.find(e => e.source === nodeId && (e as any).sourceHandle === handleId);
        if (handledEdge) {
          processNode(handledEdge.target);
          break;
        }
        // Fallback to explicit target ids on node data, if provided
        const explicitTargetId = conditionResult ? (node.data.trueTargetId as string) : (node.data.falseTargetId as string);
        if (explicitTargetId) {
          processNode(explicitTargetId);
        } else {
          // Final fallback: first outgoing edge
          moveToNextNode(nodeId);
        }
        break;

      case 'end':
        addBotMessage((node.data.message as string) || 'Conversación finalizada. ¡Gracias!', nodeId);
        setConversation(prev => ({ ...prev, isCompleted: true }));
        break;
    }
  };

  const processAction = async (node: Node) => {
    const { actionType, variableName, variableValue, apiEndpoint, apiMethod } = node.data;

    switch (actionType) {
      case 'set_variable':
        if (variableName && variableValue) {
          setConversation(prev => ({
            ...prev,
            variables: { ...prev.variables, [variableName as string]: variableValue }
          }));
        }
        break;

      case 'get_variable':
        // In a real implementation, this might prompt the user for input
        // For simulation, we'll use a placeholder
        if (variableName) {
          setConversation(prev => ({
            ...prev,
            variables: { ...prev.variables, [variableName as string]: `valor_${variableName}` }
          }));
        }
        break;

      case 'api_call':
        // Simulate API call
        console.log(`Simulando llamada API: ${apiMethod} ${apiEndpoint}`);
        // In real implementation, make actual API call
        break;

      case 'transfer_human':
        addBotMessage('Transferiendo la conversación a un agente humano...', node.id);
        setConversation(prev => ({ ...prev, isCompleted: true }));
        break;
    }
  };

  const evaluateCondition = (node: Node): boolean => {
    const { variableName, operator, value } = node.data;
    const variableValue = conversation.variables[variableName as string];

    if (!variableValue && operator !== 'exists') {
      return false;
    }

    switch (operator) {
      case '==':
        return variableValue == value;
      case '!=':
        return variableValue != value;
      case '>':
        return Number(variableValue) > Number(value);
      case '<':
        return Number(variableValue) < Number(value);
      case '>=':
        return Number(variableValue) >= Number(value);
      case '<=':
        return Number(variableValue) <= Number(value);
      case 'contains':
        return String(variableValue).includes(value as string);
      case 'exists':
        return variableValue !== undefined;
      default:
        return false;
    }
  };

  const moveToNextNode = (currentNodeId: string) => {
    const nextEdge = edges.find(edge => edge.source === currentNodeId);
    if (nextEdge) {
      setTimeout(() => processNode(nextEdge.target), 1000);
    }
  };

  const addBotMessage = (text: string, nodeId?: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'bot',
      text,
      timestamp: new Date(),
      nodeId,
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const addUserMessage = (text: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text,
      timestamp: new Date(),
    };

    setConversation(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  };

  const handleUserResponse = (response: string) => {
    addUserMessage(response);
    setUserInput('');
    setIsWaitingForInput(false);

    // Process user response based on current node
    if (conversation.currentNodeId) {
      const currentNode = nodes.find(n => n.id === conversation.currentNodeId);
      if (currentNode && currentNode.type === 'option') {
        // Find matching option and move to its target
        const selectedOption = (currentNode.data.options as any[])?.find((opt: any) => 
          opt.text.toLowerCase() === response.toLowerCase() || opt.value === response
        );
        
        if (selectedOption && selectedOption.targetNodeId) {
          processNode(selectedOption.targetNodeId);
        } else {
          moveToNextNode(conversation.currentNodeId);
        }
      } else if (currentNode && currentNode.type === 'input') {
        const variableName = (currentNode.data.variableName as string) || 'input_value';
        setConversation(prev => ({
          ...prev,
          variables: { ...prev.variables, [variableName]: response }
        }));
        moveToNextNode(conversation.currentNodeId);
      } else {
        moveToNextNode(conversation.currentNodeId);
      }
    }
  };

  const handleOptionClick = (option: any) => {
    handleUserResponse(option.text);
  };

  const currentNode = nodes.find(n => n.id === conversation.currentNodeId);
  const showOptions = currentNode?.type === 'option' && isWaitingForInput;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-bot-primary" />
              Simulador de Chatbot
            </div>
            <Button variant="outline" size="sm" onClick={resetConversation}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[500px]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {conversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {message.type === 'bot' && <Bot className="w-4 h-4 mt-0.5 text-bot-primary" />}
                      {message.type === 'user' && <User className="w-4 h-4 mt-0.5" />}
                      <span className="text-sm">{message.text}</span>
                    </div>
                    {message.nodeId && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {message.nodeId}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Options or Input Area */}
          <div className="p-4 border-t">
            {showOptions && currentNode?.data.options ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-2">Elige una opción:</p>
                {(currentNode.data.options as any[]).map((option: any, index: number) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOptionClick(option)}
                  >
                    {option.text}
                  </Button>
                ))}
              </div>
            ) : !conversation.isCompleted && !isWaitingForInput ? (
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && userInput.trim()) {
                      handleUserResponse(userInput.trim());
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => handleUserResponse(userInput.trim())}
                  disabled={!userInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            ) : conversation.isCompleted ? (
              <Card className="p-3 text-center">
                <p className="text-sm text-muted-foreground">Conversación finalizada</p>
              </Card>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};