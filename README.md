# RAG Configurator

A sophisticated web application that enables developers to design, configure, evaluate, and export Retrieval-Augmented Generation (RAG) pipelines through an intuitive visual interface.

<img width="1512" height="823" alt="Screenshot 2025-08-04 at 7 36 15 AM" src="https://github.com/user-attachments/assets/ff730b54-4916-4ab1-a1c6-86de2c5bdb2a" />

## Features

- **Visual Pipeline Builder**: Interactive UI for configuring RAG pipeline components
- **Real-time Testing**: Test your configured pipeline with document uploads and chat interface
- **Comprehensive Evaluation**: RAG Triad scoring and component-level metrics
- **Code Export**: Generate executable Python scripts, YAML configurations, and JSON schemas
- **Vercel AI SDK Integration**: Streaming chat responses with multiple LLM providers

## Tech Stack

- **Frontend**: Next.js 14+ with App Router, React, TypeScript, Tailwind CSS
- **AI Integration**: Vercel AI SDK with OpenAI, Anthropic, and Google providers
- **Backend**: Vercel Serverless Functions
- **Storage**: Vercel Blob, KV, and Postgres
- **UI Components**: Shadcn/ui component library

## Project Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/            # API endpoints
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
├── lib/                # Utility functions and configurations
│   ├── ai-config.ts    # AI SDK configuration
│   └── utils.ts        # Utility functions
└── types/              # TypeScript type definitions
    └── index.ts        # Core pipeline types
```

## Development

This project uses:
- TypeScript for type safety
- ESLint for code linting
- Tailwind CSS for styling
- Vercel AI SDK for streaming AI responses

## License

MIT License
