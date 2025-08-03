import { ProcessedDocument, ProcessingStep, CleaningOptions, DocumentMetadata } from '@/types';

export interface ProcessingConfig {
  cleaningOptions: CleaningOptions;
  preserveFormatting?: boolean;
  extractMetadata?: boolean;
}

export class DocumentProcessor {
  public readonly supportedFormats = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
    'text/csv',
    'text/markdown',
    'text/html',
    'text/plain'
  ];

  async processDocument(
    file: File,
    config: ProcessingConfig
  ): Promise<ProcessedDocument> {
    const startTime = Date.now();
    const processingLog: ProcessingStep[] = [];

    try {
      // Step 1: File validation
      processingLog.push({
        step: 'File Validation',
        timestamp: new Date(),
        duration: 0,
        status: 'success',
        message: `Processing ${file.type} file: ${file.name}`
      });

      // Step 2: Extract raw content based on file type
      const extractionStart = Date.now();
      let rawContent: string;
      let extractedMetadata: Partial<DocumentMetadata> = {};

      switch (file.type) {
        case 'application/pdf':
          ({ content: rawContent, metadata: extractedMetadata } = await this.processPDF(file));
          break;
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
          ({ content: rawContent, metadata: extractedMetadata } = await this.processDOCX(file));
          break;
        case 'application/json':
          ({ content: rawContent, metadata: extractedMetadata } = await this.processJSON(file));
          break;
        case 'text/csv':
          ({ content: rawContent, metadata: extractedMetadata } = await this.processCSV(file));
          break;
        case 'text/markdown':
          ({ content: rawContent, metadata: extractedMetadata } = await this.processMarkdown(file));
          break;
        case 'text/html':
          ({ content: rawContent, metadata: extractedMetadata } = await this.processHTML(file));
          break;
        case 'text/plain':
          ({ content: rawContent, metadata: extractedMetadata } = await this.processText(file));
          break;
        default:
          throw new Error(`Unsupported file type: ${file.type}`);
      }

      const extractionDuration = Date.now() - extractionStart;
      processingLog.push({
        step: 'Content Extraction',
        timestamp: new Date(),
        duration: extractionDuration,
        status: 'success',
        message: `Extracted ${rawContent.length} characters`,
        details: { contentLength: rawContent.length }
      });

      // Step 3: Clean and preprocess content
      const cleaningStart = Date.now();
      const cleanedContent = this.cleanText(rawContent, config.cleaningOptions);
      const cleaningDuration = Date.now() - cleaningStart;

      processingLog.push({
        step: 'Text Cleaning',
        timestamp: new Date(),
        duration: cleaningDuration,
        status: 'success',
        message: `Applied cleaning rules, result: ${cleanedContent.length} characters`,
        details: {
          originalLength: rawContent.length,
          cleanedLength: cleanedContent.length,
          reductionPercentage: Math.round(((rawContent.length - cleanedContent.length) / rawContent.length) * 100)
        }
      });

      // Step 4: Finalize metadata
      const finalMetadata: DocumentMetadata = {
        originalName: file.name,
        fileType: file.type,
        size: file.size,
        uploadedAt: new Date(),
        processedAt: new Date(),
        ...extractedMetadata,
        customFields: {
          processingDuration: Date.now() - startTime,
          contentLength: cleanedContent.length,
          ...extractedMetadata.customFields
        }
      };

      const totalDuration = Date.now() - startTime;
      processingLog.push({
        step: 'Processing Complete',
        timestamp: new Date(),
        duration: totalDuration,
        status: 'success',
        message: `Document processed successfully in ${totalDuration}ms`
      });

      return {
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalName: file.name,
        content: cleanedContent,
        metadata: finalMetadata,
        processingLog
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      processingLog.push({
        step: 'Processing Error',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        status: 'error',
        message: errorMessage,
        details: { error: errorMessage }
      });

      throw new Error(`Failed to process document: ${errorMessage}`);
    }
  }

  private async processPDF(file: File): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    try {
      // Dynamic import to avoid bundling issues
      const pdfParse = (await import('pdf-parse')).default;
      const data = await pdfParse(buffer);
      return {
        content: data.text,
        metadata: {
          title: data.info?.Title,
          author: data.info?.Author,
          customFields: {
            pageCount: data.numpages,
            pdfVersion: data.version,
            creationDate: data.info?.CreationDate,
            modificationDate: data.info?.ModDate
          }
        }
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processDOCX(file: File): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    const arrayBuffer = await file.arrayBuffer();
    
    try {
      // Dynamic import to avoid bundling issues
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ arrayBuffer });
      return {
        content: result.value,
        metadata: {
          customFields: {
            warnings: result.messages.length,
            extractionMessages: result.messages.map(msg => msg.message)
          }
        }
      };
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processJSON(file: File): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    const text = await file.text();
    
    try {
      const jsonData = JSON.parse(text);
      
      // Convert JSON to readable text format
      let content: string;
      if (Array.isArray(jsonData)) {
        content = jsonData.map(item => 
          typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)
        ).join('\n\n');
      } else if (typeof jsonData === 'object') {
        content = JSON.stringify(jsonData, null, 2);
      } else {
        content = String(jsonData);
      }

      return {
        content,
        metadata: {
          customFields: {
            jsonType: Array.isArray(jsonData) ? 'array' : typeof jsonData,
            itemCount: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length
          }
        }
      };
    } catch (error) {
      throw new Error(`JSON parsing failed: ${error instanceof Error ? error.message : 'Invalid JSON format'}`);
    }
  }

  private async processCSV(file: File): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    const text = await file.text();
    
    try {
      // Simple CSV parsing - split by lines and commas
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1);

      let content = '';
      if (headers) {
        content += `Headers: ${headers.join(', ')}\n\n`;
        
        rows.forEach((row, index) => {
          const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
          const rowData = headers.map((header, i) => `${header}: ${values[i] || ''}`).join(', ');
          content += `Row ${index + 1}: ${rowData}\n`;
        });
      } else {
        content = text;
      }

      return {
        content,
        metadata: {
          customFields: {
            rowCount: rows.length,
            columnCount: headers?.length || 0,
            headers: headers
          }
        }
      };
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processMarkdown(file: File): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    const text = await file.text();
    
    try {
      // Dynamic imports to avoid bundling issues
      const { marked } = await import('marked');
      const { htmlToText } = await import('html-to-text');
      
      // Convert markdown to HTML first, then to plain text
      const html = await marked(text);
      const plainText = htmlToText(html, {
        wordwrap: false,
        preserveNewlines: true
      });

      // Extract title from first heading
      const titleMatch = text.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : undefined;

      return {
        content: plainText,
        metadata: {
          title,
          customFields: {
            originalMarkdown: text.length,
            convertedText: plainText.length,
            hasTitle: !!title
          }
        }
      };
    } catch (error) {
      throw new Error(`Markdown parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processHTML(file: File): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    const text = await file.text();
    
    try {
      // Dynamic imports to avoid bundling issues
      const { JSDOM } = await import('jsdom');
      const { htmlToText } = await import('html-to-text');
      
      const dom = new JSDOM(text);
      const document = dom.window.document;

      // Extract title
      const title = document.querySelector('title')?.textContent || undefined;
      
      // Extract meta description
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || undefined;

      // Convert HTML to plain text
      const plainText = htmlToText(text, {
        wordwrap: false,
        preserveNewlines: true,
        ignoreHref: true,
        ignoreImage: true
      });

      return {
        content: plainText,
        metadata: {
          title,
          customFields: {
            description,
            originalHtml: text.length,
            convertedText: plainText.length,
            hasTitle: !!title
          }
        }
      };
    } catch (error) {
      throw new Error(`HTML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async processText(file: File): Promise<{ content: string; metadata: Partial<DocumentMetadata> }> {
    const text = await file.text();
    
    // Try to extract title from first line if it looks like a title
    const lines = text.split('\n');
    const firstLine = lines[0]?.trim();
    const title = (firstLine && firstLine.length < 100 && !firstLine.includes('.')) ? firstLine : undefined;

    return {
      content: text,
      metadata: {
        title,
        customFields: {
          lineCount: lines.length,
          hasTitle: !!title
        }
      }
    };
  }

  cleanText(text: string, options: CleaningOptions): string {
    let cleaned = text;

    // Remove excessive whitespace
    if (options.removeWhitespace) {
      cleaned = cleaned.replace(/\s+/g, ' ').trim();
      cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Reduce multiple newlines to double
    }

    // Remove special characters (but preserve basic punctuation)
    if (options.removeSpecialChars) {
      cleaned = cleaned.replace(/[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}\"\']/g, '');
    }

    // Normalize unicode characters
    if (options.normalizeUnicode) {
      cleaned = cleaned.normalize('NFKC');
    }

    // Apply custom rules
    if (options.customRules && options.customRules.length > 0) {
      options.customRules.forEach(rule => {
        try {
          // Assume custom rules are regex patterns
          const regex = new RegExp(rule, 'g');
          cleaned = cleaned.replace(regex, '');
        } catch (error) {
          console.warn(`Invalid custom rule: ${rule}`, error);
        }
      });
    }

    return cleaned;
  }

  // Preview method to show how text would be chunked
  previewCleaning(text: string, options: CleaningOptions): {
    original: string;
    cleaned: string;
    changes: {
      whitespaceReduced: boolean;
      specialCharsRemoved: boolean;
      unicodeNormalized: boolean;
      customRulesApplied: number;
    };
  } {
    const original = text;
    const cleaned = this.cleanText(text, options);

    return {
      original,
      cleaned,
      changes: {
        whitespaceReduced: options.removeWhitespace && original !== cleaned,
        specialCharsRemoved: options.removeSpecialChars,
        unicodeNormalized: options.normalizeUnicode,
        customRulesApplied: options.customRules?.length || 0
      }
    };
  }
}