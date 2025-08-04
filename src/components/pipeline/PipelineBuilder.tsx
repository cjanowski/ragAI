"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineStage } from './PipelineStage';
import { PipelineVisualization } from './PipelineVisualization';
import { CostEstimation } from './CostEstimation';
import { PipelineStage as PipelineStageType, ComponentOption, ValidationResult, PipelineConfiguration } from '@/types';
import { PIPELINE_STAGES, getComponentsByCategory } from '@/lib/mock-data';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ApiKeySettings } from '@/components/settings/ApiKeySettings';
import { Save, Play, AlertTriangle, CheckCircle, Settings, Eye, DollarSign, MessageSquare, Key } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineBuilderProps {
  initialConfiguration?: Partial<PipelineConfiguration>;
  onConfigurationChange?: (configuration: Partial<PipelineConfiguration>) => void;
  onSave?: (configuration: PipelineConfiguration) => void;
  onTest?: (configuration: PipelineConfiguration) => void;
  className?: string;
}

export function PipelineBuilder({
  initialConfiguration,
  onConfigurationChange,
  onSave,
  onTest,
  className
}: PipelineBuilderProps) {
  // Initialize pipeline stages
  const [stages, setStages] = useState<PipelineStageType[]>(() => {
    return PIPELINE_STAGES.map(stageTemplate => ({
      id: stageTemplate.id,
      name: stageTemplate.name,
      component: null,
      dependencies: [],
      validation: {
        isValid: false,
        errors: ['No component selected'],
        warnings: []
      }
    }));
  });

  const [configuringStage, setConfiguringStage] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [isCreatingPipeline, setIsCreatingPipeline] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');

  // Validation logic
  const validateStage = useCallback((stage: PipelineStageType): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!stage.component) {
      errors.push('No component selected');
      return { isValid: false, errors, warnings };
    }

    // Validate required parameters
    stage.component.parameters.forEach(param => {
      if (param.required && param.name === 'apiKey' && (!param.defaultValue || param.defaultValue === '')) {
        // Only flag API key as error if it's required and empty
        if (stage.component?.id.includes('openai') || 
            stage.component?.id.includes('cohere') || 
            stage.component?.id.includes('voyage') ||
            stage.component?.id.includes('gemini')) {
          warnings.push(`${param.name} is required for this component`);
        }
      }
    });

    // Component-specific validations
    if (stage.id === 'chunking' && stage.component) {
      const chunkSizeParam = stage.component.parameters.find(p => p.name === 'chunkSize');
      const overlapParam = stage.component.parameters.find(p => p.name === 'chunkOverlap');
      
      if (chunkSizeParam && overlapParam) {
        const chunkSize = chunkSizeParam.defaultValue || 1000;
        const overlap = overlapParam.defaultValue || 200;
        
        if (overlap >= chunkSize) {
          errors.push('Chunk overlap must be less than chunk size');
        }
        
        if (chunkSize > 8000) {
          warnings.push('Large chunk size may exceed model context limits');
        }
      }
    }

    // Cross-stage validations
    if (stage.id === 'embedding') {
      const chunkingStage = stages.find(s => s.id === 'chunking');
      if (chunkingStage?.component && stage.component) {
        // Check if chunk size is compatible with embedding model
        const maxTokens = stage.component.parameters.find(p => p.name === 'maxTokens')?.defaultValue || 8192;
        const chunkSize = chunkingStage.component.parameters.find(p => p.name === 'chunkSize')?.defaultValue || 1000;
        
        if (chunkSize > maxTokens * 0.75) { // Rough token estimation
          warnings.push('Chunk size may be too large for selected embedding model');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [stages]);

  // Update stage validation when stages change
  const updateStageValidation = useCallback((stageId: string) => {
    setStages(prevStages => 
      prevStages.map(stage => 
        stage.id === stageId 
          ? { ...stage, validation: validateStage(stage) }
          : stage
      )
    );
  }, [validateStage]);

  // Calculate total estimated cost
  const totalCost = useMemo(() => {
    return stages.reduce((total, stage) => {
      if (stage.component) {
        const monthlyCost = stage.component.tradeoffs.cost.monthly + 
          (stage.component.tradeoffs.cost.perOperation * 1000); // Estimate 1000 operations
        return total + monthlyCost;
      }
      return total;
    }, 0);
  }, [stages]);

  // Handle component selection
  const handleComponentSelect = useCallback((stageId: string, component: ComponentOption) => {
    console.log('PipelineBuilder: handleComponentSelect called', { stageId, component }); // Debug log
    setStages(prevStages => {
      const newStages = prevStages.map(stage => 
        stage.id === stageId 
          ? { ...stage, component }
          : stage
      );
      
      console.log('PipelineBuilder: Updated stages', newStages); // Debug log
      
      // Update validation for the changed stage and dependent stages
      setTimeout(() => {
        updateStageValidation(stageId);
        // Update dependent stages
        newStages.forEach(stage => {
          if (stage.dependencies.includes(stageId)) {
            updateStageValidation(stage.id);
          }
        });
      }, 0);
      
      return newStages;
    });
  }, [updateStageValidation]);

  // Auto-select default components for easier setup
  const selectDefaultComponents = useCallback(() => {
    const defaultSelections = [
      { stageId: 'ingestion', componentId: 'text-loader' },
      { stageId: 'chunking', componentId: 'recursive-chunking' },
      { stageId: 'embedding', componentId: 'gemini-text-embedding-004' },
      { stageId: 'vectorstore', componentId: 'chroma' },
      { stageId: 'retrieval', componentId: 'vector-search' },
      { stageId: 'generation', componentId: 'gemini-1.5-flash' }
    ];

    defaultSelections.forEach(({ stageId, componentId }) => {
      const component = getComponentsByCategory(stageId as any).find(c => c.id === componentId);
      if (component) {
        handleComponentSelect(stageId, component);
      }
    });
  }, [handleComponentSelect]);

  // Handle parameter changes
  const handleParameterChange = useCallback((stageId: string, parameter: string, value: any) => {
    setStages(prevStages => {
      const newStages = prevStages.map(stage => {
        if (stage.id === stageId && stage.component) {
          const updatedComponent = {
            ...stage.component,
            parameters: stage.component.parameters.map(param =>
              param.name === parameter 
                ? { ...param, defaultValue: value }
                : param
            )
          };
          return { ...stage, component: updatedComponent };
        }
        return stage;
      });
      
      // Update validation
      setTimeout(() => updateStageValidation(stageId), 0);
      
      return newStages;
    });
  }, [updateStageValidation]);

  // Handle configuration changes from specialized components
  const handleConfigChange = useCallback((stageId: string, config: any) => {
    // This would update the stage configuration based on the specialized component
    // For now, we'll just trigger a parameter change for the main parameters
    if (stageId === 'embedding') {
      handleParameterChange(stageId, 'model', config.model);
      handleParameterChange(stageId, 'dimensions', config.dimensions);
      handleParameterChange(stageId, 'batchSize', config.batchSize);
      if (config.apiKey) {
        handleParameterChange(stageId, 'apiKey', config.apiKey);
      }
    } else if (stageId === 'chunking') {
      handleParameterChange(stageId, 'chunkSize', config.chunkSize);
      handleParameterChange(stageId, 'chunkOverlap', config.chunkOverlap);
      handleParameterChange(stageId, 'strategy', config.strategy);
    }
  }, [handleParameterChange]);

  // Handle component removal
  const handleRemoveComponent = useCallback((stageId: string) => {
    console.log('PipelineBuilder: handleRemoveComponent called for stage:', stageId);
    setStages(prevStages => {
      const newStages = prevStages.map(stage => 
        stage.id === stageId 
          ? { 
              ...stage, 
              component: null,
              validation: {
                isValid: false,
                errors: ['No component selected'],
                warnings: []
              }
            }
          : stage
      );
      console.log('PipelineBuilder: Updated stages after removal:', newStages);
      return newStages;
    });
  }, []);

  // Handle configuration toggle
  const handleToggleConfiguration = useCallback((stageId: string) => {
    setConfiguringStage(prev => prev === stageId ? null : stageId);
  }, []);



  // Generate pipeline configuration
  const generateConfiguration = useCallback((): Partial<PipelineConfiguration> => {
    const config: Partial<PipelineConfiguration> = {
      id: `pipeline-${Date.now()}`,
      name: 'Custom RAG Pipeline',
      version: '1.0.0',
      stages: {} as any,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        description: 'Custom RAG pipeline configuration',
        tags: ['custom', 'rag'],
        estimatedCost: {
          setup: 0,
          perOperation: 0,
          monthly: totalCost,
          currency: 'USD'
        }
      },
      validation: {
        isValid: stages.every(stage => stage.validation.isValid),
        errors: stages.flatMap(stage => 
          stage.validation.errors.map(error => ({
            stage: stage.id,
            component: stage.component?.id,
            message: error,
            severity: 'error' as const
          }))
        ),
        warnings: stages.flatMap(stage => 
          stage.validation.warnings.map(warning => ({
            stage: stage.id,
            component: stage.component?.id,
            message: warning,
            suggestion: 'Consider adjusting component parameters'
          }))
        )
      }
    };

    // Map stages to proper configuration format
    const stageConfigs: any = {};
    
    stages.forEach(stage => {
      if (stage.component) {
        const parameters = stage.component.parameters.reduce((acc, param) => {
          acc[param.name] = param.defaultValue;
          return acc;
        }, {} as Record<string, any>);
        
        switch (stage.id) {
          case 'ingestion':
            stageConfigs.ingestion = {
              loaderType: stage.component.id,
              cleaningOptions: {
                removeWhitespace: true,
                removeSpecialChars: false,
                normalizeUnicode: true,
                extractTables: parameters.extractTables || 'text',
                extractImages: parameters.extractImages || 'ignore',
                customRules: []
              },
              supportedFormats: ['pdf', 'txt', 'docx', 'md', 'html'],
              parameters
            };
            break;
            
          case 'chunking':
            stageConfigs.chunking = {
              strategy: stage.component.id.includes('fixed') ? 'fixed' :
                       stage.component.id.includes('recursive') ? 'recursive' :
                       stage.component.id.includes('semantic') ? 'semantic' :
                       stage.component.id.includes('document') ? 'document' :
                       stage.component.id.includes('agentic') ? 'agentic' : 'recursive',
              chunkSize: parameters.chunkSize || 1000,
              chunkOverlap: parameters.chunkOverlap || 200,
              separators: parameters.separators || ['\n\n', '\n', '. ', ' '],
              semanticThreshold: parameters.threshold || 0.8,
              preserveStructure: parameters.preserveStructure !== false,
              parameters
            };
            break;
            
          case 'embedding':
            stageConfigs.embedding = {
              provider: stage.component.id.includes('openai') ? 'OpenAI' :
                       stage.component.id.includes('cohere') ? 'Cohere' :
                       stage.component.id.includes('voyage') ? 'Voyage AI' :
                       stage.component.id.includes('gemini') ? 'Google' : 'Self-Hosted',
              model: stage.component.id,
              dimensions: parameters.dimensions || 1536,
              maxTokens: parameters.maxTokens || 8191,
              batchSize: parameters.batchSize || 32,
              apiKey: parameters.apiKey || apiKey, // Use component API key or global API key
              parameters
            };
            break;
            
          case 'vectorstore':
            stageConfigs.vectorStore = {
              provider: stage.component.id,
              indexName: parameters.indexName || 'rag-index',
              connectionParams: {
                apiKey: parameters.apiKey || '',
                environment: parameters.environment || '',
                host: parameters.host || 'localhost',
                port: parameters.port || 8000,
                persistDirectory: parameters.persistDirectory || './chroma_db'
              },
              features: ['similarity_search', 'metadata_filtering'],
              scalingConfig: {
                replicas: 1,
                shards: 1,
                autoScale: false
              }
            };
            break;
            
          case 'retrieval':
            stageConfigs.retrieval = {
              strategy: stage.component.id.includes('hybrid') ? 'hybrid' :
                       stage.component.id.includes('rerank') ? 'rerank' : 'vector',
              topK: parameters.topK || 5,
              rerankModel: parameters.rerankModel,
              rerankTopN: parameters.rerankTopN,
              hybridAlpha: parameters.alpha || 0.5,
              filters: {},
              parameters
            };
            break;
            
          case 'generation':
            stageConfigs.generation = {
              provider: stage.component.id.includes('gemini') ? 'Google' :
                       stage.component.id.includes('openai') ? 'OpenAI' :
                       stage.component.id.includes('anthropic') ? 'Anthropic' : 'Google',
              model: stage.component.id,
              temperature: parameters.temperature || 0.1,
              maxTokens: parameters.maxTokens || 1000,
              systemPrompt: parameters.systemPrompt || 'You are a helpful AI assistant.',
              outputFormat: 'text',
              jsonSchema: undefined,
              apiKey: parameters.apiKey || apiKey, // Use component API key or global API key
              parameters
            };
            break;
        }
      }
    });
    
    config.stages = stageConfigs;
    console.log('Generated configuration:', config);
    return config;
  }, [stages, totalCost]);

  // Handle save
  const handleSave = async (): Promise<boolean> => {
    const config = generateConfiguration();
    if (!config.validation?.isValid) {
      console.error('Configuration validation failed:', config.validation?.errors);
      alert('Please fix all validation errors before saving the pipeline.');
      return false;
    }

    if (!apiKey) {
      alert('Please set your Gemini API key in the API Settings before creating a pipeline.');
      setShowApiSettings(true);
      return false;
    }

    setIsCreatingPipeline(true);
    try {
      console.log('Creating pipeline with config:', config);
      
      const response = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configuration: config, apiKey })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Pipeline created successfully:', result);
        setCurrentPipelineId(result.data.pipelineId);
        onSave?.(config as PipelineConfiguration);
        return true;
      } else {
        const error = await response.json();
        console.error('Failed to create pipeline:', error);
        alert(`Failed to create pipeline: ${error.error || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      console.error('Pipeline creation error:', error);
      alert(`Pipeline creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsCreatingPipeline(false);
    }
  };

  // Handle test
  const handleTest = async () => {
    try {
      const config = generateConfiguration();
      
      if (!config.validation?.isValid) {
        alert('Please fix all validation errors before testing the pipeline.');
        return;
      }

      // If no pipeline exists, create one first
      if (!currentPipelineId) {
        console.log('No pipeline ID, creating pipeline first...');
        const success = await handleSave();
        
        if (!success) {
          console.log('Failed to create pipeline, cannot test');
          return;
        }
      }
      
      // Show the chat interface
      console.log('Opening chat interface with pipeline ID:', currentPipelineId);
      setShowChat(true);
      
      // Call the onTest callback if provided
      if (onTest) {
        onTest(config as PipelineConfiguration);
      }
    } catch (error) {
      console.error('Test pipeline error:', error);
      alert(`Failed to test pipeline: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const overallValidation = useMemo(() => {
    const allErrors = stages.flatMap(stage => stage.validation.errors);
    const allWarnings = stages.flatMap(stage => stage.validation.warnings);
    
    // Check if all stages have components selected
    const missingComponents = stages.filter(stage => !stage.component);
    const hasAllComponents = missingComponents.length === 0;
    
    return {
      isValid: allErrors.length === 0 && hasAllComponents,
      errors: allErrors,
      warnings: allWarnings,
      missingComponents: missingComponents.map(stage => stage.name)
    };
  }, [stages]);

  const completedStages = stages.filter(stage => stage.component).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-sm mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Pipeline Configuration</h2>
              <p className="text-gray-600">Configure each stage of your RAG pipeline</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/80 border-gray-200 px-3 py-1 font-semibold">
                {completedStages}/{stages.length} configured
              </Badge>
              {overallValidation.isValid ? (
                <Badge className="flex items-center gap-2 bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1">
                  <CheckCircle className="h-4 w-4" />
                  Pipeline Valid
                </Badge>
              ) : (
                <Badge className="flex items-center gap-2 bg-red-100 text-red-700 border-red-200 px-3 py-1">
                  <AlertTriangle className="h-4 w-4" />
                  {overallValidation.missingComponents && overallValidation.missingComponents.length > 0 
                    ? `${overallValidation.missingComponents.length} stage${overallValidation.missingComponents.length !== 1 ? 's' : ''} missing`
                    : `${overallValidation.errors.length} error${overallValidation.errors.length !== 1 ? 's' : ''}`
                  }
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVisualization(!showVisualization)}
              className="bg-white/60 hover:bg-white/80 border border-gray-200"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showVisualization ? 'Hide' : 'Show'} Visualization
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(!showChat)}
              className="bg-white/60 hover:bg-white/80 border border-gray-200"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {showChat ? 'Hide' : 'Show'} Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiSettings(!showApiSettings)}
              className="bg-white/60 hover:bg-white/80 border border-gray-200"
            >
              <Key className="h-4 w-4 mr-2" />
              API Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={selectDefaultComponents}
              className="bg-white/60 hover:bg-white/80 border border-gray-200"
            >
              <Settings className="h-4 w-4 mr-2" />
              Quick Setup
            </Button>
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!overallValidation.isValid || isCreatingPipeline}
              className="bg-white/60 hover:bg-white/80 border-gray-200 font-semibold"
              title={!overallValidation.isValid ? 'Please configure all pipeline stages' : !apiKey ? 'API key recommended for full functionality' : ''}
            >
              <Save className="h-4 w-4 mr-2" />
              {isCreatingPipeline ? 'Creating...' : currentPipelineId ? 'Update Pipeline' : 'Create Pipeline'}
            </Button>
            <Button
              onClick={handleTest}
              disabled={!overallValidation.isValid}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg"
              title={!overallValidation.isValid ? 'Please configure all pipeline stages' : !apiKey ? 'API key recommended for full functionality' : ''}
            >
              <Play className="h-4 w-4 mr-2" />
              Test Pipeline
            </Button>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      {totalCost > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Cost Summary
            </CardTitle>
            <p className="text-gray-600">Estimated monthly costs for your pipeline configuration</p>
          </CardHeader>
          <CardContent>
            <CostEstimation
              cost={{
                setup: 0,
                perOperation: 0,
                monthly: totalCost,
                currency: 'USD'
              }}
              showDetails={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Pipeline Visualization */}
      {showVisualization && (
        <PipelineVisualization
          stages={stages}
          totalCost={totalCost}
          onStageClick={handleToggleConfiguration}
          showCosts={true}
          showValidation={true}
        />
      )}

      {/* API Settings */}
      {showApiSettings && (
        <div className="mb-8">
          <ApiKeySettings
            onApiKeyChange={setApiKey}
            className=""
          />
        </div>
      )}

      {/* Chat Interface */}
      {showChat && (
        <div className="mb-8">
          <ChatInterface
            pipelineId={currentPipelineId || undefined}
            className="h-96"
          />
        </div>
      )}

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {stages.map((stage) => (
          <PipelineStage
            key={stage.id}
            stage={stage}
            onComponentSelect={handleComponentSelect}
            onParameterChange={handleParameterChange}
            onRemoveComponent={handleRemoveComponent}
            isConfiguring={configuringStage === stage.id}
            onToggleConfiguration={handleToggleConfiguration}
            onConfigChange={handleConfigChange}
            allStages={stages}
          />
        ))}
      </div>

      {/* Getting Started Help */}
      {completedStages === 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Getting Started
            </CardTitle>
            <p className="text-gray-600">Configure your RAG pipeline by selecting components for each stage</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white/60 rounded-lg p-4 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3">Quick Setup Options:</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={selectDefaultComponents}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Auto-Select Recommended Components
                  </Button>
                  <span className="text-sm text-gray-600">
                    Automatically selects good default components for each stage
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Or manually select components for each stage below to customize your pipeline.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      {(overallValidation.errors.length > 0 || overallValidation.warnings.length > 0 || (overallValidation.missingComponents && overallValidation.missingComponents.length > 0)) && completedStages > 0 && (
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Pipeline Status
            </CardTitle>
            <p className="text-gray-600">
              {overallValidation.isValid 
                ? 'Your pipeline is ready to use!' 
                : 'Please complete the configuration to test your pipeline'
              }
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {overallValidation.missingComponents && overallValidation.missingComponents.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Missing Components ({overallValidation.missingComponents.length})
                </h4>
                <ul className="space-y-2">
                  {overallValidation.missingComponents.map((stageName, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-3 bg-white/60 p-2 rounded">
                      <span className="text-blue-500 mt-0.5">•</span>
                      Please select a component for the {stageName} stage
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {overallValidation.errors.length > 0 && (
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Errors ({overallValidation.errors.length})
                </h4>
                <ul className="space-y-2">
                  {overallValidation.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-3 bg-white/60 p-2 rounded">
                      <span className="text-red-500 mt-0.5">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {overallValidation.warnings.length > 0 && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Warnings ({overallValidation.warnings.length})
                </h4>
                <ul className="space-y-2">
                  {overallValidation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-amber-700 flex items-start gap-3 bg-white/60 p-2 rounded">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}