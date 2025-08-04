import { ChunkingConfig, EmbeddingConfig } from '@/types';

export interface CompatibilityResult {
  isCompatible: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export function validateEmbeddingCompatibility(
  chunkingConfig: ChunkingConfig,
  embeddingConfig: EmbeddingConfig
): CompatibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Estimate tokens from chunk size (rough approximation: 1 token ≈ 4 characters)
  const estimatedTokens = Math.ceil(chunkingConfig.chunkSize / 4);

  // Check if chunk size exceeds embedding model's token limit
  if (estimatedTokens > embeddingConfig.maxTokens) {
    errors.push(
      `Chunk size (~${estimatedTokens} tokens) exceeds embedding model limit (${embeddingConfig.maxTokens} tokens)`
    );
    recommendations.push(
      `Reduce chunk size to ${Math.floor(embeddingConfig.maxTokens * 0.8 * 4)} characters or less`
    );
  }

  // Warn if chunk size is close to the limit
  if (estimatedTokens > embeddingConfig.maxTokens * 0.8 && estimatedTokens <= embeddingConfig.maxTokens) {
    warnings.push(
      `Chunk size is close to embedding model limit. Consider reducing for safety margin.`
    );
  }

  // Check overlap ratio
  const overlapRatio = chunkingConfig.chunkOverlap / chunkingConfig.chunkSize;
  if (overlapRatio > 0.5) {
    warnings.push(
      `High overlap ratio (${Math.round(overlapRatio * 100)}%) may lead to redundant embeddings`
    );
  }

  // Strategy-specific recommendations
  if (chunkingConfig.strategy === 'semantic' && embeddingConfig.dimensions < 768) {
    warnings.push(
      'Semantic chunking works best with higher-dimensional embeddings (768+ dimensions)'
    );
  }

  if (chunkingConfig.strategy === 'fixed' && embeddingConfig.dimensions > 1536) {
    recommendations.push(
      'Consider using recursive or semantic chunking with high-dimensional embeddings for better context preservation'
    );
  }

  return {
    isCompatible: errors.length === 0,
    errors,
    warnings,
    recommendations
  };
}

export function getOptimalChunkSize(embeddingConfig: EmbeddingConfig): {
  recommended: number;
  minimum: number;
  maximum: number;
} {
  // Conservative approach: use 75% of max tokens, converted to characters
  const maxSafeTokens = Math.floor(embeddingConfig.maxTokens * 0.75);
  const recommended = maxSafeTokens * 4; // Convert tokens to characters
  
  return {
    recommended: Math.min(recommended, 2000), // Cap at reasonable size
    minimum: 100,
    maximum: embeddingConfig.maxTokens * 4
  };
}

export function estimateEmbeddingCost(
  chunkingConfig: ChunkingConfig,
  embeddingConfig: EmbeddingConfig,
  documentsPerMonth: number = 1000
): {
  tokensPerDocument: number;
  totalTokensPerMonth: number;
  estimatedCost: number;
} {
  // Estimate average document length and number of chunks
  const avgDocumentLength = 5000; // characters
  const chunksPerDocument = Math.ceil(
    (avgDocumentLength - chunkingConfig.chunkOverlap) / 
    (chunkingConfig.chunkSize - chunkingConfig.chunkOverlap)
  );
  
  const tokensPerChunk = Math.ceil(chunkingConfig.chunkSize / 4);
  const tokensPerDocument = chunksPerDocument * tokensPerChunk;
  const totalTokensPerMonth = tokensPerDocument * documentsPerMonth;
  
  // Calculate cost (assuming cost is per 1M tokens)
  const costPer1MTokens = embeddingConfig.parameters?.costPer1MTokens || 0;
  const estimatedCost = (totalTokensPerMonth / 1000000) * costPer1MTokens;
  
  return {
    tokensPerDocument,
    totalTokensPerMonth,
    estimatedCost
  };
}