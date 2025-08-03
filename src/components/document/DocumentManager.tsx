'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DocumentUpload } from './DocumentUpload';
import { CleaningOptionsComponent } from './CleaningOptions';
import { DocumentPreview } from './DocumentPreview';
// import { DocumentProcessor, ProcessingConfig } from '@/lib/document-processor'; // Server-side only
import { documentStorage } from '@/lib/storage';
import { CleaningOptions, ProcessedDocument } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Settings, 
  Eye, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
// import { toast } from 'sonner'; // Using simple toast implementation below

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedDocument?: ProcessedDocument;
  error?: string;
}

interface DocumentManagerProps {
  sessionId: string;
  onDocumentsChange?: (documents: ProcessedDocument[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

const DEFAULT_CLEANING_OPTIONS: CleaningOptions = {
  removeWhitespace: true,
  removeSpecialChars: false,
  normalizeUnicode: true,
  extractTables: 'text',
  extractImages: 'ignore',
  customRules: []
};

export function DocumentManager({
  sessionId,
  onDocumentsChange,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024 // 10MB
}: DocumentManagerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [cleaningOptions, setCleaningOptions] = useState<CleaningOptions>(DEFAULT_CLEANING_OPTIONS);
  const [selectedDocument, setSelectedDocument] = useState<ProcessedDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  // const documentProcessor = new DocumentProcessor(); // Server-side only

  // Load existing documents on mount
  useEffect(() => {
    loadExistingDocuments();
  }, [sessionId]);

  // Notify parent component when documents change
  useEffect(() => {
    const completedDocuments = uploadedFiles
      .filter(file => file.status === 'completed' && file.processedDocument)
      .map(file => file.processedDocument!);
    
    onDocumentsChange?.(completedDocuments);
  }, [uploadedFiles, onDocumentsChange]);

  const loadExistingDocuments = async () => {
    try {
      // Call API to get existing documents
      const response = await fetch(`/api/documents/process?sessionId=${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const result = await response.json();
      const storedDocuments = result.documents || [];
      const existingFiles: UploadedFile[] = [];

      for (const storedDoc of storedDocuments) {
        try {
          // Get full document data
          const docResponse = await fetch(`/api/documents/process?sessionId=${sessionId}&documentId=${storedDoc.id}`);
          if (docResponse.ok) {
            const docResult = await docResponse.json();
            const processedDoc = docResult.document;
            
            if (processedDoc) {
              // Create a mock File object for display purposes
              const mockFile = new File([''], storedDoc.metadata.originalName, {
                type: storedDoc.metadata.fileType
              });

              existingFiles.push({
                file: mockFile,
                id: storedDoc.id,
                status: 'completed',
                processedDocument: processedDoc
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to load document ${storedDoc.id}:`, error);
        }
      }

      setUploadedFiles(existingFiles);
    } catch (error) {
      console.error('Failed to load existing documents:', error);
      toast.error('Failed to load existing documents');
    }
  };

  const handleFilesUploaded = useCallback((newFiles: UploadedFile[]) => {
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Auto-process files if cleaning options are set
    newFiles.forEach(file => {
      processFile(file.id);
    });
  }, []);

  const processFile = async (fileId: string) => {
    const fileIndex = uploadedFiles.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return;

    // Update status to processing
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing' } : f
    ));

    try {
      const file = uploadedFiles[fileIndex].file;
      
      // Create form data for API call
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sessionId', sessionId);
      formData.append('cleaningOptions', JSON.stringify(cleaningOptions));

      // Call API to process document
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Processing failed');
      }

      const result = await response.json();
      
      // Fetch the full processed document
      const docResponse = await fetch(`/api/documents/process?sessionId=${sessionId}&documentId=${result.document.id}`);
      if (!docResponse.ok) {
        throw new Error('Failed to retrieve processed document');
      }
      
      const docResult = await docResponse.json();
      const processedDocument = docResult.document;

      // Update file status
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'completed', processedDocument, error: undefined }
          : f
      ));

      toast.success(`Successfully processed ${file.name}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      // Update file status with error
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      toast.error(`Failed to process file: ${errorMessage}`);
    }
  };

  const handleFileRemove = useCallback(async (fileId: string) => {
    try {
      // Call API to remove document
      const response = await fetch(`/api/documents/process?sessionId=${sessionId}&documentId=${fileId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      // Remove from state
      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      
      // Clear selected document if it was the removed one
      if (selectedDocument?.id === fileId) {
        setSelectedDocument(null);
      }

      toast.success('Document removed');
    } catch (error) {
      console.error('Failed to remove document:', error);
      toast.error('Failed to remove document');
    }
  }, [sessionId, selectedDocument]);

  const handleReprocessFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;

    // Reset status and reprocess
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending', processedDocument: undefined, error: undefined }
        : f
    ));

    await processFile(fileId);
  };

  const handleReprocessAll = async () => {
    setIsProcessing(true);
    
    const filesToReprocess = uploadedFiles.filter(f => 
      f.status === 'error' || f.status === 'completed'
    );

    for (const file of filesToReprocess) {
      await handleReprocessFile(file.id);
    }

    setIsProcessing(false);
    toast.success('All documents reprocessed');
  };

  const handleDocumentSelect = (document: ProcessedDocument) => {
    setSelectedDocument(document);
    setActiveTab('preview');
  };

  const handleCleaningOptionsChange = (newOptions: CleaningOptions) => {
    setCleaningOptions(newOptions);
    
    // Show toast suggesting reprocessing if there are completed documents
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    if (completedFiles.length > 0) {
      toast.info('Cleaning options updated. Consider reprocessing documents to apply changes.');
    }
  };

  const getStatusStats = () => {
    const stats = uploadedFiles.reduce((acc, file) => {
      acc[file.status] = (acc[file.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: uploadedFiles.length,
      pending: stats.pending || 0,
      processing: stats.processing || 0,
      completed: stats.completed || 0,
      error: stats.error || 0
    };
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Management
            </CardTitle>
            <div className="flex items-center gap-2">
              {stats.total > 0 && (
                <>
                  <Badge variant="secondary">{stats.total} total</Badge>
                  {stats.completed > 0 && (
                    <Badge variant="default">{stats.completed} ready</Badge>
                  )}
                  {stats.processing > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {stats.processing} processing
                    </Badge>
                  )}
                  {stats.error > 0 && (
                    <Badge variant="destructive">{stats.error} failed</Badge>
                  )}
                </>
              )}
              {stats.total > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReprocessAll}
                  disabled={isProcessing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  Reprocess All
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Processing
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <DocumentUpload
            onFilesUploaded={handleFilesUploaded}
            onFileRemove={handleFileRemove}
            maxFiles={maxFiles}
            maxSize={maxFileSize}
            uploadedFiles={uploadedFiles}
          />

          {/* Document List */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Document Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-3">
                        {file.status === 'pending' && <Clock className="h-4 w-4 text-gray-500" />}
                        {file.status === 'processing' && (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                        )}
                        {file.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {file.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        
                        <div>
                          <p className="font-medium text-sm">{file.file.name}</p>
                          {file.error && (
                            <p className="text-xs text-red-600">{file.error}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {file.status === 'completed' && file.processedDocument && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDocumentSelect(file.processedDocument!)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        {(file.status === 'error' || file.status === 'completed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReprocessFile(file.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Retry
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(file.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <CleaningOptionsComponent
            options={cleaningOptions}
            onChange={handleCleaningOptionsChange}
            previewText={selectedDocument?.content}
            showPreview={!!selectedDocument}
          />
        </TabsContent>

        <TabsContent value="preview">
          {selectedDocument ? (
            <DocumentPreview
              document={selectedDocument}
              onDownload={() => {
                // Create download link
                const blob = new Blob([selectedDocument.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedDocument.originalName}_processed.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Document Selected</h3>
                <p className="text-gray-500">
                  Upload and process a document, then click "View" to see the preview here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Toast notification system (simple implementation)
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.error('❌', message),
  info: (message: string) => console.info('ℹ️', message)
};