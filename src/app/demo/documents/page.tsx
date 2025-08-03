'use client';

import React, { useState } from 'react';
import { DocumentManager } from '@/components/document';
import { ProcessedDocument } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DocumentsDemo() {
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const handleDocumentsChange = (documents: ProcessedDocument[]) => {
    setProcessedDocuments(documents);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Document Upload & Processing Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Test the document upload and processing system. Upload various file types 
            (PDF, DOCX, JSON, CSV, MD, HTML, TXT) and see how they are processed and cleaned.
          </p>
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-sm">
              Session ID: {sessionId}
            </Badge>
          </div>
        </div>

        {/* Document Manager */}
        <DocumentManager
          sessionId={sessionId}
          onDocumentsChange={handleDocumentsChange}
          maxFiles={10}
          maxFileSize={10 * 1024 * 1024} // 10MB
        />

        {/* Summary */}
        {processedDocuments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Processing Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Documents Processed</h4>
                  <p className="text-2xl font-bold text-blue-600">{processedDocuments.length}</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Total Content</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {processedDocuments.reduce((sum, doc) => sum + doc.content.length, 0).toLocaleString()} chars
                  </p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Total Size</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatFileSize(processedDocuments.reduce((sum, doc) => sum + doc.metadata.size, 0))}
                  </p>
                </div>
              </div>

              {/* File Types */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">File Types Processed</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(processedDocuments.map(doc => doc.metadata.fileType))).map(fileType => (
                    <Badge key={fileType} variant="outline">
                      {fileType}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Processing Times */}
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-3">Processing Performance</h4>
                <div className="space-y-2 text-sm">
                  {processedDocuments.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center">
                      <span className="truncate max-w-xs">{doc.originalName}</span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {doc.metadata.customFields.processingDuration}ms
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {doc.content.length.toLocaleString()} chars
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">1. Upload Documents</h4>
                <p className="text-sm text-gray-600">
                  Drag and drop files or click to select. Supports PDF, DOCX, JSON, CSV, 
                  Markdown, HTML, and plain text files up to 10MB each.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">2. Configure Processing</h4>
                <p className="text-sm text-gray-600">
                  Adjust text cleaning options, table extraction settings, and custom 
                  regex rules in the Processing tab.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">3. Preview Results</h4>
                <p className="text-sm text-gray-600">
                  View processed content, metadata, and processing logs in the Preview tab. 
                  Download cleaned text files.
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Supported File Types</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
                <div>📄 PDF (.pdf)</div>
                <div>📝 Word (.docx)</div>
                <div>🔧 JSON (.json)</div>
                <div>📊 CSV (.csv)</div>
                <div>📋 Markdown (.md)</div>
                <div>🌐 HTML (.html)</div>
                <div>📄 Text (.txt)</div>
                <div>✨ More coming soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}