"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CostEstimate } from '@/types';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CostEstimationProps {
  cost: CostEstimate;
  showDetails?: boolean;
  className?: string;
}

export function CostEstimation({ cost, showDetails = false, className }: CostEstimationProps) {
  const formatCost = (amount: number) => {
    if (amount === 0) return 'Free';
    if (amount < 0.01) return `$${amount.toFixed(4)}`;
    return `$${amount.toFixed(2)}`;
  };

  const getTotalMonthlyCost = () => {
    return cost.monthly + (cost.perOperation * 10000); // Estimate 10k operations per month
  };

  const getCostColor = () => {
    const total = getTotalMonthlyCost();
    if (total === 0) return 'text-green-600 bg-green-50 border-green-200';
    if (total < 20) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (total < 100) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (!showDetails) {
    return (
      <Badge className={cn("text-xs font-medium", getCostColor(), className)}>
        <DollarSign className="h-3 w-3 mr-1" />
        {formatCost(getTotalMonthlyCost())}/mo
      </Badge>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign className="h-4 w-4 text-gray-600" />
        <span className="font-medium text-sm text-gray-700">Cost Breakdown</span>
      </div>
      
      <div className="space-y-2 text-sm">
        {cost.setup > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Setup Cost:</span>
            <span className="font-medium">{formatCost(cost.setup)}</span>
          </div>
        )}
        
        {cost.perOperation > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Per Operation:</span>
            <span className="font-medium">{formatCost(cost.perOperation)}</span>
          </div>
        )}
        
        {cost.monthly > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Monthly Base:</span>
            <span className="font-medium">{formatCost(cost.monthly)}</span>
          </div>
        )}
        
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="font-medium text-gray-700">Est. Monthly Total:</span>
          <span className={cn("font-bold", getCostColor().split(' ')[0])}>
            {formatCost(getTotalMonthlyCost())}
          </span>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        * Estimated based on 10,000 operations/month
      </div>
    </div>
  );
}