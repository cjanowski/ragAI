"use client";

import React from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ComponentSelector } from './ComponentSelector';
import { ConfigurationForm } from './ConfigurationForm';
import { CostEstimation } from './CostEstimation';
import { PipelineStage as PipelineStageType, ComponentOption, ValidationResult } from '@/types';
import { Settings, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineStageProps {
  stage: PipelineStageType;
  onComponentSelect: (stageId: string, component: ComponentOption) => void;
  onParameterChange: (stageId: string, parameter: string, value: any) => void;
  onRemoveComponent: (stageId: string) => void;
  isConfiguring: boolean;
  onToggleConfiguration: (stageId: string) => void;
  className?: string;
}

export function PipelineStage({
  stage,
  onComponentSelect,
  onParameterChange,
  onRemoveComponent,
  isConfiguring,
  onToggleConfiguration,
  className
}: PipelineStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging,
  } = useDraggable({
    id: stage.id,
    data: {
      type: 'stage',
      stage,
    },
  });

  const {
    isOver,
    setNodeRef: setDroppableRef,
  } = useDroppable({
    id: stage.id,
    data: {
      type: 'stage',
      accepts: ['component'],
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

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
      ref={(node) => {
        setDraggableRef(node);
        setDroppableRef(node);
      }}
      style={style}
      className={cn(
        "relative transition-all duration-200",
        isDragging && "opacity-50 scale-105 z-50",
        isOver && "ring-2 ring-blue-500 ring-opacity-50",
        className
      )}
      {...attributes}
      {...listeners}
    >
      <Card className={cn(
        "w-full min-h-[200px] transition-all duration-200",
        stage.component ? "border-green-200 bg-green-50/50" : "border-dashed border-gray-300",
        isOver && "border-blue-500 bg-blue-50/50",
        !stage.validation.isValid && "border-red-200 bg-red-50/50"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {stage.name}
              {getValidationIcon(stage.validation)}
            </CardTitle>
            <div className="flex items-center gap-2">
              {stage.component && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleConfiguration(stage.id)}
                  className="h-8 w-8 p-0"
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
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                Select a component for this stage
              </div>
              <ComponentSelector
                category={stage.id as any}
                onSelect={(component) => onComponentSelect(stage.id, component)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Component Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{stage.component.name}</Badge>
                    <CostEstimation cost={stage.component.tradeoffs.cost} />
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {stage.component.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveComponent(stage.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>

              {/* Configuration Form */}
              {isConfiguring && (
                <div className="border-t pt-4">
                  <ConfigurationForm
                    component={stage.component}
                    onParameterChange={(parameter, value) => 
                      onParameterChange(stage.id, parameter, value)
                    }
                  />
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-green-600">Pros:</span>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    {stage.component.tradeoffs.pros.slice(0, 2).map((pro, index) => (
                      <li key={index} className="truncate">{pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium text-red-600">Cons:</span>
                  <ul className="list-disc list-inside text-gray-600 mt-1">
                    {stage.component.tradeoffs.cons.slice(0, 2).map((con, index) => (
                      <li key={index} className="truncate">{con}</li>
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