'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DocumentMetadata, ProcessingStep } from '@/types';

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  metadata?: DocumentMetadata;
  processingSteps?: ProcessingStep[];
  error?: string;
}

interface DocumentUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onFileRemove: (fileId: string) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  uploadedFiles: UploadedFile[];
}

const SUPPORTED_FORMATS = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/json': '.json',
  'text/csv': '.csv',
  'text/markdown': '.md',
  'text/html': '.html',
  'text/plain': '.txt'
};

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_MAX_FILES = 10;

export function DocumentUpload({
  onFilesUploaded,
  onFileRemove,
  maxFiles = DEFAULT_MAX_FILES,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedFormats = Object.keys(SUPPORTED_FORMATS),
  uploadedFiles
}: DocumentUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      console.warn('Some files were rejected:', rejectedFiles);
    }

    // Convert accepted files to UploadedFile format
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending' as const,
      metadata: {
        originalName: file.name,
        fileType: file.type || getFileTypeFromExtension(file.name),
        size: file.size,
        uploadedAt: new Date(),
        customFields: {}
      }
    }));

    onFilesUploaded(newFiles);
  }, [onFilesUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => {
      acc[format] = [SUPPORTED_FORMATS[format as keyof typeof SUPPORTED_FORMATS]];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: maxFiles - uploadedFiles.length,
    maxSize,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  });

  const getFileTypeFromExtension = (filename: string): string => {
    const extension = filename.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'json': 'application/json',
      'csv': 'text/csv',
      'md': 'text/markdown',
      'html': 'text/html',
      'txt': 'text/plain'
    };
    return typeMap[extension || ''] || 'application/octet-stream';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="h-4 w-4 text-gray-500" />;
      case 'processing':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canUploadMore = uploadedFiles.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canUploadMore && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive || dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                }
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Drop files here' : 'Upload documents'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Drag and drop files here, or click to select files
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {Object.values(SUPPORTED_FORMATS).map(format => (
                  <Badge key={format} variant="secondary" className="text-xs">
                    {format.toUpperCase()}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                Maximum {maxFiles} files, up to {formatFileSize(maxSize)} each
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">
              Uploaded Documents ({uploadedFiles.length}/{maxFiles})
            </h3>
            <div className="space-y-3">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(uploadedFile.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getStatusColor(uploadedFile.status)}`}
                        >
                          {uploadedFile.status}
                        </Badge>
                      </div>
                      {uploadedFile.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {uploadedFile.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFileRemove(uploadedFile.id)}
                    className="ml-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}