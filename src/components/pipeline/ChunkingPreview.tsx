"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ChunkingConfig, EmbeddingConfig, Chunk } from '@/types';
import { chunkText, calculateChunkingStats, ChunkingStats } from '@/lib/chunking';
import { Eye, FileText, Scissors, AlertTriangle, Info, Copy, Download, Brain, Bot, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChunkingPreviewProps {
  config: ChunkingConfig;
  embeddingConfig?: EmbeddingConfig;
  className?: string;
}

const SAMPLE_TEXTS = {
  technical: `# Introduction to Machine Learning

Machine learning is a subset of artificial intelligence (AI) that provides systems the ability to automatically learn and improve from experience without being explicitly programmed. Machine learning focuses on the development of computer programs that can access data and use it to learn for themselves.

## Types of Machine Learning

### Supervised Learning
Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs. It infers a function from labeled training data consisting of a set of training examples.

### Unsupervised Learning
Unsupervised learning is a type of machine learning that looks for previously undetected patterns in a data set with no pre-existing labels and with a minimum of human supervision.

### Reinforcement Learning
Reinforcement learning is an area of machine learning concerned with how intelligent agents ought to take actions in an environment in order to maximize the notion of cumulative reward.`,

  narrative: `The old lighthouse keeper had been watching the horizon for forty-seven years. Every morning, he climbed the spiral staircase to the lamp room, checking the lens, cleaning the windows, and ensuring the beacon would shine bright through the night.

Today felt different. The sea was unusually calm, and a strange mist hung low over the water. As he polished the great lens, he noticed something peculiar in the distance—a ship that seemed to shimmer and fade, as if it existed between two worlds.

He rubbed his eyes and looked again. The ship was still there, but now he could see figures on its deck, waving frantically. They appeared to be calling out, but no sound reached his ears across the water.`,

  legal: `WHEREAS, the parties desire to enter into this Agreement to define and set forth the terms and conditions of their mutual understanding; and

WHEREAS, Company A wishes to engage Company B to provide certain services as described herein; and

WHEREAS, Company B represents that it has the necessary expertise, experience, and resources to perform such services;

NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:

1. SCOPE OF SERVICES
Company B shall provide the following services to Company A:
(a) Technical consulting services related to software development
(b) Code review and quality assurance
(c) Documentation and training materials`
};

// Use the chunking library for all implementations

export function ChunkingPreview({
  config,
  embeddingConfig,
  className
}: ChunkingPreviewProps) {
  const [selectedSample, setSelectedSample] = useState<keyof typeof SAMPLE_TEXTS>('technical');
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);

  const textToChunk = useCustomText ? customText : SAMPLE_TEXTS[selectedSample];
  
  const chunks = useMemo(() => {
    if (!textToChunk.trim()) return [];
    return chunkText(textToChunk, config);
  }, [textToChunk, config]);

  const stats = useMemo(() => {
    if (chunks.length === 0) return null;
    return calculateChunkingStats(chunks);
  }, [chunks]);

  const getChunkColor = (chunk: Chunk, index: number) => {
    const colors = [
      'border-l-blue-400 bg-blue-50/50',
      'border-l-green-400 bg-green-50/50',
      'border-l-purple-400 bg-purple-50/50',
      'border-l-orange-400 bg-orange-50/50',
      'border-l-pink-400 bg-pink-50/50',
      'border-l-indigo-400 bg-indigo-50/50'
    ];
    return colors[index % colors.length];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const exportChunks = () => {
    const exportData = {
      config,
      chunks: chunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        size: chunk.content.length,
        tokens: chunk.metadata.tokens
      })),
      stats
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chunking-preview.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Input Selection */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Text Input
          </CardTitle>
          <p className="text-sm text-gray-600">
            Choose sample text or provide your own to preview chunking results
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              variant={!useCustomText ? "default" : "outline"}
              size="sm"
              onClick={() => setUseCustomText(false)}
            >
              Sample Text
            </Button>
            <Button
              variant={useCustomText ? "default" : "outline"}
              size="sm"
              onClick={() => setUseCustomText(true)}
            >
              Custom Text
            </Button>
          </div>

          {!useCustomText ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(SAMPLE_TEXTS).map(([key, text]) => (
                <Card
                  key={key}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    selectedSample === key 
                      ? "ring-2 ring-blue-500 bg-blue-50/50 border-blue-200" 
                      : "hover:border-gray-300 bg-white/60"
                  )}
                  onClick={() => setSelectedSample(key as keyof typeof SAMPLE_TEXTS)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold capitalize mb-2">{key}</h4>
                    <p className="text-xs text-gray-600 line-clamp-3">
                      {text.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Textarea
              placeholder="Paste your text here to preview chunking..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={8}
              className="bg-white/80"
            />
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-blue-600" />
                Chunking Statistics
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportChunks}
                  className="bg-white/60 hover:bg-white/80"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalChunks}</div>
                <div className="text-sm text-gray-600">Total Chunks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.avgSize}</div>
                <div className="text-sm text-gray-600">Avg Size (chars)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.avgTokens}</div>
                <div className="text-sm text-gray-600">Avg Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.totalTokens}</div>
                <div className="text-sm text-gray-600">Total Tokens</div>
              </div>
            </div>
            
            {/* Enhanced Statistics */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Size Distribution */}
              <div className="bg-white/60 rounded-lg p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Size Distribution
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Small (&lt;500 chars)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(stats.sizeDistribution.small / stats.totalChunks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8">{stats.sizeDistribution.small}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medium (500-1500)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${(stats.sizeDistribution.medium / stats.totalChunks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8">{stats.sizeDistribution.medium}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Large (&gt;1500 chars)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(stats.sizeDistribution.large / stats.totalChunks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8">{stats.sizeDistribution.large}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Token Distribution */}
              <div className="bg-white/60 rounded-lg p-4 border border-purple-100">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Token Distribution
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Small (&lt;125 tokens)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(stats.tokenDistribution.small / stats.totalChunks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8">{stats.tokenDistribution.small}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medium (125-375)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${(stats.tokenDistribution.medium / stats.totalChunks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8">{stats.tokenDistribution.medium}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Large (&gt;375 tokens)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(stats.tokenDistribution.large / stats.totalChunks) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 w-8">{stats.tokenDistribution.large}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Size Range:</span>
                <span className="font-medium">{stats.minSize} - {stats.maxSize} chars</span>
              </div>
              {embeddingConfig && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Model Limit:</span>
                  <span className={cn(
                    "font-medium",
                    stats.avgTokens > embeddingConfig.maxTokens ? "text-red-600" : "text-green-600"
                  )}>
                    {embeddingConfig.maxTokens} tokens
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Warnings */}
      {embeddingConfig && stats && stats.avgTokens > embeddingConfig.maxTokens && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Token Limit Exceeded</h4>
                <p className="text-sm text-red-700">
                  Average chunk size ({stats.avgTokens} tokens) exceeds the embedding model limit 
                  ({embeddingConfig.maxTokens} tokens). Consider reducing chunk size or switching to a model with higher limits.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chunk Preview */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Chunk Preview
          </CardTitle>
          <p className="text-sm text-gray-600">
            Preview how your text will be split into chunks
          </p>
        </CardHeader>
        <CardContent>
          {chunks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No text to chunk. Please select sample text or enter custom text.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chunks.map((chunk, index) => (
                <Card
                  key={chunk.id}
                  className={cn(
                    "border-l-4 transition-all duration-200 hover:shadow-md",
                    getChunkColor(chunk, index)
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-white/80">
                          Chunk {index + 1}
                        </Badge>
                        <div className="text-sm text-gray-600">
                          {chunk.content.length} chars • {chunk.metadata.tokens} tokens
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(chunk.content)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="bg-white/60 rounded-lg p-3 text-sm leading-relaxed">
                      <pre className="whitespace-pre-wrap font-sans">
                        {chunk.content}
                      </pre>
                    </div>
                    
                    {/* Special indicators for different strategies */}
                    {chunk.metadata.customFields?.semanticBoundary && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          <Brain className="h-3 w-3 mr-1" />
                          Semantic Boundary
                        </Badge>
                      </div>
                    )}
                    
                    {chunk.metadata.customFields?.agenticBoundary && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                          <Bot className="h-3 w-3 mr-1" />
                          AI-Optimized Boundary
                        </Badge>
                        {chunk.metadata.customFields?.qualityScore && (
                          <Badge variant="outline" className="bg-white/80">
                            Quality: {(chunk.metadata.customFields.qualityScore * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}