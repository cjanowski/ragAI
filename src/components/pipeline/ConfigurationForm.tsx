"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ComponentOption } from '@/types';

interface ConfigurationFormProps {
  component: ComponentOption;
  onParameterChange: (parameter: string, value: any) => void;
  className?: string;
}

export function ConfigurationForm({ 
  component, 
  onParameterChange, 
  className 
}: ConfigurationFormProps) {
  const renderParameter = (param: any) => {
    const handleChange = (value: any) => {
      onParameterChange(param.name, value);
    };

    switch (param.type) {
      case 'string':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={param.name}>
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={param.name}
              type={param.name.toLowerCase().includes('password') || param.name.toLowerCase().includes('key') ? 'password' : 'text'}
              value={param.defaultValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={`Enter ${param.name.toLowerCase()}`}
              className="bg-white/80"
            />
          </div>
        );

      case 'number':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={param.name}>
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={param.name}
              type="number"
              value={param.defaultValue || ''}
              onChange={(e) => handleChange(Number(e.target.value))}
              min={param.validation?.min}
              max={param.validation?.max}
              className="bg-white/80"
            />
            {param.validation && (
              <div className="text-xs text-gray-500">
                {param.validation.min !== undefined && param.validation.max !== undefined && 
                  `Range: ${param.validation.min} - ${param.validation.max}`
                }
              </div>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div key={param.name} className="flex items-center space-x-2">
            <Switch
              id={param.name}
              checked={param.defaultValue || false}
              onCheckedChange={handleChange}
            />
            <Label htmlFor={param.name}>
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
          </div>
        );

      case 'select':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={param.name}>
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select value={param.defaultValue || ''} onValueChange={handleChange}>
              <SelectTrigger className="bg-white/80">
                <SelectValue placeholder={`Select ${param.name.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {param.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multiselect':
        return (
          <div key={param.name} className="space-y-2">
            <Label htmlFor={param.name}>
              {param.name}
              {param.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {param.options?.map((option: string) => (
                <div key={option} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`${param.name}-${option}`}
                    checked={(param.defaultValue || []).includes(option)}
                    onChange={(e) => {
                      const currentValues = param.defaultValue || [];
                      const newValues = e.target.checked
                        ? [...currentValues, option]
                        : currentValues.filter((v: string) => v !== option);
                      handleChange(newValues);
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`${param.name}-${option}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2">Configuration Parameters</h4>
          <p className="text-sm text-gray-600">
            Configure the parameters for {component.name}
          </p>
        </div>
        
        {component.parameters.map(renderParameter)}
      </div>
    </div>
  );
}