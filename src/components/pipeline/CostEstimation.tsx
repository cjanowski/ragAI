"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CostEstimate } from '@/types';
import { DollarSign, TrendingUp, Calculator, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostEstimationProps {
  cost: CostEstimate;
  usage?: {
    documentsPerMonth?: number;
    queriesPerMonth?: number;
    averageDocumentSize?: number;
  };
  className?: string;
  showDetails?: boolean;
}

export function CostEstimation({
  cost,
  usage = {
    documentsPerMonth: 100,
    queriesPerMonth: 1000,
    averageDocumentSize: 5000
  },
  className,
  showDetails = false
}: CostEstimationProps) {
  
  const calculateMonthlyCost = () => {
    const { documentsPerMonth = 100, queriesPerMonth = 1000 } = usage;
    
    // Estimate operations based on usage
    const estimatedOperations = documentsPerMonth * 10 + queriesPerMonth; // 10 ops per doc, 1 per query
    const operationCost = cost.perOperation * estimatedOperations;
    const totalMonthlyCost = cost.monthly + operationCost;
    
    return {
      setup: cost.setup,
      monthly: cost.monthly,
      operations: operationCost,
      total: totalMonthlyCost
    };
  };

  const monthlyCost = calculateMonthlyCost();
  
  const getCostLevel = (totalCost: number): 'free' | 'low' | 'medium' | 'high' => {
    if (totalCost === 0) return 'free';
    if (totalCost < 20) return 'low';
    if (totalCost < 100) return 'medium';
    return 'high';
  };

  const getCostColor = (level: string) => {
    switch (level) {
      case 'free': return 'text-green-600 bg-green-50 border-green-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Free';
    if (amount < 0.01) return `$${amount.toFixed(4)}`;
    if (amount < 1) return `$${amount.toFixed(3)}`;
    return `$${amount.toFixed(2)}`;
  };

  const costLevel = getCostLevel(monthlyCost.total);
  const costColor = getCostColor(costLevel);

  if (!showDetails) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Badge 
            variant="outline" 
            className={cn(
              "cursor-pointer hover:shadow-sm transition-all",
              costColor,
              className
            )}
          >
            <DollarSign className="h-3 w-3 mr-1" />
            {formatCurrency(monthlyCost.total)}/mo
          </Badge>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <CostEstimation 
            cost={cost} 
            usage={usage} 
            showDetails={true}
            className="p-4"
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-gray-600" />
        <h4 className="font-medium text-sm">Cost Estimation</h4>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3">
        {cost.setup > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">One-time Setup</span>
              <Info className="h-3 w-3 text-gray-400" />
            </div>
            <span className="font-medium">{formatCurrency(cost.setup)}</span>
          </div>
        )}

        {cost.monthly > 0 && (
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Base Monthly</span>
              <Info className="h-3 w-3 text-gray-400" />
            </div>
            <span className="font-medium">{formatCurrency(cost.monthly)}</span>
          </div>
        )}

        {cost.perOperation > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Per Operation</span>
                <Info className="h-3 w-3 text-gray-400" />
              </div>
              <span className="font-medium">{formatCurrency(cost.perOperation)}</span>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="text-xs text-gray-600 font-medium">Estimated Monthly Usage</div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Documents processed:</span>
                  <span>{usage.documentsPerMonth?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Queries handled:</span>
                  <span>{usage.queriesPerMonth?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium pt-1 border-t border-gray-200">
                  <span>Operation costs:</span>
                  <span>{formatCurrency(monthlyCost.operations)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Cost */}
        <div className={cn(
          "flex items-center justify-between py-3 px-3 rounded-lg border-2",
          costColor
        )}>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Total Monthly Cost</span>
          </div>
          <span className="font-bold text-lg">{formatCurrency(monthlyCost.total)}</span>
        </div>
      </div>

      {/* Cost Level Indicator */}
      <div className="flex items-center gap-2 text-xs">
        <div className={cn(
          "w-2 h-2 rounded-full",
          costLevel === 'free' && "bg-green-500",
          costLevel === 'low' && "bg-blue-500",
          costLevel === 'medium' && "bg-yellow-500",
          costLevel === 'high' && "bg-red-500"
        )} />
        <span className="text-gray-600">
          {costLevel === 'free' && 'Free to use'}
          {costLevel === 'low' && 'Budget-friendly option'}
          {costLevel === 'medium' && 'Moderate cost'}
          {costLevel === 'high' && 'Premium pricing'}
        </span>
      </div>

      {/* Usage Assumptions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
        <div className="font-medium mb-1">Assumptions:</div>
        <ul className="space-y-0.5">
          <li>• {usage.documentsPerMonth} documents processed monthly</li>
          <li>• {usage.queriesPerMonth} queries handled monthly</li>
          <li>• Average document size: {usage.averageDocumentSize?.toLocaleString()} characters</li>
        </ul>
      </div>
    </div>
  );
}