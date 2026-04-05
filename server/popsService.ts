import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ==========================================
// TYPES
// ==========================================

export type POPStatus = 'draft' | 'review' | 'approved' | 'deprecated';

export interface POP {
  id: string;
  departamento: string;
  titulo: string;
  conteudo: string;
  gatilhos: string[];
  slas: {
    [key: string]: string;
  };
  status: POPStatus;
  tags: string[];
  versao: number;
  embedding: number[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface POPVersion {
  id: string;
  pop_id: string;
  versao: number;
  conteudo: string;
  status: POPStatus;
  mudancas: string;
  created_at: string;
  created_by?: string;
}

export interface CreatePOPInput {
  departamento: string;
  titulo: string;
  conteudo: string;
  gatilhos?: string[];
  slas?: { [key: string]: string };
  tags?: string[];
  status?: POPStatus;
}

export interface UpdatePOPInput {
  titulo?: string;
  conteudo?: string;
  gatilhos?: string[];
  slas?: { [key: string]: string };
  tags?: string[];
  status?: POPStatus;
  mudancas?: string;
}

export interface SearchResult {
  pop: POP;
  score: number;
  relevance: number;
}

// ==========================================
// POPS SERVICE
// ==========================================

export class POPsService {
  private client: SupabaseClient;
  private genAI: GoogleGenerativeAI;
  private embeddingModel: string = 'text-embedding-004';

  constructor(supabaseUrl: string, supabaseKey: string, geminiKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.genAI = new GoogleGenerativeAI(geminiKey);
  }

  /**
   * Generate embedding for POP content
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Create a new POP
   */
  async create(input: CreatePOPInput, userId?: string): Promise<POP | null> {
    try {
      const embedding = await this.generateEmbedding(
        `${input.titulo} ${input.conteudo}`
      );

      const { data, error } = await this.client
        .from('pops')
        .insert({
          departamento: input.departamento,
          titulo: input.titulo,
          conteudo: input.conteudo,
          gatilhos: input.gatilhos || [],
          slas: input.slas || {},
          status: input.status || 'draft',
          tags: input.tags || [],
          versao: 1,
          embedding,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Create POP error:', error);
        return null;
      }

      // Create initial version record
      await this.client.from('pops_versions').insert({
        pop_id: data.id,
        versao: 1,
        conteudo: input.conteudo,
        status: input.status || 'draft',
        mudancas: 'Criação inicial',
        created_by: userId
      });

      return data as POP;
    } catch (error) {
      console.error('Create POP failed:', error);
      return null;
    }
  }

  /**
   * Get POP by ID
   */
  async getById(id: string): Promise<POP | null> {
    try {
      const { data, error } = await this.client
        .from('pops')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get POP error:', error);
        return null;
      }

      return data as POP;
    } catch (error) {
      console.error('Get POP failed:', error);
      return null;
    }
  }

  /**
   * Update POP with automatic versioning
   */
  async update(id: string, input: UpdatePOPInput, userId?: string): Promise<POP | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        console.error('POP not found');
        return null;
      }

      // Check if content changed
      const contentChanged = input.conteudo && input.conteudo !== existing.conteudo;
      const newVersion = contentChanged ? existing.versao + 1 : existing.versao;

      // Generate new embedding if content changed
      let embedding = existing.embedding;
      if (contentChanged) {
        embedding = await this.generateEmbedding(
          `${input.titulo || existing.titulo} ${input.conteudo || existing.conteudo}`
        );
      }

      const updateData: any = {
        ...(input.titulo !== undefined && { titulo: input.titulo }),
        ...(input.conteudo !== undefined && { conteudo: input.conteudo }),
        ...(input.gatilhos !== undefined && { gatilhos: input.gatilhos }),
        ...(input.slas !== undefined && { slas: input.slas }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.status !== undefined && { status: input.status }),
        versao: newVersion,
        embedding,
        updated_by: userId
      };

      const { data, error } = await this.client
        .from('pops')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update POP error:', error);
        return null;
      }

      // Create version record if content changed
      if (contentChanged) {
        await this.client.from('pops_versions').insert({
          pop_id: id,
          versao: newVersion,
          conteudo: input.conteudo,
          status: input.status || existing.status,
          mudancas: input.mudancas || 'Atualização de conteúdo',
          created_by: userId
        });
      }

      return data as POP;
    } catch (error) {
      console.error('Update POP failed:', error);
      return null;
    }
  }

  /**
   * Delete POP
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Delete versions first
      await this.client.from('pops_versions').delete().eq('pop_id', id);

      // Delete POP
      const { error } = await this.client.from('pops').delete().eq('id', id);

      if (error) {
        console.error('Delete POP error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete POP failed:', error);
      return false;
    }
  }

  /**
   * Search POPs by query (semantic + full-text hybrid)
   */
  async search(query: string, departamento?: string, limit: number = 20): Promise<SearchResult[]> {
    try {
      const embedding = await this.generateEmbedding(query);

      let supabaseQuery = this.client
        .from('pops')
        .select('*')
        .order('updated_at', { ascending: false });

      if (departamento) {
        supabaseQuery = supabaseQuery.eq('departamento', departamento);
      }

      const { data, error } = await supabaseQuery.limit(limit);

      if (error) {
        console.error('Search POPs error:', error);
        return [];
      }

      // Simple relevance scoring based on title and tags match
      const results = (data || [])
        .map((pop: any) => {
          let score = 0;

          // Title match
          if (pop.titulo.toLowerCase().includes(query.toLowerCase())) {
            score += 0.5;
          }

          // Content match
          if (pop.conteudo.toLowerCase().includes(query.toLowerCase())) {
            score += 0.3;
          }

          // Tag match
          if (pop.tags && pop.tags.some((tag: string) => tag.toLowerCase().includes(query.toLowerCase()))) {
            score += 0.2;
          }

          return {
            pop: pop as POP,
            score,
            relevance: Math.min(score, 1)
          };
        })
        .filter(result => result.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);

      return results;
    } catch (error) {
      console.error('Search POPs failed:', error);
      return [];
    }
  }

  /**
   * Get POPs by department
   */
  async getByDepartment(departamento: string, limit: number = 50): Promise<POP[]> {
    try {
      const { data, error } = await this.client
        .from('pops')
        .select('*')
        .eq('departamento', departamento)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get by department error:', error);
        return [];
      }

      return (data || []) as POP[];
    } catch (error) {
      console.error('Get by department failed:', error);
      return [];
    }
  }

  /**
   * Get POPs by status
   */
  async getByStatus(status: POPStatus, limit: number = 50): Promise<POP[]> {
    try {
      const { data, error } = await this.client
        .from('pops')
        .select('*')
        .eq('status', status)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get by status error:', error);
        return [];
      }

      return (data || []) as POP[];
    } catch (error) {
      console.error('Get by status failed:', error);
      return [];
    }
  }

  /**
   * Get all departments
   */
  async getDepartamentos(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('pops')
        .select('departamento')
        .order('departamento');

      if (error) {
        console.error('Get departments error:', error);
        return [];
      }

      const depts = new Set<string>();
      (data || []).forEach((row: any) => {
        if (row.departamento) depts.add(row.departamento);
      });

      return Array.from(depts);
    } catch (error) {
      console.error('Get departments failed:', error);
      return [];
    }
  }

  /**
   * Get related POPs based on similarity
   */
  async getRelated(id: string, limit: number = 5): Promise<POP[]> {
    try {
      const pop = await this.getById(id);
      if (!pop) return [];

      const { data, error } = await this.client
        .from('pops')
        .select('*')
        .neq('id', id)
        .eq('departamento', pop.departamento)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get related error:', error);
        return [];
      }

      return (data || []) as POP[];
    } catch (error) {
      console.error('Get related failed:', error);
      return [];
    }
  }

  /**
   * Get version history for a POP
   */
  async getVersionHistory(popId: string): Promise<POPVersion[]> {
    try {
      const { data, error } = await this.client
        .from('pops_versions')
        .select('*')
        .eq('pop_id', popId)
        .order('versao', { ascending: false });

      if (error) {
        console.error('Get version history error:', error);
        return [];
      }

      return (data || []) as POPVersion[];
    } catch (error) {
      console.error('Get version history failed:', error);
      return [];
    }
  }

  /**
   * Get specific version of a POP
   */
  async getVersion(popId: string, versao: number): Promise<POPVersion | null> {
    try {
      const { data, error } = await this.client
        .from('pops_versions')
        .select('*')
        .eq('pop_id', popId)
        .eq('versao', versao)
        .single();

      if (error) {
        console.error('Get version error:', error);
        return null;
      }

      return data as POPVersion;
    } catch (error) {
      console.error('Get version failed:', error);
      return null;
    }
  }

  /**
   * Get POP statistics
   */
  async getStats(): Promise<{
    total: number;
    byStatus: { [key in POPStatus]: number };
    byDepartment: { [key: string]: number };
    avgVersion: number;
  }> {
    try {
      const { data, error, count } = await this.client
        .from('pops')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Get stats error:', error);
        return {
          total: 0,
          byStatus: { draft: 0, review: 0, approved: 0, deprecated: 0 },
          byDepartment: {},
          avgVersion: 0
        };
      }

      const byStatus: { [key in POPStatus]: number } = {
        draft: 0,
        review: 0,
        approved: 0,
        deprecated: 0
      };
      const byDepartment: { [key: string]: number } = {};
      let totalVersions = 0;

      (data || []).forEach((pop: any) => {
        byStatus[pop.status as POPStatus]++;
        byDepartment[pop.departamento] = (byDepartment[pop.departamento] || 0) + 1;
        totalVersions += pop.versao || 1;
      });

      const total = count || 0;
      const avgVersion = total > 0 ? Math.round((totalVersions / total) * 10) / 10 : 0;

      return {
        total,
        byStatus,
        byDepartment,
        avgVersion
      };
    } catch (error) {
      console.error('Get stats failed:', error);
      return {
        total: 0,
        byStatus: { draft: 0, review: 0, approved: 0, deprecated: 0 },
        byDepartment: {},
        avgVersion: 0
      };
    }
  }
}

export default POPsService;
