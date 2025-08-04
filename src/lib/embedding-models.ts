import { ComponentOption, CostEstimate } from '@/types';

// ============================================================================
// EMBEDDING MODEL DEFINITIONS WITH MTEB SCORES
// ============================================================================

export interface EmbeddingModelInfo {
  id: string;
  name: string;
  provider: string;
  maxTokens: number;
  dimensions: number;
  costPer1MTokens: number;
  contextWindow: number;
  languages: string[];
  specialFeatures: string[];
  mtebScore: number; // Overall MTEB score
  mtebScores: {
    retrieval: number;
    classification: number;
    clustering: number;
    pairClassification: number;
    reranking: number;
    sts: number; // Semantic Textual Similarity
    summarization: number;
  };
  deploymentType: 'api' | 'self-hosted' | 'both';
  releaseDate: string;
  modelSize?: string;
  hostingRequirements?: {
    minRAM: string;
    minVRAM: string;
    recommendedGPU: string;
  };
}

export const EMBEDDING_MODELS: Record<string, EmbeddingModelInfo> = {
  'openai-ada-002': {
    id: 'openai-ada-002',
    name: 'text-embedding-ada-002',
    provider: 'OpenAI',
    maxTokens: 8191,
    dimensions: 1536,
    costPer1MTokens: 0.10,
    contextWindow: 8191,
    languages: ['en', 'multilingual'],
    specialFeatures: ['General purpose', 'High quality', 'Widely supported'],
    mtebScore: 61.0,
    mtebScores: {
      retrieval: 49.25,
      classification: 70.93,
      clustering: 58.66,
      pairClassification: 84.89,
      reranking: 58.04,
      sts: 80.05,
      summarization: 30.8
    },
    deploymentType: 'api',
    releaseDate: '2022-12',
    modelSize: 'Unknown'
  },
  'openai-3-small': {
    id: 'openai-3-small',
    name: 'text-embedding-3-small',
    provider: 'OpenAI',
    maxTokens: 8191,
    dimensions: 1536,
    costPer1MTokens: 0.02,
    contextWindow: 8191,
    languages: ['en', 'multilingual'],
    specialFeatures: ['Cost effective', 'Configurable dimensions', 'Latest model'],
    mtebScore: 62.3,
    mtebScores: {
      retrieval: 51.08,
      classification: 67.81,
      clustering: 58.24,
      pairClassification: 82.4,
      reranking: 58.13,
      sts: 80.0,
      summarization: 31.4
    },
    deploymentType: 'api',
    releaseDate: '2024-01',
    modelSize: 'Unknown'
  },
  'openai-3-large': {
    id: 'openai-3-large',
    name: 'text-embedding-3-large',
    provider: 'OpenAI',
    maxTokens: 8191,
    dimensions: 3072,
    costPer1MTokens: 0.13,
    contextWindow: 8191,
    languages: ['en', 'multilingual'],
    specialFeatures: ['Highest quality', 'Large dimensions', 'Best performance'],
    mtebScore: 64.6,
    mtebScores: {
      retrieval: 54.9,
      classification: 69.6,
      clustering: 59.16,
      pairClassification: 85.8,
      reranking: 60.4,
      sts: 81.4,
      summarization: 33.7
    },
    deploymentType: 'api',
    releaseDate: '2024-01',
    modelSize: 'Unknown'
  },
  'cohere-embed-v3': {
    id: 'cohere-embed-v3',
    name: 'embed-english-v3.0',
    provider: 'Cohere',
    maxTokens: 512,
    dimensions: 1024,
    costPer1MTokens: 0.10,
    contextWindow: 512,
    languages: ['en'],
    specialFeatures: ['Task-specific optimization', 'Fast inference', 'English optimized'],
    mtebScore: 64.5,
    mtebScores: {
      retrieval: 55.4,
      classification: 75.8,
      clustering: 47.4,
      pairClassification: 87.2,
      reranking: 59.1,
      sts: 82.3,
      summarization: 31.3
    },
    deploymentType: 'api',
    releaseDate: '2023-11',
    modelSize: 'Unknown'
  },
  'cohere-embed-multilingual': {
    id: 'cohere-embed-multilingual',
    name: 'embed-multilingual-v3.0',
    provider: 'Cohere',
    maxTokens: 512,
    dimensions: 1024,
    costPer1MTokens: 0.10,
    contextWindow: 512,
    languages: ['multilingual'],
    specialFeatures: ['100+ languages', 'Cross-lingual retrieval', 'Cultural awareness'],
    mtebScore: 66.3,
    mtebScores: {
      retrieval: 54.9,
      classification: 71.6,
      clustering: 52.0,
      pairClassification: 86.6,
      reranking: 58.7,
      sts: 82.4,
      summarization: 32.6
    },
    deploymentType: 'api',
    releaseDate: '2023-11',
    modelSize: 'Unknown'
  },
  'voyage-large-2': {
    id: 'voyage-large-2',
    name: 'voyage-large-2',
    provider: 'Voyage AI',
    maxTokens: 16000,
    dimensions: 1536,
    costPer1MTokens: 0.12,
    contextWindow: 16000,
    languages: ['en', 'multilingual'],
    specialFeatures: ['Large context', 'Domain-specific fine-tuning', 'High accuracy'],
    mtebScore: 68.2,
    mtebScores: {
      retrieval: 58.5,
      classification: 75.8,
      clustering: 54.9,
      pairClassification: 88.1,
      reranking: 61.8,
      sts: 84.0,
      summarization: 35.2
    },
    deploymentType: 'api',
    releaseDate: '2024-01',
    modelSize: 'Unknown'
  },
  'voyage-code-2': {
    id: 'voyage-code-2',
    name: 'voyage-code-2',
    provider: 'Voyage AI',
    maxTokens: 16000,
    dimensions: 1536,
    costPer1MTokens: 0.12,
    contextWindow: 16000,
    languages: ['code', 'en'],
    specialFeatures: ['Code-optimized', 'Large context', 'Programming languages'],
    mtebScore: 69.1,
    mtebScores: {
      retrieval: 59.3,
      classification: 76.2,
      clustering: 55.8,
      pairClassification: 89.0,
      reranking: 62.5,
      sts: 85.1,
      summarization: 36.0
    },
    deploymentType: 'api',
    releaseDate: '2024-02',
    modelSize: 'Unknown'
  },
  'sentence-transformers-mini': {
    id: 'sentence-transformers-mini',
    name: 'all-MiniLM-L6-v2',
    provider: 'Sentence Transformers',
    maxTokens: 512,
    dimensions: 384,
    costPer1MTokens: 0, // Self-hosted
    contextWindow: 512,
    languages: ['en', 'multilingual'],
    specialFeatures: ['Open source', 'Fast inference', 'Local deployment'],
    mtebScore: 56.3,
    mtebScores: {
      retrieval: 41.95,
      classification: 63.05,
      clustering: 42.35,
      pairClassification: 82.37,
      reranking: 57.36,
      sts: 78.9,
      summarization: 28.56
    },
    deploymentType: 'self-hosted',
    releaseDate: '2021-08',
    modelSize: '80MB',
    hostingRequirements: {
      minRAM: '2GB',
      minVRAM: '1GB',
      recommendedGPU: 'Any modern GPU'
    }
  },
  'sentence-transformers-mpnet': {
    id: 'sentence-transformers-mpnet',
    name: 'all-mpnet-base-v2',
    provider: 'Sentence Transformers',
    maxTokens: 512,
    dimensions: 768,
    costPer1MTokens: 0, // Self-hosted
    contextWindow: 512,
    languages: ['en'],
    specialFeatures: ['High quality', 'Open source', 'Balanced performance'],
    mtebScore: 57.8,
    mtebScores: {
      retrieval: 43.81,
      classification: 65.65,
      clustering: 44.69,
      pairClassification: 83.04,
      reranking: 58.11,
      sts: 80.28,
      summarization: 29.91
    },
    deploymentType: 'self-hosted',
    releaseDate: '2021-08',
    modelSize: '420MB',
    hostingRequirements: {
      minRAM: '4GB',
      minVRAM: '2GB',
      recommendedGPU: 'GTX 1060 or better'
    }
  },
  'bge-large-en': {
    id: 'bge-large-en',
    name: 'bge-large-en-v1.5',
    provider: 'BAAI',
    maxTokens: 512,
    dimensions: 1024,
    costPer1MTokens: 0, // Self-hosted
    contextWindow: 512,
    languages: ['en'],
    specialFeatures: ['State-of-the-art open source', 'High performance', 'Research-backed'],
    mtebScore: 63.98,
    mtebScores: {
      retrieval: 54.29,
      classification: 75.0,
      clustering: 46.08,
      pairClassification: 87.12,
      reranking: 60.03,
      sts: 83.11,
      summarization: 31.61
    },
    deploymentType: 'self-hosted',
    releaseDate: '2023-09',
    modelSize: '1.34GB',
    hostingRequirements: {
      minRAM: '8GB',
      minVRAM: '4GB',
      recommendedGPU: 'RTX 3070 or better'
    }
  },
  'e5-large-v2': {
    id: 'e5-large-v2',
    name: 'e5-large-v2',
    provider: 'Microsoft',
    maxTokens: 512,
    dimensions: 1024,
    costPer1MTokens: 0, // Self-hosted
    contextWindow: 512,
    languages: ['multilingual'],
    specialFeatures: ['Multilingual', 'Strong performance', 'Research model'],
    mtebScore: 62.25,
    mtebScores: {
      retrieval: 50.56,
      classification: 73.84,
      clustering: 44.49,
      pairClassification: 86.03,
      reranking: 58.6,
      sts: 81.05,
      summarization: 30.19
    },
    deploymentType: 'self-hosted',
    releaseDate: '2023-02',
    modelSize: '1.34GB',
    hostingRequirements: {
      minRAM: '8GB',
      minVRAM: '4GB',
      recommendedGPU: 'RTX 3070 or better'
    }
  },
  'gemini-text-embedding-004': {
    id: 'gemini-text-embedding-004',
    name: 'Gemini Text Embedding 004',
    provider: 'Google',
    maxTokens: 2048,
    dimensions: 768,
    costPer1MTokens: 0.00025,
    contextWindow: 2048,
    languages: ['multilingual'],
    specialFeatures: ['Task-specific optimization', 'Latest model', 'Multilingual', 'High quality'],
    mtebScore: 66.31,
    mtebScores: {
      retrieval: 55.7,
      classification: 73.5,
      clustering: 52.8,
      pairClassification: 85.2,
      reranking: 61.3,
      sts: 82.4,
      summarization: 33.2
    },
    deploymentType: 'api',
    releaseDate: '2024-05',
    modelSize: 'Unknown'
  }
};

// ============================================================================
// EMBEDDING PROVIDER ABSTRACTION
// ============================================================================

export interface EmbeddingProvider {
  name: string;
  models: EmbeddingModelInfo[];
  requiresApiKey: boolean;
  supportsBatching: boolean;
  maxBatchSize: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  embed(texts: string[], model: string, options?: EmbeddingOptions): Promise<number[][]>;
  estimateCost(tokenCount: number, model: string): number;
}

export interface EmbeddingOptions {
  apiKey?: string;
  batchSize?: number;
  dimensions?: number;
  inputType?: string;
  truncate?: boolean;
}

export interface BatchProcessingConfig {
  batchSize: number;
  maxConcurrency: number;
  retryAttempts: number;
  retryDelay: number;
  progressCallback?: (processed: number, total: number) => void;
}

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  name = 'OpenAI';
  models = [
    EMBEDDING_MODELS['openai-ada-002'],
    EMBEDDING_MODELS['openai-3-small'],
    EMBEDDING_MODELS['openai-3-large']
  ];
  requiresApiKey = true;
  supportsBatching = true;
  maxBatchSize = 2048;
  rateLimit = {
    requestsPerMinute: 3000,
    tokensPerMinute: 1000000
  };

  async embed(texts: string[], model: string, options?: EmbeddingOptions): Promise<number[][]> {
    // Implementation would make actual API calls
    throw new Error('Not implemented - this is a mock interface');
  }

  estimateCost(tokenCount: number, model: string): number {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) return 0;
    return (tokenCount / 1000000) * modelInfo.costPer1MTokens;
  }
}

export class CohereEmbeddingProvider implements EmbeddingProvider {
  name = 'Cohere';
  models = [
    EMBEDDING_MODELS['cohere-embed-v3'],
    EMBEDDING_MODELS['cohere-embed-multilingual']
  ];
  requiresApiKey = true;
  supportsBatching = true;
  maxBatchSize = 96;
  rateLimit = {
    requestsPerMinute: 1000,
    tokensPerMinute: 1000000
  };

  async embed(texts: string[], model: string, options?: EmbeddingOptions): Promise<number[][]> {
    throw new Error('Not implemented - this is a mock interface');
  }

  estimateCost(tokenCount: number, model: string): number {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) return 0;
    return (tokenCount / 1000000) * modelInfo.costPer1MTokens;
  }
}

export class VoyageEmbeddingProvider implements EmbeddingProvider {
  name = 'Voyage AI';
  models = [
    EMBEDDING_MODELS['voyage-large-2'],
    EMBEDDING_MODELS['voyage-code-2']
  ];
  requiresApiKey = true;
  supportsBatching = true;
  maxBatchSize = 128;
  rateLimit = {
    requestsPerMinute: 300,
    tokensPerMinute: 1000000
  };

  async embed(texts: string[], model: string, options?: EmbeddingOptions): Promise<number[][]> {
    throw new Error('Not implemented - this is a mock interface');
  }

  estimateCost(tokenCount: number, model: string): number {
    const modelInfo = this.models.find(m => m.id === model);
    if (!modelInfo) return 0;
    return (tokenCount / 1000000) * modelInfo.costPer1MTokens;
  }
}

export class SelfHostedEmbeddingProvider implements EmbeddingProvider {
  name = 'Self-Hosted';
  models = [
    EMBEDDING_MODELS['sentence-transformers-mini'],
    EMBEDDING_MODELS['sentence-transformers-mpnet'],
    EMBEDDING_MODELS['bge-large-en'],
    EMBEDDING_MODELS['e5-large-v2']
  ];
  requiresApiKey = false;
  supportsBatching = true;
  maxBatchSize = 32; // Limited by GPU memory

  async embed(texts: string[], model: string, options?: EmbeddingOptions): Promise<number[][]> {
    throw new Error('Not implemented - this is a mock interface');
  }

  estimateCost(tokenCount: number, model: string): number {
    // Self-hosted models have infrastructure costs but no per-token costs
    return 0;
  }
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

export const EMBEDDING_PROVIDERS: Record<string, EmbeddingProvider> = {
  openai: new OpenAIEmbeddingProvider(),
  cohere: new CohereEmbeddingProvider(),
  voyage: new VoyageEmbeddingProvider(),
  'self-hosted': new SelfHostedEmbeddingProvider()
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getAllEmbeddingModels(): EmbeddingModelInfo[] {
  return Object.values(EMBEDDING_MODELS);
}

export function getModelsByProvider(provider: string): EmbeddingModelInfo[] {
  return Object.values(EMBEDDING_MODELS).filter(model => 
    model.provider.toLowerCase() === provider.toLowerCase()
  );
}

export function getModelById(id: string): EmbeddingModelInfo | undefined {
  return EMBEDDING_MODELS[id];
}

export function getProviderByModel(modelId: string): EmbeddingProvider | undefined {
  const model = getModelById(modelId);
  if (!model) return undefined;
  
  return Object.values(EMBEDDING_PROVIDERS).find(provider =>
    provider.models.some(m => m.id === modelId)
  );
}

export function calculateMonthlyCost(
  model: EmbeddingModelInfo,
  documentsPerMonth: number,
  avgTokensPerDocument: number,
  includeInfrastructure: boolean = true
): {
  tokenCost: number;
  infrastructureCost: number;
  totalCost: number;
} {
  const totalTokens = documentsPerMonth * avgTokensPerDocument;
  const tokenCost = (totalTokens / 1000000) * model.costPer1MTokens;
  
  let infrastructureCost = 0;
  if (model.deploymentType === 'self-hosted' && includeInfrastructure) {
    // Estimate infrastructure costs based on model size and requirements
    if (model.hostingRequirements) {
      const ramCost = parseInt(model.hostingRequirements.minRAM) * 0.05; // $0.05 per GB RAM
      const gpuCost = model.hostingRequirements.recommendedGPU.includes('RTX') ? 50 : 20;
      infrastructureCost = ramCost + gpuCost;
    }
  }
  
  return {
    tokenCost,
    infrastructureCost,
    totalCost: tokenCost + infrastructureCost
  };
}

export function getOptimalBatchSize(model: EmbeddingModelInfo, provider: EmbeddingProvider): number {
  // Consider model context window, provider limits, and performance
  const providerMax = provider.maxBatchSize;
  const contextBasedMax = Math.floor(model.maxTokens / 100); // Conservative estimate
  
  return Math.min(providerMax, contextBasedMax, 100); // Cap at 100 for reasonable performance
}

export function estimateProcessingTime(
  totalTexts: number,
  batchSize: number,
  model: EmbeddingModelInfo,
  provider: EmbeddingProvider
): {
  estimatedMinutes: number;
  numberOfBatches: number;
  bottleneck: 'rate_limit' | 'processing' | 'network';
} {
  const numberOfBatches = Math.ceil(totalTexts / batchSize);
  
  // Estimate based on provider rate limits and processing speed
  let timePerBatch = 1; // Base processing time in seconds
  
  if (model.deploymentType === 'api') {
    timePerBatch = 2; // Network overhead
    if (provider.rateLimit) {
      const batchesPerMinute = provider.rateLimit.requestsPerMinute;
      timePerBatch = Math.max(timePerBatch, 60 / batchesPerMinute);
    }
  } else {
    // Self-hosted models are faster but limited by hardware
    timePerBatch = 0.5;
  }
  
  const totalSeconds = numberOfBatches * timePerBatch;
  const estimatedMinutes = totalSeconds / 60;
  
  // Determine bottleneck
  let bottleneck: 'rate_limit' | 'processing' | 'network' = 'processing';
  if (model.deploymentType === 'api' && provider.rateLimit) {
    bottleneck = 'rate_limit';
  } else if (model.deploymentType === 'api') {
    bottleneck = 'network';
  }
  
  return {
    estimatedMinutes,
    numberOfBatches,
    bottleneck
  };
}

// ============================================================================
// COMPONENT OPTION GENERATION
// ============================================================================

export function generateEmbeddingComponentOptions(): ComponentOption[] {
  return Object.values(EMBEDDING_MODELS).map(model => {
    const provider = getProviderByModel(model.id);
    
    const parameters: any[] = [
      {
        name: 'maxTokens',
        type: 'number',
        required: false,
        defaultValue: model.maxTokens,
        validation: { min: 1, max: model.maxTokens }
      },
      {
        name: 'batchSize',
        type: 'number',
        required: false,
        defaultValue: provider ? getOptimalBatchSize(model, provider) : 32,
        validation: { min: 1, max: provider?.maxBatchSize || 100 }
      }
    ];
    
    // Add provider-specific parameters
    if (provider?.requiresApiKey) {
      parameters.unshift({
        name: 'apiKey',
        type: 'string',
        required: true,
        defaultValue: ''
      });
    }
    
    if (model.id.includes('openai-3')) {
      parameters.push({
        name: 'dimensions',
        type: 'select',
        required: false,
        defaultValue: model.dimensions.toString(),
        options: model.dimensions === 3072 ? ['1536', '3072'] : ['512', '1536']
      });
    }
    
    if (model.provider === 'Cohere') {
      parameters.push({
        name: 'inputType',
        type: 'select',
        required: false,
        defaultValue: 'search_document',
        options: ['search_document', 'search_query', 'classification', 'clustering']
      });
    }
    
    const costEstimate: CostEstimate = {
      setup: model.deploymentType === 'self-hosted' ? 50 : 0,
      perOperation: model.costPer1MTokens / 1000000 * 500, // Assume 500 tokens per operation
      monthly: model.deploymentType === 'self-hosted' ? 
        (model.hostingRequirements ? 70 : 20) : 0,
      currency: 'USD'
    };
    
    return {
      id: model.id,
      name: model.name,
      description: `${model.provider} embedding model with ${model.dimensions} dimensions. MTEB Score: ${model.mtebScore}. ${model.specialFeatures.join(', ')}.`,
      category: 'embedding' as const,
      parameters,
      tradeoffs: {
        pros: [
          `MTEB Score: ${model.mtebScore}`,
          `${model.dimensions} dimensions`,
          `${model.maxTokens} token context`,
          ...model.specialFeatures
        ],
        cons: model.deploymentType === 'api' ? 
          ['API costs', 'Rate limits', 'External dependency'] :
          ['Requires local compute', 'Model management', 'Hardware requirements'],
        useCases: model.languages.includes('multilingual') ?
          ['Multilingual content', 'Cross-language retrieval', 'Global applications'] :
          model.languages.includes('code') ?
          ['Code search', 'Technical documentation', 'Programming Q&A'] :
          ['General purpose', 'English content', 'Production systems'],
        cost: costEstimate
      }
    };
  });
}