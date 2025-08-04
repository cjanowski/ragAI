"use client";

import React, { useState } from 'react';
import { EmbeddingConfiguration } from '@/components/pipeline';
import { EmbeddingConfig, ChunkingConfig } from '@/types';

export default function EmbeddingDemo() {
  const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig>({
    provider: 'OpenAI',
    model: 'openai-3-small',
    dimensions: 1536,
    maxTokens: 8191,
    batchSize: 32,
    parameters: {}
  });

  const [chunkingConfig] = useState<ChunkingConfig>({
    strategy: 'recursive',
    chunkSize: 1000,
    chunkOverlap: 200,
    preserveStructure: true,
    parameters: {}
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Embedding Model Configuration Demo
          </h1>
          <p className="text-gray-600">
            Test the embedding model selection and configuration interface
          </p>
        </div>

        <EmbeddingConfiguration
          config={embeddingConfig}
          chunkingConfig={chunkingConfig}
          onConfigChange={setEmbeddingConfig}
        />

        {/* Configuration Debug Panel */}
        <div className="mt-8 p-6 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Current Configuration</h3>
          <pre className="text-sm bg-white p-4 rounded border overflow-auto">
            {JSON.stringify(embeddingConfig, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}