import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@/lib/gemini-client';

export async function POST(request: NextRequest) {
  try {
    const { apiKey }: { apiKey: string } = await request.json();
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 400 }
      );
    }
    
    // Test the API key
    const client = new GeminiClient(apiKey);
    const isValid = await client.testConnection();
    
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'API key is valid and working!'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid API key or connection failed' },
        { status: 401 }
      );
    }
    
  } catch (error) {
    console.error('API key test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}