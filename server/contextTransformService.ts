import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ==========================================
// TYPES
// ==========================================

export type ContextType = 'personality' | 'memory' | 'knowledge' | 'process' | 'client';
export type ContextFormat = 'json' | 'markdown' | 'yaml' | 'prompt' | 'summary';

export interface Context {
  id: string;
  tipo: ContextType;
  agente: string;
  titulo: string;
  conteudo: string;
  formato: ContextFormat;
  tags: string[];
  versao: number;
  embedding: number[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ContextVersion {
  id: string;
  context_id: string;
  versao: number;
  conteudo: string;
  formato: ContextFormat;
  mudancas: string;
  created_at: string;
  created_by?: string;
}

export interface CreateContextInput {
  tipo: ContextType;
  agente: string;
  titulo: string;
  conteudo: string;
  formato?: ContextFormat;
  tags?: string[];
}

export interface UpdateContextInput {
  titulo?: string;
  conteudo?: string;
  tags?: string[];
  mudancas?: string;
}

export interface TransformResult {
  success: boolean;
  content: string;
  format: ContextFormat;
  error?: string;
}

export interface ConsolidationResult {
  success: boolean;
  content: string;
  format: ContextFormat;
  contexts_used: number;
  error?: string;
}

// ==========================================
// CONTEXT TRANSFORM SERVICE
// ==========================================

export class ContextTransformService {
  private client: SupabaseClient;
  private genAI: GoogleGenerativeAI;
  private embeddingModel: string = 'text-embedding-004';

  constructor(supabaseUrl: string, supabaseKey: string, geminiKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.genAI = new GoogleGenerativeAI(geminiKey);
  }

  /**
   * Generate embedding for context content
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Transform context between formats using Gemini
   */
  async transformFormat(
    content: string,
    sourceFormat: ContextFormat,
    targetFormat: ContextFormat
  ): Promise<TransformResult> {
    if (sourceFormat === targetFormat) {
      return { success: true, content, format: targetFormat };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `Transform the following ${sourceFormat} content to ${targetFormat} format. 
Preserve all information and structure. Output ONLY the transformed content without explanations.

Source content:
${content}`;

      const result = await model.generateContent(prompt);
      const transformedContent = result.response.text();

      return {
        success: true,
        content: transformedContent,
        format: targetFormat
      };
    } catch (error) {
      console.error('Transform format error:', error);
      return {
        success: false,
        content,
        format: sourceFormat,
        error: `Failed to transform from ${sourceFormat} to ${targetFormat}`
      };
    }
  }

  /**
   * Consolidate multiple contexts into a single prompt
   */
  async consolidateContexts(
    contextIds: string[],
    outputFormat: ContextFormat = 'prompt'
  ): Promise<ConsolidationResult> {
    try {
      // Fetch all contexts
      const contexts: Context[] = [];
      for (const id of contextIds) {
        const context = await this.getById(id);
        if (context) contexts.push(context);
      }

      if (contexts.length === 0) {
        return {
          success: false,
          content: '',
          format: outputFormat,
          contexts_used: 0,
          error: 'No valid contexts found'
        };
      }

      // Prepare consolidated content
      const consolidatedParts: string[] = [];

      for (const context of contexts) {
        const header = `## [${context.tipo.toUpperCase()}] ${context.titulo}`;
        consolidatedParts.push(`${header}\n${context.conteudo}`);
      }

      const consolidatedContent = consolidatedParts.join('\n\n---\n\n');

      // Transform to target format if needed
      if (outputFormat !== 'markdown') {
        const transformed = await this.transformFormat(
          consolidatedContent,
          'markdown',
          outputFormat
        );

        if (!transformed.success) {
          return {
            success: false,
            content: consolidatedContent,
            format: 'markdown',
            contexts_used: contexts.length,
            error: 'Failed to transform consolidated content'
          };
        }

        return {
          success: true,
          content: transformed.content,
          format: outputFormat,
          contexts_used: contexts.length
        };
      }

      return {
        success: true,
        content: consolidatedContent,
        format: 'markdown',
        contexts_used: contexts.length
      };
    } catch (error) {
      console.error('Consolidate contexts error:', error);
      return {
        success: false,
        content: '',
        format: outputFormat,
        contexts_used: 0,
        error: 'Failed to consolidate contexts'
      };
    }
  }

  /**
   * Create a new context
   */
  async create(input: CreateContextInput, userId?: string): Promise<Context | null> {
    try {
      const embedding = await this.generateEmbedding(
        `${input.titulo} ${input.conteudo}`
      );

      const { data, error } = await this.client
        .from('contexts')
        .insert({
          tipo: input.tipo,
          agente: input.agente,
          titulo: input.titulo,
          conteudo: input.conteudo,
          formato: input.formato || 'markdown',
          tags: input.tags || [],
          versao: 1,
          embedding,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Create context error:', error);
        return null;
      }

      // Create initial version record
      await this.client.from('contexts_versions').insert({
        context_id: data.id,
        versao: 1,
        conteudo: input.conteudo,
        formato: input.formato || 'markdown',
        mudancas: 'Criação inicial',
        created_by: userId
      });

      return data as Context;
    } catch (error) {
      console.error('Create context failed:', error);
      return null;
    }
  }

  /**
   * Get context by ID
   */
  async getById(id: string): Promise<Context | null> {
    try {
      const { data, error } = await this.client
        .from('contexts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get context error:', error);
        return null;
      }

      return data as Context;
    } catch (error) {
      console.error('Get context failed:', error);
      return null;
    }
  }

  /**
   * Update context with automatic versioning
   */
  async update(id: string, input: UpdateContextInput, userId?: string): Promise<Context | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        console.error('Context not found');
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
        ...(input.tags !== undefined && { tags: input.tags }),
        versao: newVersion,
        embedding,
        updated_by: userId
      };

      const { data, error } = await this.client
        .from('contexts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update context error:', error);
        return null;
      }

      // Create version record if content changed
      if (contentChanged) {
        await this.client.from('contexts_versions').insert({
          context_id: id,
          versao: newVersion,
          conteudo: input.conteudo,
          formato: existing.formato,
          mudancas: input.mudancas || 'Atualização de conteúdo',
          created_by: userId
        });
      }

      return data as Context;
    } catch (error) {
      console.error('Update context failed:', error);
      return null;
    }
  }

  /**
   * Delete context
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Delete versions first
      await this.client.from('contexts_versions').delete().eq('context_id', id);

      // Delete context
      const { error } = await this.client.from('contexts').delete().eq('id', id);

      if (error) {
        console.error('Delete context error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete context failed:', error);
      return false;
    }
  }

  /**
   * Search contexts
   */
  async search(
    query: string,
    agente?: string,
    tipo?: ContextType,
    limit: number = 20
  ): Promise<Context[]> {
    try {
      let supabaseQuery = this.client
        .from('contexts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (agente) {
        supabaseQuery = supabaseQuery.eq('agente', agente);
      }

      if (tipo) {
        supabaseQuery = supabaseQuery.eq('tipo', tipo);
      }

      const { data, error } = await supabaseQuery.limit(limit);

      if (error) {
        console.error('Search contexts error:', error);
        return [];
      }

      // Filter by query
      const results = (data || [])
        .filter((context: any) => {
          const queryLower = query.toLowerCase();
          return (
            context.titulo.toLowerCase().includes(queryLower) ||
            context.conteudo.toLowerCase().includes(queryLower) ||
            (context.tags && context.tags.some((tag: string) => tag.toLowerCase().includes(queryLower)))
          );
        })
        .slice(0, limit);

      return results as Context[];
    } catch (error) {
      console.error('Search contexts failed:', error);
      return [];
    }
  }

  /**
   * Get contexts by agent
   */
  async getByAgent(agente: string, limit: number = 50): Promise<Context[]> {
    try {
      const { data, error } = await this.client
        .from('contexts')
        .select('*')
        .eq('agente', agente)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get by agent error:', error);
        return [];
      }

      return (data || []) as Context[];
    } catch (error) {
      console.error('Get by agent failed:', error);
      return [];
    }
  }

  /**
   * Get contexts by type
   */
  async getByType(tipo: ContextType, limit: number = 50): Promise<Context[]> {
    try {
      const { data, error } = await this.client
        .from('contexts')
        .select('*')
        .eq('tipo', tipo)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get by type error:', error);
        return [];
      }

      return (data || []) as Context[];
    } catch (error) {
      console.error('Get by type failed:', error);
      return [];
    }
  }

  /**
   * Get all unique agents
   */
  async getAgents(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('contexts')
        .select('agente')
        .order('agente');

      if (error) {
        console.error('Get agents error:', error);
        return [];
      }

      const agents = new Set<string>();
      (data || []).forEach((row: any) => {
        if (row.agente) agents.add(row.agente);
      });

      return Array.from(agents);
    } catch (error) {
      console.error('Get agents failed:', error);
      return [];
    }
  }

  /**
   * Get version history for a context
   */
  async getVersionHistory(contextId: string): Promise<ContextVersion[]> {
    try {
      const { data, error } = await this.client
        .from('contexts_versions')
        .select('*')
        .eq('context_id', contextId)
        .order('versao', { ascending: false });

      if (error) {
        console.error('Get version history error:', error);
        return [];
      }

      return (data || []) as ContextVersion[];
    } catch (error) {
      console.error('Get version history failed:', error);
      return [];
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    byType: { [key in ContextType]: number };
    byAgent: { [key: string]: number };
    byFormat: { [key in ContextFormat]: number };
  }> {
    try {
      const { data, error, count } = await this.client
        .from('contexts')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Get stats error:', error);
        return {
          total: 0,
          byType: { personality: 0, memory: 0, knowledge: 0, process: 0, client: 0 },
          byAgent: {},
          byFormat: { json: 0, markdown: 0, yaml: 0, prompt: 0, summary: 0 }
        };
      }

      const byType: { [key in ContextType]: number } = {
        personality: 0,
        memory: 0,
        knowledge: 0,
        process: 0,
        client: 0
      };
      const byAgent: { [key: string]: number } = {};
      const byFormat: { [key in ContextFormat]: number } = {
        json: 0,
        markdown: 0,
        yaml: 0,
        prompt: 0,
        summary: 0
      };

      (data || []).forEach((context: any) => {
        byType[context.tipo as ContextType]++;
        byAgent[context.agente] = (byAgent[context.agente] || 0) + 1;
        byFormat[context.formato as ContextFormat]++;
      });

      return {
        total: count || 0,
        byType,
        byAgent,
        byFormat
      };
    } catch (error) {
      console.error('Get stats failed:', error);
      return {
        total: 0,
        byType: { personality: 0, memory: 0, knowledge: 0, process: 0, client: 0 },
        byAgent: {},
        byFormat: { json: 0, markdown: 0, yaml: 0, prompt: 0, summary: 0 }
      };
    }
  }
}

export default ContextTransformService;
