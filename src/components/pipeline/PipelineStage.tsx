"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComponentSelector } from './ComponentSelector';
import { ConfigurationForm } from './ConfigurationForm';
import { CostEstimation } from './CostEstimation';
import { EmbeddingConfiguration } from './EmbeddingConfiguration';
import { ChunkingConfiguration } from './ChunkingConfiguration';
import { PipelineStage as PipelineStageType, ComponentOption, ValidationResult, EmbeddingConfig, ChunkingConfig } from '@/types';
import { Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper functions to convert between component options and config objects
function convertComponentToEmbeddingConfig(component: ComponentOption): EmbeddingConfig {
  const apiKeyParam = component.parameters.find(p => p.name === 'apiKey');
  const maxTokensParam = component.parameters.find(p => p.name === 'maxTokens');
  const batchSizeParam = component.parameters.find(p => p.name === 'batchSize');
  const dimensionsParam = component.parameters.find(p => p.name === 'dimensions');
  
  return {
    provider: component.id.includes('openai') ? 'OpenAI' : 
              component.id.includes('cohere') ? 'Cohere' :
              component.id.includes('voyage') ? 'Voyage AI' : 'Self-Hosted',
    model: component.id,
    dimensions: dimensionsParam ? parseInt(dimensionsParam.defaultValue) : 1536,
    maxTokens: maxTokensParam?.defaultValue || 8191,
    batchSize: batchSizeParam?.defaultValue || 32,
    apiKey: apiKeyParam?.defaultValue || '',
    parameters: component.parameters.reduce((acc, param) => {
      acc[param.name] = param.defaultValue;
      return acc;
    }, {} as Record<string, any>)
  };
}

function convertComponentToChunkingConfig(component: ComponentOption): ChunkingConfig {
  const chunkSizeParam = component.parameters.find(p => p.name === 'chunkSize');
  const chunkOverlapParam = component.parameters.find(p => p.name === 'chunkOverlap');
  const preserveStructureParam = component.parameters.find(p => p.name === 'preserveStructure');
  
  return {
    strategy: component.id.includes('fixed') ? 'fixed' :
              component.id.includes('recursive') ? 'recursive' :
              component.id.includes('semantic') ? 'semantic' :
              component.id.includes('document') ? 'document' :
              component.id.includes('agentic') ? 'agentic' : 'recursive',
    chunkSize: chunkSizeParam?.defaultValue || 1000,
    chunkOverlap: chunkOverlapParam?.defaultValue || 200,
    preserveStructure: preserveStructureParam?.defaultValue || true,
    parameters: component.parameters.reduce((acc, param) => {
      acc[param.name] = param.defaultValue;
      return acc;
    }, {} as Record<string, any>)
  };
}

function getChunkingConfigFromStages(stages?: PipelineStageType[]): ChunkingConfig | undefined {
  if (!stages) return undefined;
  const chunkingStage = stages.find(s => s.id === 'chunking');
  if (!chunkingStage?.component) return undefined;
  return convertComponentToChunkingConfig(chunkingStage.component);
}

function getEmbeddingConfigFromStages(stages?: PipelineStageType[]): EmbeddingConfig | undefined {
  if (!stages) return undefined;
  const embeddingStage = stages.find(s => s.id === 'embedding');
  if (!embeddingStage?.component) return undefined;
  return convertComponentToEmbeddingConfig(embeddingStage.component);
}

interface PipelineStageProps {
  stage: PipelineStageType;
  onComponentSelect: (stageId: string, component: ComponentOption) => void;
  onParameterChange: (stageId: string, parameter: string, value: any) => void;
  onRemoveComponent: (stageId: string) => void;
  isConfiguring: boolean;
  onToggleConfiguration: (stageId: string) => void;
  onConfigChange?: (stageId: string, config: any) => void;
  allStages?: PipelineStageType[];
  className?: string;
}

export function PipelineStage({
  stage,
  onComponentSelect,
  onParameterChange,
  onRemoveComponent,
  isConfiguring,
  onToggleConfiguration,
  onConfigChange,
  allStages,
  className
}: PipelineStageProps) {
  // Temporarily disable drag and drop to focus on core functionality
  const isDragging = false;
  const isOver = false;
  const style = undefined;

  const getValidationIcon = (validation: ValidationResult) => {
    if (!validation.isValid && validation.errors.length > 0) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (validation.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (stage.component) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getValidationMessages = (validation: ValidationResult) => {
    const messages = [...validation.errors, ...validation.warnings];
    return messages.length > 0 ? messages : null;
  };

  return (
    <div
      className={cn(
        "relative transition-all duration-200",
        isDragging && "opacity-50 scale-105 z-50",
        isOver && "ring-2 ring-blue-500 ring-opacity-50",
        className
      )}
    >
      <Card className={cn(
        "w-full min-h-[280px] transition-all duration-300 hover:shadow-lg group relative overflow-hidden",
        stage.component 
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm" 
          : "border-dashed border-gray-300 bg-white hover:border-gray-400",
        isOver && "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md scale-[1.02]",
        !stage.validation.isValid && stage.component && "border-red-200 bg-gradient-to-br from-red-50 to-pink-50"
      )}>
        <CardHeader className="pb-4 relative">
          {/* Stage number indicator */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg">
            {['ingestion', 'chunking', 'embedding', 'vectorstore', 'retrieval', 'generation'].indexOf(stage.id) + 1}
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-900 mb-1">
                {stage.name}
                {getValidationIcon(stage.validation)}
              </CardTitle>
              <p className="text-sm text-gray-500 font-medium">
                {stage.id === 'ingestion' && 'Load and preprocess documents'}
                {stage.id === 'chunking' && 'Split text into manageable pieces'}
                {stage.id === 'embedding' && 'Convert text to vectors'}
                {stage.id === 'vectorstore' && 'Store and index embeddings'}
                {stage.id === 'retrieval' && 'Find relevant context'}
                {stage.id === 'generation' && 'Generate AI responses'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {stage.component && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Settings button clicked for stage:', stage.id);
                    onToggleConfiguration(stage.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="h-9 w-9 p-0 hover:bg-white/80 transition-colors z-10 relative"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Validation Messages */}
          {getValidationMessages(stage.validation) && (
            <div className="space-y-1">
              {stage.validation.errors.map((error, index) => (
                <div key={index} className="text-sm text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {error}
                </div>
              ))}
              {stage.validation.warnings.map((warning, index) => (
                <div key={index} className="text-sm text-yellow-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {warning}
                </div>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {!stage.component ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-dashed border-gray-400 rounded-lg"></div>
              </div>
              <div className="text-gray-600 mb-6 font-medium">
                Choose a component to get started
              </div>
              <ComponentSelector
                category={stage.id as any}
                onSelect={(component) => onComponentSelect(stage.id, component)}
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected Component Info */}
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="secondary" className="bg-white/80 text-gray-700 font-semibold px-3 py-1">
                        {stage.component.name}
                      </Badge>
                      <CostEstimation cost={stage.component.tradeoffs.cost} />
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {stage.component.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Remove button clicked for stage:', stage.id);
                      onRemoveComponent(stage.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50/80 transition-colors z-10 relative"
                  >
                    Remove
                  </Button>
                </div>
              </div>

              {/* Configuration Form */}
              {isConfiguring && (
                <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                  {stage.id === 'embedding' ? (
                    <EmbeddingConfiguration
                      config={convertComponentToEmbeddingConfig(stage.component)}
                      chunkingConfig={getChunkingConfigFromStages(allStages)}
                      onConfigChange={(config) => onConfigChange?.(stage.id, config)}
                    />
                  ) : stage.id === 'chunking' ? (
                    <ChunkingConfiguration
                      config={convertComponentToChunkingConfig(stage.component)}
                      embeddingConfig={getEmbeddingConfigFromStages(allStages)}
                      onConfigChange={(config) => onConfigChange?.(stage.id, config)}
                    />
                  ) : (
                    <ConfigurationForm
                      component={stage.component}
                      onParameterChange={(parameter, value) => 
                        onParameterChange(stage.id, parameter, value)
                      }
                    />
                  )}
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50/80 rounded-lg p-3 border border-emerald-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="font-semibold text-emerald-700 text-sm">Advantages</span>
                  </div>
                  <ul className="space-y-1">
                    {stage.component.tradeoffs.pros.slice(0, 2).map((pro, index) => (
                      <li key={index} className="text-xs text-emerald-600 leading-relaxed">{pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50/80 rounded-lg p-3 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="font-semibold text-amber-700 text-sm">Considerations</span>
                  </div>
                  <ul className="space-y-1">
                    {stage.component.tradeoffs.cons.slice(0, 2).map((con, index) => (
                      <li key={index} className="text-xs text-amber-600 leading-relaxed">{con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}