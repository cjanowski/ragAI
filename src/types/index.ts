import { z } from 'zod';

// ============================================================================
// CORE PIPELINE TYPES
// ============================================================================

export interface PipelineStage {
  id: string;
  name: string;
  component: ComponentOption | null;
  dependencies: string[];
  validation: ValidationResult;
}

export interface ComponentOption {
  id: string;
  name: string;
  description: string;
  category: 'ingestion' | 'chunking' | 'embedding' | 'vectorstore' | 'retrieval' | 'generation';
  parameters: Parameter[];
  tradeoffs: {
    pros: string[];
    cons: string[];
    useCases: string[];
    cost: CostEstimate;
  };
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CostEstimate {
  setup: number;
  perOperation: number;
  monthly: number;
  currency: string;
}

// ============================================================================
// PIPELINE CONFIGURATION TYPES
// ============================================================================

export interface PipelineConfiguration {
  id: string;
  name: string;
  version: string;
  stages: {
    ingestion: IngestionConfig;
    chunking: ChunkingConfig;
    embedding: EmbeddingConfig;
    vectorStore: VectorStoreConfig;
    retrieval: RetrievalConfig;
    generation: GenerationConfig;
  };
  metadata: ConfigurationMetadata;
  validation: PipelineValidation;
}

export interface ConfigurationMetadata {
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  description?: string;
  tags: string[];
  estimatedCost: CostEstimate;
}

export interface PipelineValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  stage: string;
  component?: string;
  message: string;
  severity: 'error' | 'warning';
  code?: string;
}

export interface ValidationWarning {
  stage: string;
  component?: string;
  message: string;
  suggestion?: string;
  code?: string;
}

// ============================================================================
// STAGE-SPECIFIC CONFIGURATION TYPES
// ============================================================================

// Ingestion Configuration
export interface IngestionConfig {
  loaderType: string;
  cleaningOptions: CleaningOptions;
  supportedFormats: string[];
  parameters: Record<string, any>;
}

export interface CleaningOptions {
  removeWhitespace: boolean;
  removeSpecialChars: boolean;
  normalizeUnicode: boolean;
  extractTables: 'ignore' | 'text' | 'structured';
  extractImages: 'ignore' | 'alt_text' | 'description';
  customRules: string[];
}

// Chunking Configuration
export interface ChunkingConfig {
  strategy: 'fixed' | 'recursive' | 'semantic' | 'document' | 'agentic';
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
  semanticThreshold?: number;
  preserveStructure: boolean;
  parameters: Record<string, any>;
}

// Embedding Configuration
export interface EmbeddingConfig {
  provider: string;
  model: string;
  dimensions: number;
  maxTokens: number;
  batchSize: number;
  apiKey?: string;
  parameters: Record<string, any>;
}

// Vector Store Configuration
export interface VectorStoreConfig {
  provider: string;
  indexName: string;
  connectionParams: Record<string, any>;
  features: string[];
  scalingConfig?: {
    replicas: number;
    shards: number;
    autoScale: boolean;
  };
}

// Retrieval Configuration
export interface RetrievalConfig {
  strategy: 'vector' | 'hybrid' | 'rerank';
  topK: number;
  rerankModel?: string;
  rerankTopN?: number;
  hybridAlpha?: number;
  filters?: Record<string, any>;
  parameters: Record<string, any>;
}

// Generation Configuration
export interface GenerationConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  outputFormat: 'text' | 'json';
  jsonSchema?: object;
  parameters: Record<string, any>;
}

// ============================================================================
// DOCUMENT AND PROCESSING TYPES
// ============================================================================

export interface Document {
  id: string;
  name: string;
  content: string;
  metadata: DocumentMetadata;
  chunks?: Chunk[];
}

export interface DocumentMetadata {
  originalName: string;
  fileType: string;
  size: number;
  uploadedAt: Date;
  processedAt?: Date;
  source?: string;
  author?: string;
  title?: string;
  language?: string;
  customFields: Record<string, any>;
}

export interface ProcessedDocument {
  id: string;
  originalName: string;
  content: string;
  metadata: DocumentMetadata;
  processingLog: ProcessingStep[];
}

export interface ProcessingStep {
  step: string;
  timestamp: Date;
  duration: number;
  status: 'success' | 'warning' | 'error';
  message?: string;
  details?: Record<string, any>;
}

export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface ChunkMetadata {
  documentId: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
  tokens: number;
  source: string;
  customFields: Record<string, any>;
}

// ============================================================================
// EXTERNAL SERVICE INTEGRATION TYPES
// ============================================================================

// LLM Provider Types
export interface LLMProvider {
  name: string;
  models: LLMModel[];
  generateResponse(prompt: string, config: GenerationConfig): AsyncGenerator<string>;
  estimateCost(inputTokens: number, outputTokens: number): number;
}

export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
  inputCostPer1M: number;
  outputCostPer1M: number;
  capabilities: string[];
  supportedFormats: string[];
}

// Vector Database Types
export interface VectorStore {
  name: string;
  features: VectorStoreFeature[];
  connect(config: ConnectionConfig): Promise<void>;
  upsert(vectors: Vector[]): Promise<void>;
  search(query: Vector, options: SearchOptions): Promise<SearchResult[]>;
  hybridSearch?(query: string, vector: Vector, options: HybridSearchOptions): Promise<SearchResult[]>;
}

export interface VectorStoreFeature {
  name: string;
  supported: boolean;
  description: string;
}

export interface Vector {
  id: string;
  values: number[];
  metadata: Record<string, any>;
}

export interface SearchOptions {
  topK: number;
  filter?: Record<string, any>;
  includeMetadata: boolean;
  includeValues: boolean;
}

export interface HybridSearchOptions extends SearchOptions {
  alpha: number;
  sparseVector?: Record<string, number>;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  values?: number[];
}

export interface ConnectionConfig {
  apiKey?: string;
  endpoint?: string;
  region?: string;
  database?: string;
  collection?: string;
  [key: string]: any;
}

// ============================================================================
// EVALUATION AND METRICS TYPES
// ============================================================================

export interface EvaluationResult {
  id: string;
  pipelineConfig: PipelineConfiguration;
  timestamp: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  metrics: EvaluationMetrics;
  diagnostics: DiagnosticInsight[];
  testQuestions: TestQuestion[];
  duration?: number;
}

export interface EvaluationMetrics {
  ragTriad: RAGTriadScores;
  componentMetrics: ComponentMetrics;
  performanceMetrics: PerformanceMetrics;
  costMetrics: CostMetrics;
}

export interface RAGTriadScores {
  contextRelevance: MetricScore;
  groundedness: MetricScore;
  answerRelevance: MetricScore;
}

export interface ComponentMetrics {
  contextPrecision: MetricScore;
  contextRecall: MetricScore;
  faithfulness: MetricScore;
  answerSimilarity: MetricScore;
  answerCorrectness: MetricScore;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  tokensPerSecond: number;
  throughput: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

export interface CostMetrics {
  totalCost: number;
  costPerQuery: number;
  embeddingCost: number;
  llmCost: number;
  vectorStoreCost: number;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  component: string;
  cost: number;
  unit: string;
  volume: number;
}

export interface MetricScore {
  value: number;
  confidence: number;
  breakdown: ScoreBreakdown[];
  threshold?: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface ScoreBreakdown {
  category: string;
  score: number;
  weight: number;
  details?: string;
}

export interface DiagnosticInsight {
  component: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  impact: string;
  estimatedImprovement?: number;
}

export interface TestQuestion {
  id: string;
  question: string;
  expectedAnswer?: string;
  relevantContext: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  metadata: Record<string, any>;
}

// ============================================================================
// ERROR HANDLING TYPES
// ============================================================================

export enum ErrorType {
  VALIDATION_ERROR = 'validation_error',
  CONFIGURATION_ERROR = 'configuration_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
  TIMEOUT_ERROR = 'timeout_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  QUOTA_EXCEEDED_ERROR = 'quota_exceeded_error',
  NETWORK_ERROR = 'network_error',
  PARSING_ERROR = 'parsing_error',
  STORAGE_ERROR = 'storage_error'
}

export interface ErrorResponse {
  type: ErrorType;
  message: string;
  details?: Record<string, any>;
  suggestions?: string[];
  retryable: boolean;
  retryAfter?: number;
  errorCode?: string;
  timestamp: Date;
  requestId?: string;
}

export interface APIError extends Error {
  type: ErrorType;
  statusCode: number;
  retryable: boolean;
  details?: Record<string, any>;
}

// ============================================================================
// TELEMETRY AND ANALYTICS TYPES
// ============================================================================

export interface TelemetryEvent {
  eventType: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  properties: Record<string, any>;
  metrics?: Record<string, number>;
  context?: TelemetryContext;
}

export interface TelemetryContext {
  userAgent?: string;
  platform?: string;
  version?: string;
  environment?: string;
  feature?: string;
  experiment?: string;
}

export interface UsageMetrics {
  totalQueries: number;
  totalDocuments: number;
  totalEvaluations: number;
  totalExports: number;
  storageUsed: number;
  computeTime: number;
  costAccrued: number;
  lastActivity: Date;
}

// Telemetry event types
export const TELEMETRY_EVENTS = {
  PIPELINE_CREATED: 'pipeline_created',
  PIPELINE_UPDATED: 'pipeline_updated',
  COMPONENT_SELECTED: 'component_selected',
  COMPONENT_CONFIGURED: 'component_configured',
  DOCUMENT_UPLOADED: 'document_uploaded',
  DOCUMENT_PROCESSED: 'document_processed',
  CHAT_MESSAGE_SENT: 'chat_message_sent',
  CHAT_RESPONSE_RECEIVED: 'chat_response_received',
  EVALUATION_STARTED: 'evaluation_started',
  EVALUATION_COMPLETED: 'evaluation_completed',
  EVALUATION_FAILED: 'evaluation_failed',
  EXPORT_GENERATED: 'export_generated',
  ERROR_OCCURRED: 'error_occurred',
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  FEATURE_USED: 'feature_used'
} as const;

// ============================================================================
// USER AND PROJECT MANAGEMENT TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
  usage: UsageMetrics;
  preferences: UserPreferences;
  limits: UserLimits;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  defaultConfigurations?: Partial<PipelineConfiguration>;
}

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  evaluationComplete: boolean;
  quotaWarnings: boolean;
  systemUpdates: boolean;
}

export interface UserLimits {
  maxProjects: number;
  maxDocumentsPerProject: number;
  maxEvaluationsPerMonth: number;
  maxExportsPerMonth: number;
  maxStorageGB: number;
  maxComputeHours: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  configurations: PipelineConfiguration[];
  evaluationHistory: EvaluationResult[];
  documents: Document[];
  sharedWith: ProjectShare[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'archived' | 'deleted';
  tags: string[];
}

export interface ProjectShare {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  sharedAt: Date;
  sharedBy: string;
}

// ============================================================================
// CHAT AND INTERACTION TYPES
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  retrievedContext?: RetrievedContext[];
  processingTime?: number;
  tokensUsed?: TokenUsage;
  cost?: number;
  pipelineConfig?: string; // Pipeline configuration ID
  sources?: SourceReference[];
}

export interface RetrievedContext {
  id: string;
  content: string;
  score: number;
  source: string;
  metadata: Record<string, any>;
}

export interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

export interface SourceReference {
  documentId: string;
  chunkId: string;
  title: string;
  excerpt: string;
  relevanceScore: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  currentPipeline: PipelineConfiguration;
  uploadedDocuments: DocumentMetadata[];
  sessionId: string;
  totalCost: number;
}

// ============================================================================
// EXPORT AND CODE GENERATION TYPES
// ============================================================================

export interface ExportRequest {
  pipelineId: string;
  format: 'python' | 'yaml' | 'json' | 'typescript';
  framework?: 'langchain' | 'llamaindex' | 'custom';
  includeTests: boolean;
  includeDocumentation: boolean;
  customizations?: ExportCustomizations;
}

export interface ExportCustomizations {
  packageName?: string;
  className?: string;
  environmentVariables?: Record<string, string>;
  additionalDependencies?: string[];
  customCode?: string;
}

export interface ExportResult {
  id: string;
  format: string;
  files: ExportFile[];
  instructions: string;
  dependencies: string[];
  createdAt: Date;
  downloadUrl?: string;
}

export interface ExportFile {
  name: string;
  content: string;
  type: 'code' | 'config' | 'documentation' | 'test';
  language?: string;
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Cost Estimate Schema
export const CostEstimateSchema = z.object({
  setup: z.number().min(0),
  perOperation: z.number().min(0),
  monthly: z.number().min(0),
  currency: z.string().length(3)
});

// Parameter Schema
export const ParameterSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['string', 'number', 'boolean', 'select', 'multiselect']),
  required: z.boolean(),
  defaultValue: z.any().optional(),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional()
  }).optional()
});

// Component Option Schema
export const ComponentOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['ingestion', 'chunking', 'embedding', 'vectorstore', 'retrieval', 'generation']),
  parameters: z.array(ParameterSchema),
  tradeoffs: z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    useCases: z.array(z.string()),
    cost: CostEstimateSchema
  })
});

// Cleaning Options Schema
export const CleaningOptionsSchema = z.object({
  removeWhitespace: z.boolean(),
  removeSpecialChars: z.boolean(),
  normalizeUnicode: z.boolean(),
  extractTables: z.enum(['ignore', 'text', 'structured']),
  extractImages: z.enum(['ignore', 'alt_text', 'description']),
  customRules: z.array(z.string())
});

// Stage Configuration Schemas
export const IngestionConfigSchema = z.object({
  loaderType: z.string().min(1),
  cleaningOptions: CleaningOptionsSchema,
  supportedFormats: z.array(z.string()),
  parameters: z.record(z.any())
});

export const ChunkingConfigSchema = z.object({
  strategy: z.enum(['fixed', 'recursive', 'semantic', 'document', 'agentic']),
  chunkSize: z.number().min(1).max(32000),
  chunkOverlap: z.number().min(0),
  separators: z.array(z.string()).optional(),
  semanticThreshold: z.number().min(0).max(1).optional(),
  preserveStructure: z.boolean(),
  parameters: z.record(z.any())
}).refine(data => data.chunkOverlap < data.chunkSize, {
  message: "Chunk overlap must be less than chunk size",
  path: ["chunkOverlap"]
});

export const EmbeddingConfigSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  dimensions: z.number().min(1),
  maxTokens: z.number().min(1),
  batchSize: z.number().min(1).max(1000),
  apiKey: z.string().optional(),
  parameters: z.record(z.any())
});

export const VectorStoreConfigSchema = z.object({
  provider: z.string().min(1),
  indexName: z.string().min(1),
  connectionParams: z.record(z.any()),
  features: z.array(z.string()),
  scalingConfig: z.object({
    replicas: z.number().min(1),
    shards: z.number().min(1),
    autoScale: z.boolean()
  }).optional()
});

export const RetrievalConfigSchema = z.object({
  strategy: z.enum(['vector', 'hybrid', 'rerank']),
  topK: z.number().min(1).max(100),
  rerankModel: z.string().optional(),
  rerankTopN: z.number().min(1).optional(),
  hybridAlpha: z.number().min(0).max(1).optional(),
  filters: z.record(z.any()).optional(),
  parameters: z.record(z.any())
}).refine(data => {
  if (data.strategy === 'rerank' && !data.rerankModel) {
    return false;
  }
  if (data.strategy === 'hybrid' && data.hybridAlpha === undefined) {
    return false;
  }
  return true;
}, {
  message: "Strategy-specific parameters are required"
});

export const GenerationConfigSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().min(1),
  systemPrompt: z.string(),
  outputFormat: z.enum(['text', 'json']),
  jsonSchema: z.object({}).optional(),
  parameters: z.record(z.any())
}).refine(data => {
  if (data.outputFormat === 'json' && !data.jsonSchema) {
    return false;
  }
  return true;
}, {
  message: "JSON schema is required when output format is JSON"
});

// Configuration Metadata Schema
export const ConfigurationMetadataSchema = z.object({
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  estimatedCost: CostEstimateSchema
});

// Pipeline Configuration Schema
export const PipelineConfigurationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  stages: z.object({
    ingestion: IngestionConfigSchema,
    chunking: ChunkingConfigSchema,
    embedding: EmbeddingConfigSchema,
    vectorStore: VectorStoreConfigSchema,
    retrieval: RetrievalConfigSchema,
    generation: GenerationConfigSchema
  }),
  metadata: ConfigurationMetadataSchema,
  validation: z.object({
    isValid: z.boolean(),
    errors: z.array(z.object({
      stage: z.string(),
      component: z.string().optional(),
      message: z.string(),
      severity: z.enum(['error', 'warning']),
      code: z.string().optional()
    })),
    warnings: z.array(z.object({
      stage: z.string(),
      component: z.string().optional(),
      message: z.string(),
      suggestion: z.string().optional(),
      code: z.string().optional()
    }))
  })
});

// Document Metadata Schema
export const DocumentMetadataSchema = z.object({
  originalName: z.string().min(1),
  fileType: z.string().min(1),
  size: z.number().min(0),
  uploadedAt: z.date(),
  processedAt: z.date().optional(),
  source: z.string().optional(),
  author: z.string().optional(),
  title: z.string().optional(),
  language: z.string().optional(),
  customFields: z.record(z.any())
});

// Document Schema
export const DocumentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  content: z.string(),
  metadata: DocumentMetadataSchema,
  chunks: z.array(z.object({
    id: z.string(),
    content: z.string(),
    metadata: z.object({
      documentId: z.string(),
      chunkIndex: z.number(),
      startOffset: z.number(),
      endOffset: z.number(),
      tokens: z.number(),
      source: z.string(),
      customFields: z.record(z.any())
    }),
    embedding: z.array(z.number()).optional()
  })).optional()
});

// User Schema
export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  tier: z.enum(['free', 'pro', 'enterprise']),
  createdAt: z.date(),
  updatedAt: z.date(),
  usage: z.object({
    totalQueries: z.number().min(0),
    totalDocuments: z.number().min(0),
    totalEvaluations: z.number().min(0),
    totalExports: z.number().min(0),
    storageUsed: z.number().min(0),
    computeTime: z.number().min(0),
    costAccrued: z.number().min(0),
    lastActivity: z.date()
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
    notifications: z.object({
      email: z.boolean(),
      inApp: z.boolean(),
      evaluationComplete: z.boolean(),
      quotaWarnings: z.boolean(),
      systemUpdates: z.boolean()
    }),
    defaultConfigurations: z.any().optional()
  }),
  limits: z.object({
    maxProjects: z.number().min(1),
    maxDocumentsPerProject: z.number().min(1),
    maxEvaluationsPerMonth: z.number().min(1),
    maxExportsPerMonth: z.number().min(1),
    maxStorageGB: z.number().min(1),
    maxComputeHours: z.number().min(1)
  })
});

// Export Request Schema
export const ExportRequestSchema = z.object({
  pipelineId: z.string().min(1),
  format: z.enum(['python', 'yaml', 'json', 'typescript']),
  framework: z.enum(['langchain', 'llamaindex', 'custom']).optional(),
  includeTests: z.boolean(),
  includeDocumentation: z.boolean(),
  customizations: z.object({
    packageName: z.string().optional(),
    className: z.string().optional(),
    environmentVariables: z.record(z.string()).optional(),
    additionalDependencies: z.array(z.string()).optional(),
    customCode: z.string().optional()
  }).optional()
});

// Chat Message Schema
export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.object({
    retrievedContext: z.array(z.object({
      id: z.string(),
      content: z.string(),
      score: z.number(),
      source: z.string(),
      metadata: z.record(z.any())
    })).optional(),
    processingTime: z.number().optional(),
    tokensUsed: z.object({
      input: z.number(),
      output: z.number(),
      total: z.number()
    }).optional(),
    cost: z.number().optional(),
    pipelineConfig: z.string().optional(),
    sources: z.array(z.object({
      documentId: z.string(),
      chunkId: z.string(),
      title: z.string(),
      excerpt: z.string(),
      relevanceScore: z.number()
    })).optional()
  }).optional()
});

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

export function validatePipelineConfiguration(config: unknown): {
  success: boolean;
  data?: PipelineConfiguration;
  errors?: z.ZodError;
} {
  try {
    const result = PipelineConfigurationSchema.parse(config);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateDocument(document: unknown): {
  success: boolean;
  data?: Document;
  errors?: z.ZodError;
} {
  try {
    const result = DocumentSchema.parse(document);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateUser(user: unknown): {
  success: boolean;
  data?: User;
  errors?: z.ZodError;
} {
  try {
    const result = UserSchema.parse(user);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

export function validateExportRequest(request: unknown): {
  success: boolean;
  data?: ExportRequest;
  errors?: z.ZodError;
} {
  try {
    const result = ExportRequestSchema.parse(request);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isPipelineConfiguration(obj: any): obj is PipelineConfiguration {
  return validatePipelineConfiguration(obj).success;
}

export function isDocument(obj: any): obj is Document {
  return validateDocument(obj).success;
}

export function isUser(obj: any): obj is User {
  return validateUser(obj).success;
}

export function isErrorResponse(obj: any): obj is ErrorResponse {
  return obj && typeof obj === 'object' && 'type' in obj && 'message' in obj;
}

export function isChatMessage(obj: any): obj is ChatMessage {
  return obj && typeof obj === 'object' && 'id' in obj && 'role' in obj && 'content' in obj;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type PipelineStageType = keyof PipelineConfiguration['stages'];
export type ComponentCategory = ComponentOption['category'];
export type ChunkingStrategy = ChunkingConfig['strategy'];
export type RetrievalStrategy = RetrievalConfig['strategy'];
export type UserTier = User['tier'];
export type ProjectStatus = Project['status'];
export type ExportFormat = ExportRequest['format'];
export type MessageRole = ChatMessage['role'];

// Type for partial pipeline configurations during building
export type PartialPipelineConfiguration = Partial<PipelineConfiguration> & {
  id: string;
  name: string;
};

// Type for pipeline configuration updates
export type PipelineConfigurationUpdate = Partial<Omit<PipelineConfiguration, 'id' | 'metadata'>> & {
  metadata?: Partial<ConfigurationMetadata>;
};

// Type for search and filtering
export type SearchFilters = {
  category?: ComponentCategory;
  provider?: string;
  priceRange?: [number, number];
  features?: string[];
  compatibility?: string[];
};

// Type for API responses
export type APIResponse<T> = {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
};

// Type for streaming responses
export type StreamingResponse<T> = {
  type: 'data' | 'error' | 'complete';
  data?: T;
  error?: ErrorResponse;
  metadata?: Record<string, any>;
};