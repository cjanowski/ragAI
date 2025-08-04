"use client";

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ComponentOption } from '@/types';
import { getComponentsByCategory } from '@/lib/mock-data';
import { Info, DollarSign, Zap, Shield } from 'lucide-react';
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
  const [showDetails, setShowDetails] = useState(false);
  
  const components = getComponentsByCategory(category);
  
  console.log(`ComponentSelector for ${category}:`, components); // Debug log

  const formatCost = (cost: ComponentOption['tradeoffs']['cost']) => {
    if (cost.perOperation > 0) {
      return `${cost.perOperation.toFixed(4)}/op`;
    }
    if (cost.monthly > 0) {
      return `${cost.monthly}/mo`;
    }
    return 'Free';
  };

  const handleSelect = (componentId: string) => {
    const component = components.find(c => c.id === componentId);
    if (component) {
      console.log('Selecting component:', component); // Debug log
      onSelect(component);
    }
  };

  if (components.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        <div className="text-center py-4 text-gray-500">
          No components available for {category}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Simple Select Dropdown */}
      <Select 
        value={selectedComponent?.id || ''} 
        onValueChange={handleSelect}
      >
        <SelectTrigger className="w-full h-12 bg-white/80 backdrop-blur-sm border-gray-200 hover:border-blue-300">
          <SelectValue placeholder={`Choose ${category} component`} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {components.map((component) => (
            <SelectItem key={component.id} value={component.id}>
              <div className="flex items-center justify-between w-full">
                <span>{component.name}</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  ${formatCost(component.tradeoffs.cost)}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Selected Component Details */}
      {selectedComponent && (
        <Card className="bg-white/60 backdrop-blur-sm border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base font-bold text-gray-900 mb-1">
                  {selectedComponent.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 leading-relaxed">
                  {selectedComponent.description}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 ml-3 hover:bg-blue-100 transition-colors"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Info className="h-4 w-4 text-blue-600" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-xs bg-gray-50 border-gray-200 font-medium">
                  {selectedComponent.parameters.length} params
                </Badge>
                <div className="text-sm font-bold text-blue-600">
                  ${formatCost(selectedComponent.tradeoffs.cost)}
                </div>
              </div>
              
              {/* Quick indicators */}
              <div className="flex items-center gap-2">
                {selectedComponent.tradeoffs.cost.perOperation === 0 && selectedComponent.tradeoffs.cost.monthly === 0 && (
                  <Badge className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 border-emerald-200">Free</Badge>
                )}
                {selectedComponent.tradeoffs.pros.some(pro => pro.toLowerCase().includes('fast')) && (
                  <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                    <Zap className="h-3 w-3 text-amber-600" />
                  </div>
                )}
              </div>
            </div>

            {/* Expandable Details */}
            {showDetails && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                {/* Cost Information */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <span className="font-medium text-sm">Cost Structure</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {selectedComponent.tradeoffs.cost.setup > 0 && (
                      <div className="flex justify-between">
                        <span>Setup:</span>
                        <span>${selectedComponent.tradeoffs.cost.setup}</span>
                      </div>
                    )}
                    {selectedComponent.tradeoffs.cost.perOperation > 0 && (
                      <div className="flex justify-between">
                        <span>Per Operation:</span>
                        <span>${selectedComponent.tradeoffs.cost.perOperation.toFixed(4)}</span>
                      </div>
                    )}
                    {selectedComponent.tradeoffs.cost.monthly > 0 && (
                      <div className="flex justify-between">
                        <span>Monthly:</span>
                        <span>${selectedComponent.tradeoffs.cost.monthly}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pros and Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <h5 className="font-medium text-sm text-green-700 mb-2">Advantages</h5>
                    <ul className="space-y-1">
                      {selectedComponent.tradeoffs.pros.slice(0, 3).map((pro, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">•</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-medium text-sm text-red-700 mb-2">Considerations</h5>
                    <ul className="space-y-1">
                      {selectedComponent.tradeoffs.cons.slice(0, 3).map((con, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}