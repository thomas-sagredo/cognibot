import { pipeline, Pipeline } from '@xenova/transformers';

interface IntentAnalysis {
  intent: string;
  confidence: number;
  entities: Entity[];
  sentiment: SentimentResult;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestedResponse: string;
  contextualTags: string[];
}

interface Entity {
  text: string;
  label: string;
  confidence: number;
  start: number;
  end: number;
}

interface SentimentResult {
  label: 'positive' | 'negative' | 'neutral';
  score: number;
}

interface ConversationContext {
  previousMessages: string[];
  userProfile: UserProfile;
  sessionData: Record<string, any>;
  currentFlow: string[];
  timestamp: Date;
}

interface UserProfile {
  language: string;
  preferredTone: string;
  previousIntents: string[];
  satisfactionScore: number;
  isReturningUser: boolean;
}

export class RealtimeNLPEngine {
  private intentClassifier: Pipeline | null = null;
  private sentimentAnalyzer: Pipeline | null = null;
  private nerModel: Pipeline | null = null;
  private worker: Worker | null = null;
  private isInitialized = false;
  private intentCache = new Map<string, IntentAnalysis>();
  
  // Pre-defined intent patterns for quick matching
  private intentPatterns = new Map([
    ['greeting', /^(hi|hello|hey|good morning|good afternoon|good evening)/i],
    ['question', /\?|what|how|when|where|why|which|who/i],
    ['complaint', /problem|issue|error|bug|wrong|broken|not working/i],
    ['compliment', /great|awesome|excellent|perfect|love|amazing/i],
    ['request', /can you|could you|please|i need|i want|help me/i],
    ['goodbye', /bye|goodbye|see you|talk later|thanks|thank you/i],
    ['urgent', /urgent|emergency|asap|immediately|critical|help/i],
  ]);

  constructor() {
    this.initializeModels();
    this.setupWebWorker();
  }

  private async initializeModels() {
    try {
      // Load lightweight models optimized for browser
      this.intentClassifier = await pipeline(
        'text-classification',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
        { device: 'webgpu' } // Use WebGPU if available
      );

      this.sentimentAnalyzer = await pipeline(
        'sentiment-analysis',
        'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
      );

      this.nerModel = await pipeline(
        'token-classification',
        'Xenova/bert-base-NER'
      );

      this.isInitialized = true;
      console.log('NLP models initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NLP models:', error);
      // Fallback to rule-based analysis
    }
  }

  private setupWebWorker() {
    if (typeof Worker !== 'undefined') {
      // Create worker for heavy NLP processing
      const workerCode = `
        importScripts('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.6.0/dist/transformers.min.js');
        
        let classifier = null;
        let sentiment = null;
        
        self.onmessage = async function(e) {
          const { type, data } = e.data;
          
          try {
            switch (type) {
              case 'init':
                classifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
                sentiment = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
                self.postMessage({ type: 'ready' });
                break;
                
              case 'analyze':
                const results = await Promise.all([
                  classifier(data.text),
                  sentiment(data.text)
                ]);
                
                self.postMessage({
                  type: 'result',
                  data: {
                    classification: results[0],
                    sentiment: results[1],
                    requestId: data.requestId
                  }
                });
                break;
            }
          } catch (error) {
            self.postMessage({
              type: 'error',
              error: error.message,
              requestId: data.requestId
            });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      this.worker.postMessage({ type: 'init' });
    }
  }

  async analyzeIntent(
    text: string,
    context?: ConversationContext
  ): Promise<IntentAnalysis> {
    // Check cache first
    const cacheKey = this.getCacheKey(text, context);
    if (this.intentCache.has(cacheKey)) {
      return this.intentCache.get(cacheKey)!;
    }

    const startTime = performance.now();
    
    try {
      // Fast rule-based pre-classification
      const quickIntent = this.quickIntentClassification(text);
      
      // Parallel processing for detailed analysis
      const [
        mlIntent,
        sentiment,
        entities,
        urgency
      ] = await Promise.all([
        this.classifyIntentML(text),
        this.analyzeSentiment(text),
        this.extractEntities(text),
        this.assessUrgency(text, context)
      ]);

      // Combine results with confidence weighting
      const finalIntent = this.combineIntentResults(quickIntent, mlIntent);
      
      const analysis: IntentAnalysis = {
        intent: finalIntent.intent,
        confidence: finalIntent.confidence,
        entities,
        sentiment,
        urgency,
        suggestedResponse: await this.generateSuggestedResponse(finalIntent, sentiment, context),
        contextualTags: this.extractContextualTags(text, context),
      };

      // Cache result
      this.intentCache.set(cacheKey, analysis);
      
      // Performance logging
      const processingTime = performance.now() - startTime;
      if (processingTime > 100) {
        console.warn(`Slow NLP processing: ${processingTime}ms for text: "${text.substring(0, 50)}..."`);
      }

      return analysis;
    } catch (error) {
      console.error('Intent analysis failed:', error);
      return this.getFallbackAnalysis(text);
    }
  }

  private quickIntentClassification(text: string): { intent: string; confidence: number } {
    const normalizedText = text.toLowerCase().trim();
    
    for (const [intent, pattern] of this.intentPatterns) {
      if (pattern.test(normalizedText)) {
        return {
          intent,
          confidence: 0.8, // High confidence for pattern matches
        };
      }
    }

    // Default classification based on text characteristics
    if (normalizedText.includes('?')) {
      return { intent: 'question', confidence: 0.6 };
    }
    
    if (normalizedText.length < 10) {
      return { intent: 'greeting', confidence: 0.5 };
    }

    return { intent: 'general', confidence: 0.3 };
  }

  private async classifyIntentML(text: string): Promise<{ intent: string; confidence: number }> {
    if (!this.isInitialized || !this.intentClassifier) {
      return { intent: 'general', confidence: 0.5 };
    }

    try {
      const result = await this.intentClassifier(text);
      
      // Map model output to our intent categories
      const mappedIntent = this.mapModelOutputToIntent(result);
      
      return {
        intent: mappedIntent.intent,
        confidence: mappedIntent.confidence,
      };
    } catch (error) {
      console.error('ML intent classification failed:', error);
      return { intent: 'general', confidence: 0.3 };
    }
  }

  private async analyzeSentiment(text: string): Promise<SentimentResult> {
    if (!this.isInitialized || !this.sentimentAnalyzer) {
      return this.ruleBased SentimentAnalysis(text);
    }

    try {
      const result = await this.sentimentAnalyzer(text);
      return {
        label: result[0].label.toLowerCase() as 'positive' | 'negative' | 'neutral',
        score: result[0].score,
      };
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return this.ruleBasedSentimentAnalysis(text);
    }
  }

  private async extractEntities(text: string): Promise<Entity[]> {
    if (!this.isInitialized || !this.nerModel) {
      return this.ruleBasedEntityExtraction(text);
    }

    try {
      const result = await this.nerModel(text);
      
      return result
        .filter((entity: any) => entity.score > 0.8) // High confidence only
        .map((entity: any) => ({
          text: entity.word,
          label: entity.entity,
          confidence: entity.score,
          start: entity.start,
          end: entity.end,
        }));
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return this.ruleBasedEntityExtraction(text);
    }
  }

  private async assessUrgency(
    text: string,
    context?: ConversationContext
  ): Promise<'low' | 'medium' | 'high' | 'critical'> {
    const urgentKeywords = [
      'urgent', 'emergency', 'asap', 'immediately', 'critical',
      'help', 'stuck', 'broken', 'not working', 'error', 'problem'
    ];

    const criticalKeywords = [
      'emergency', 'critical', 'down', 'outage', 'security',
      'hack', 'breach', 'urgent help'
    ];

    const normalizedText = text.toLowerCase();
    
    // Check for critical keywords
    if (criticalKeywords.some(keyword => normalizedText.includes(keyword))) {
      return 'critical';
    }

    // Check for urgent keywords
    if (urgentKeywords.some(keyword => normalizedText.includes(keyword))) {
      return 'high';
    }

    // Check context for escalation patterns
    if (context?.previousMessages) {
      const recentMessages = context.previousMessages.slice(-3);
      const hasRepeatedIssues = recentMessages.some(msg => 
        urgentKeywords.some(keyword => msg.toLowerCase().includes(keyword))
      );
      
      if (hasRepeatedIssues) {
        return 'medium';
      }
    }

    // Check for question marks (might indicate confusion)
    const questionCount = (text.match(/\?/g) || []).length;
    if (questionCount > 2) {
      return 'medium';
    }

    return 'low';
  }

  private combineIntentResults(
    quickResult: { intent: string; confidence: number },
    mlResult: { intent: string; confidence: number }
  ): { intent: string; confidence: number } {
    // If both agree, increase confidence
    if (quickResult.intent === mlResult.intent) {
      return {
        intent: quickResult.intent,
        confidence: Math.min(0.95, (quickResult.confidence + mlResult.confidence) / 2 + 0.1),
      };
    }

    // If ML has higher confidence, use it
    if (mlResult.confidence > quickResult.confidence + 0.2) {
      return mlResult;
    }

    // Otherwise, use quick result (faster and often accurate)
    return quickResult;
  }

  private async generateSuggestedResponse(
    intent: { intent: string; confidence: number },
    sentiment: SentimentResult,
    context?: ConversationContext
  ): Promise<string> {
    const responseTemplates: Record<string, string[]> = {
      greeting: [
        "Hello! How can I help you today?",
        "Hi there! What can I assist you with?",
        "Welcome! I'm here to help."
      ],
      question: [
        "I'd be happy to help answer that for you.",
        "Let me provide you with the information you need.",
        "That's a great question. Here's what I can tell you:"
      ],
      complaint: [
        "I understand your concern. Let me help resolve this issue.",
        "I'm sorry to hear about this problem. Let's work together to fix it.",
        "Thank you for bringing this to my attention. I'll help you right away."
      ],
      compliment: [
        "Thank you so much! I'm glad I could help.",
        "I appreciate your kind words! Is there anything else I can assist with?",
        "That's wonderful to hear! How else can I help you today?"
      ],
      request: [
        "I'll be happy to help you with that.",
        "Let me assist you with your request.",
        "I can definitely help you with that. Here's what we can do:"
      ],
      urgent: [
        "I understand this is urgent. Let me prioritize your request.",
        "I'll help you resolve this immediately.",
        "This seems important. Let me get you the help you need right away."
      ]
    };

    const templates = responseTemplates[intent.intent] || responseTemplates.question;
    
    // Select template based on sentiment and context
    let selectedTemplate = templates[0];
    
    if (sentiment.label === 'negative' && intent.intent === 'complaint') {
      selectedTemplate = templates[Math.min(1, templates.length - 1)];
    } else if (sentiment.label === 'positive') {
      selectedTemplate = templates[Math.min(2, templates.length - 1)];
    }

    // Personalize based on context
    if (context?.userProfile.isReturningUser) {
      selectedTemplate = selectedTemplate.replace('Hello!', 'Welcome back!');
    }

    return selectedTemplate;
  }

  private extractContextualTags(text: string, context?: ConversationContext): string[] {
    const tags: string[] = [];
    const normalizedText = text.toLowerCase();

    // Technical tags
    if (/api|integration|webhook|code|technical/.test(normalizedText)) {
      tags.push('technical');
    }

    // Business tags
    if (/pricing|cost|plan|billing|payment/.test(normalizedText)) {
      tags.push('billing');
    }

    // Support tags
    if (/help|support|assistance|guide/.test(normalizedText)) {
      tags.push('support');
    }

    // Feature tags
    if (/feature|functionality|capability|option/.test(normalizedText)) {
      tags.push('feature-inquiry');
    }

    // Context-based tags
    if (context?.currentFlow.includes('onboarding')) {
      tags.push('onboarding');
    }

    return tags;
  }

  // Fallback methods for when ML models aren't available

  private ruleBasedSentimentAnalysis(text: string): SentimentResult {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'problem', 'issue', 'broken'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) {
      return { label: 'positive', score: 0.7 };
    } else if (negativeCount > positiveCount) {
      return { label: 'negative', score: 0.7 };
    } else {
      return { label: 'neutral', score: 0.6 };
    }
  }

  private ruleBasedEntityExtraction(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Email extraction
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;
    while ((match = emailRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'EMAIL',
        confidence: 0.9,
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // Phone number extraction
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    while ((match = phoneRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'PHONE',
        confidence: 0.8,
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    // URL extraction
    const urlRegex = /https?:\/\/[^\s]+/g;
    while ((match = urlRegex.exec(text)) !== null) {
      entities.push({
        text: match[0],
        label: 'URL',
        confidence: 0.9,
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return entities;
  }

  private mapModelOutputToIntent(result: any): { intent: string; confidence: number } {
    // Map model-specific outputs to our intent categories
    const label = result[0]?.label?.toLowerCase() || 'general';
    const score = result[0]?.score || 0.5;

    const intentMapping: Record<string, string> = {
      'positive': 'compliment',
      'negative': 'complaint',
      'neutral': 'general',
    };

    return {
      intent: intentMapping[label] || 'general',
      confidence: score,
    };
  }

  private getFallbackAnalysis(text: string): IntentAnalysis {
    return {
      intent: 'general',
      confidence: 0.3,
      entities: [],
      sentiment: { label: 'neutral', score: 0.5 },
      urgency: 'low',
      suggestedResponse: "I'd be happy to help you with that.",
      contextualTags: [],
    };
  }

  private getCacheKey(text: string, context?: ConversationContext): string {
    const contextKey = context ? 
      `${context.userProfile.language}-${context.currentFlow.join(',')}` : 
      'default';
    return `${text.substring(0, 100)}-${contextKey}`;
  }

  // Public methods
  clearCache() {
    this.intentCache.clear();
  }

  updateIntentPatterns(patterns: Map<string, RegExp>) {
    this.intentPatterns = new Map([...this.intentPatterns, ...patterns]);
  }

  getPerformanceMetrics() {
    return {
      cacheSize: this.intentCache.size,
      isInitialized: this.isInitialized,
      hasWorker: !!this.worker,
    };
  }
}

// React Hook for using real-time NLP
export const useRealtimeNLP = () => {
  const [engine] = useState(() => new RealtimeNLPEngine());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if engine is ready
    const checkReady = () => {
      if (engine.getPerformanceMetrics().isInitialized) {
        setIsReady(true);
      } else {
        setTimeout(checkReady, 1000);
      }
    };
    checkReady();
  }, [engine]);

  const analyzeText = useCallback(async (
    text: string,
    context?: ConversationContext
  ) => {
    return engine.analyzeIntent(text, context);
  }, [engine]);

  const clearCache = useCallback(() => {
    engine.clearCache();
  }, [engine]);

  return {
    analyzeText,
    clearCache,
    isReady,
    engine,
  };
};
