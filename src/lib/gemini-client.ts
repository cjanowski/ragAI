import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================================================
// GEMINI API CLIENT
// ============================================================================

export class GeminiClient {
  private genAI: GoogleGenerativeAI;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // ============================================================================
  // TEXT GENERATION
  // ============================================================================

  async* generateText(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): AsyncGenerator<string, void, unknown> {
    const model = this.genAI.getGenerativeModel({ 
      model: options?.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: options?.temperature || 0.1,
        maxOutputTokens: options?.maxTokens || 1000,
      },
      systemInstruction: options?.systemPrompt
    });

    try {
      const result = await model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTextComplete(prompt: string, options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): Promise<string> {
    const model = this.genAI.getGenerativeModel({ 
      model: options?.model || 'gemini-1.5-flash',
      generationConfig: {
        temperature: options?.temperature || 0.1,
        maxOutputTokens: options?.maxTokens || 1000,
      },
      systemInstruction: options?.systemPrompt
    });

    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // EMBEDDING GENERATION
  // ============================================================================

  async generateEmbeddings(texts: string[], options?: {
    model?: string;
    taskType?: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' | 'SEMANTIC_SIMILARITY' | 'CLASSIFICATION' | 'CLUSTERING';
    title?: string;
  }): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ 
      model: options?.model || 'text-embedding-004'
    });

    try {
      const embeddings: number[][] = [];
      
      // Process texts in batches to avoid rate limits
      const batchSize = 100;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(async (text) => {
          const result = await model.embedContent(text);
          return result.embedding.values;
        });
        
        const batchEmbeddings = await Promise.all(batchPromises);
        embeddings.push(...batchEmbeddings);
        
        // Add small delay between batches to respect rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return embeddings;
    } catch (error) {
      console.error('Gemini embedding error:', error);
      throw new Error(`Gemini embedding API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateQueryEmbedding(query: string, options?: {
    model?: string;
    title?: string;
  }): Promise<number[]> {
    const embeddings = await this.generateEmbeddings([query], {
      ...options,
      taskType: 'RETRIEVAL_QUERY'
    });
    return embeddings[0];
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async countTokens(text: string, model?: string): Promise<number> {
    const genModel = this.genAI.getGenerativeModel({ 
      model: model || 'gemini-1.5-flash'
    });

    try {
      const result = await genModel.countTokens(text);
      return result.totalTokens;
    } catch (error) {
      // Fallback to rough estimation if API fails
      return Math.ceil(text.length / 4);
    }
  }

  // Test API key validity
  async testConnection(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      });
      
      const result = await model.generateContent('Hello');
      return !!result.response.text();
    } catch (error) {
      console.error('Test connection error:', error);
      return false;
    }
  }
}

// ============================================================================
// GEMINI MODEL CONFIGURATIONS
// ============================================================================

export const GEMINI_MODELS = {
  // Text Generation Models
  'gemini-1.5-pro': {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    type: 'generation',
    contextWindow: 2000000, // 2M tokens
    maxOutputTokens: 8192,
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    capabilities: ['text', 'multimodal', 'code', 'reasoning'],
    description: 'Most capable model for complex reasoning and long context'
  },
  'gemini-1.5-flash': {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    type: 'generation',
    contextWindow: 1000000, // 1M tokens
    maxOutputTokens: 8192,
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
    capabilities: ['text', 'multimodal', 'code', 'fast'],
    description: 'Fast and efficient model for most tasks'
  },
  'gemini-1.5-flash-8b': {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    type: 'generation',
    contextWindow: 1000000, // 1M tokens
    maxOutputTokens: 8192,
    inputCostPer1M: 0.0375,
    outputCostPer1M: 0.15,
    capabilities: ['text', 'fast', 'efficient'],
    description: 'Smallest and fastest model for simple tasks'
  },
  
  // Embedding Models
  'text-embedding-004': {
    id: 'text-embedding-004',
    name: 'Text Embedding 004',
    type: 'embedding',
    dimensions: 768,
    maxTokens: 2048,
    costPer1M: 0.00025,
    capabilities: ['text', 'multilingual', 'task-specific'],
    description: 'Latest embedding model with task-specific optimization'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getGeminiClient(apiKey?: string): GeminiClient {
  const key = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) {
    throw new Error('Gemini API key not provided. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable or pass apiKey parameter.');
  }
  return new GeminiClient(key);
}

export function calculateGeminiCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const model = GEMINI_MODELS[modelId as keyof typeof GEMINI_MODELS];
  if (!model || model.type !== 'generation') return 0;
  
  const generationModel = model as any;
  const inputCost = (inputTokens / 1000000) * generationModel.inputCostPer1M;
  const outputCost = (outputTokens / 1000000) * generationModel.outputCostPer1M;
  
  return inputCost + outputCost;
}

export function calculateEmbeddingCost(
  tokens: number,
  modelId: string = 'text-embedding-004'
): number {
  const model = GEMINI_MODELS[modelId as keyof typeof GEMINI_MODELS];
  if (!model || model.type !== 'embedding') return 0;
  
  const embeddingModel = model as any;
  return (tokens / 1000000) * embeddingModel.costPer1M;
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}

export const geminiRateLimiter = new RateLimiter(60, 60000); // 60 requests per minute