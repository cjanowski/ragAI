"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PipelineStage } from '@/types';
import { ArrowRight, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineVisualizationProps {
  stages: PipelineStage[];
  totalCost: number;
  onStageClick?: (stageId: string) => void;
  showCosts?: boolean;
  showValidation?: boolean;
  className?: string;
}

export function PipelineVisualization({
  stages,
  totalCost,
  onStageClick,
  showCosts = false,
  showValidation = false,
  className
}: PipelineVisualizationProps) {
  const getValidationIcon = (stage: PipelineStage) => {
    if (!stage.component) {
      return <XCircle className="h-4 w-4 text-gray-400" />;
    }
    if (!stage.validation.isValid) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    if (stage.validation.warnings.length > 0) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card className={cn("bg-white/80 backdrop-blur-sm border-gray-200", className)}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Pipeline Visualization
        </CardTitle>
        <p className="text-gray-600">Visual representation of your RAG pipeline flow</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between overflow-x-auto pb-4">
          {stages.map((stage, index) => (
            <React.Fragment key={stage.id}>
              <div
                className={cn(
                  "flex flex-col items-center min-w-[120px] cursor-pointer transition-all duration-200",
                  onStageClick && "hover:scale-105"
                )}
                onClick={() => onStageClick?.(stage.id)}
              >
                <div className={cn(
                  "w-16 h-16 rounded-full border-2 flex items-center justify-center mb-2 transition-colors",
                  stage.component 
                    ? "border-green-500 bg-green-50" 
                    : "border-gray-300 bg-gray-50"
                )}>
                  <div className="text-sm font-bold text-gray-700">
                    {index + 1}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="font-semibold text-sm text-gray-900 mb-1">
                    {stage.name}
                  </div>
                  
                  {stage.component ? (
                    <Badge variant="outline" className="text-xs bg-white/80">
                      {stage.component.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500">
                      Not configured
                    </Badge>
                  )}
                  
                  {showValidation && (
                    <div className="flex justify-center mt-1">
                      {getValidationIcon(stage)}
                    </div>
                  )}
                  
                  {showCosts && stage.component && (
                    <div className="text-xs text-gray-600 mt-1">
                      ${stage.component.tradeoffs.cost.monthly}/mo
                    </div>
                  )}
                </div>
              </div>
              
              {index < stages.length - 1 && (
                <ArrowRight className="h-6 w-6 text-gray-400 mx-2 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
        
        {showCosts && totalCost > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Estimated Monthly Cost:
              </span>
              <span className="text-lg font-bold text-blue-600">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}