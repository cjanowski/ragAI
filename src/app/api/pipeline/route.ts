import { NextRequest, NextResponse } from 'next/server';
import { PipelineManager, PipelineFactory } from '@/lib/pipeline-engine';
import { PipelineConfiguration } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { configuration, apiKey }: { 
      configuration: PipelineConfiguration; 
      apiKey?: string; 
    } = await request.json();
    
    // Validate configuration
    const validation = PipelineFactory.validateConfiguration(configuration);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid configuration', 
          details: validation.errors 
        },
        { status: 400 }
      );
    }
    
    // Get API key from request or environment
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gemini API key required. Please provide apiKey in request or set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY environment variable.' 
        },
        { status: 400 }
      );
    }
    
    // Create pipeline
    const pipelineId = await PipelineManager.createAndStorePipeline(configuration, geminiApiKey);
    
    return NextResponse.json({
      success: true,
      data: {
        pipelineId,
        status: 'created'
      }
    });
    
  } catch (error) {
    console.error('Pipeline creation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create pipeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('id');
    
    if (pipelineId) {
      // Get specific pipeline
      const pipeline = PipelineManager.getPipeline(pipelineId);
      if (!pipeline) {
        return NextResponse.json(
          { success: false, error: 'Pipeline not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: {
          id: pipeline.id,
          configuration: pipeline.configuration,
          status: pipeline.getStatus()
        }
      });
    } else {
      // Get all pipelines
      const pipelines = PipelineManager.getAllPipelines();
      return NextResponse.json({
        success: true,
        data: pipelines.map(p => ({
          id: p.id,
          name: p.configuration.name,
          status: p.getStatus()
        }))
      });
    }
    
  } catch (error) {
    console.error('Pipeline retrieval error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve pipeline(s)',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pipelineId = searchParams.get('id');
    
    if (!pipelineId) {
      return NextResponse.json(
        { success: false, error: 'Pipeline ID required' },
        { status: 400 }
      );
    }
    
    const deleted = PipelineManager.deletePipeline(pipelineId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Pipeline not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: { message: 'Pipeline deleted successfully' }
    });
    
  } catch (error) {
    console.error('Pipeline deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete pipeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}