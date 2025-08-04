import { NextRequest, NextResponse } from 'next/server';
import { PipelineManager } from '@/lib/pipeline-engine';

export async function POST(request: NextRequest) {
  try {
    const { pipelineId, question }: { pipelineId: string; question: string } = await request.json();
    
    if (!pipelineId) {
      return NextResponse.json(
        { success: false, error: 'Pipeline ID required' },
        { status: 400 }
      );
    }
    
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Question required' },
        { status: 400 }
      );
    }
    
    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const responseGenerator = PipelineManager.queryPipeline(pipelineId, question);
          
          for await (const chunk of responseGenerator) {
            const data = JSON.stringify({ type: 'chunk', data: chunk }) + '\n';
            controller.enqueue(encoder.encode(data));
          }
          
          // Send completion signal
          const completion = JSON.stringify({ type: 'complete' }) + '\n';
          controller.enqueue(encoder.encode(completion));
          
        } catch (error) {
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      }
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
    
  } catch (error) {
    console.error('Pipeline query error:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { success: false, error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to query pipeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}