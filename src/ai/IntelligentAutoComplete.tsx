import React, { useState, useEffect, useRef, useCallback } from 'react';
import { debounce } from 'lodash-es';

interface AutoCompleteContext {
  nodeType: string;
  previousMessages: string[];
  chatbotPersonality: string;
  industry: string;
  userIntent: string;
  conversationFlow: string[];
}

interface CompletionSuggestion {
  text: string;
  confidence: number;
  reasoning: string;
  category: 'greeting' | 'question' | 'response' | 'closing' | 'action';
  tone: 'formal' | 'casual' | 'friendly' | 'professional';
}

export class IntelligentAutoCompleteEngine {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';
  private cache = new Map<string, CompletionSuggestion[]>();
  private abortController: AbortController | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getCompletions(
    partialText: string,
    context: AutoCompleteContext,
    maxSuggestions = 3
  ): Promise<CompletionSuggestion[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(partialText, context);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      const prompt = this.buildPrompt(partialText, context);
      const response = await this.callGPT4(prompt, this.abortController.signal);
      
      const suggestions = this.parseResponse(response);
      
      // Cache results
      this.cache.set(cacheKey, suggestions);
      
      return suggestions.slice(0, maxSuggestions);
    } catch (error) {
      if (error.name === 'AbortError') {
        return [];
      }
      console.error('Auto-complete error:', error);
      return this.getFallbackSuggestions(partialText, context);
    }
  }

  private buildPrompt(partialText: string, context: AutoCompleteContext): string {
    return `
You are an AI assistant helping to write chatbot messages. Complete the following message in a natural, engaging way.

Context:
- Node Type: ${context.nodeType}
- Industry: ${context.industry}
- Chatbot Personality: ${context.chatbotPersonality}
- User Intent: ${context.userIntent}
- Previous Messages: ${context.previousMessages.join(' → ')}
- Conversation Flow: ${context.conversationFlow.join(' → ')}

Partial Message: "${partialText}"

Provide 3 different completions with the following JSON format:
{
  "completions": [
    {
      "text": "completed message text",
      "confidence": 0.95,
      "reasoning": "why this completion makes sense",
      "category": "greeting|question|response|closing|action",
      "tone": "formal|casual|friendly|professional"
    }
  ]
}

Requirements:
- Keep the same tone and style as previous messages
- Make completions contextually relevant
- Vary the suggestions (different approaches)
- Keep messages concise and actionable
- Match the chatbot's personality
`;
  }

  private async callGPT4(prompt: string, signal: AbortSignal): Promise<any> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert chatbot content writer. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  private parseResponse(response: any): CompletionSuggestion[] {
    try {
      return response.completions.map((completion: any) => ({
        text: completion.text,
        confidence: completion.confidence || 0.8,
        reasoning: completion.reasoning || '',
        category: completion.category || 'response',
        tone: completion.tone || 'friendly',
      }));
    } catch (error) {
      console.error('Failed to parse GPT response:', error);
      return [];
    }
  }

  private getFallbackSuggestions(
    partialText: string,
    context: AutoCompleteContext
  ): CompletionSuggestion[] {
    const fallbacks: Record<string, string[]> = {
      greeting: [
        'Hello! How can I help you today?',
        'Hi there! What can I assist you with?',
        'Welcome! I\'m here to help.',
      ],
      question: [
        'Could you please provide more details?',
        'What would you like to know about?',
        'How can I better assist you?',
      ],
      response: [
        'I understand. Let me help you with that.',
        'That\'s a great question. Here\'s what I can tell you:',
        'I\'d be happy to explain that for you.',
      ],
    };

    const categoryFallbacks = fallbacks[context.nodeType] || fallbacks.response;
    
    return categoryFallbacks.map((text, index) => ({
      text,
      confidence: 0.6 - index * 0.1,
      reasoning: 'Fallback suggestion',
      category: context.nodeType as any,
      tone: 'friendly' as const,
    }));
  }

  private getCacheKey(partialText: string, context: AutoCompleteContext): string {
    return `${partialText}-${context.nodeType}-${context.industry}-${context.userIntent}`;
  }

  clearCache() {
    this.cache.clear();
  }
}

// React Component for Auto-Complete Input
interface IntelligentTextInputProps {
  value: string;
  onChange: (value: string) => void;
  context: AutoCompleteContext;
  placeholder?: string;
  className?: string;
}

export const IntelligentTextInput: React.FC<IntelligentTextInputProps> = ({
  value,
  onChange,
  context,
  placeholder,
  className,
}) => {
  const [suggestions, setSuggestions] = useState<CompletionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const engineRef = useRef<IntelligentAutoCompleteEngine | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize engine
  useEffect(() => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (apiKey) {
      engineRef.current = new IntelligentAutoCompleteEngine(apiKey);
    }
  }, []);

  // Debounced suggestion fetching
  const debouncedGetSuggestions = useCallback(
    debounce(async (text: string, ctx: AutoCompleteContext) => {
      if (!engineRef.current || text.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const newSuggestions = await engineRef.current.getCompletions(text, ctx);
        setSuggestions(newSuggestions);
        setShowSuggestions(newSuggestions.length > 0);
        setSelectedIndex(0);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    debouncedGetSuggestions(newValue, context);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Tab':
      case 'Enter':
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  // Apply selected suggestion
  const applySuggestion = (suggestion: CompletionSuggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Track usage for learning
    trackSuggestionUsage(suggestion, context);
  };

  const trackSuggestionUsage = (suggestion: CompletionSuggestion, ctx: AutoCompleteContext) => {
    // Send analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'autocomplete_used', {
        category: suggestion.category,
        tone: suggestion.tone,
        confidence: suggestion.confidence,
        node_type: ctx.nodeType,
      });
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} resize-none`}
        rows={3}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
              }`}
              onClick={() => applySuggestion(suggestion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-900 mb-1">{suggestion.text}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {suggestion.category}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {suggestion.tone}
                    </span>
                    <span className="text-green-600">
                      {Math.round(suggestion.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
                <div className="ml-2 text-xs text-gray-400">
                  Tab to apply
                </div>
              </div>
              {suggestion.reasoning && (
                <p className="text-xs text-gray-400 mt-1 italic">
                  {suggestion.reasoning}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Hook for using intelligent auto-complete
export const useIntelligentAutoComplete = (apiKey: string) => {
  const engineRef = useRef<IntelligentAutoCompleteEngine | null>(null);

  useEffect(() => {
    if (apiKey) {
      engineRef.current = new IntelligentAutoCompleteEngine(apiKey);
    }
  }, [apiKey]);

  const getCompletions = useCallback(
    async (partialText: string, context: AutoCompleteContext) => {
      if (!engineRef.current) return [];
      return engineRef.current.getCompletions(partialText, context);
    },
    []
  );

  const clearCache = useCallback(() => {
    engineRef.current?.clearCache();
  }, []);

  return {
    getCompletions,
    clearCache,
    isReady: !!engineRef.current,
  };
};
