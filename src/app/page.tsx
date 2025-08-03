"use client";

import { PipelineBuilder } from '@/components/pipeline';
import { PipelineConfiguration } from '@/types';

export default function Home() {
  const handleConfigurationChange = (configuration: Partial<PipelineConfiguration>) => {
    console.log('Configuration changed:', configuration);
  };

  const handleSave = (configuration: PipelineConfiguration) => {
    console.log('Saving configuration:', configuration);
    // Here you would typically save to your backend
  };

  const handleTest = (configuration: PipelineConfiguration) => {
    console.log('Testing pipeline:', configuration);
    // Here you would typically trigger a test run
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            RAG Pipeline Configurator
          </h1>
          <p className="text-lg text-gray-600">
            Build, configure, and test your Retrieval-Augmented Generation pipeline with an intuitive visual interface.
          </p>
        </div>
        
        <PipelineBuilder
          onConfigurationChange={handleConfigurationChange}
          onSave={handleSave}
          onTest={handleTest}
        />
      </div>
    </div>
  );
}