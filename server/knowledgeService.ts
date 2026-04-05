import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ==========================================
// TYPES
// ==========================================

export interface KnowledgeEntry {
  id: string;
  doc_id: string;
  content: string;
  content_hash: string;
  hierarchical_path: string;
  embedding: number[];
  metadata: {
    hierarchy?: string[];
    level?: number;
    position?: number;
    is_complete?: boolean;
    entities?: {
      siglas: string[];
      codigos: string[];
      datas: string[];
      emails: string[];
      valores: string[];
    };
    tags?: string[];
    char_count?: number;
    word_count?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  entry: KnowledgeEntry;
  score: number;
  type: 'semantic' | 'fulltext' | 'hybrid';
  relevance: number;
}

export interface HybridSearchOptions {
  limit?: number;
  semanticWeight?: number;
  fulltextWeight?: number;
  minRelevance?: number;
}

// ==========================================
// KNOWLEDGE SERVICE
// ==========================================

export class KnowledgeService {
  private client: SupabaseClient;
  private genAI: GoogleGenerativeAI;
  private embeddingModel: string = 'text-embedding-004';

  constructor(supabaseUrl: string, supabaseKey: string, geminiKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.genAI = new GoogleGenerativeAI(geminiKey);
  }

  /**
   * Generate embedding for a text query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(query);
    return result.embedding.values;
  }

  /**
   * Semantic search using vector similarity
   */
  async semanticSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const { limit = 10, minRelevance = 0.3 } = options;

    try {
      const embedding = await this.generateQueryEmbedding(query);

      const { data, error } = await this.client.rpc('search_knowledge_semantic', {
        query_embedding: embedding,
        match_threshold: minRelevance,
        match_count: limit
      });

      if (error) {
        console.error('Semantic search error:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        entry: item as KnowledgeEntry,
        score: item.similarity || 0,
        type: 'semantic' as const,
        relevance: item.similarity || 0
      }));
    } catch (error) {
      console.error('Semantic search failed:', error);
      return [];
    }
  }

  /**
   * Full-text search using PostgreSQL FTS
   */
  async fulltextSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const { limit = 10 } = options;

    try {
      const { data, error } = await this.client.rpc('search_knowledge_fulltext', {
        search_query: query,
        match_count: limit
      });

      if (error) {
        console.error('Full-text search error:', error);
        return [];
      }

      return (data || []).map((item: any) => ({
        entry: item as KnowledgeEntry,
        score: item.rank || 0,
        type: 'fulltext' as const,
        relevance: item.rank || 0
      }));
    } catch (error) {
      console.error('Full-text search failed:', error);
      return [];
    }
  }

  /**
   * Hybrid search combining semantic and full-text results
   */
  async hybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 10,
      semanticWeight = 0.6,
      fulltextWeight = 0.4,
      minRelevance = 0.2
    } = options;

    try {
      // Run both searches in parallel
      const [semanticResults, fulltextResults] = await Promise.all([
        this.semanticSearch(query, { limit: limit * 2, minRelevance }),
        this.fulltextSearch(query, { limit: limit * 2 })
      ]);

      // Merge and deduplicate results
      const resultMap = new Map<string, SearchResult>();

      // Add semantic results
      semanticResults.forEach(result => {
        const key = result.entry.id;
        resultMap.set(key, {
          ...result,
          relevance: result.score * semanticWeight
        });
      });

      // Add/merge full-text results
      fulltextResults.forEach(result => {
        const key = result.entry.id;
        if (resultMap.has(key)) {
          const existing = resultMap.get(key)!;
          existing.relevance += result.score * fulltextWeight;
          existing.type = 'hybrid';
        } else {
          resultMap.set(key, {
            ...result,
            relevance: result.score * fulltextWeight,
            type: 'hybrid'
          });
        }
      });

      // Sort by relevance and return top results
      return Array.from(resultMap.values())
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, limit);
    } catch (error) {
      console.error('Hybrid search failed:', error);
      return [];
    }
  }

  /**
   * Get knowledge entry by ID
   */
  async getById(id: string): Promise<KnowledgeEntry | null> {
    try {
      const { data, error } = await this.client
        .from('giles_knowledge')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get by ID error:', error);
        return null;
      }

      return data as KnowledgeEntry;
    } catch (error) {
      console.error('Get by ID failed:', error);
      return null;
    }
  }

  /**
   * Get all entries by document ID
   */
  async getByDocId(docId: string, limit: number = 100): Promise<KnowledgeEntry[]> {
    try {
      const { data, error } = await this.client
        .from('giles_knowledge')
        .select('*')
        .eq('doc_id', docId)
        .limit(limit);

      if (error) {
        console.error('Get by doc ID error:', error);
        return [];
      }

      return (data || []) as KnowledgeEntry[];
    } catch (error) {
      console.error('Get by doc ID failed:', error);
      return [];
    }
  }

  /**
   * Get entries by tag
   */
  async getByTag(tag: string, limit: number = 50): Promise<KnowledgeEntry[]> {
    try {
      const { data, error } = await this.client
        .from('giles_knowledge')
        .select('*')
        .filter('metadata->tags', 'cs', `["${tag}"]`)
        .limit(limit);

      if (error) {
        console.error('Get by tag error:', error);
        return [];
      }

      return (data || []) as KnowledgeEntry[];
    } catch (error) {
      console.error('Get by tag failed:', error);
      return [];
    }
  }

  /**
   * Get entries by entity (sigla, codigo, email, etc.)
   */
  async getByEntity(
    entityType: 'siglas' | 'codigos' | 'datas' | 'emails' | 'valores',
    entityValue: string,
    limit: number = 50
  ): Promise<KnowledgeEntry[]> {
    try {
      const { data, error } = await this.client
        .from('giles_knowledge')
        .select('*')
        .filter(`metadata->entities->${entityType}`, 'cs', `["${entityValue}"]`)
        .limit(limit);

      if (error) {
        console.error('Get by entity error:', error);
        return [];
      }

      return (data || []) as KnowledgeEntry[];
    } catch (error) {
      console.error('Get by entity failed:', error);
      return [];
    }
  }

  /**
   * Get all unique document IDs
   */
  async getDocuments(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('giles_knowledge')
        .select('doc_id', { count: 'exact' })
        .order('doc_id');

      if (error) {
        console.error('Get documents error:', error);
        return [];
      }

      const docs = new Set<string>();
      (data || []).forEach((row: any) => {
        if (row.doc_id) docs.add(row.doc_id);
      });

      return Array.from(docs);
    } catch (error) {
      console.error('Get documents failed:', error);
      return [];
    }
  }

  /**
   * Get all unique tags
   */
  async getTags(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('giles_knowledge')
        .select('metadata');

      if (error) {
        console.error('Get tags error:', error);
        return [];
      }

      const tags = new Set<string>();
      (data || []).forEach((row: any) => {
        if (row.metadata?.tags && Array.isArray(row.metadata.tags)) {
          row.metadata.tags.forEach((tag: string) => tags.add(tag));
        }
      });

      return Array.from(tags).sort();
    } catch (error) {
      console.error('Get tags failed:', error);
      return [];
    }
  }

  /**
   * Get statistics about knowledge base
   */
  async getStats(): Promise<{
    total: number;
    documents: number;
    tags: number;
    avgChunkSize: number;
  }> {
    try {
      const { data, error, count } = await this.client
        .from('giles_knowledge')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Get stats error:', error);
        return { total: 0, documents: 0, tags: 0, avgChunkSize: 0 };
      }

      const docs = new Set<string>();
      const tags = new Set<string>();
      let totalChars = 0;

      (data || []).forEach((row: any) => {
        if (row.doc_id) docs.add(row.doc_id);
        if (row.metadata?.tags && Array.isArray(row.metadata.tags)) {
          row.metadata.tags.forEach((tag: string) => tags.add(tag));
        }
        if (row.metadata?.char_count) {
          totalChars += row.metadata.char_count;
        }
      });

      const total = count || 0;
      const avgChunkSize = total > 0 ? Math.round(totalChars / total) : 0;

      return {
        total,
        documents: docs.size,
        tags: tags.size,
        avgChunkSize
      };
    } catch (error) {
      console.error('Get stats failed:', error);
      return { total: 0, documents: 0, tags: 0, avgChunkSize: 0 };
    }
  }

  /**
   * Delete knowledge entry by ID
   */
  async deleteById(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('giles_knowledge')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  /**
   * Delete all entries for a document
   */
  async deleteByDocId(docId: string): Promise<number> {
    try {
      // First get count of entries to delete
      const { count } = await this.client
        .from('giles_knowledge')
        .select('id', { count: 'exact' })
        .eq('doc_id', docId);

      // Then delete them
      const { error } = await this.client
        .from('giles_knowledge')
        .delete()
        .eq('doc_id', docId);

      if (error) {
        console.error('Delete by doc ID error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Delete by doc ID failed:', error);
      return 0;
    }
  }
}

export default KnowledgeService;
