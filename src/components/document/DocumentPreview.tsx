'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedDocument, ProcessingStep } from '@/types';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Info,
  ChevronDown,
  ChevronRight,
  Eye,
  Download
} from 'lucide-react';

interface DocumentPreviewProps {
  document: ProcessedDocument;
  onDownload?: () => void;
  maxPreviewLength?: number;
}

export function DocumentPreview({ 
  document, 
  onDownload,
  maxPreviewLength = 2000 
}: DocumentPreviewProps) {
  const [showFullContent, setShowFullContent] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const previewContent = showFullContent 
    ? document.content 
    : document.content.substring(0, maxPreviewLength);

  const isContentTruncated = document.content.length > maxPreviewLength;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle className="text-lg">{document.originalName}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Processed on {document.metadata.processedAt?.toLocaleString()}
                </p>
              </div>
            </div>
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Content Preview</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="processing">Processing Log</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge variant="secondary">
                    {formatFileSize(document.metadata.size)}
                  </Badge>
                  <Badge variant="secondary">
                    {document.content.length.toLocaleString()} characters
                  </Badge>
                  <Badge variant="secondary">
                    {document.metadata.fileType}
                  </Badge>
                </div>
                {isContentTruncated && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFullContent(!showFullContent)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showFullContent ? 'Show Less' : 'Show Full Content'}
                  </Button>
                )}
              </div>

              <div className="border rounded-lg p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap text-sm font-mono max-h-96 overflow-y-auto">
                  {previewContent}
                  {isContentTruncated && !showFullContent && (
                    <span className="text-gray-500 italic">
                      \n\n... ({(document.content.length - maxPreviewLength).toLocaleString()} more characters)
                    </span>
                  )}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">File Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Original Name:</span>
                      <span className="font-mono">{document.metadata.originalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">File Type:</span>
                      <span className="font-mono">{document.metadata.fileType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Size:</span>
                      <span className="font-mono">{formatFileSize(document.metadata.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Uploaded:</span>
                      <span className="font-mono">{document.metadata.uploadedAt.toLocaleString()}</span>
                    </div>
                    {document.metadata.processedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Processed:</span>
                        <span className="font-mono">{document.metadata.processedAt.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Content Information</h4>
                  <div className="space-y-2 text-sm">
                    {document.metadata.title && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Title:</span>
                        <span className="font-mono truncate max-w-48">{document.metadata.title}</span>
                      </div>
                    )}
                    {document.metadata.author && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Author:</span>
                        <span className="font-mono">{document.metadata.author}</span>
                      </div>
                    )}
                    {document.metadata.language && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Language:</span>
                        <span className="font-mono">{document.metadata.language}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Content Length:</span>
                      <span className="font-mono">{document.content.length.toLocaleString()} chars</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Fields */}
              {Object.keys(document.metadata.customFields).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(document.metadata.customFields).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span>
                        <span className="font-mono truncate max-w-48">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="processing" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Processing Steps</h4>
                <div className="space-y-2">
                  {document.processingLog.map((step, index) => (
                    <div key={index} className="border rounded-lg">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleStep(index)}
                      >
                        <div className="flex items-center space-x-3">
                          {getStepIcon(step.status)}
                          <div>
                            <span className="font-medium text-sm">{step.step}</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                variant={step.status === 'success' ? 'default' : 
                                        step.status === 'warning' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {step.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {formatDuration(step.duration)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {expandedSteps.has(index) ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>

                      {expandedSteps.has(index) && (
                        <div className="px-3 pb-3 border-t bg-gray-50">
                          <div className="pt-3 space-y-2">
                            <p className="text-sm text-gray-700">{step.message}</p>
                            <div className="text-xs text-gray-500">
                              {step.timestamp.toLocaleString()}
                            </div>
                            {step.details && (
                              <div className="mt-2">
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                    Show Details
                                  </summary>
                                  <pre className="mt-2 p-2 bg-white rounded border font-mono text-xs overflow-x-auto">
                                    {JSON.stringify(step.details, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

