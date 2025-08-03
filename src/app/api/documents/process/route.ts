import { NextRequest, NextResponse } from 'next/server';
import { DocumentProcessor } from '@/lib/document-processor';
import { documentStorage } from '@/lib/storage';
import { CleaningOptions } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const cleaningOptionsStr = formData.get('cleaningOptions') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    // Parse cleaning options
    let cleaningOptions: CleaningOptions;
    try {
      cleaningOptions = cleaningOptionsStr ? JSON.parse(cleaningOptionsStr) : {
        removeWhitespace: true,
        removeSpecialChars: false,
        normalizeUnicode: true,
        extractTables: 'text' as const,
        extractImages: 'ignore' as const,
        customRules: []
      };
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid cleaning options format' },
        { status: 400 }
      );
    }

    // Process the document
    const processor = new DocumentProcessor();
    const processedDocument = await processor.processDocument(file, {
      cleaningOptions,
      preserveFormatting: false,
      extractMetadata: true
    });

    // Store the processed document
    const storedDocument = await documentStorage.storeDocument(
      processedDocument,
      sessionId,
      24 * 60 * 60 * 1000 // 24 hours
    );

    return NextResponse.json({
      success: true,
      document: {
        id: processedDocument.id,
        originalName: processedDocument.originalName,
        contentLength: processedDocument.content.length,
        metadata: processedDocument.metadata,
        processingLog: processedDocument.processingLog,
        storageUrl: storedDocument.url
      }
    });

  } catch (error) {
    console.error('Document processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const documentId = searchParams.get('documentId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session ID provided' },
        { status: 400 }
      );
    }

    if (documentId) {
      // Get specific document
      const document = await documentStorage.retrieveDocument(documentId, sessionId);
      
      if (!document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        document
      });
    } else {
      // List all documents for session
      const documents = await documentStorage.listDocuments(sessionId);
      
      return NextResponse.json({
        success: true,
        documents
      });
    }

  } catch (error) {
    console.error('Document retrieval error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve documents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const documentId = searchParams.get('documentId');

    if (!sessionId || !documentId) {
      return NextResponse.json(
        { error: 'Session ID and document ID are required' },
        { status: 400 }
      );
    }

    const deleted = await documentStorage.deleteDocument(documentId, sessionId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Document deletion error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}