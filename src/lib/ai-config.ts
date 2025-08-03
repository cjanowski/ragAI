import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Initialize providers with API keys
const openaiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const anthropicProvider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
});

// Default models for each provider
export const defaultModels = {
  openai: openaiProvider('gpt-4-turbo'),
  anthropic: anthropicProvider('claude-3-sonnet-20240229'),
  google: googleProvider('gemini-pro'),
};

// Streaming configuration
export const streamingConfig = {
  temperature: 0.7,
};