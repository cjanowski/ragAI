"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { EmbeddingConfig, ChunkingConfig } from '@/types';
import { 
  EMBEDDING_MODELS, 
  EmbeddingModelInfo, 
  getAllEmbeddingModels,
  getModelsByProvider,
  calculateMonthlyCost,
  getOptimalBatchSize,
  estimateProcessingTime,
  EMBEDDING_PROVIDERS
} from '@/lib/embedding-models';
import { validateEmbeddingCompatibility } from '@/lib/embedding-compatibility';
import { 
  Brain, 
  Zap, 
  DollarSign, 
  Clock, 
  Server, 
  Cloud, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  TrendingUp,
  Globe,
  Code,
  Cpu,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmbeddingConfigurationProps {
  config: EmbeddingConfig;
  chunkingConfig?: ChunkingConfig;
  onConfigChange: (config: EmbeddingConfig) => void;
  className?: string;
}

export function EmbeddingConfiguration({
  config,
  chunkingConfig,
  onConfigChange,
  className
}: EmbeddingConfigurationProps) {
  const [activeTab, setActiveTab] = useState('select');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'mteb' | 'cost' | 'dimensions'>('mteb');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [costScenario, setCostScenario] = useState({
    documentsPerMonth: 1000,
    avgTokensPerDocument: 2000
  });

  const allModels = getAllEmbeddingModels();
  const selectedModel = EMBEDDING_MODELS[config.model];
  const compatibility = chunkingConfig && selectedModel ? 
    validateEmbeddingCompatibility(chunkingConfig, config) : null;

  // Filter and sort models
  const filteredModels = useMemo(() => {
    let models = selectedProvider === 'all' ? 
      allModels : 
      getModelsByProvider(selectedProvider);

    // Sort models
    models = models.sort((a, b) => {
      switch (sortBy) {
        case 'mteb':
          return b.mtebScore - a.mtebScore;
        case 'cost':
          return a.costPer1MTokens - b.costPer1MTokens;
        case 'dimensions':
          return b.dimensions - a.dimensions;
        default:
          return 0;
      }
    });

    return models;
  }, [allModels, selectedProvider, sortBy]);

  // Get unique providers
  const providers = useMemo(() => {
    const providerSet = new Set(allModels.map(model => model.provider));
    return Array.from(providerSet);
  }, [allModels]);

  const handleModelSelect = (model: EmbeddingModelInfo) => {
    const provider = EMBEDDING_PROVIDERS[model.provider.toLowerCase()] || 
                    EMBEDDING_PROVIDERS['self-hosted'];
    
    onConfigChange({
      ...config,
      provider: model.provider,
      model: model.id,
      dimensions: model.dimensions,
      maxTokens: model.maxTokens,
      batchSize: getOptimalBatchSize(model, provider)
    });
  };

  const handleParameterChange = (parameter: string, value: any) => {
    onConfigChange({
      ...config,
      parameters: {
        ...config.parameters,
        [parameter]: value
      }
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai': return <Brain className="h-4 w-4" />;
      case 'cohere': return <Zap className="h-4 w-4" />;
      case 'voyage ai': return <TrendingUp className="h-4 w-4" />;
      case 'sentence transformers':
      case 'baai':
      case 'microsoft': return <Server className="h-4 w-4" />;
      default: return <Cloud className="h-4 w-4" />;
    }
  };

  const getDeploymentBadge = (deploymentType: string) => {
    switch (deploymentType) {
      case 'api':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">API</Badge>;
      case 'self-hosted':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Self-Hosted</Badge>;
      case 'both':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Flexible</Badge>;
      default:
        return null;
    }
  };

  const getMTEBScoreColor = (score: number) => {
    if (score >= 65) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Embedding Model Configuration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Select and configure the embedding model for converting text to vectors
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="select">Select Model</TabsTrigger>
              <TabsTrigger value="compare">Compare</TabsTrigger>
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="costs">Cost Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="select" className="space-y-6 mt-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Label>Provider:</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map(provider => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label>Sort by:</Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mteb">MTEB Score</SelectItem>
                      <SelectItem value="cost">Cost</SelectItem>
                      <SelectItem value="dimensions">Dimensions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Model Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModels.map((model) => {
                  const isSelected = config.model === model.id;
                  const costInfo = calculateMonthlyCost(model, 1000, 2000);
                  
                  return (
                    <Card
                      key={model.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        isSelected 
                          ? "ring-2 ring-purple-500 bg-purple-50/50 border-purple-200" 
                          : "hover:border-gray-300 bg-white/60"
                      )}
                      onClick={() => handleModelSelect(model)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {getProviderIcon(model.provider)}
                            <div>
                              <CardTitle className="text-sm font-semibold">
                                {model.name}
                              </CardTitle>
                              <p className="text-xs text-gray-600">{model.provider}</p>
                            </div>
                          </div>
                          {getDeploymentBadge(model.deploymentType)}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {/* MTEB Score */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">MTEB Score</span>
                          <span className={cn("font-bold text-sm", getMTEBScoreColor(model.mtebScore))}>
                            {model.mtebScore}
                          </span>
                        </div>
                        
                        {/* Key specs */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Dimensions:</span>
                            <span className="font-medium ml-1">{model.dimensions}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Context:</span>
                            <span className="font-medium ml-1">{model.maxTokens}</span>
                          </div>
                        </div>
                        
                        {/* Cost */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Monthly Cost</span>
                          <span className="font-bold text-sm text-green-600">
                            ${costInfo.totalCost.toFixed(2)}
                          </span>
                        </div>
                        
                        {/* Languages */}
                        <div className="flex flex-wrap gap-1">
                          {model.languages.map(lang => (
                            <Badge key={lang} variant="outline" className="text-xs px-1 py-0">
                              {lang === 'multilingual' ? (
                                <><Globe className="h-3 w-3 mr-1" />Multi</>
                              ) : lang === 'code' ? (
                                <><Code className="h-3 w-3 mr-1" />Code</>
                              ) : lang}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="compare" className="mt-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-3 font-semibold">Model</th>
                      <th className="text-center p-3 font-semibold">MTEB Score</th>
                      <th className="text-center p-3 font-semibold">Dimensions</th>
                      <th className="text-center p-3 font-semibold">Context</th>
                      <th className="text-center p-3 font-semibold">Cost/1M</th>
                      <th className="text-center p-3 font-semibold">Deployment</th>
                      <th className="text-center p-3 font-semibold">Languages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((model) => {
                      const isSelected = config.model === model.id;
                      
                      return (
                        <tr 
                          key={model.id}
                          className={cn(
                            "border-b border-gray-100 hover:bg-gray-50 cursor-pointer",
                            isSelected && "bg-purple-50 border-purple-200"
                          )}
                          onClick={() => handleModelSelect(model)}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getProviderIcon(model.provider)}
                              <div>
                                <div className="font-medium text-sm">{model.name}</div>
                                <div className="text-xs text-gray-600">{model.provider}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-3">
                            <span className={cn("font-bold", getMTEBScoreColor(model.mtebScore))}>
                              {model.mtebScore}
                            </span>
                          </td>
                          <td className="text-center p-3 font-medium">{model.dimensions}</td>
                          <td className="text-center p-3 font-medium">{model.maxTokens}</td>
                          <td className="text-center p-3">
                            <span className="font-medium">
                              {model.costPer1MTokens === 0 ? 'Free*' : `$${model.costPer1MTokens}`}
                            </span>
                          </td>
                          <td className="text-center p-3">
                            {getDeploymentBadge(model.deploymentType)}
                          </td>
                          <td className="text-center p-3">
                            <div className="flex justify-center gap-1">
                              {model.languages.slice(0, 2).map(lang => (
                                <Badge key={lang} variant="outline" className="text-xs">
                                  {lang === 'multilingual' ? 'Multi' : 
                                   lang === 'code' ? 'Code' : lang}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* MTEB Score Breakdown */}
              {selectedModel && (
                <Card className="mt-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-purple-900">
                      MTEB Score Breakdown - {selectedModel.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(selectedModel.mtebScores).map(([category, score]) => (
                        <div key={category} className="text-center">
                          <div className="text-sm font-medium text-purple-800 capitalize">
                            {category.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className={cn("text-lg font-bold", getMTEBScoreColor(score))}>
                            {score}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="configure" className="space-y-6 mt-6">
              {selectedModel ? (
                <>
                  {/* Selected Model Info */}
                  <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-900">
                        {getProviderIcon(selectedModel.provider)}
                        {selectedModel.name}
                      </CardTitle>
                      <p className="text-sm text-purple-700">
                        {selectedModel.specialFeatures.join(' • ')}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-purple-700">MTEB Score</div>
                          <div className={cn("text-xl font-bold", getMTEBScoreColor(selectedModel.mtebScore))}>
                            {selectedModel.mtebScore}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-purple-700">Dimensions</div>
                          <div className="text-xl font-bold text-purple-900">{selectedModel.dimensions}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-purple-700">Max Tokens</div>
                          <div className="text-xl font-bold text-purple-900">{selectedModel.maxTokens}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-purple-700">Cost/1M Tokens</div>
                          <div className="text-xl font-bold text-green-600">
                            {selectedModel.costPer1MTokens === 0 ? 'Free*' : `$${selectedModel.costPer1MTokens}`}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Configuration Parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* API Key (if required) */}
                    {selectedModel.deploymentType === 'api' && (
                      <div className="space-y-2">
                        <Label htmlFor="apiKey">API Key *</Label>
                        <Input
                          id="apiKey"
                          type="password"
                          placeholder="Enter your API key"
                          value={config.apiKey || ''}
                          onChange={(e) => handleParameterChange('apiKey', e.target.value)}
                          className="bg-white/80"
                        />
                        <p className="text-xs text-gray-600">
                          Required for API-based models. Keep this secure.
                        </p>
                      </div>
                    )}

                    {/* Batch Size */}
                    <div className="space-y-2">
                      <Label htmlFor="batchSize">Batch Size</Label>
                      <Input
                        id="batchSize"
                        type="number"
                        value={config.batchSize}
                        onChange={(e) => onConfigChange({ 
                          ...config, 
                          batchSize: parseInt(e.target.value) || 1 
                        })}
                        min={1}
                        max={EMBEDDING_PROVIDERS[selectedModel.provider.toLowerCase()]?.maxBatchSize || 100}
                        className="bg-white/80"
                      />
                      <p className="text-xs text-gray-600">
                        Number of texts to process in each batch. Higher values are more efficient but use more memory.
                      </p>
                    </div>

                    {/* Model-specific parameters */}
                    {selectedModel.id.includes('openai-3') && (
                      <div className="space-y-2">
                        <Label>Dimensions</Label>
                        <Select 
                          value={config.dimensions?.toString()} 
                          onValueChange={(value) => onConfigChange({ 
                            ...config, 
                            dimensions: parseInt(value) 
                          })}
                        >
                          <SelectTrigger className="bg-white/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedModel.dimensions === 3072 ? (
                              <>
                                <SelectItem value="1536">1536 (Faster, cheaper)</SelectItem>
                                <SelectItem value="3072">3072 (Higher quality)</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="512">512 (Faster, cheaper)</SelectItem>
                                <SelectItem value="1536">1536 (Higher quality)</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedModel.provider === 'Cohere' && (
                      <div className="space-y-2">
                        <Label>Input Type</Label>
                        <Select 
                          value={config.parameters?.inputType || 'search_document'}
                          onValueChange={(value) => handleParameterChange('inputType', value)}
                        >
                          <SelectTrigger className="bg-white/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="search_document">Search Document</SelectItem>
                            <SelectItem value="search_query">Search Query</SelectItem>
                            <SelectItem value="classification">Classification</SelectItem>
                            <SelectItem value="clustering">Clustering</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-600">
                          Optimize embeddings for specific use cases.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Advanced Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={showAdvanced}
                        onCheckedChange={setShowAdvanced}
                      />
                      <Label>Show Advanced Configuration</Label>
                    </div>

                    {showAdvanced && (
                      <Card className="bg-gray-50 border-gray-200">
                        <CardHeader>
                          <CardTitle className="text-sm">Advanced Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Max Concurrent Requests</Label>
                              <Input
                                type="number"
                                value={config.parameters?.maxConcurrency || 5}
                                onChange={(e) => handleParameterChange('maxConcurrency', parseInt(e.target.value) || 5)}
                                min={1}
                                max={20}
                                className="bg-white/80"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Retry Attempts</Label>
                              <Input
                                type="number"
                                value={config.parameters?.retryAttempts || 3}
                                onChange={(e) => handleParameterChange('retryAttempts', parseInt(e.target.value) || 3)}
                                min={0}
                                max={10}
                                className="bg-white/80"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Hosting Requirements (for self-hosted models) */}
                  {selectedModel.deploymentType === 'self-hosted' && selectedModel.hostingRequirements && (
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-900">
                          <Server className="h-5 w-5" />
                          Hosting Requirements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <HardDrive className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">RAM</div>
                              <div className="text-sm text-green-700">{selectedModel.hostingRequirements.minRAM}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">VRAM</div>
                              <div className="text-sm text-green-700">{selectedModel.hostingRequirements.minVRAM}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">GPU</div>
                              <div className="text-sm text-green-700">{selectedModel.hostingRequirements.recommendedGPU}</div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-100 rounded-lg">
                          <p className="text-sm text-green-800">
                            <strong>Model Size:</strong> {selectedModel.modelSize} - 
                            Self-hosted models provide privacy and no per-token costs but require infrastructure management.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Compatibility Check */}
                  {compatibility && (
                    <Card className={cn(
                      "border-2",
                      compatibility.isCompatible ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                    )}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {compatibility.isCompatible ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          )}
                          Chunking Compatibility
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {compatibility.errors.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-red-800">Errors:</h4>
                            <ul className="space-y-1">
                              {compatibility.errors.map((error, index) => (
                                <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {compatibility.warnings.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-yellow-800">Warnings:</h4>
                            <ul className="space-y-1">
                              {compatibility.warnings.map((warning, index) => (
                                <li key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                                  <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {warning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {compatibility.recommendations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-semibold text-blue-800">Recommendations:</h4>
                            <ul className="space-y-1">
                              {compatibility.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Model Selected</h3>
                  <p className="text-gray-500">Please select an embedding model from the &quot;Select Model&quot; tab.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="costs" className="space-y-6 mt-6">
              {/* Cost Scenario Configuration */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <DollarSign className="h-5 w-5" />
                    Cost Analysis Scenario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Documents per Month</Label>
                      <Input
                        type="number"
                        value={costScenario.documentsPerMonth}
                        onChange={(e) => setCostScenario({
                          ...costScenario,
                          documentsPerMonth: parseInt(e.target.value) || 0
                        })}
                        min={1}
                        className="bg-white/80"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Average Tokens per Document</Label>
                      <Input
                        type="number"
                        value={costScenario.avgTokensPerDocument}
                        onChange={(e) => setCostScenario({
                          ...costScenario,
                          avgTokensPerDocument: parseInt(e.target.value) || 0
                        })}
                        min={1}
                        className="bg-white/80"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cost Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left p-4 font-semibold">Model</th>
                      <th className="text-center p-4 font-semibold">Token Cost</th>
                      <th className="text-center p-4 font-semibold">Infrastructure</th>
                      <th className="text-center p-4 font-semibold">Total Monthly</th>
                      <th className="text-center p-4 font-semibold">Per Document</th>
                      <th className="text-center p-4 font-semibold">Processing Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((model) => {
                      const costInfo = calculateMonthlyCost(
                        model, 
                        costScenario.documentsPerMonth, 
                        costScenario.avgTokensPerDocument
                      );
                      const provider = EMBEDDING_PROVIDERS[model.provider.toLowerCase()] || 
                                      EMBEDDING_PROVIDERS['self-hosted'];
                      const timeInfo = estimateProcessingTime(
                        costScenario.documentsPerMonth,
                        getOptimalBatchSize(model, provider),
                        model,
                        provider
                      );
                      const isSelected = config.model === model.id;
                      
                      return (
                        <tr 
                          key={model.id}
                          className={cn(
                            "border-b border-gray-100 hover:bg-gray-50",
                            isSelected && "bg-purple-50 border-purple-200"
                          )}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              {getProviderIcon(model.provider)}
                              <div>
                                <div className="font-medium text-sm">{model.name}</div>
                                <div className="text-xs text-gray-600">{model.provider}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-4">
                            <span className="font-medium text-green-600">
                              ${costInfo.tokenCost.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center p-4">
                            <span className="font-medium text-blue-600">
                              ${costInfo.infrastructureCost.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center p-4">
                            <span className="font-bold text-lg">
                              ${costInfo.totalCost.toFixed(2)}
                            </span>
                          </td>
                          <td className="text-center p-4">
                            <span className="font-medium">
                              ${(costInfo.totalCost / costScenario.documentsPerMonth).toFixed(4)}
                            </span>
                          </td>
                          <td className="text-center p-4">
                            <div className="flex items-center justify-center gap-1">
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="text-sm">
                                {timeInfo.estimatedMinutes < 1 ? 
                                  '<1 min' : 
                                  `${Math.round(timeInfo.estimatedMinutes)} min`
                                }
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Selected Model Cost Breakdown */}
              {selectedModel && (
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-900">
                      Cost Breakdown - {selectedModel.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const costInfo = calculateMonthlyCost(
                        selectedModel, 
                        costScenario.documentsPerMonth, 
                        costScenario.avgTokensPerDocument
                      );
                      const totalTokens = costScenario.documentsPerMonth * costScenario.avgTokensPerDocument;
                      
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {(totalTokens / 1000000).toFixed(2)}M
                            </div>
                            <div className="text-sm text-green-700">Total Tokens</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              ${costInfo.tokenCost.toFixed(2)}
                            </div>
                            <div className="text-sm text-blue-700">Token Costs</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              ${costInfo.infrastructureCost.toFixed(2)}
                            </div>
                            <div className="text-sm text-purple-700">Infrastructure</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              ${costInfo.totalCost.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-700">Total Monthly</div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}