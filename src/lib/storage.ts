import { put, del, list, head } from '@vercel/blob';
import { ProcessedDocument, DocumentMetadata } from '@/types';

export interface StorageConfig {
  token?: string;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export interface StoredDocument {
  id: string;
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  metadata: DocumentMetadata;
  content?: string; // For temporary storage
}

export class DocumentStorage {
  private config: StorageConfig;

  constructor(config: StorageConfig = {}) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      allowedTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/json',
        'text/csv',
        'text/markdown',
        'text/html',
        'text/plain'
      ],
      ...config
    };
  }

  /**
   * Store a processed document temporarily in Vercel Blob
   */
  async storeDocument(
    document: ProcessedDocument,
    sessionId: string,
    expiresIn: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): Promise<StoredDocument> {
    try {
      // Validate file size
      const contentSize = new Blob([document.content]).size;
      if (contentSize > (this.config.maxFileSize || 0)) {
        throw new Error(`Document size (${contentSize} bytes) exceeds maximum allowed size`);
      }

      // Create a unique pathname for the document
      const timestamp = Date.now();
      const pathname = `temp/${sessionId}/${document.id}-${timestamp}.json`;

      // Prepare document data for storage
      const documentData = {
        id: document.id,
        originalName: document.originalName,
        content: document.content,
        metadata: document.metadata,
        processingLog: document.processingLog,
        storedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn).toISOString()
      };

      // Store in Vercel Blob
      const blob = await put(pathname, JSON.stringify(documentData), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json'
      });

      return {
        id: document.id,
        url: blob.url,
        pathname: pathname,
        size: contentSize,
        uploadedAt: new Date(),
        metadata: document.metadata,
        content: document.content
      };

    } catch (error) {
      throw new Error(`Failed to store document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve a stored document from Vercel Blob
   */
  async retrieveDocument(documentId: string, sessionId: string): Promise<ProcessedDocument | null> {
    try {
      // List all documents for the session
      const { blobs } = await list({
        prefix: `temp/${sessionId}/`,
        limit: 100
      });

      // Find the document by ID
      const documentBlob = blobs.find(blob => 
        blob.pathname.includes(documentId)
      );

      if (!documentBlob) {
        return null;
      }

      // Fetch the document content
      const response = await fetch(documentBlob.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch document: ${response.statusText}`);
      }

      const documentData = await response.json();

      // Check if document has expired
      if (documentData.expiresAt && new Date(documentData.expiresAt) < new Date()) {
        // Clean up expired document
        await this.deleteDocument(documentId, sessionId);
        return null;
      }

      return {
        id: documentData.id,
        originalName: documentData.originalName,
        content: documentData.content,
        metadata: {
          ...documentData.metadata,
          uploadedAt: new Date(documentData.metadata.uploadedAt),
          processedAt: documentData.metadata.processedAt ? new Date(documentData.metadata.processedAt) : undefined
        },
        processingLog: documentData.processingLog.map((step: any) => ({
          ...step,
          timestamp: new Date(step.timestamp)
        }))
      };

    } catch (error) {
      throw new Error(`Failed to retrieve document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all documents for a session
   */
  async listDocuments(sessionId: string): Promise<StoredDocument[]> {
    try {
      const { blobs } = await list({
        prefix: `temp/${sessionId}/`,
        limit: 100
      });

      const documents: StoredDocument[] = [];

      for (const blob of blobs) {
        try {
          // Extract document ID from pathname
          const pathParts = blob.pathname.split('/');
          const filename = pathParts[pathParts.length - 1];
          const documentId = filename.split('-')[0];

          // Get document metadata
          const response = await fetch(blob.url);
          if (response.ok) {
            const documentData = await response.json();
            
            // Skip expired documents
            if (documentData.expiresAt && new Date(documentData.expiresAt) < new Date()) {
              continue;
            }

            documents.push({
              id: documentId,
              url: blob.url,
              pathname: blob.pathname,
              size: blob.size,
              uploadedAt: new Date(blob.uploadedAt),
              metadata: {
                ...documentData.metadata,
                uploadedAt: new Date(documentData.metadata.uploadedAt),
                processedAt: documentData.metadata.processedAt ? new Date(documentData.metadata.processedAt) : undefined
              }
            });
          }
        } catch (error) {
          console.warn(`Failed to process blob ${blob.pathname}:`, error);
        }
      }

      return documents;

    } catch (error) {
      throw new Error(`Failed to list documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a stored document
   */
  async deleteDocument(documentId: string, sessionId: string): Promise<boolean> {
    try {
      // List all documents for the session to find the exact pathname
      const { blobs } = await list({
        prefix: `temp/${sessionId}/`,
        limit: 100
      });

      const documentBlob = blobs.find(blob => 
        blob.pathname.includes(documentId)
      );

      if (!documentBlob) {
        return false;
      }

      await del(documentBlob.url);
      return true;

    } catch (error) {
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up expired documents for a session
   */
  async cleanupExpiredDocuments(sessionId: string): Promise<number> {
    try {
      const { blobs } = await list({
        prefix: `temp/${sessionId}/`,
        limit: 100
      });

      let deletedCount = 0;

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          if (response.ok) {
            const documentData = await response.json();
            
            // Check if document has expired
            if (documentData.expiresAt && new Date(documentData.expiresAt) < new Date()) {
              await del(blob.url);
              deletedCount++;
            }
          }
        } catch (error) {
          console.warn(`Failed to check expiration for blob ${blob.pathname}:`, error);
        }
      }

      return deletedCount;

    } catch (error) {
      throw new Error(`Failed to cleanup expired documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get storage usage statistics for a session
   */
  async getStorageStats(sessionId: string): Promise<{
    documentCount: number;
    totalSize: number;
    oldestDocument: Date | null;
    newestDocument: Date | null;
  }> {
    try {
      const documents = await this.listDocuments(sessionId);

      if (documents.length === 0) {
        return {
          documentCount: 0,
          totalSize: 0,
          oldestDocument: null,
          newestDocument: null
        };
      }

      const totalSize = documents.reduce((sum, doc) => sum + doc.size, 0);
      const uploadDates = documents.map(doc => doc.uploadedAt);
      const oldestDocument = new Date(Math.min(...uploadDates.map(d => d.getTime())));
      const newestDocument = new Date(Math.max(...uploadDates.map(d => d.getTime())));

      return {
        documentCount: documents.length,
        totalSize,
        oldestDocument,
        newestDocument
      };

    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store raw file temporarily (before processing)
   */
  async storeRawFile(
    file: File,
    sessionId: string,
    expiresIn: number = 24 * 60 * 60 * 1000 // 24 hours default
  ): Promise<StoredDocument> {
    try {
      // Validate file
      if (file.size > (this.config.maxFileSize || 0)) {
        throw new Error(`File size (${file.size} bytes) exceeds maximum allowed size`);
      }

      if (this.config.allowedTypes && !this.config.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed`);
      }

      // Create pathname
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'bin';
      const pathname = `temp/${sessionId}/raw-${timestamp}.${fileExtension}`;

      // Store file
      const blob = await put(pathname, file, {
        access: 'public',
        addRandomSuffix: false
      });

      return {
        id: `raw-${timestamp}`,
        url: blob.url,
        pathname: pathname,
        size: file.size,
        uploadedAt: new Date(),
        metadata: {
          originalName: file.name,
          fileType: file.type,
          size: file.size,
          uploadedAt: new Date(),
          customFields: {
            expiresAt: new Date(Date.now() + expiresIn).toISOString()
          }
        }
      };

    } catch (error) {
      throw new Error(`Failed to store raw file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Default instance
export const documentStorage = new DocumentStorage();