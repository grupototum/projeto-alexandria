import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  BATCH_SIZE: 50,
  BATCH_DELAY_MS: 1000,
  MAX_RETRIES: 3,
  RETRY_DELAYS: [2000, 4000, 8000],
  MAX_CHUNK_SIZE: 1500,
  MIN_CHUNK_SIZE: 200,
  OVERLAP_SIZE: 300,
  EMBEDDING_DIMENSION: 768
};

// ==========================================
// TYPES
// ==========================================

interface Chunk {
  content: string;
  doc_id: string;
  content_hash: string;
  hierarchical_path: string;
  hierarchy: string[];
  level: number;
  position: number;
  is_complete: boolean;
  overlap?: string;
  metadata: {
    char_count: number;
    word_count: number;
    has_overlap: boolean;
    entities: {
      siglas: string[];
      codigos: string[];
      datas: string[];
      emails: string[];
      valores: string[];
    };
    tags: string[];
  };
}

interface IngestionResult {
  doc_id: string;
  processed: number;
  skipped: number;
  failed: number;
  duration_ms: number;
}

// ==========================================
// UTILS - HASH
// ==========================================

function generateSHA256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// CHUNKING LOGIC
// ==========================================

function parseMarkdown(content: string): Array<{level: number; title: string; path: string[]; content: string}> {
  const lines = content.split('\n');
  const sections: Array<{level: number; title: string; path: string[]; content: string; lineNumber: number}> = [];
  let currentSection: any = null;
  let contentBuffer: string[] = [];
  const headingStack: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      if (currentSection && contentBuffer.length > 0) {
        currentSection.content = contentBuffer.join('\n').trim();
        sections.push(currentSection);
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      while (headingStack.length >= level) {
        headingStack.pop();
      }
      headingStack.push(title);

      currentSection = {
        level,
        title,
        path: [...headingStack],
        content: '',
        lineNumber: i + 1
      };
      contentBuffer = [];
    } else {
      contentBuffer.push(line);
    }
  }

  if (currentSection && contentBuffer.length > 0) {
    currentSection.content = contentBuffer.join('\n').trim();
    sections.push(currentSection);
  }

  return sections;
}

function splitIntoChunks(sections: Array<{level: number; title: string; path: string[]; content: string}>, docId: string): Chunk[] {
  const chunks: Chunk[] = [];
  let globalPosition = 0;

  for (const section of sections) {
    const { content, path, level } = section;
    
    if (content.length <= CONFIG.MAX_CHUNK_SIZE) {
      chunks.push(createChunk(content, docId, path, level, globalPosition, true));
      globalPosition++;
      continue;
    }

    const paragraphs = content.split(/\n\n+/).filter(p => p.trim());
    let currentChunk: string[] = [];
    let currentSize = 0;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const paraSize = para.length;

      if (currentSize + paraSize > CONFIG.MAX_CHUNK_SIZE && currentChunk.length > 0) {
        const chunkContent = currentChunk.join('\n\n');
        const nextPara = paragraphs[i];
        const overlap = nextPara.slice(0, CONFIG.OVERLAP_SIZE);

        chunks.push(createChunk(chunkContent, docId, path, level, globalPosition, false, overlap));
        
        const prevOverlap = currentChunk[currentChunk.length - 1].slice(-CONFIG.OVERLAP_SIZE);
        currentChunk = [prevOverlap, para];
        currentSize = prevOverlap.length + paraSize;
        globalPosition++;
      } else {
        currentChunk.push(para);
        currentSize += paraSize;
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(createChunk(currentChunk.join('\n\n'), docId, path, level, globalPosition, true));
      globalPosition++;
    }
  }

  return chunks;
}

function createChunk(
  content: string, 
  docId: string, 
  hierarchy: string[], 
  level: number, 
  position: number, 
  isComplete: boolean,
  overlap?: string
): Chunk {
  const contentHash = generateSHA256(`${docId}:${position}:${content.slice(0, 100)}`);
  const hierarchicalPath = hierarchy.join(' > ');
  
  return {
    content,
    doc_id: docId,
    content_hash: contentHash,
    hierarchical_path: hierarchicalPath,
    hierarchy,
    level,
    position,
    is_complete: isComplete,
    overlap,
    metadata: {
      char_count: content.length,
      word_count: content.split(/\s+/).length,
      has_overlap: !!overlap,
      entities: extractEntities(content),
      tags: inferTags(content, hierarchy)
    }
  };
}

function extractEntities(text: string): Chunk['metadata']['entities'] {
  const dedup = <T,>(arr: T[]): T[] => {
    const seen = new Set<T>();
    const result: T[] = [];
    for (const item of arr) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
    return result;
  };
  
  return {
    siglas: dedup(text.match(/\b[A-Z]{2,6}\b/g) || []),
    codigos: dedup(text.match(/\b[A-Z]+-\d{3,}\b/g) || []),
    datas: dedup(text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) || []),
    emails: dedup(text.match(/\S+@\S+\.\S+/g) || []),
    valores: dedup(text.match(/R\$\s*[\d.,]+/g) || [])
  };
}

function inferTags(content: string, hierarchy: string[]): string[] {
  const tags: string[] = [];
  const tagSet = new Set<string>();
  const text = content.toLowerCase();
  const pathStr = hierarchy.join(' ').toLowerCase();

  if (text.includes('checklist')) tagSet.add('checklist');
  if (text.includes('procedimento') || text.includes('passo')) tagSet.add('procedimento');
  if (text.includes('erro') || text.includes('bug') || text.includes('falha')) tagSet.add('troubleshooting');
  if (text.includes('sla') || text.includes('prazo')) tagSet.add('sla');
  if (text.includes('código') || text.includes('script')) tagSet.add('codigo');
  if (pathStr.includes('atendimento')) tagSet.add('atendimento');
  if (pathStr.includes('vendas')) tagSet.add('vendas');
  if (pathStr.includes('tecnico')) tagSet.add('tecnico');

  tagSet.forEach(tag => tags.push(tag));
  return tags;
}

// ==========================================
// SUPABASE INTEGRATION
// ==========================================

class SupabaseService {
  private client: SupabaseClient;

  constructor(url: string, key: string) {
    this.client = createClient(url, key);
  }

  async checkHashExists(hash: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('giles_knowledge')
      .select('id')
      .eq('content_hash', hash)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking hash:', error);
    }

    return !!data;
  }

  async insertChunks(chunks: Chunk[], embeddings: number[][]): Promise<void> {
    const records = chunks.map((chunk, idx) => ({
      doc_id: chunk.doc_id,
      content: chunk.content,
      content_hash: chunk.content_hash,
      hierarchical_path: chunk.hierarchical_path,
      embedding: embeddings[idx],
      metadata: {
        hierarchy: chunk.hierarchy,
        level: chunk.level,
        position: chunk.position,
        is_complete: chunk.is_complete,
        entities: chunk.metadata.entities,
        tags: chunk.metadata.tags,
        char_count: chunk.metadata.char_count,
        word_count: chunk.metadata.word_count
      }
    }));

    const { error } = await this.client
      .from('giles_knowledge')
      .insert(records);

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }
  }
}

// ==========================================
// GEMINI EMBEDDINGS
// ==========================================

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model: string = 'text-embedding-004') {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model;
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: this.model });
    
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const result = await model.embedContent(text);
      embeddings.push(result.embedding.values);
    }
    
    return embeddings;
  }
}

// ==========================================
// EXPORTS
// ==========================================

export class IngestionService {
  private supabase: SupabaseService;
  private gemini: GeminiService;

  constructor(supabaseUrl: string, supabaseKey: string, geminiKey: string) {
    this.supabase = new SupabaseService(supabaseUrl, supabaseKey);
    this.gemini = new GeminiService(geminiKey);
  }

  async ingestDocument(filePath: string, options: { docId?: string; dominio?: string } = {}): Promise<IngestionResult> {
    const startTime = Date.now();
    const docId = options.docId || path.basename(filePath, '.md');
    const dominio = options.dominio || 'geral';

    console.log(`📄 Processing: ${filePath}`);
    console.log(`🆔 Doc ID: ${docId}`);
    console.log(`🏷️  Domain: ${dominio}`);

    // Read file
    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse and chunk
    console.log('✂️  Parsing markdown...');
    const sections = parseMarkdown(content);
    console.log(`   Found ${sections.length} sections`);

    console.log('🔪 Chunking...');
    const chunks = splitIntoChunks(sections, docId);
    console.log(`   Generated ${chunks.length} chunks`);

    // Filter existing hashes
    console.log('🔍 Checking existing hashes...');
    const newChunks: Chunk[] = [];
    let skipped = 0;

    for (const chunk of chunks) {
      const exists = await this.supabase.checkHashExists(chunk.content_hash);
      if (exists) {
        skipped++;
      } else {
        newChunks.push(chunk);
      }
    }

    console.log(`   ${skipped} already exist (skipping)`);
    console.log(`   ${newChunks.length} new chunks to process`);

    if (newChunks.length === 0) {
      return {
        doc_id: docId,
        processed: 0,
        skipped,
        failed: 0,
        duration_ms: Date.now() - startTime
      };
    }

    // Process batches with rate limiting
    console.log('☁️  Uploading to Supabase...');
    let processed = 0;
    let failed = 0;

    for (let i = 0; i < newChunks.length; i += CONFIG.BATCH_SIZE) {
      const batch = newChunks.slice(i, i + CONFIG.BATCH_SIZE);
      const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(newChunks.length / CONFIG.BATCH_SIZE);

      process.stdout.write(`   Batch ${batchNum}/${totalBatches}... `);

      let retryCount = 0;
      let success = false;

      while (!success && retryCount <= CONFIG.MAX_RETRIES) {
        try {
          const texts = batch.map(c => c.content);
          const embeddings = await this.gemini.generateEmbeddings(texts);
          await this.supabase.insertChunks(batch, embeddings);
          
          processed += batch.length;
          success = true;
          process.stdout.write('✅\n');

        } catch (error: any) {
          if (error.status === 429 && retryCount < CONFIG.MAX_RETRIES) {
            const delay = CONFIG.RETRY_DELAYS[retryCount];
            process.stdout.write(`⏳(${delay}ms)... `);
            await sleep(delay);
            retryCount++;
          } else {
            process.stdout.write(`❌ ${error.message}\n`);
            failed += batch.length;
            success = true; // Move to next batch
          }
        }
      }

      if (i + CONFIG.BATCH_SIZE < newChunks.length) {
        await sleep(CONFIG.BATCH_DELAY_MS);
      }
    }

    const duration = Date.now() - startTime;

    console.log('\n📊 Summary:');
    console.log(`   ✅ Processed: ${processed}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   ⏱️  Duration: ${duration}ms`);

    return {
      doc_id: docId,
      processed,
      skipped,
      failed,
      duration_ms: duration
    };
  }

  async ingestDirectory(dirPath: string, options: { pattern?: string; recursive?: boolean; dominio?: string } = {}): Promise<IngestionResult[]> {
    const pattern = options.pattern || '.md';
    const files = fs.readdirSync(dirPath)
      .filter(f => f.endsWith(pattern))
      .map(f => path.join(dirPath, f));

    console.log(`📁 Found ${files.length} files in ${dirPath}`);

    const results: IngestionResult[] = [];
    for (const file of files) {
      const result = await this.ingestDocument(file, { dominio: options.dominio });
      results.push(result);
    }

    return results;
  }
}

// ==========================================
// EXPORTS
// ==========================================

export type { Chunk, IngestionResult };
