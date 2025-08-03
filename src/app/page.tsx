"use client";

import { PipelineBuilder } from '@/components/pipeline';
import { PipelineConfiguration } from '@/types';
import { Sparkles, Zap, Shield } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RAG Pipeline Studio</h1>
                <p className="text-sm text-gray-500">Visual pipeline configuration</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Real-time validation</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Production ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Build Your RAG Pipeline
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Design, configure, and optimize your Retrieval-Augmented Generation pipeline with our 
              intuitive visual interface. Get real-time cost estimates and validation feedback.
            </p>
          </div>
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