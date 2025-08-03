import { ComponentOption } from '@/types';

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
      pros: ['Predictable chunk sizes', 'Fast processing', 'Simple to understand'],
      cons: ['May break semantic units', 'Context boundaries ignored'],
      useCases: ['General purpose', 'Large documents', 'Quick prototyping'],
      cost: {
        setup: 0,
        perOperation: 0.0001,
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
      }
    ],
    tradeoffs: {
      pros: ['Preserves semantic coherence', 'Better context boundaries', 'Improved retrieval'],
      cons: ['Slower processing', 'Requires embeddings', 'Variable chunk sizes'],
      useCases: ['Academic papers', 'Technical docs', 'Narrative content'],
      cost: {
        setup: 0,
        perOperation: 0.002,
        monthly: 0,
        currency: 'USD'
      }
    }
  },

  // Embedding Components
  {
    id: 'openai-ada-002',
    name: 'OpenAI text-embedding-ada-002',
    description: 'OpenAI\'s most capable embedding model with 1536 dimensions',
    category: 'embedding',
    parameters: [
      {
        name: 'apiKey',
        type: 'string',
        required: true,
        defaultValue: ''
      },
      {
        name: 'batchSize',
        type: 'number',
        required: false,
        defaultValue: 100,
        validation: { min: 1, max: 2048 }
      }
    ],
    tradeoffs: {
      pros: ['High quality embeddings', 'Well-tested', 'Good performance'],
      cons: ['API costs', 'Rate limits', 'External dependency'],
      useCases: ['Production systems', 'High accuracy needs', 'General purpose'],
      cost: {
        setup: 0,
        perOperation: 0.0001,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'sentence-transformers',
    name: 'Sentence Transformers',
    description: 'Open-source embedding models running locally',
    category: 'embedding',
    parameters: [
      {
        name: 'modelName',
        type: 'select',
        required: true,
        defaultValue: 'all-MiniLM-L6-v2',
        options: ['all-MiniLM-L6-v2', 'all-mpnet-base-v2', 'multi-qa-MiniLM-L6-cos-v1']
      }
    ],
    tradeoffs: {
      pros: ['No API costs', 'Privacy', 'No rate limits'],
      cons: ['Requires local compute', 'Model management', 'Potentially lower quality'],
      useCases: ['Privacy-sensitive data', 'Cost optimization', 'Offline systems'],
      cost: {
        setup: 50,
        perOperation: 0,
        monthly: 20,
        currency: 'USD'
      }
    }
  },

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
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'OpenAI\'s most capable language model for high-quality responses',
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
        validation: { min: 1, max: 4000 }
      }
    ],
    tradeoffs: {
      pros: ['Highest quality', 'Strong reasoning', 'Follows instructions well'],
      cons: ['Most expensive', 'Slower responses', 'Rate limits'],
      useCases: ['Complex reasoning', 'High-quality content', 'Critical applications'],
      cost: {
        setup: 0,
        perOperation: 0.03,
        monthly: 0,
        currency: 'USD'
      }
    }
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Anthropic\'s balanced model with good performance and cost efficiency',
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
        validation: { min: 0, max: 1 }
      },
      {
        name: 'maxTokens',
        type: 'number',
        required: false,
        defaultValue: 1000,
        validation: { min: 1, max: 4000 }
      }
    ],
    tradeoffs: {
      pros: ['Good balance of quality/cost', 'Fast responses', 'Strong safety'],
      cons: ['Less capable than GPT-4', 'Newer ecosystem', 'Limited availability'],
      useCases: ['Production systems', 'Cost-conscious applications', 'Safe AI needs'],
      cost: {
        setup: 0,
        perOperation: 0.015,
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