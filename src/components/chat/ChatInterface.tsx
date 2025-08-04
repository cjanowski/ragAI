"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage, Document } from '@/types';
import { Send, Bot, User, Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  pipelineId?: string;
  onDocumentUpload?: (documents: Document[]) => void;
  className?: string;
}

export function ChatInterface({ pipelineId, onDocumentUpload, className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pipelineStatus, setPipelineStatus] = useState<'not_ready' | 'ready' | 'error'>(
    pipelineId ? 'ready' : 'not_ready'
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (pipelineId) {
      setPipelineStatus('ready');
      console.log('ChatInterface: Pipeline ID received:', pipelineId);
    } else {
      setPipelineStatus('not_ready');
    }
  }, [pipelineId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !pipelineId) {
      console.log('Cannot upload files:', { files: !!files, pipelineId });
      return;
    }

    console.log('Uploading files to pipeline:', pipelineId);

    const newDocuments: Document[] = [];
    
    for (const file of Array.from(files)) {
      const content = await file.text();
      const document: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        content,
        metadata: {
          originalName: file.name,
          fileType: file.type || 'text/plain',
          size: file.size,
          uploadedAt: new Date(),
          customFields: {}
        }
      };
      newDocuments.push(document);
    }

    setDocuments(prev => [...prev, ...newDocuments]);
    
    // Ingest documents into pipeline
    try {
      const response = await fetch('/api/pipeline/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId,
          documents: newDocuments
        })
      });

      if (response.ok) {
        setPipelineStatus('ready');
        onDocumentUpload?.(newDocuments);
        
        // Add system message
        const systemMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'system',
          content: `Successfully uploaded and processed ${newDocuments.length} document(s). You can now ask questions about the content.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, systemMessage]);
      } else {
        throw new Error('Failed to ingest documents');
      }
    } catch (error) {
      setPipelineStatus('error');
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'system',
        content: `Error uploading documents: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !pipelineId || isLoading) {
      console.log('Cannot send message:', { input: input.trim(), pipelineId, isLoading });
      return;
    }

    console.log('Sending message to pipeline:', pipelineId);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create assistant message placeholder
    const assistantMessageId = `msg-${Date.now()}-assistant`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/pipeline/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipelineId,
          question: input.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to query pipeline');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'chunk') {
                accumulatedContent += data.data;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: accumulatedContent }
                    : msg
                ));
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusIcon = () => {
    switch (pipelineStatus) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (pipelineStatus) {
      case 'ready':
        return `Ready (${documents.length} documents)`;
      case 'error':
        return 'Error - Check configuration';
      default:
        return 'Upload documents to start';
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm border-gray-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              RAG Chat Interface
            </CardTitle>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="text-sm text-gray-600">{getStatusText()}</span>
            </div>
          </div>
          
          {/* Document Upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.pdf,.docx,.json,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={!pipelineId}
              className="bg-white/60 hover:bg-white/80"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
            
            {documents.length > 0 && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                </span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Welcome to RAG Chat
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Upload documents and start asking questions to test your RAG pipeline.
                  </p>
                  {!pipelineId && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Please create and configure a pipeline first
                    </Badge>
                  )}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3 max-w-4xl",
                      message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === 'user' 
                        ? "bg-blue-600 text-white" 
                        : message.role === 'system'
                        ? "bg-gray-500 text-white"
                        : "bg-green-600 text-white"
                    )}>
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "rounded-2xl px-4 py-3 max-w-[80%]",
                      message.role === 'user'
                        ? "bg-blue-600 text-white"
                        : message.role === 'system'
                        ? "bg-gray-100 text-gray-800 border border-gray-200"
                        : "bg-white border border-gray-200 text-gray-800"
                    )}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                        {isLoading && message.role === 'assistant' && message.content === '' && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Thinking...
                          </div>
                        )}
                      </div>
                      
                      {message.metadata && (
                        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                          {message.metadata.processingTime && (
                            <span>Response time: {message.metadata.processingTime}ms</span>
                          )}
                          {message.metadata.tokensUsed && (
                            <span className="ml-4">
                              Tokens: {message.metadata.tokensUsed.total}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  !pipelineId 
                    ? "Create a pipeline first..." 
                    : pipelineStatus !== 'ready'
                    ? "Upload documents to start chatting..."
                    : "Ask a question about your documents..."
                }
                disabled={!pipelineId || pipelineStatus !== 'ready' || isLoading}
                className="flex-1 bg-white/80"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || !pipelineId || pipelineStatus !== 'ready' || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}