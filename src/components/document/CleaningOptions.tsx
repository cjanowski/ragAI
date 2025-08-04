'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CleaningOptions } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Plus, X, Eye, EyeOff } from 'lucide-react';

interface CleaningOptionsProps {
  options: CleaningOptions;
  onChange: (options: CleaningOptions) => void;
  onPreview?: (text: string) => void;
  previewText?: string;
  showPreview?: boolean;
}

export function CleaningOptionsComponent({
  options,
  onChange,
  onPreview,
  previewText,
  showPreview = false
}: CleaningOptionsProps) {
  const [newCustomRule, setNewCustomRule] = useState('');
  const [previewVisible, setPreviewVisible] = useState(showPreview);

  const handleToggle = (key: keyof CleaningOptions, value: boolean | string) => {
    onChange({
      ...options,
      [key]: value
    });
  };

  const handleExtractTablesChange = (value: 'ignore' | 'text' | 'structured') => {
    onChange({
      ...options,
      extractTables: value
    });
  };

  const handleExtractImagesChange = (value: 'ignore' | 'alt_text' | 'description') => {
    onChange({
      ...options,
      extractImages: value
    });
  };

  const addCustomRule = () => {
    if (newCustomRule.trim()) {
      onChange({
        ...options,
        customRules: [...options.customRules, newCustomRule.trim()]
      });
      setNewCustomRule('');
    }
  };

  const removeCustomRule = (index: number) => {
    onChange({
      ...options,
      customRules: options.customRules.filter((_, i) => i !== index)
    });
  };

  const handlePreviewToggle = () => {
    setPreviewVisible(!previewVisible);
    if (!previewVisible && onPreview && previewText) {
      onPreview(previewText);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Text Cleaning & Preprocessing</CardTitle>
            {onPreview && previewText && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewToggle}
                className="flex items-center gap-2"
              >
                {previewVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {previewVisible ? 'Hide Preview' : 'Show Preview'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Text Cleaning */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Basic Cleaning</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="remove-whitespace">Remove Excessive Whitespace</Label>
                <p className="text-xs text-gray-500">
                  Normalize spaces, tabs, and line breaks
                </p>
              </div>
              <Switch
                id="remove-whitespace"
                checked={options.removeWhitespace}
                onCheckedChange={(checked) => handleToggle('removeWhitespace', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="remove-special-chars">Remove Special Characters</Label>
                <p className="text-xs text-gray-500">
                  Keep only alphanumeric characters and basic punctuation
                </p>
              </div>
              <Switch
                id="remove-special-chars"
                checked={options.removeSpecialChars}
                onCheckedChange={(checked) => handleToggle('removeSpecialChars', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="normalize-unicode">Normalize Unicode</Label>
                <p className="text-xs text-gray-500">
                  Convert unicode characters to standard forms
                </p>
              </div>
              <Switch
                id="normalize-unicode"
                checked={options.normalizeUnicode}
                onCheckedChange={(checked) => handleToggle('normalizeUnicode', checked)}
              />
            </div>
          </div>

          {/* Table Extraction */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Table Handling</h4>
            <div className="space-y-2">
              <Label>Extract Tables</Label>
              <div className="flex gap-2">
                {(['ignore', 'text', 'structured'] as const).map((value) => (
                  <Button
                    key={value}
                    variant={options.extractTables === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleExtractTablesChange(value)}
                  >
                    {value === 'ignore' && 'Ignore'}
                    {value === 'text' && 'As Text'}
                    {value === 'structured' && 'Structured'}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {options.extractTables === 'ignore' && 'Skip tables entirely'}
                {options.extractTables === 'text' && 'Convert tables to plain text'}
                {options.extractTables === 'structured' && 'Preserve table structure'}
              </p>
            </div>
          </div>

          {/* Image Extraction */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Image Handling</h4>
            <div className="space-y-2">
              <Label>Extract Images</Label>
              <div className="flex gap-2">
                {(['ignore', 'alt_text', 'description'] as const).map((value) => (
                  <Button
                    key={value}
                    variant={options.extractImages === value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleExtractImagesChange(value)}
                  >
                    {value === 'ignore' && 'Ignore'}
                    {value === 'alt_text' && 'Alt Text'}
                    {value === 'description' && 'Description'}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                {options.extractImages === 'ignore' && 'Skip images entirely'}
                {options.extractImages === 'alt_text' && 'Extract alt text only'}
                {options.extractImages === 'description' && 'Generate image descriptions (requires vision model)'}
              </p>
            </div>
          </div>

          {/* Custom Rules */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Custom Rules</h4>
            <div className="space-y-2">
              <Label>Regex Patterns</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter regex pattern (e.g., /\d+/g)"
                  value={newCustomRule}
                  onChange={(e) => setNewCustomRule(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomRule()}
                />
                <Button onClick={addCustomRule} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Add custom regex patterns to remove specific text patterns
              </p>
            </div>

            {options.customRules.length > 0 && (
              <div className="space-y-2">
                <Label>Active Rules</Label>
                <div className="flex flex-wrap gap-2">
                  {options.customRules.map((rule, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <code className="text-xs">{rule}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCustomRule(index)}
                        className="h-4 w-4 p-0 hover:bg-red-100"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Section */}
      {previewVisible && previewText && (
        <Card>
          <CardHeader>
            <CardTitle>Cleaning Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Original Text</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm font-mono max-h-40 overflow-y-auto">
                  {previewText.substring(0, 500)}
                  {previewText.length > 500 && '...'}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Cleaned Text</Label>
                <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm font-mono max-h-40 overflow-y-auto">
                  {/* This would be populated by the preview function */}
                  <span className="text-gray-500 italic">
                    Click &quot;Show Preview&quot; to see cleaned text
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

