export { DocumentUpload } from './DocumentUpload';
export { CleaningOptionsComponent } from './CleaningOptions';
export { DocumentPreview } from './DocumentPreview';
export { DocumentManager } from './DocumentManager';

// Re-export types for convenience
export type {
  ProcessedDocument,
  ProcessingStep,
  CleaningOptions,
  DocumentMetadata
} from '@/types';

// Re-export processor and storage (server-side only)
// export { DocumentProcessor } from '@/lib/document-processor';
// export { documentStorage, DocumentStorage } from '@/lib/storage';
// export type { ProcessingConfig } from '@/lib/document-processor';
// export type { StorageConfig, StoredDocument } from '@/lib/storage';