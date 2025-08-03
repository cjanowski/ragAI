"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineStage } from './PipelineStage';
import { PipelineVisualization } from './PipelineVisualization';
import { CostEstimation } from './CostEstimation';
import { PipelineStage as PipelineStageType, ComponentOption, ValidationResult, PipelineConfiguration } from '@/types';
import { PIPELINE_STAGES } from '@/lib/mock-data';
import { Save, Play, AlertTriangle, CheckCircle, Settings, Eye } from 'lucide-react';
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
  const [draggedItem, setDraggedItem] = useState<any>(null);

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
      if (param.required && !param.defaultValue) {
        // In a real implementation, you'd check actual parameter values
        // For now, we'll assume default values satisfy requirements
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
    setStages(prevStages => {
      const newStages = prevStages.map(stage => 
        stage.id === stageId 
          ? { ...stage, component }
          : stage
      );
      
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

  // Handle component removal
  const handleRemoveComponent = useCallback((stageId: string) => {
    setStages(prevStages => 
      prevStages.map(stage => 
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
      )
    );
  }, []);

  // Handle configuration toggle
  const handleToggleConfiguration = useCallback((stageId: string) => {
    setConfiguringStage(prev => prev === stageId ? null : stageId);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setDraggedItem(event.active.data.current);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggedItem(null);
    // Handle reordering if needed
  };

  // Generate pipeline configuration
  const generateConfiguration = useCallback((): Partial<PipelineConfiguration> => {
    const config: Partial<PipelineConfiguration> = {
      id: `pipeline-${Date.now()}`,
      name: 'Custom RAG Pipeline',
      version: '1.0.0',
      stages: {} as any,
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

    // Map stages to configuration format
    stages.forEach(stage => {
      if (stage.component && config.stages) {
        const stageConfig = {
          provider: stage.component.id,
          parameters: stage.component.parameters.reduce((acc, param) => {
            acc[param.name] = param.defaultValue;
            return acc;
          }, {} as Record<string, any>)
        };
        
        (config.stages as any)[stage.id] = stageConfig;
      }
    });

    return config;
  }, [stages]);

  // Handle save
  const handleSave = () => {
    const config = generateConfiguration();
    if (onSave && config.validation?.isValid) {
      onSave(config as PipelineConfiguration);
    }
  };

  // Handle test
  const handleTest = () => {
    const config = generateConfiguration();
    if (onTest && config.validation?.isValid) {
      onTest(config as PipelineConfiguration);
    }
  };

  const overallValidation = useMemo(() => {
    const allErrors = stages.flatMap(stage => stage.validation.errors);
    const allWarnings = stages.flatMap(stage => stage.validation.warnings);
    return {
      isValid: allErrors.length === 0 && stages.every(stage => stage.component),
      errors: allErrors,
      warnings: allWarnings
    };
  }, [stages]);

  const completedStages = stages.filter(stage => stage.component).length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Pipeline Builder</h2>
          <Badge variant="outline">
            {completedStages}/{stages.length} configured
          </Badge>
          {overallValidation.isValid ? (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Valid
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {overallValidation.errors.length} error{overallValidation.errors.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVisualization(!showVisualization)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showVisualization ? 'Hide' : 'Show'} Visualization
          </Button>
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={!overallValidation.isValid}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={handleTest}
            disabled={!overallValidation.isValid}
          >
            <Play className="h-4 w-4 mr-2" />
            Test Pipeline
          </Button>
        </div>
      </div>

      {/* Cost Summary */}
      {totalCost > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Cost Summary</CardTitle>
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

      {/* Pipeline Stages */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {stages.map((stage) => (
            <PipelineStage
              key={stage.id}
              stage={stage}
              onComponentSelect={handleComponentSelect}
              onParameterChange={handleParameterChange}
              onRemoveComponent={handleRemoveComponent}
              isConfiguring={configuringStage === stage.id}
              onToggleConfiguration={handleToggleConfiguration}
            />
          ))}
        </div>
      </DndContext>

      {/* Validation Summary */}
      {(overallValidation.errors.length > 0 || overallValidation.warnings.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overallValidation.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">Errors</h4>
                <ul className="space-y-1">
                  {overallValidation.errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {overallValidation.warnings.length > 0 && (
              <div>
                <h4 className="font-medium text-yellow-700 mb-2">Warnings</h4>
                <ul className="space-y-1">
                  {overallValidation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-yellow-600 flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
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