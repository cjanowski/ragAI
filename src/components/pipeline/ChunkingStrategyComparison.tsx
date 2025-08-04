"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChunkingConfig } from '@/types';
import { getAllChunkingStrategies } from '@/lib/chunking';
import { CheckCircle, Clock, Zap, Brain, DollarSign, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChunkingStrategy {
  id: ChunkingConfig['strategy'];
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  pros: string[];
  cons: string[];
  useCases: string[];
  complexity: string;
  speed: string;
  quality: string;
}

interface ChunkingStrategyComparisonProps {
  strategies: ChunkingStrategy[];
  selectedStrategy: ChunkingConfig['strategy'];
  onStrategySelect: (strategy: ChunkingConfig['strategy']) => void;
  className?: string;
}

const COMPARISON_CRITERIA = [
  {
    key: 'complexity',
    name: 'Implementation Complexity',
    icon: Brain,
    description: 'How difficult it is to implement and maintain'
  },
  {
    key: 'speed',
    name: 'Processing Speed',
    icon: Zap,
    description: 'How fast the chunking process runs'
  },
  {
    key: 'quality',
    name: 'Output Quality',
    icon: CheckCircle,
    description: 'Quality of chunk boundaries and context preservation'
  },
  {
    key: 'cost',
    name: 'Operational Cost',
    icon: DollarSign,
    description: 'Cost implications of running this strategy'
  }
];

const PERFORMANCE_MATRIX = {
  fixed: {
    complexity: { score: 5, label: 'Very Low', color: 'text-green-600 bg-green-50' },
    speed: { score: 5, label: 'Very Fast', color: 'text-green-600 bg-green-50' },
    quality: { score: 2, label: 'Basic', color: 'text-red-600 bg-red-50' },
    cost: { score: 5, label: 'Very Low', color: 'text-green-600 bg-green-50' }
  },
  recursive: {
    complexity: { score: 3, label: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
    speed: { score: 4, label: 'Fast', color: 'text-green-600 bg-green-50' },
    quality: { score: 4, label: 'Good', color: 'text-blue-600 bg-blue-50' },
    cost: { score: 4, label: 'Low', color: 'text-green-600 bg-green-50' }
  },
  document: {
    complexity: { score: 3, label: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
    speed: { score: 3, label: 'Medium', color: 'text-yellow-600 bg-yellow-50' },
    quality: { score: 4, label: 'Very Good', color: 'text-blue-600 bg-blue-50' },
    cost: { score: 4, label: 'Low', color: 'text-green-600 bg-green-50' }
  },
  semantic: {
    complexity: { score: 2, label: 'High', color: 'text-orange-600 bg-orange-50' },
    speed: { score: 2, label: 'Slow', color: 'text-red-600 bg-red-50' },
    quality: { score: 5, label: 'Excellent', color: 'text-purple-600 bg-purple-50' },
    cost: { score: 2, label: 'High', color: 'text-red-600 bg-red-50' }
  },
  agentic: {
    complexity: { score: 1, label: 'Very High', color: 'text-red-600 bg-red-50' },
    speed: { score: 1, label: 'Very Slow', color: 'text-red-600 bg-red-50' },
    quality: { score: 5, label: 'Outstanding', color: 'text-purple-600 bg-purple-50' },
    cost: { score: 1, label: 'Very High', color: 'text-red-600 bg-red-50' }
  }
};

export function ChunkingStrategyComparison({
  strategies,
  selectedStrategy,
  onStrategySelect,
  className
}: ChunkingStrategyComparisonProps) {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    if (score >= 2) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div
        key={i}
        className={cn(
          "h-2 w-4 rounded-sm",
          i < score ? "bg-blue-500" : "bg-gray-200"
        )}
      />
    ));
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Overview Comparison Table */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Strategy Comparison Matrix
          </CardTitle>
          <p className="text-sm text-gray-600">
            Compare different chunking strategies across key performance criteria
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-900">Strategy</th>
                  {COMPARISON_CRITERIA.map((criterion) => {
                    const Icon = criterion.icon;
                    return (
                      <th key={criterion.key} className="text-center p-3 font-semibold text-gray-900">
                        <div className="flex flex-col items-center gap-1">
                          <Icon className="h-4 w-4" />
                          <span className="text-xs">{criterion.name}</span>
                        </div>
                      </th>
                    );
                  })}
                  <th className="text-center p-3 font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strategy) => {
                  const performance = PERFORMANCE_MATRIX[strategy.id];
                  const isSelected = selectedStrategy === strategy.id;
                  
                  return (
                    <tr
                      key={strategy.id}
                      className={cn(
                        "border-b border-gray-100 hover:bg-gray-50/50 transition-colors",
                        isSelected && "bg-blue-50/50 border-blue-200"
                      )}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <strategy.icon className={cn("h-5 w-5", isSelected ? "text-blue-600" : "text-gray-600")} />
                          <div>
                            <div className={cn("font-semibold", isSelected ? "text-blue-900" : "text-gray-900")}>
                              {strategy.name}
                            </div>
                            <div className="text-xs text-gray-600 max-w-xs">
                              {strategy.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {COMPARISON_CRITERIA.map((criterion) => {
                        const score = performance[criterion.key as keyof typeof performance];
                        return (
                          <td key={criterion.key} className="p-3 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex gap-1">
                                {getScoreBars(score.score)}
                              </div>
                              <Badge className={cn("text-xs px-2 py-1", score.color)}>
                                {score.label}
                              </Badge>
                            </div>
                          </td>
                        );
                      })}
                      
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => onStrategySelect(strategy.id)}
                          className={cn(
                            "text-xs",
                            isSelected && "bg-blue-600 hover:bg-blue-700"
                          )}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategies.map((strategy) => {
          const performance = PERFORMANCE_MATRIX[strategy.id];
          const isSelected = selectedStrategy === strategy.id;
          const Icon = strategy.icon;
          
          return (
            <Card
              key={strategy.id}
              className={cn(
                "transition-all duration-200 cursor-pointer hover:shadow-lg",
                isSelected 
                  ? "ring-2 ring-blue-500 bg-blue-50/30 border-blue-200" 
                  : "hover:border-gray-300 bg-white/60"
              )}
              onClick={() => onStrategySelect(strategy.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-5 w-5", isSelected ? "text-blue-600" : "text-gray-600")} />
                    <span className={cn(isSelected ? "text-blue-900" : "text-gray-900")}>
                      {strategy.name}
                    </span>
                  </div>
                  {isSelected && (
                    <Badge className="bg-blue-600 text-white">
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-gray-600">{strategy.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Performance Scores */}
                <div className="grid grid-cols-2 gap-3">
                  {COMPARISON_CRITERIA.map((criterion) => {
                    const score = performance[criterion.key as keyof typeof performance];
                    const Icon = criterion.icon;
                    
                    return (
                      <div key={criterion.key} className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">{criterion.name}</span>
                            <Badge className={cn("text-xs px-2 py-0.5", score.color)}>
                              {score.label}
                            </Badge>
                          </div>
                          <div className="flex gap-1 mt-1">
                            {getScoreBars(score.score)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <h4 className="font-semibold text-green-700 mb-2 text-sm flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Advantages
                    </h4>
                    <ul className="space-y-1">
                      {strategy.pros.slice(0, 2).map((pro, index) => (
                        <li key={index} className="text-xs text-green-700 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-red-700 mb-2 text-sm flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Considerations
                    </h4>
                    <ul className="space-y-1">
                      {strategy.cons.slice(0, 2).map((con, index) => (
                        <li key={index} className="text-xs text-red-700 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Use Cases */}
                <div>
                  <h4 className="font-semibold text-blue-700 mb-2 text-sm">Best For</h4>
                  <div className="flex flex-wrap gap-1">
                    {strategy.useCases.slice(0, 3).map((useCase, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {useCase}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendation Box */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Brain className="h-5 w-5" />
            Strategy Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-800">For Beginners</h4>
              <p className="text-indigo-700">
                Start with <strong>Fixed-Size</strong> or <strong>Recursive</strong> chunking. 
                They&apos;re simple to configure and work well for most use cases.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-800">For Production</h4>
              <p className="text-indigo-700">
                <strong>Recursive</strong> chunking offers the best balance of quality, 
                speed, and simplicity for most production systems.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-800">For High Quality</h4>
              <p className="text-indigo-700">
                Use <strong>Semantic</strong> or <strong>Agentic</strong> chunking when 
                retrieval quality is more important than speed or cost.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-indigo-800">For Structured Docs</h4>
              <p className="text-indigo-700">
                <strong>Document-Based</strong> chunking works best with well-structured 
                documents like technical manuals or academic papers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}