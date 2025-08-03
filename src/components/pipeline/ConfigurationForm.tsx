"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z, ZodString, ZodNumber } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ComponentOption, Parameter } from '@/types';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigurationFormProps {
  component: ComponentOption;
  onParameterChange: (parameter: string, value: any) => void;
  initialValues?: Record<string, any>;
  className?: string;
}

export function ConfigurationForm({
  component,
  onParameterChange,
  initialValues = {},
  className
}: ConfigurationFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(initialValues);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Create dynamic schema based on component parameters
  const createValidationSchema = (parameters: Parameter[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    parameters.forEach(param => {
      let field: z.ZodTypeAny;
      
      switch (param.type) {
        case 'string':
          field = z.string();
          if (param.validation?.pattern) {
            field = (field as ZodString).regex(new RegExp(param.validation.pattern));
          }
          break;
        case 'number':
          field = z.number();
          if (param.validation?.min !== undefined) {
            field = (field as ZodNumber).min(param.validation.min);
          }
          if (param.validation?.max !== undefined) {
            field = (field as ZodNumber).max(param.validation.max);
          }
          break;
        case 'boolean':
          field = z.boolean();
          break;
        case 'select':
        case 'multiselect':
          if (param.options) {
            if (param.type === 'multiselect') {
              field = z.array(z.enum(param.options as [string, ...string[]]));
            } else {
              field = z.enum(param.options as [string, ...string[]]);
            }
          } else {
            field = z.string();
          }
          break;
        default:
          field = z.any();
      }
      
      if (!param.required) {
        field = field.optional();
      }
      
      schemaFields[param.name] = field;
    });
    
    return z.object(schemaFields);
  };

  const schema = createValidationSchema(component.parameters);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: component.parameters.reduce((acc, param) => {
      acc[param.name] = initialValues[param.name] ?? param.defaultValue;
      return acc;
    }, {} as Record<string, any>),
    mode: 'onChange'
  });

  const watchedValues = watch();

  // Update parent component when values change
  useEffect(() => {
    Object.entries(watchedValues).forEach(([key, value]) => {
      if (value !== formValues[key]) {
        setFormValues(prev => ({ ...prev, [key]: value }));
        onParameterChange(key, value);
      }
    });
  }, [watchedValues, formValues, onParameterChange]);

  const validateParameter = (param: Parameter, value: any): string | null => {
    if (param.required && (value === undefined || value === null || value === '')) {
      return `${param.name} is required`;
    }
    
    if (param.type === 'number' && value !== undefined && value !== null) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return `${param.name} must be a number`;
      }
      if (param.validation?.min !== undefined && numValue < param.validation.min) {
        return `${param.name} must be at least ${param.validation.min}`;
      }
      if (param.validation?.max !== undefined && numValue > param.validation.max) {
        return `${param.name} must be at most ${param.validation.max}`;
      }
    }
    
    return null;
  };

  const renderParameterInput = (param: Parameter) => {
    const value = watchedValues[param.name];
    const error = errors[param.name];
    const hasError = !!error;
    
    const baseInputClasses = cn(
      "transition-colors",
      hasError && "border-red-500 focus:border-red-500 focus:ring-red-500"
    );

    switch (param.type) {
      case 'string':
        return (
          <Input
            {...register(param.name)}
            type="text"
            placeholder={param.defaultValue?.toString() || `Enter ${param.name}`}
            className={baseInputClasses}
          />
        );
        
      case 'number':
        return (
          <Input
            {...register(param.name, { valueAsNumber: true })}
            type="number"
            min={param.validation?.min}
            max={param.validation?.max}
            step={param.validation?.min && param.validation.min < 1 ? 0.1 : 1}
            placeholder={param.defaultValue?.toString() || `Enter ${param.name}`}
            className={baseInputClasses}
          />
        );
        
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              {...register(param.name)}
              type="checkbox"
              id={param.name}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <Label htmlFor={param.name} className="text-sm">
              Enable {param.name}
            </Label>
          </div>
        );
        
      case 'select':
        return (
          <Select
            value={value?.toString() || ''}
            onValueChange={(newValue) => setValue(param.name, newValue)}
          >
            <SelectTrigger className={baseInputClasses}>
              <SelectValue placeholder={`Select ${param.name}`} />
            </SelectTrigger>
            <SelectContent>
              {param.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
        
      case 'multiselect':
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {(value as string[] || []).map((selectedOption: string) => (
                <Badge
                  key={selectedOption}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const newValue = (value as string[]).filter(v => v !== selectedOption);
                    setValue(param.name, newValue);
                  }}
                >
                  {selectedOption} ×
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={(newValue) => {
                const currentValue = value as string[] || [];
                if (!currentValue.includes(newValue)) {
                  setValue(param.name, [...currentValue, newValue]);
                }
              }}
            >
              <SelectTrigger className={baseInputClasses}>
                <SelectValue placeholder={`Add ${param.name}`} />
              </SelectTrigger>
              <SelectContent>
                {param.options?.filter(option => !(value as string[] || []).includes(option)).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
        
      default:
        return (
          <Input
            {...register(param.name)}
            type="text"
            placeholder={`Enter ${param.name}`}
            className={baseInputClasses}
          />
        );
    }
  };

  const getParameterDescription = (param: Parameter): string => {
    const descriptions: Record<string, string> = {
      chunkSize: 'Number of characters per chunk. Larger chunks provide more context but may exceed model limits.',
      chunkOverlap: 'Number of characters to overlap between chunks. Helps maintain context continuity.',
      temperature: 'Controls randomness in generation. Lower values (0.1) are more focused, higher values (0.9) are more creative.',
      maxTokens: 'Maximum number of tokens to generate in the response.',
      topK: 'Number of most relevant chunks to retrieve for context.',
      threshold: 'Minimum similarity score for semantic chunking. Higher values create more coherent chunks.',
      alpha: 'Balance between vector and keyword search in hybrid retrieval (0.0 = pure keyword, 1.0 = pure vector).',
      batchSize: 'Number of items to process in each batch. Higher values are more efficient but use more memory.',
      apiKey: 'Your API key for this service. Keep this secure and never share it.',
    };
    
    return descriptions[param.name] || `Configuration parameter for ${param.name}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Configuration</h4>
        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              <span className="text-xs">Valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              <span className="text-xs">Invalid</span>
            </div>
          )}
        </div>
      </div>

      <form className="space-y-4">
        {component.parameters.map((param) => (
          <div key={param.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={param.name} className="text-sm font-medium">
                {param.name}
                {param.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <div className="flex items-center gap-1">
                {param.defaultValue !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    Default: {param.defaultValue.toString()}
                  </Badge>
                )}
              </div>
            </div>
            
            {renderParameterInput(param)}
            
            {/* Parameter description */}
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{getParameterDescription(param)}</span>
            </div>
            
            {/* Validation error */}
            {errors[param.name] && (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>{errors[param.name]?.message?.toString()}</span>
              </div>
            )}
            
            {/* Parameter-specific validation hints */}
            {param.validation && (
              <div className="text-xs text-gray-400">
                {param.validation.min !== undefined && param.validation.max !== undefined && (
                  <span>Range: {param.validation.min} - {param.validation.max}</span>
                )}
                {param.validation.pattern && (
                  <span>Pattern: {param.validation.pattern}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </form>
      
      {component.parameters.length === 0 && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No configuration required for this component
        </div>
      )}
    </div>
  );
}