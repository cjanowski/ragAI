import { PipelineConfiguration, Document, Chunk, EvaluationResult } from '@/types';
import { GeminiClient, getGeminiClient, geminiRateLimiter } from './gemini-client';

// ============================================================================
// PIPELINE EXECUTION ENGINE
// ============================================================================

export interface ExecutableRAGPipeline {
  id: string;
  configuration: PipelineConfiguration;
  ingest(documents: Document[]): Promise<void>;
  query(question: string): AsyncGenerator<string, void, unknown>;
  evaluate(testQuestions: string[]): Promise<EvaluationResult>;
  getStatus(): PipelineStatus;
}

export interface PipelineStatus {
  isReady: boolean;
  documentsIngested: number;
  lastActivity: Date;
  errors: string[];
  warnings: string[];
}

export class RAGPipelineEngine implements ExecutableRAGPipeline {
  public id: string;
  public configuration: PipelineConfiguration;
  private documents: Document[] = [];
  private chunks: Chunk[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private status: PipelineStatus;
  private geminiClient: GeminiClient;

  constructor(configuration: PipelineConfiguration, apiKey?: string) {
    this.id = configuration.id;
    this.configuration = configuration;
    this.geminiClient = getGeminiClient(apiKey);
    this.status = {
      isReady: false,
      documentsIngested: 0,
      lastActivity: new Date(),
      errors: [],
      warnings: []
    };
  }

  async ingest(documents: Document[]): Promise<void> {
    try {
      this.status.lastActivity = new Date();
      this.documents = documents;
      
      // Step 1: Process documents through ingestion stage
      const processedDocs = await this.processIngestion(documents);
      
      // Step 2: Chunk the documents
      this.chunks = await this.processChunking(processedDocs);
      
      // Step 3: Generate embeddings
      await this.processEmbedding(this.chunks);
      
      // Step 4: Store in vector database
      await this.processVectorStorage(this.chunks);
      
      this.status.documentsIngested = documents.length;
      this.status.isReady = true;
      this.status.errors = [];
      
    } catch (error) {
      this.status.errors.push(`Ingestion failed: ${error}`);
      throw error;
    }
  }

  async* query(question: string): AsyncGenerator<string, void, unknown> {
    if (!this.status.isReady) {
      throw new Error('Pipeline not ready. Please ingest documents first.');
    }

    try {
      this.status.lastActivity = new Date();
      
      // Step 1: Generate query embedding
      const queryEmbedding = await this.generateQueryEmbedding(question);
      
      // Step 2: Retrieve relevant chunks
      const relevantChunks = await this.retrieveRelevantChunks(queryEmbedding);
      
      // Step 3: Generate response
      const context = relevantChunks.map(chunk => chunk.content).join('\n\n');
      
      yield* this.generateResponse(question, context);
      
    } catch (error) {
      this.status.errors.push(`Query failed: ${error}`);
      throw error;
    }
  }

  async evaluate(testQuestions: string[]): Promise<EvaluationResult> {
    // Mock evaluation - in real implementation would use TruLens/RAGAs
    return {
      id: `eval-${Date.now()}`,
      pipelineConfig: this.configuration,
      timestamp: new Date(),
      status: 'completed',
      metrics: {
        ragTriad: {
          contextRelevance: { value: 0.85, confidence: 0.9, breakdown: [], status: 'good' },
          groundedness: { value: 0.82, confidence: 0.88, breakdown: [], status: 'good' },
          answerRelevance: { value: 0.79, confidence: 0.85, breakdown: [], status: 'good' }
        },
        componentMetrics: {
          contextPrecision: { value: 0.83, confidence: 0.87, breakdown: [], status: 'good' },
          contextRecall: { value: 0.81, confidence: 0.86, breakdown: [], status: 'good' },
          faithfulness: { value: 0.84, confidence: 0.89, breakdown: [], status: 'good' },
          answerSimilarity: { value: 0.78, confidence: 0.84, breakdown: [], status: 'good' },
          answerCorrectness: { value: 0.80, confidence: 0.85, breakdown: [], status: 'good' }
        },
        performanceMetrics: {
          averageResponseTime: 2.3,
          tokensPerSecond: 45,
          throughput: 12,
          errorRate: 0.02,
          p95ResponseTime: 3.1,
          p99ResponseTime: 4.2
        },
        costMetrics: {
          totalCost: 0.15,
          costPerQuery: 0.003,
          embeddingCost: 0.05,
          llmCost: 0.08,
          vectorStoreCost: 0.02,
          breakdown: [
            { component: 'embedding', cost: 0.05, unit: 'USD', volume: 1000 },
            { component: 'llm', cost: 0.08, unit: 'USD', volume: 500 },
            { component: 'vectorstore', cost: 0.02, unit: 'USD', volume: 1 }
          ]
        }
      },
      diagnostics: [
        {
          component: 'chunking',
          issue: 'Chunk size could be optimized',
          severity: 'low',
          recommendation: 'Consider reducing chunk size to 800 characters',
          impact: 'May improve retrieval precision',
          estimatedImprovement: 0.05
        }
      ],
      testQuestions: testQuestions.map((q, i) => ({
        id: `q-${i}`,
        question: q,
        relevantContext: [`Context for ${q}`],
        difficulty: 'medium',
        category: 'general',
        metadata: {}
      })),
      duration: 45
    };
  }

  getStatus(): PipelineStatus {
    return { ...this.status };
  }

  // Private implementation methods
  private async processIngestion(documents: Document[]): Promise<Document[]> {
    // Mock document processing based on ingestion configuration
    const config = this.configuration.stages.ingestion;
    
    return documents.map(doc => ({
      ...doc,
      content: this.cleanText(doc.content, config.cleaningOptions),
      metadata: {
        ...doc.metadata,
        processedAt: new Date()
      }
    }));
  }

  private cleanText(text: string, options: any): string {
    let cleaned = text;
    
    if (options?.removeWhitespace) {
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
    }
    
    if (options?.removeSpecialChars) {
      cleaned = cleaned.replace(/[^\w\s.,!?-]/g, '');
    }
    
    return cleaned;
  }

  private async processChunking(documents: Document[]): Promise<Chunk[]> {
    const config = this.configuration.stages.chunking;
    const chunks: Chunk[] = [];
    
    for (const doc of documents) {
      const docChunks = this.chunkDocument(doc, config);
      chunks.push(...docChunks);
    }
    
    return chunks;
  }

  private chunkDocument(document: Document, config: any): Chunk[] {
    const { chunkSize, chunkOverlap, strategy } = config;
    const chunks: Chunk[] = [];
    const text = document.content;
    
    if (strategy === 'fixed') {
      for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
        const chunk = text.slice(i, i + chunkSize);
        if (chunk.trim()) {
          chunks.push({
            id: `${document.id}-chunk-${chunks.length}`,
            content: chunk.trim(),
            metadata: {
              documentId: document.id,
              chunkIndex: chunks.length,
              startOffset: i,
              endOffset: i + chunk.length,
              tokens: Math.ceil(chunk.length / 4), // Rough token estimate
              source: document.name,
              customFields: {}
            }
          });
        }
      }
    } else if (strategy === 'recursive') {
      // Simple recursive chunking implementation
      const separators = ['\n\n', '\n', '. ', ' '];
      chunks.push(...this.recursiveChunk(text, chunkSize, chunkOverlap, separators, document));
    }
    
    return chunks;
  }

  private recursiveChunk(
    text: string, 
    chunkSize: number, 
    overlap: number, 
    separators: string[], 
    document: Document
  ): Chunk[] {
    const chunks: Chunk[] = [];
    
    if (text.length <= chunkSize) {
      chunks.push({
        id: `${document.id}-chunk-0`,
        content: text.trim(),
        metadata: {
          documentId: document.id,
          chunkIndex: 0,
          startOffset: 0,
          endOffset: text.length,
          tokens: Math.ceil(text.length / 4),
          source: document.name,
          customFields: {}
        }
      });
      return chunks;
    }
    
    // Find best split point
    let splitPoint = chunkSize;
    for (const separator of separators) {
      const lastIndex = text.lastIndexOf(separator, chunkSize);
      if (lastIndex > chunkSize * 0.5) {
        splitPoint = lastIndex + separator.length;
        break;
      }
    }
    
    const chunk = text.slice(0, splitPoint).trim();
    if (chunk) {
      chunks.push({
        id: `${document.id}-chunk-${chunks.length}`,
        content: chunk,
        metadata: {
          documentId: document.id,
          chunkIndex: chunks.length,
          startOffset: 0,
          endOffset: splitPoint,
          tokens: Math.ceil(chunk.length / 4),
          source: document.name,
          customFields: {}
        }
      });
    }
    
    // Process remaining text with overlap
    const remainingText = text.slice(Math.max(0, splitPoint - overlap));
    if (remainingText.length > overlap) {
      chunks.push(...this.recursiveChunk(remainingText, chunkSize, overlap, separators, document));
    }
    
    return chunks;
  }

  private async processEmbedding(chunks: Chunk[]): Promise<void> {
    const config = this.configuration.stages.embedding;
    
    try {
      // Extract text content from chunks
      const texts = chunks.map(chunk => chunk.content);
      
      // Generate embeddings using Gemini
      await geminiRateLimiter.waitIfNeeded();
      const embeddings = await this.geminiClient.generateEmbeddings(texts, {
        model: 'text-embedding-004',
        taskType: 'RETRIEVAL_DOCUMENT'
      });
      
      // Store embeddings
      chunks.forEach((chunk, index) => {
        const embedding = embeddings[index];
        this.embeddings.set(chunk.id, embedding);
        chunk.embedding = embedding;
      });
      
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Fallback to mock embeddings if API fails
      for (const chunk of chunks) {
        const embedding = Array.from({ length: 768 }, () => Math.random() - 0.5);
        this.embeddings.set(chunk.id, embedding);
        chunk.embedding = embedding;
      }
      this.status.warnings.push('Using fallback embeddings due to API error');
    }
  }

  private async processVectorStorage(chunks: Chunk[]): Promise<void> {
    // Mock vector storage - in real implementation would store in actual vector DB
    console.log(`Stored ${chunks.length} chunks in vector database`);
  }

  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      await geminiRateLimiter.waitIfNeeded();
      return await this.geminiClient.generateQueryEmbedding(query, {
        model: 'text-embedding-004'
      });
    } catch (error) {
      console.error('Query embedding generation failed:', error);
      // Fallback to mock embedding
      return Array.from({ length: 768 }, () => Math.random() - 0.5);
    }
  }

  private async retrieveRelevantChunks(queryEmbedding: number[]): Promise<Chunk[]> {
    const config = this.configuration.stages.retrieval;
    const topK = config.topK || 5;
    
    // Calculate similarity scores (mock implementation)
    const scoredChunks = this.chunks.map(chunk => {
      const chunkEmbedding = this.embeddings.get(chunk.id) || [];
      const similarity = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      return { chunk, similarity };
    });
    
    // Sort by similarity and return top K
    return scoredChunks
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(item => item.chunk);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async* generateResponse(question: string, context: string): AsyncGenerator<string, void, unknown> {
    const config = this.configuration.stages.generation;
    
    const systemPrompt = config.systemPrompt || `You are a helpful AI assistant that answers questions based on the provided context. 
Use only the information from the context to answer questions. If the context doesn't contain enough information to answer the question, say so clearly.
Be concise but comprehensive in your responses.`;

    const prompt = `Context:
${context}

Question: ${question}

Please provide a helpful answer based on the context above.`;

    try {
      await geminiRateLimiter.waitIfNeeded();
      
      const responseGenerator = this.geminiClient.generateText(prompt, {
        model: config.model || 'gemini-1.5-flash',
        temperature: config.temperature || 0.1,
        maxTokens: config.maxTokens || 1000,
        systemPrompt
      });

      for await (const chunk of responseGenerator) {
        yield chunk;
      }
    } catch (error) {
      console.error('Response generation failed:', error);
      yield `I apologize, but I encountered an error while generating a response: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

// ============================================================================
// PIPELINE FACTORY
// ============================================================================

export class PipelineFactory {
  static async createPipeline(configuration: PipelineConfiguration, apiKey?: string): Promise<ExecutableRAGPipeline> {
    // Validate configuration
    if (!configuration.validation.isValid) {
      throw new Error('Invalid pipeline configuration');
    }
    
    return new RAGPipelineEngine(configuration, apiKey);
  }
  
  static validateConfiguration(configuration: Partial<PipelineConfiguration>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log('Validating configuration:', configuration);
    
    // Check if configuration has basic structure
    if (!configuration.stages) {
      errors.push('Configuration must have stages');
      return { isValid: false, errors, warnings };
    }
    
    // Check if we have at least some stages configured
    const configuredStages = Object.keys(configuration.stages);
    if (configuredStages.length === 0) {
      errors.push('No stages configured');
      return { isValid: false, errors, warnings };
    }
    
    // For now, we'll be lenient and allow partial configurations
    // In a production system, you might want to require all stages
    console.log('Configured stages:', configuredStages);
    
    // Validate chunking configuration if present
    if (configuration.stages.chunking) {
      const chunking = configuration.stages.chunking;
      if (chunking.chunkOverlap >= chunking.chunkSize) {
        errors.push('Chunk overlap must be less than chunk size');
      }
      if (chunking.chunkSize > 8000) {
        warnings.push('Large chunk size may exceed model context limits');
      }
    }
    
    // Validate embedding configuration if present
    if (configuration.stages.embedding && configuration.stages.chunking) {
      const embedding = configuration.stages.embedding;
      const chunking = configuration.stages.chunking;
      const estimatedTokens = Math.ceil(chunking.chunkSize / 4);
      
      if (estimatedTokens > embedding.maxTokens) {
        errors.push('Chunk size exceeds embedding model token limit');
      }
    }
    
    console.log('Validation result:', { isValid: errors.length === 0, errors, warnings });
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ============================================================================
// PIPELINE MANAGER
// ============================================================================

export class PipelineManager {
  private static pipelines: Map<string, ExecutableRAGPipeline> = new Map();
  
  static async createAndStorePipeline(configuration: PipelineConfiguration, apiKey?: string): Promise<string> {
    const pipeline = await PipelineFactory.createPipeline(configuration, apiKey);
    this.pipelines.set(pipeline.id, pipeline);
    return pipeline.id;
  }
  
  static getPipeline(id: string): ExecutableRAGPipeline | undefined {
    return this.pipelines.get(id);
  }
  
  static getAllPipelines(): ExecutableRAGPipeline[] {
    return Array.from(this.pipelines.values());
  }
  
  static deletePipeline(id: string): boolean {
    return this.pipelines.delete(id);
  }
  
  static async ingestDocuments(pipelineId: string, documents: Document[]): Promise<void> {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }
    
    await pipeline.ingest(documents);
  }
  
  static async* queryPipeline(pipelineId: string, question: string): AsyncGenerator<string, void, unknown> {
    const pipeline = this.getPipeline(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline ${pipelineId} not found`);
    }
    
    yield* pipeline.query(question);
  }
}