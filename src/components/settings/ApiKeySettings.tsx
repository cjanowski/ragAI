"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ApiKeySettingsProps {
  onApiKeyChange?: (apiKey: string) => void;
  className?: string;
}

export function ApiKeySettings({ onApiKeyChange, className }: ApiKeySettingsProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      onApiKeyChange?.(savedApiKey);
    }
  }, [onApiKeyChange]);

  const handleApiKeyChange = (value: string) => {
    setApiKey(value);
    setValidationStatus('idle');
    setValidationMessage('');
    
    // Save to localStorage
    if (value) {
      localStorage.setItem('gemini_api_key', value);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    
    onApiKeyChange?.(value);
  };

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationMessage('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationStatus('idle');

    try {
      // Test the API key by making a simple request
      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      const result = await response.json();

      if (result.success) {
        setValidationStatus('valid');
        setValidationMessage('API key is valid and working!');
      } else {
        setValidationStatus('invalid');
        setValidationMessage(result.error || 'API key validation failed');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage('Failed to validate API key. Please check your connection.');
    } finally {
      setIsValidating(false);
    }
  };

  const getValidationIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getValidationColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'text-green-600';
      case 'invalid':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card className={cn("bg-white/80 backdrop-blur-sm border-gray-200", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Gemini API Configuration
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure your Google Gemini API key to power the RAG pipeline
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="apiKey">Gemini API Key</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder="Enter your Gemini API key..."
              className="pr-10 bg-white/80"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4 text-gray-500" />
              ) : (
                <Eye className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
          
          {/* Validation Status */}
          {validationMessage && (
            <div className={cn("flex items-center gap-2 text-sm", getValidationColor())}>
              {getValidationIcon()}
              {validationMessage}
            </div>
          )}
        </div>

        {/* Validation Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={validateApiKey}
            disabled={!apiKey.trim() || isValidating}
            variant="outline"
            className="bg-white/60 hover:bg-white/80"
          >
            {isValidating ? 'Validating...' : 'Test API Key'}
          </Button>
          
          {validationStatus === 'valid' && (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Valid
            </Badge>
          )}
        </div>

        {/* API Key Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">How to get your Gemini API key:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Visit the Google AI Studio</li>
            <li>Sign in with your Google account</li>
            <li>Click &quot;Get API key&quot; in the left sidebar</li>
            <li>Create a new API key or use an existing one</li>
            <li>Copy the API key and paste it above</li>
          </ol>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/60 hover:bg-white/80 text-blue-700 border-blue-300"
              onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Get API Key
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-900 mb-2">Security Notice:</h4>
          <p className="text-sm text-amber-800">
            Your API key is stored locally in your browser and is only sent to Google&apos;s servers 
            to make API requests. It is not stored on our servers or shared with third parties.
          </p>
        </div>

        {/* Pricing Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Gemini API Pricing:</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div className="flex justify-between">
              <span>Gemini 1.5 Flash:</span>
              <span>$0.075 / 1M input tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Gemini 1.5 Pro:</span>
              <span>$1.25 / 1M input tokens</span>
            </div>
            <div className="flex justify-between">
              <span>Text Embedding:</span>
              <span>$0.00025 / 1M tokens</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Prices are subject to change. Check Google&apos;s pricing page for the latest rates.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}