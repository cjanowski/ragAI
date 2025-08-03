"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComponentOption } from '@/types';
import { getComponentsByCategory } from '@/lib/mock-data';
import { ChevronDown, Info, DollarSign, Zap, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComponentSelectorProps {
  category: 'ingestion' | 'chunking' | 'embedding' | 'vectorstore' | 'retrieval' | 'generation';
  onSelect: (component: ComponentOption) => void;
  selectedComponent?: ComponentOption;
  className?: string;
}

export function ComponentSelector({
  category,
  onSelect,
  selectedComponent,
  className
}: ComponentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<ComponentOption | null>(null);
  
  const components = getComponentsByCategory(category);

  const formatCost = (cost: ComponentOption['tradeoffs']['cost']) => {
    if (cost.perOperation > 0) {
      return `$${cost.perOperation.toFixed(4)}/op`;
    }
    if (cost.monthly > 0) {
      return `$${cost.monthly}/mo`;
    }
    return 'Free';
  };

  const getCostColor = (cost: ComponentOption['tradeoffs']['cost']) => {
    const totalMonthlyCost = cost.monthly + (cost.perOperation * 10000); // Estimate for 10k ops
    if (totalMonthlyCost === 0) return 'text-green-600';
    if (totalMonthlyCost < 20) return 'text-blue-600';
    if (totalMonthlyCost < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleSelect = (component: ComponentOption) => {
    onSelect(component);
    setIsOpen(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedComponent ? selectedComponent.name : `Select ${category} component`}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="start">
          <div className="max-h-96 overflow-y-auto">
            <div className="p-3 border-b">
              <h4 className="font-semibold text-sm">
                Choose {category.charAt(0).toUpperCase() + category.slice(1)} Component
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Select the best component for your use case
              </p>
            </div>
            
            <div className="p-2 space-y-2">
              {components.map((component) => (
                <div key={component.id} className="relative">
                  <Card 
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      selectedComponent?.id === component.id && "ring-2 ring-blue-500"
                    )}
                    onClick={() => handleSelect(component)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-medium">
                            {component.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1 line-clamp-2">
                            {component.description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedForDetails(component);
                          }}
                        >
                          <Info className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {component.parameters.length} params
                          </Badge>
                          <span className={cn("text-xs font-medium", getCostColor(component.tradeoffs.cost))}>
                            {formatCost(component.tradeoffs.cost)}
                          </span>
                        </div>
                        
                        {/* Quick indicators */}
                        <div className="flex items-center gap-1">
                          {component.tradeoffs.cost.perOperation === 0 && component.tradeoffs.cost.monthly === 0 && (
                            <Badge variant="success" className="text-xs px-1 py-0">Free</Badge>
                          )}
                          {component.tradeoffs.pros.some(pro => pro.toLowerCase().includes('fast')) && (
                            <Zap className="h-3 w-3 text-yellow-500" />
                          )}
                          {component.tradeoffs.pros.some(pro => pro.toLowerCase().includes('secure') || pro.toLowerCase().includes('privacy')) && (
                            <Shield className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Detailed Component Information Modal */}
      {selectedForDetails && (
        <Popover open={!!selectedForDetails} onOpenChange={() => setSelectedForDetails(null)}>
          <PopoverContent className="w-80 p-0" side="right">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{selectedForDetails.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedForDetails.description}
                  </p>
                </div>
              </div>

              {/* Cost Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">Cost Structure</span>
                </div>
                <div className="space-y-1 text-sm">
                  {selectedForDetails.tradeoffs.cost.setup > 0 && (
                    <div className="flex justify-between">
                      <span>Setup:</span>
                      <span>${selectedForDetails.tradeoffs.cost.setup}</span>
                    </div>
                  )}
                  {selectedForDetails.tradeoffs.cost.perOperation > 0 && (
                    <div className="flex justify-between">
                      <span>Per Operation:</span>
                      <span>${selectedForDetails.tradeoffs.cost.perOperation.toFixed(4)}</span>
                    </div>
                  )}
                  {selectedForDetails.tradeoffs.cost.monthly > 0 && (
                    <div className="flex justify-between">
                      <span>Monthly:</span>
                      <span>${selectedForDetails.tradeoffs.cost.monthly}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Pros and Cons */}
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm text-green-700 mb-2">Advantages</h5>
                  <ul className="space-y-1">
                    {selectedForDetails.tradeoffs.pros.map((pro, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-sm text-red-700 mb-2">Considerations</h5>
                  <ul className="space-y-1">
                    {selectedForDetails.tradeoffs.cons.map((con, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-sm text-blue-700 mb-2">Best For</h5>
                  <ul className="space-y-1">
                    {selectedForDetails.tradeoffs.useCases.map((useCase, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {useCase}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t">
                <Button
                  onClick={() => {
                    handleSelect(selectedForDetails);
                    setSelectedForDetails(null);
                  }}
                  className="w-full"
                  size="sm"
                >
                  Select This Component
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}