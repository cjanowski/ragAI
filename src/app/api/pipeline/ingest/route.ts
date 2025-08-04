import { NextRequest, NextResponse } from 'next/server';
import { PipelineManager } from '@/lib/pipeline-engine';
import { Document } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { pipelineId, documents }: { pipelineId: string; documents: Document[] } = await request.json();
    
    if (!pipelineId) {
      return NextResponse.json(
        { success: false, error: 'Pipeline ID required' },
        { status: 400 }
      );
    }
    
    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Documents array required' },
        { status: 400 }
      );
    }
    
    // Ingest documents into pipeline
    await PipelineManager.ingestDocuments(pipelineId, documents);
    
    return NextResponse.json({
      success: true,
      data: {
        message: `Successfully ingested ${documents.length} documents`,
        documentsProcessed: documents.length
      }
    });
    
  } catch (error) {
    console.error('Document ingestion error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to ingest documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}