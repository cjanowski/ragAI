"use client";

import React, { useState } from 'react';
import { ChunkingConfiguration } from '@/components/pipeline';
import { ChunkingConfig, EmbeddingConfig } from '@/types';

export default function ChunkingDemo() {
  const [chunkingConfig, setChunkingConfig] = useState<ChunkingConfig>({
    strategy: 'recursive',
    chunkSize: 1000,
    chunkOverlap: 200,
    preserveStructure: true,
    parameters: {}
  });

  const [embeddingConfig] = useState<EmbeddingConfig>({
    provider: 'openai',
    model: 'text-embedding-ada-002',
    dimensions: 1536,
    maxTokens: 8191,
    batchSize: 100,
    parameters: {}
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Chunking Strategy Configuration Demo
          </h1>
          <p className="text-gray-600">
            Test and configure different chunking strategies for your RAG pipeline
          </p>
        </div>

        <ChunkingConfiguration
          config={chunkingConfig}
          embeddingConfig={embeddingConfig}
          onConfigChange={setChunkingConfig}
        />
      </div>
    </div>
  );
}