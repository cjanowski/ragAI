"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChunkingConfig, EmbeddingConfig } from '@/types';
import { AlertTriangle, Info } from 'lucide-react';

interface ChunkingConfigurationProps {
  config: ChunkingConfig;
  embeddingConfig?: EmbeddingConfig;
  onConfigChange: (config: ChunkingConfig) => void;
  className?: string;
}

export function ChunkingConfiguration({
  config,
  embeddingConfig,
  onConfigChange,
  className
}: ChunkingConfigurationProps) {
  const handleChange = (field: keyof ChunkingConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };

  const getTokenEstimate = (chunkSize: number) => {
    return Math.ceil(chunkSize / 4); // Rough token estimation
  };

  const isChunkSizeCompatible = () => {
    if (!embeddingConfig) return true;
    const tokenEstimate = getTokenEstimate(config.chunkSize);
    return tokenEstimate <= embeddingConfig.maxTokens;
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Chunking Configuration</h4>
          <p className="text-sm text-gray-600">
            Configure how your documents will be split into chunks
          </p>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-2">
          <Label htmlFor="strategy">Chunking Strategy</Label>
          <Select value={config.strategy} onValueChange={(value) => handleChange('strategy', value)}>
            <SelectTrigger className="bg-white/80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed-Size Chunking</SelectItem>
              <SelectItem value="recursive">Recursive Chunking</SelectItem>
              <SelectItem value="semantic">Semantic Chunking</SelectItem>
              <SelectItem value="document">Document-Based Chunking</SelectItem>
              <SelectItem value="agentic">Agentic Chunking</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chunk Size */}
        <div className="space-y-2">
          <Label htmlFor="chunkSize">Chunk Size (characters)</Label>
          <Input
            id="chunkSize"
            type="number"
            value={config.chunkSize}
            onChange={(e) => handleChange('chunkSize', Number(e.target.value))}
            min={100}
            max={8000}
            className="bg-white/80"
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            Estimated tokens: ~{getTokenEstimate(config.chunkSize)}
          </div>
        </div>

        {/* Chunk Overlap */}
        <div className="space-y-2">
          <Label htmlFor="chunkOverlap">Chunk Overlap (characters)</Label>
          <Input
            id="chunkOverlap"
            type="number"
            value={config.chunkOverlap}
            onChange={(e) => handleChange('chunkOverlap', Number(e.target.value))}
            min={0}
            max={Math.floor(config.chunkSize * 0.5)}
            className="bg-white/80"
          />
          <div className="text-xs text-gray-500">
            Maximum recommended: {Math.floor(config.chunkSize * 0.5)} (50% of chunk size)
          </div>
        </div>

        {/* Preserve Structure */}
        <div className="flex items-center space-x-2">
          <Switch
            id="preserveStructure"
            checked={config.preserveStructure}
            onCheckedChange={(checked) => handleChange('preserveStructure', checked)}
          />
          <Label htmlFor="preserveStructure">Preserve Document Structure</Label>
        </div>

        {/* Compatibility Warning */}
        {!isChunkSizeCompatible() && embeddingConfig && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Compatibility Warning
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-amber-700">
                Your chunk size (~{getTokenEstimate(config.chunkSize)} tokens) may exceed the 
                embedding model's maximum token limit ({embeddingConfig.maxTokens} tokens). 
                Consider reducing the chunk size to {Math.floor(embeddingConfig.maxTokens * 0.75 * 4)} characters or less.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Strategy-specific options */}
        {config.strategy === 'semantic' && (
          <div className="space-y-2">
            <Label htmlFor="semanticThreshold">Semantic Similarity Threshold</Label>
            <Input
              id="semanticThreshold"
              type="number"
              value={config.semanticThreshold || 0.8}
              onChange={(e) => handleChange('semanticThreshold', Number(e.target.value))}
              min={0.1}
              max={1.0}
              step={0.1}
              className="bg-white/80"
            />
            <div className="text-xs text-gray-500">
              Higher values create more coherent chunks but may result in larger sizes
            </div>
          </div>
        )}

        {/* Validation Messages */}
        {config.chunkOverlap >= config.chunkSize && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4">
              <p className="text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Chunk overlap must be less than chunk size
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}