import { ChunkingConfig, EmbeddingConfig, Chunk, ChunkMetadata } from '@/types';

// ============================================================================
// CHUNKING STRATEGY IMPLEMENTATIONS
// ============================================================================

export interface ChunkingStrategy {
  id: ChunkingConfig['strategy'];
  name: string;
  description: string;
  chunk: (text: string, config: ChunkingConfig) => Chunk[];
  validate: (config: ChunkingConfig, embeddingConfig?: EmbeddingConfig) => {
    errors: string[];
    warnings: string[];
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Estimate token count from character count (rough approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * Create chunk metadata
 */
function createChunkMetadata(
  documentId: string,
  chunkIndex: number,
  content: string,
  startOffset: number,
  endOffset: number,
  customFields: Record<string, any> = {}
): ChunkMetadata {
  return {
    documentId,
    chunkIndex,
    startOffset,
    endOffset,
    tokens: estimateTokenCount(content),
    source: 'chunking-preview',
    customFields
  };
}

/**
 * Create a chunk object
 */
function createChunk(
  content: string,
  metadata: ChunkMetadata
): Chunk {
  return {
    id: `chunk-${metadata.chunkIndex}`,
    content: content.trim(),
    metadata
  };
}

// ============================================================================
// FIXED-SIZE CHUNKING STRATEGY
// ============================================================================

const fixedSizeChunking: ChunkingStrategy = {
  id: 'fixed',
  name: 'Fixed-Size Chunking',
  description: 'Split text into fixed-size chunks with configurable overlap',
  
  chunk: (text: string, config: ChunkingConfig): Chunk[] => {
    const chunks: Chunk[] = [];
    const { chunkSize, chunkOverlap } = config;
    const step = chunkSize - chunkOverlap;
    
    for (let i = 0; i < text.length; i += step) {
      const start = i;
      const end = Math.min(i + chunkSize, text.length);
      const content = text.slice(start, end);
      
      if (content.trim()) {
        const metadata = createChunkMetadata(
          'preview-doc',
          chunks.length,
          content,
          start,
          end,
          { strategy: 'fixed' }
        );
        chunks.push(createChunk(content, metadata));
      }
      
      // Break if we've reached the end
      if (end >= text.length) break;
    }
    
    return chunks;
  },
  
  validate: (config: ChunkingConfig, embeddingConfig?: EmbeddingConfig) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (config.chunkSize <= 0) {
      errors.push('Chunk size must be greater than 0');
    }
    if (config.chunkOverlap < 0) {
      errors.push('Chunk overlap cannot be negative');
    }
    if (config.chunkOverlap >= config.chunkSize) {
      errors.push('Chunk overlap must be less than chunk size');
    }
    
    // Embedding model compatibility
    if (embeddingConfig) {
      const estimatedTokens = estimateTokenCount('x'.repeat(config.chunkSize));
      if (estimatedTokens > embeddingConfig.maxTokens) {
        errors.push(`Chunk size (~${estimatedTokens} tokens) exceeds embedding model limit (${embeddingConfig.maxTokens} tokens)`);
      }
      if (estimatedTokens > embeddingConfig.maxTokens * 0.8) {
        warnings.push('Chunk size is close to embedding model limit. Consider reducing for better performance.');
      }
    }
    
    // Performance warnings
    if (config.chunkSize > 4000) {
      warnings.push('Large chunk sizes may impact retrieval precision');
    }
    if (config.chunkOverlap > config.chunkSize * 0.5) {
      warnings.push('High overlap ratio may cause redundant content');
    }
    
    return { errors, warnings };
  }
};

// ============================================================================
// RECURSIVE CHUNKING STRATEGY
// ============================================================================

const recursiveChunking: ChunkingStrategy = {
  id: 'recursive',
  name: 'Recursive Chunking',
  description: 'Recursively split text using multiple separators (paragraphs, sentences, words)',
  
  chunk: (text: string, config: ChunkingConfig): Chunk[] => {
    const separators = config.separators || ['\n\n', '\n', '. ', ' '];
    const { chunkSize, chunkOverlap } = config;
    
    const splitText = (text: string, separators: string[]): string[] => {
      if (separators.length === 0 || text.length <= chunkSize) {
        return [text];
      }
      
      const separator = separators[0];
      const parts = text.split(separator);
      
      if (parts.length === 1) {
        return splitText(text, separators.slice(1));
      }
      
      const result: string[] = [];
      let currentChunk = '';
      
      for (const part of parts) {
        const testChunk = currentChunk + (currentChunk ? separator : '') + part;
        
        if (testChunk.length <= chunkSize) {
          currentChunk = testChunk;
        } else {
          if (currentChunk) {
            result.push(currentChunk);
            // Add overlap from the end of the previous chunk
            const overlapText = currentChunk.slice(-chunkOverlap);
            currentChunk = overlapText + (overlapText ? separator : '') + part;
          } else {
            // Part is too large, split it further
            result.push(...splitText(part, separators.slice(1)));
          }
        }
      }
      
      if (currentChunk) {
        result.push(currentChunk);
      }
      
      return result;
    };
    
    const textChunks = splitText(text, separators);
    const chunks: Chunk[] = [];
    
    textChunks.forEach((chunk, index) => {
      if (chunk.trim()) {
        const metadata = createChunkMetadata(
          'preview-doc',
          index,
          chunk,
          0, // Would be calculated in real implementation
          chunk.length,
          { 
            strategy: 'recursive',
            separatorsUsed: separators
          }
        );
        chunks.push(createChunk(chunk, metadata));
      }
    });
    
    return chunks;
  },
  
  validate: (config: ChunkingConfig, embeddingConfig?: EmbeddingConfig) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Use fixed-size validation as base
    const baseValidation = fixedSizeChunking.validate(config, embeddingConfig);
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    
    // Recursive-specific validation
    if (!config.separators || config.separators.length === 0) {
      warnings.push('No separators defined. Using default separators.');
    }
    
    return { errors, warnings };
  }
};

// ============================================================================
// DOCUMENT-BASED CHUNKING STRATEGY
// ============================================================================

const documentChunking: ChunkingStrategy = {
  id: 'document',
  name: 'Document-Based Chunking',
  description: 'Split based on document structure (headers, sections, pages)',
  
  chunk: (text: string, config: ChunkingConfig): Chunk[] => {
    const chunks: Chunk[] = [];
    const lines = text.split('\n');
    let currentChunk = '';
    let chunkIndex = 0;
    let currentOffset = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = line.trim().match(/^#{1,6}\s/) || 
                      line.trim().match(/^[A-Z][A-Z\s]{2,}$/) || // ALL CAPS headers
                      (i < lines.length - 1 && lines[i + 1]?.match(/^[=-]{3,}$/)); // Underlined headers
      
      if (isHeader && currentChunk.trim()) {
        // Start new chunk at header
        const metadata = createChunkMetadata(
          'preview-doc',
          chunkIndex,
          currentChunk,
          currentOffset,
          currentOffset + currentChunk.length,
          { 
            strategy: 'document',
            preserveStructure: config.preserveStructure,
            headerBoundary: true
          }
        );
        chunks.push(createChunk(currentChunk, metadata));
        chunkIndex++;
        currentOffset += currentChunk.length;
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
        
        // Also split if chunk gets too large
        if (currentChunk.length > config.chunkSize) {
          const metadata = createChunkMetadata(
            'preview-doc',
            chunkIndex,
            currentChunk,
            currentOffset,
            currentOffset + currentChunk.length,
            { 
              strategy: 'document',
              preserveStructure: config.preserveStructure,
              sizeBoundary: true
            }
          );
          chunks.push(createChunk(currentChunk, metadata));
          chunkIndex++;
          currentOffset += currentChunk.length;
          currentChunk = '';
        }
      }
    }
    
    if (currentChunk.trim()) {
      const metadata = createChunkMetadata(
        'preview-doc',
        chunkIndex,
        currentChunk,
        currentOffset,
        currentOffset + currentChunk.length,
        { 
          strategy: 'document',
          preserveStructure: config.preserveStructure,
          finalChunk: true
        }
      );
      chunks.push(createChunk(currentChunk, metadata));
    }
    
    return chunks;
  },
  
  validate: (config: ChunkingConfig, embeddingConfig?: EmbeddingConfig) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Use fixed-size validation as base
    const baseValidation = fixedSizeChunking.validate(config, embeddingConfig);
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    
    // Document-specific validation
    if (config.chunkSize < 500) {
      warnings.push('Small chunk size may not capture complete document sections');
    }
    
    return { errors, warnings };
  }
};

// ============================================================================
// SEMANTIC CHUNKING STRATEGY
// ============================================================================

const semanticChunking: ChunkingStrategy = {
  id: 'semantic',
  name: 'Semantic Chunking',
  description: 'Split text based on semantic similarity using embeddings',
  
  chunk: (text: string, config: ChunkingConfig): Chunk[] => {
    // Simplified semantic chunking - in reality would use embeddings
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    let currentOffset = 0;
    
    for (const sentence of sentences) {
      const testChunk = currentChunk + (currentChunk ? '. ' : '') + sentence.trim();
      
      if (testChunk.length <= config.chunkSize) {
        currentChunk = testChunk;
      } else {
        if (currentChunk) {
          const metadata = createChunkMetadata(
            'preview-doc',
            chunkIndex,
            currentChunk + '.',
            currentOffset,
            currentOffset + currentChunk.length,
            { 
              strategy: 'semantic',
              semanticThreshold: config.semanticThreshold || 0.8,
              semanticBoundary: true,
              coherenceScore: 0.85 + Math.random() * 0.1 // Simulated coherence score
            }
          );
          chunks.push(createChunk(currentChunk + '.', metadata));
          chunkIndex++;
          currentOffset += currentChunk.length;
        }
        currentChunk = sentence.trim();
      }
    }
    
    if (currentChunk.trim()) {
      const metadata = createChunkMetadata(
        'preview-doc',
        chunkIndex,
        currentChunk + '.',
        currentOffset,
        currentOffset + currentChunk.length,
        { 
          strategy: 'semantic',
          semanticThreshold: config.semanticThreshold || 0.8,
          semanticBoundary: true,
          coherenceScore: 0.85 + Math.random() * 0.1,
          finalChunk: true
        }
      );
      chunks.push(createChunk(currentChunk + '.', metadata));
    }
    
    return chunks;
  },
  
  validate: (config: ChunkingConfig, embeddingConfig?: EmbeddingConfig) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Use fixed-size validation as base
    const baseValidation = fixedSizeChunking.validate(config, embeddingConfig);
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    
    // Semantic-specific validation
    if (!config.semanticThreshold) {
      errors.push('Semantic threshold is required for semantic chunking');
    } else if (config.semanticThreshold < 0.1 || config.semanticThreshold > 1.0) {
      errors.push('Semantic threshold must be between 0.1 and 1.0');
    }
    
    if (config.chunkSize < 500) {
      warnings.push('Small chunks may not provide enough context for semantic analysis');
    }
    
    if (!embeddingConfig) {
      warnings.push('Semantic chunking requires an embedding model for optimal performance');
    }
    
    return { errors, warnings };
  }
};

// ============================================================================
// AGENTIC CHUNKING STRATEGY
// ============================================================================

const agenticChunking: ChunkingStrategy = {
  id: 'agentic',
  name: 'Agentic Chunking',
  description: 'AI-powered chunking that understands content and creates optimal boundaries',
  
  chunk: (text: string, config: ChunkingConfig): Chunk[] => {
    // Simplified agentic chunking - in reality would use LLM
    // For demo, we'll use a combination of document structure and semantic boundaries
    const documentChunks = documentChunking.chunk(text, config);
    const refinedChunks: Chunk[] = [];
    
    documentChunks.forEach((chunk, index) => {
      const content = chunk.content;
      
      if (content.length > config.chunkSize * 0.8) {
        // Split large chunks at natural boundaries using AI-like logic
        const sentences = content.split(/[.!?]+/).filter(s => s.trim());
        let currentSubChunk = '';
        let subChunkIndex = 0;
        
        sentences.forEach((sentence, sentIndex) => {
          const testChunk = currentSubChunk + (currentSubChunk ? '. ' : '') + sentence.trim();
          
          if (testChunk.length <= config.chunkSize || !currentSubChunk) {
            currentSubChunk = testChunk;
          } else {
            const metadata = createChunkMetadata(
              'preview-doc',
              refinedChunks.length,
              currentSubChunk + '.',
              0, // Would be calculated in real implementation
              currentSubChunk.length,
              { 
                strategy: 'agentic',
                agenticBoundary: true,
                parentChunk: chunk.id,
                qualityScore: 0.9 + Math.random() * 0.1,
                contentType: detectContentType(currentSubChunk),
                boundaryReason: 'semantic_coherence',
                subChunkIndex: subChunkIndex++
              }
            );
            refinedChunks.push(createChunk(currentSubChunk + '.', metadata));
            currentSubChunk = sentence.trim();
          }
        });
        
        if (currentSubChunk.trim()) {
          const metadata = createChunkMetadata(
            'preview-doc',
            refinedChunks.length,
            currentSubChunk + '.',
            0,
            currentSubChunk.length,
            { 
              strategy: 'agentic',
              agenticBoundary: true,
              parentChunk: chunk.id,
              qualityScore: 0.9 + Math.random() * 0.1,
              contentType: detectContentType(currentSubChunk),
              boundaryReason: 'natural_ending',
              subChunkIndex: subChunkIndex++
            }
          );
          refinedChunks.push(createChunk(currentSubChunk + '.', metadata));
        }
      } else {
        // Keep smaller chunks as-is but enhance metadata
        const enhancedMetadata = createChunkMetadata(
          'preview-doc',
          refinedChunks.length,
          content,
          0,
          content.length,
          { 
            strategy: 'agentic',
            agenticBoundary: true,
            qualityScore: 0.95 + Math.random() * 0.05,
            contentType: detectContentType(content),
            boundaryReason: 'optimal_size',
            originalChunk: true
          }
        );
        refinedChunks.push(createChunk(content, enhancedMetadata));
      }
    });
    
    return refinedChunks;
  },
  
  validate: (config: ChunkingConfig, embeddingConfig?: EmbeddingConfig) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Use fixed-size validation as base
    const baseValidation = fixedSizeChunking.validate(config, embeddingConfig);
    errors.push(...baseValidation.errors);
    warnings.push(...baseValidation.warnings);
    
    // Agentic-specific validation
    if (config.chunkSize < 500) {
      warnings.push('Agentic chunking works best with larger chunk sizes for better context understanding');
    }
    
    warnings.push('Agentic chunking requires LLM API calls and will be slower and more expensive than other strategies');
    
    return { errors, warnings };
  }
};

// ============================================================================
// CONTENT TYPE DETECTION (Helper for Agentic Chunking)
// ============================================================================

function detectContentType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (text.match(/^#{1,6}\s/)) return 'header';
  if (text.match(/```|`[^`]+`/)) return 'code';
  if (text.match(/\|.*\|.*\|/)) return 'table';
  if (text.match(/^\d+\./m)) return 'numbered_list';
  if (text.match(/^[-*+]\s/m)) return 'bullet_list';
  if (lowerText.includes('therefore') || lowerText.includes('conclusion')) return 'conclusion';
  if (lowerText.includes('introduction') || lowerText.includes('overview')) return 'introduction';
  if (text.match(/[.!?]\s*$/)) return 'paragraph';
  
  return 'text';
}

// ============================================================================
// STRATEGY REGISTRY
// ============================================================================

export const CHUNKING_STRATEGIES: Record<ChunkingConfig['strategy'], ChunkingStrategy> = {
  fixed: fixedSizeChunking,
  recursive: recursiveChunking,
  document: documentChunking,
  semantic: semanticChunking,
  agentic: agenticChunking
};

// ============================================================================
// MAIN CHUNKING FUNCTION
// ============================================================================

/**
 * Chunk text using the specified strategy
 */
export function chunkText(text: string, config: ChunkingConfig): Chunk[] {
  const strategy = CHUNKING_STRATEGIES[config.strategy];
  if (!strategy) {
    throw new Error(`Unknown chunking strategy: ${config.strategy}`);
  }
  
  return strategy.chunk(text, config);
}

/**
 * Validate chunking configuration
 */
export function validateChunkingConfig(
  config: ChunkingConfig, 
  embeddingConfig?: EmbeddingConfig
): { errors: string[]; warnings: string[] } {
  const strategy = CHUNKING_STRATEGIES[config.strategy];
  if (!strategy) {
    return {
      errors: [`Unknown chunking strategy: ${config.strategy}`],
      warnings: []
    };
  }
  
  return strategy.validate(config, embeddingConfig);
}

/**
 * Get chunking strategy information
 */
export function getChunkingStrategy(strategy: ChunkingConfig['strategy']): ChunkingStrategy | undefined {
  return CHUNKING_STRATEGIES[strategy];
}

/**
 * Get all available chunking strategies
 */
export function getAllChunkingStrategies(): ChunkingStrategy[] {
  return Object.values(CHUNKING_STRATEGIES);
}

// ============================================================================
// CHUNKING STATISTICS
// ============================================================================

export interface ChunkingStats {
  totalChunks: number;
  avgSize: number;
  minSize: number;
  maxSize: number;
  totalTokens: number;
  avgTokens: number;
  sizeDistribution: {
    small: number; // < 500 chars
    medium: number; // 500-1500 chars
    large: number; // > 1500 chars
  };
  tokenDistribution: {
    small: number; // < 125 tokens
    medium: number; // 125-375 tokens
    large: number; // > 375 tokens
  };
}

/**
 * Calculate statistics for chunked text
 */
export function calculateChunkingStats(chunks: Chunk[]): ChunkingStats {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      avgSize: 0,
      minSize: 0,
      maxSize: 0,
      totalTokens: 0,
      avgTokens: 0,
      sizeDistribution: { small: 0, medium: 0, large: 0 },
      tokenDistribution: { small: 0, medium: 0, large: 0 }
    };
  }
  
  const sizes = chunks.map(c => c.content.length);
  const tokens = chunks.map(c => c.metadata.tokens);
  
  const sizeDistribution = {
    small: chunks.filter(c => c.content.length < 500).length,
    medium: chunks.filter(c => c.content.length >= 500 && c.content.length <= 1500).length,
    large: chunks.filter(c => c.content.length > 1500).length
  };
  
  const tokenDistribution = {
    small: chunks.filter(c => c.metadata.tokens < 125).length,
    medium: chunks.filter(c => c.metadata.tokens >= 125 && c.metadata.tokens <= 375).length,
    large: chunks.filter(c => c.metadata.tokens > 375).length
  };
  
  return {
    totalChunks: chunks.length,
    avgSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
    totalTokens: tokens.reduce((a, b) => a + b, 0),
    avgTokens: Math.round(tokens.reduce((a, b) => a + b, 0) / tokens.length),
    sizeDistribution,
    tokenDistribution
  };
}