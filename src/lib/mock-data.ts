import { ComponentOption } from '@/types';
import { generateEmbeddingComponentOptions } from './embedding-models';

export const MOCK_COMPONENT_OPTIONS: ComponentOption[] = [
  // Ingestion Components
  {
    id: 'pdf-loader',
    name: 'PDF Loader',
    description: 'Extract text from PDF documents with support for tables and images',
    category: 'ingestion',
    parameters: [
      {
        name: 'extractTables',
        type: 'select',
        required: false,
        defaultValue: 'text',
        options: ['ignore', 'text', 'structured']
      },
      {
        name: 'extractImages',
        type: 'select',
        required: false,
        defaultValue: 'ignore',
        options: ['ignore', 'alt_text', 'description']
      }
    ],
    tradeoffs: {
      pros: ['Handles complex layouts', 'Preserves document structure', 'Supports OCR'],
      cons: ['Slower processing', 'May struggle with scanned PDFs', 'Higher memory usage'],
      useCases: ['Research papers', 'Technical documentation', 'Reports'],
      cost: {
        setup: 0,
        perOperation: 0.001,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'text-loader',
    name: 'Text Loader',
    description: 'Simple text file loader for plain text documents',
    category: 'ingestion',
    parameters: [
      {
        name: 'encoding',
        type: 'select',
        required: false,
        defaultValue: 'utf-8',
        options: ['utf-8', 'ascii', 'latin-1']
      }
    ],
    tradeoffs: {
      pros: ['Fast processing', 'Low memory usage', 'Simple and reliable'],
      cons: ['No formatting preservation', 'Limited to plain text'],
      useCases: ['Code files', 'Simple documents', 'Logs'],
      cost: {
        setup: 0,
        perOperation: 0.0001,
        monthly: 0,
        currency: 'USD'
      }
    }
  },

  // Chunking Components
  {
    id: 'fixed-chunking',
    name: 'Fixed-Size Chunking',
    description: 'Split text into fixed-size chunks with configurable overlap',
    category: 'chunking',
    parameters: [
      {
        name: 'chunkSize',
        type: 'number',
        required: true,
        defaultValue: 1000,
        validation: { min: 100, max: 8000 }
      },
      {
        name: 'chunkOverlap',
        type: 'number',
        required: true,
        defaultValue: 200,
        validation: { min: 0, max: 1000 }
      }
    ],
    tradeoffs: {
      pros: ['Predictable chunk sizes', 'Fast processing', 'Simple to understand', 'Memory efficient'],
      cons: ['May break semantic units', 'Context boundaries ignored', 'Poor for structured content'],
      useCases: ['General purpose', 'Large documents', 'Quick prototyping', 'Memory-constrained environments'],
      cost: {
        setup: 0,
        perOperation: 0.0001,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'recursive-chunking',
    name: 'Recursive Chunking',
    description: 'Recursively split text using multiple separators (paragraphs, sentences, words)',
    category: 'chunking',
    parameters: [
      {
        name: 'chunkSize',
        type: 'number',
        required: true,
        defaultValue: 1000,
        validation: { min: 100, max: 8000 }
      },
      {
        name: 'chunkOverlap',
        type: 'number',
        required: true,
        defaultValue: 200,
        validation: { min: 0, max: 1000 }
      },
      {
        name: 'separators',
        type: 'multiselect',
        required: false,
        defaultValue: ['\n\n', '\n', '. ', ' '],
        options: ['\n\n', '\n', '. ', ' ', '!', '?']
      }
    ],
    tradeoffs: {
      pros: ['Respects document structure', 'Better context preservation', 'Configurable separators', 'Good balance'],
      cons: ['More complex than fixed', 'Variable chunk sizes', 'Requires separator tuning'],
      useCases: ['Structured documents', 'Mixed content types', 'Production systems', 'Most common choice'],
      cost: {
        setup: 0,
        perOperation: 0.0002,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'document-chunking',
    name: 'Document-Based Chunking',
    description: 'Split based on document structure (headers, sections, pages)',
    category: 'chunking',
    parameters: [
      {
        name: 'chunkSize',
        type: 'number',
        required: true,
        defaultValue: 2000,
        validation: { min: 500, max: 8000 }
      },
      {
        name: 'preserveStructure',
        type: 'boolean',
        required: false,
        defaultValue: true
      },
      {
        name: 'headerLevels',
        type: 'multiselect',
        required: false,
        defaultValue: ['h1', 'h2', 'h3'],
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
      }
    ],
    tradeoffs: {
      pros: ['Preserves document hierarchy', 'Natural boundaries', 'Context-aware', 'Good for navigation'],
      cons: ['Requires structured input', 'Variable chunk sizes', 'May create large chunks'],
      useCases: ['Technical documentation', 'Academic papers', 'Structured reports', 'Hierarchical content'],
      cost: {
        setup: 0,
        perOperation: 0.0003,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'semantic-chunking',
    name: 'Semantic Chunking',
    description: 'Split text based on semantic similarity using embeddings',
    category: 'chunking',
    parameters: [
      {
        name: 'threshold',
        type: 'number',
        required: true,
        defaultValue: 0.8,
        validation: { min: 0.1, max: 1.0 }
      },
      {
        name: 'maxChunkSize',
        type: 'number',
        required: true,
        defaultValue: 2000,
        validation: { min: 500, max: 8000 }
      },
      {
        name: 'embeddingModel',
        type: 'select',
        required: false,
        defaultValue: 'sentence-transformers/all-MiniLM-L6-v2',
        options: ['sentence-transformers/all-MiniLM-L6-v2', 'openai/text-embedding-ada-002']
      }
    ],
    tradeoffs: {
      pros: ['Preserves semantic coherence', 'Better context boundaries', 'Improved retrieval', 'Content-aware'],
      cons: ['Slower processing', 'Requires embeddings', 'Variable chunk sizes', 'Higher cost'],
      useCases: ['Academic papers', 'Technical docs', 'Narrative content', 'High-quality retrieval'],
      cost: {
        setup: 0,
        perOperation: 0.002,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'agentic-chunking',
    name: 'Agentic Chunking',
    description: 'AI-powered chunking that understands content and creates optimal boundaries',
    category: 'chunking',
    parameters: [
      {
        name: 'maxChunkSize',
        type: 'number',
        required: true,
        defaultValue: 2000,
        validation: { min: 500, max: 8000 }
      },
      {
        name: 'llmModel',
        type: 'select',
        required: true,
        defaultValue: 'gpt-3.5-turbo',
        options: ['gpt-3.5-turbo', 'gpt-4', 'claude-3-sonnet']
      },
      {
        name: 'qualityThreshold',
        type: 'number',
        required: false,
        defaultValue: 0.9,
        validation: { min: 0.5, max: 1.0 }
      }
    ],
    tradeoffs: {
      pros: ['Highest quality boundaries', 'Content understanding', 'Adaptive to content type', 'Best retrieval'],
      cons: ['Slowest processing', 'Highest cost', 'Requires LLM calls', 'Complex setup'],
      useCases: ['Premium applications', 'Complex documents', 'Research systems', 'Maximum quality needs'],
      cost: {
        setup: 0,
        perOperation: 0.01,
        monthly: 0,
        currency: 'USD'
      }
    }
  },

  // Embedding Components - Generated from embedding-models.ts
  ...generateEmbeddingComponentOptions(),

  // Vector Store Components
  {
    id: 'pinecone',
    name: 'Pinecone',
    description: 'Managed vector database with high performance and scalability',
    category: 'vectorstore',
    parameters: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        defaultValue: ''
      },
      {
        name: 'environment',
        type: 'string',
        required: true,
        defaultValue: 'us-east1-gcp'
      },
      {
        name: 'indexName',
        type: 'string',
        required: true,
        defaultValue: 'rag-index'
      }
    ],
    tradeoffs: {
      pros: ['Fully managed', 'High performance', 'Auto-scaling', 'Hybrid search'],
      cons: ['Vendor lock-in', 'Costs scale with usage', 'Limited customization'],
      useCases: ['Production systems', 'High-scale applications', 'Managed infrastructure'],
      cost: {
        setup: 0,
        perOperation: 0.0001,
        monthly: 70,
        currency: 'USD'
      }
    }
  },
  {
    id: 'chroma',
    name: 'Chroma',
    description: 'Open-source vector database that can run locally or in the cloud',
    category: 'vectorstore',
    parameters: [
      {
        name: 'persistDirectory',
        type: 'string',
        required: false,
        defaultValue: './chroma_db'
      },
      {
        name: 'host',
        type: 'string',
        required: false,
        defaultValue: 'localhost'
      },
      {
        name: 'port',
        type: 'number',
        required: false,
        defaultValue: 8000
      }
    ],
    tradeoffs: {
      pros: ['Open source', 'Local deployment', 'No vendor lock-in', 'Easy setup'],
      cons: ['Self-managed', 'Limited enterprise features', 'Scaling complexity'],
      useCases: ['Development', 'Small to medium scale', 'Cost-sensitive projects'],
      cost: {
        setup: 0,
        perOperation: 0,
        monthly: 15,
        currency: 'USD'
      }
    }
  },

  // Retrieval Components
  {
    id: 'vector-search',
    name: 'Vector Search',
    description: 'Basic semantic search using vector similarity',
    category: 'retrieval',
    parameters: [
      {
        name: 'topK',
        type: 'number',
        required: true,
        defaultValue: 5,
        validation: { min: 1, max: 50 }
      },
      {
        name: 'scoreThreshold',
        type: 'number',
        required: false,
        defaultValue: 0.7,
        validation: { min: 0, max: 1 }
      }
    ],
    tradeoffs: {
      pros: ['Fast retrieval', 'Good semantic matching', 'Simple implementation'],
      cons: ['No keyword matching', 'May miss exact matches', 'Context dependent'],
      useCases: ['Semantic search', 'Conceptual queries', 'General RAG'],
      cost: {
        setup: 0,
        perOperation: 0.0001,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'hybrid-search',
    name: 'Hybrid Search',
    description: 'Combines vector search with keyword search for better results',
    category: 'retrieval',
    parameters: [
      {
        name: 'topK',
        type: 'number',
        required: true,
        defaultValue: 10,
        validation: { min: 1, max: 50 }
      },
      {
        name: 'alpha',
        type: 'number',
        required: true,
        defaultValue: 0.5,
        validation: { min: 0, max: 1 }
      }
    ],
    tradeoffs: {
      pros: ['Best of both worlds', 'Handles exact matches', 'More robust'],
      cons: ['More complex', 'Slower than pure vector', 'Requires tuning'],
      useCases: ['Mixed query types', 'Technical documentation', 'Fact-based QA'],
      cost: {
        setup: 0,
        perOperation: 0.0002,
        monthly: 0,
        currency: 'USD'
      }
    }
  },

  // Generation Components
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s most capable model for complex reasoning with 2M token context window',
    category: 'generation',
    parameters: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        defaultValue: ''
      },
      {
        name: 'temperature',
        type: 'number',
        required: false,
        defaultValue: 0.1,
        validation: { min: 0, max: 2 }
      },
      {
        name: 'maxTokens',
        type: 'number',
        required: false,
        defaultValue: 1000,
        validation: { min: 1, max: 8192 }
      },
      {
        name: 'systemPrompt',
        type: 'string',
        required: false,
        defaultValue: 'You are a helpful AI assistant.'
      }
    ],
    tradeoffs: {
      pros: ['Largest context window (2M tokens)', 'Multimodal capabilities', 'Strong reasoning', 'Code generation'],
      cons: ['Higher cost', 'Rate limits', 'Requires API key'],
      useCases: ['Long document analysis', 'Complex reasoning', 'Multimodal tasks', 'Code generation'],
      cost: {
        setup: 0,
        perOperation: 0.0125,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Google\'s fast and efficient model with 1M token context window',
    category: 'generation',
    parameters: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        defaultValue: ''
      },
      {
        name: 'temperature',
        type: 'number',
        required: false,
        defaultValue: 0.1,
        validation: { min: 0, max: 2 }
      },
      {
        name: 'maxTokens',
        type: 'number',
        required: false,
        defaultValue: 1000,
        validation: { min: 1, max: 8192 }
      },
      {
        name: 'systemPrompt',
        type: 'string',
        required: false,
        defaultValue: 'You are a helpful AI assistant.'
      }
    ],
    tradeoffs: {
      pros: ['Very fast responses', 'Cost effective', 'Large context (1M tokens)', 'Multimodal'],
      cons: ['Less capable than Pro', 'Rate limits', 'Requires API key'],
      useCases: ['Production systems', 'Real-time applications', 'Cost-conscious deployments'],
      cost: {
        setup: 0,
        perOperation: 0.00075,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash 8B',
    description: 'Google\'s smallest and fastest model for simple tasks',
    category: 'generation',
    parameters: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        defaultValue: ''
      },
      {
        name: 'temperature',
        type: 'number',
        required: false,
        defaultValue: 0.1,
        validation: { min: 0, max: 2 }
      },
      {
        name: 'maxTokens',
        type: 'number',
        required: false,
        defaultValue: 1000,
        validation: { min: 1, max: 8192 }
      },
      {
        name: 'systemPrompt',
        type: 'string',
        required: false,
        defaultValue: 'You are a helpful AI assistant.'
      }
    ],
    tradeoffs: {
      pros: ['Fastest responses', 'Lowest cost', 'Large context (1M tokens)', 'Efficient'],
      cons: ['Least capable', 'Text only', 'Rate limits'],
      useCases: ['Simple Q&A', 'High-volume applications', 'Budget-conscious projects'],
      cost: {
        setup: 0,
        perOperation: 0.000375,
        monthly: 0,
        currency: 'USD'
      }
    }
  }
];

export const PIPELINE_STAGES = [
  { id: 'ingestion', name: 'Data Ingestion', description: 'Load and preprocess documents' },
  { id: 'chunking', name: 'Text Chunking', description: 'Split documents into manageable pieces' },
  { id: 'embedding', name: 'Embedding', description: 'Convert text to vector representations' },
  { id: 'vectorstore', name: 'Vector Storage', description: 'Store and index embeddings' },
  { id: 'retrieval', name: 'Retrieval', description: 'Find relevant context for queries' },
  { id: 'generation', name: 'Generation', description: 'Generate responses using LLMs' }
];

export function getComponentsByCategory(category: string): ComponentOption[] {
  return MOCK_COMPONENT_OPTIONS.filter(component => component.category === category);
}

export function getComponentById(id: string): ComponentOption | undefined {
  return MOCK_COMPONENT_OPTIONS.find(component => component.id === id);
}