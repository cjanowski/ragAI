"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineStage, ValidationResult } from '@/types';
import { Download, Maximize2, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PipelineVisualizationProps {
  stages: PipelineStage[];
  totalCost?: number;
  onStageClick?: (stageId: string) => void;
  className?: string;
  showCosts?: boolean;
  showValidation?: boolean;
}

export function PipelineVisualization({
  stages,
  totalCost = 0,
  onStageClick,
  className,
  showCosts = true,
  showValidation = true
}: PipelineVisualizationProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 14,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
        nodeSpacing: 50,
        rankSpacing: 80,
      },
    });
  }, []);

  // Generate Mermaid diagram syntax
  const generateMermaidSyntax = useCallback(() => {
    const stageOrder = ['ingestion', 'chunking', 'embedding', 'vectorstore', 'retrieval', 'generation'];
    const orderedStages = stageOrder.map(id => stages.find(stage => stage.id === id)).filter(Boolean) as PipelineStage[];
    
    let syntax = 'flowchart TD\n';
    
    // Add nodes
    orderedStages.forEach((stage, index) => {
      const componentName = stage.component?.name || 'Not Selected';
      const isValid = stage.validation.isValid;
      const hasWarnings = stage.validation.warnings.length > 0;
      
      // Determine node style based on validation
      let nodeClass = 'default';
      if (!stage.component) {
        nodeClass = 'empty';
      } else if (!isValid) {
        nodeClass = 'error';
      } else if (hasWarnings) {
        nodeClass = 'warning';
      } else {
        nodeClass = 'success';
      }
      
      // Create node with component info
      const nodeLabel = showDetails 
        ? `${stage.name}<br/><small>${componentName}</small>`
        : stage.name;
      
      syntax += `    ${stage.id}["${nodeLabel}"]:::${nodeClass}\n`;
      
      // Add click event
      if (onStageClick) {
        syntax += `    click ${stage.id} "${stage.id}"\n`;
      }
    });
    
    // Add connections
    for (let i = 0; i < orderedStages.length - 1; i++) {
      const currentStage = orderedStages[i];
      const nextStage = orderedStages[i + 1];
      
      // Different arrow styles based on component selection
      const arrowStyle = currentStage.component && nextStage.component 
        ? '-->' 
        : '-..->';
      
      syntax += `    ${currentStage.id} ${arrowStyle} ${nextStage.id}\n`;
    }
    
    // Add styling
    syntax += `
    classDef default fill:#f9f9f9,stroke:#d1d5db,stroke-width:2px,color:#374151
    classDef empty fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e,stroke-dasharray: 5 5
    classDef success fill:#d1fae5,stroke:#10b981,stroke-width:2px,color:#065f46
    classDef warning fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#92400e
    classDef error fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
    `;
    
    return syntax;
  }, [stages, showDetails, onStageClick]);

  // Render the Mermaid diagram
  const renderDiagram = useCallback(async () => {
    if (!mermaidRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const syntax = generateMermaidSyntax();
      const { svg } = await mermaid.render('pipeline-diagram', syntax);
      
      if (mermaidRef.current) {
        mermaidRef.current.innerHTML = svg;
        
        // Add click handlers
        if (onStageClick) {
          const nodes = mermaidRef.current.querySelectorAll('[id*="flowchart-"]');
          nodes.forEach(node => {
            const stageId = stages.find(stage => 
              node.textContent?.includes(stage.name)
            )?.id;
            
            if (stageId) {
              node.addEventListener('click', () => onStageClick(stageId));
              (node as HTMLElement).style.cursor = 'pointer';
            }
          });
        }
      }
    } catch (err) {
      console.error('Mermaid rendering error:', err);
      setError('Failed to render pipeline diagram');
    } finally {
      setIsLoading(false);
    }
  }, [generateMermaidSyntax, stages, showDetails, onStageClick]);

  // Re-render when stages change
  useEffect(() => {
    renderDiagram();
  }, [renderDiagram, stages, showDetails, showCosts, showValidation]);

  const getOverallValidation = (): ValidationResult => {
    const allErrors = stages.flatMap(stage => stage.validation.errors);
    const allWarnings = stages.flatMap(stage => stage.validation.warnings);
    const isValid = allErrors.length === 0 && stages.every(stage => stage.component);
    
    return {
      isValid,
      errors: allErrors,
      warnings: allWarnings
    };
  };

  const overallValidation = getOverallValidation();
  const completedStages = stages.filter(stage => stage.component).length;
  const totalStages = stages.length;

  const exportDiagram = () => {
    if (!mermaidRef.current) return;
    
    const svg = mermaidRef.current.querySelector('svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'pipeline-diagram.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <Card className={cn("w-full bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-lg", className)}>
      <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Eye className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Pipeline Flow</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white/80 border-gray-200 px-3 py-1 font-semibold">
              {completedStages}/{totalStages} configured
            </Badge>
            {showValidation && (
              <Badge 
                className={cn(
                  "px-3 py-1 font-semibold",
                  overallValidation.isValid 
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                    : "bg-red-100 text-red-700 border-red-200"
                )}
              >
                {overallValidation.isValid ? 'Valid Pipeline' : 'Invalid Pipeline'}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="h-8 w-8 p-0"
            >
              {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={renderDiagram}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportDiagram}
              className="h-8 w-8 p-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Pipeline Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{completedStages} of {totalStages} stages configured</span>
          {showCosts && totalCost > 0 && (
            <span>Estimated cost: ${totalCost.toFixed(2)}/month</span>
          )}
          {overallValidation.errors.length > 0 && (
            <span className="text-red-600">
              {overallValidation.errors.length} error{overallValidation.errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {overallValidation.warnings.length > 0 && (
            <span className="text-yellow-600">
              {overallValidation.warnings.length} warning{overallValidation.warnings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Rendering pipeline...</span>
          </div>
        )}
        
        {error && (
          <div className="flex items-center justify-center py-12 text-red-600">
            <span>{error}</span>
          </div>
        )}
        
        <div 
          ref={mermaidRef}
          className={cn(
            "w-full min-h-[300px] flex items-center justify-center",
            isLoading && "hidden"
          )}
        />
        
        {/* Legend */}
        {!isLoading && !error && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-500"></div>
                <span>Configured</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-500"></div>
                <span>Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-500"></div>
                <span>Error</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-500 border-dashed"></div>
                <span>Not Configured</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}