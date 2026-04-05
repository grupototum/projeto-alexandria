import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ==========================================
// TYPES
// ==========================================

export type SkillCategory = 'automacao' | 'analise' | 'criacao' | 'integracao' | 'validacao';

export interface SkillSchema {
  [key: string]: {
    type: string;
    description?: string;
    required?: boolean;
  };
}

export interface Skill {
  id: string;
  nome: string;
  descricao: string;
  agente: string;
  categoria: SkillCategory;
  entrada: SkillSchema;
  saida: SkillSchema;
  triggers: string[];
  dependencias: string[];
  versao: string;
  ativa: boolean;
  embedding: number[];
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CreateSkillInput {
  nome: string;
  descricao: string;
  agente: string;
  categoria: SkillCategory;
  entrada?: SkillSchema;
  saida?: SkillSchema;
  triggers?: string[];
  dependencias?: string[];
}

export interface UpdateSkillInput {
  nome?: string;
  descricao?: string;
  categoria?: SkillCategory;
  entrada?: SkillSchema;
  saida?: SkillSchema;
  triggers?: string[];
  dependencias?: string[];
  ativa?: boolean;
}

export interface SkillRecommendation {
  skill: Skill;
  score: number;
  reason: string;
}

// ==========================================
// SKILLS SERVICE
// ==========================================

export class SkillsService {
  private client: SupabaseClient;
  private genAI: GoogleGenerativeAI;
  private embeddingModel: string = 'text-embedding-004';

  constructor(supabaseUrl: string, supabaseKey: string, geminiKey: string) {
    this.client = createClient(supabaseUrl, supabaseKey);
    this.genAI = new GoogleGenerativeAI(geminiKey);
  }

  /**
   * Generate embedding for skill content
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
    const result = await model.embedContent(text);
    return result.embedding.values;
  }

  /**
   * Create a new skill
   */
  async create(input: CreateSkillInput, userId?: string): Promise<Skill | null> {
    try {
      const embedding = await this.generateEmbedding(
        `${input.nome} ${input.descricao} ${input.categoria}`
      );

      const { data, error } = await this.client
        .from('skills')
        .insert({
          nome: input.nome,
          descricao: input.descricao,
          agente: input.agente,
          categoria: input.categoria,
          entrada: input.entrada || {},
          saida: input.saida || {},
          triggers: input.triggers || [],
          dependencias: input.dependencias || [],
          versao: '1.0.0',
          ativa: true,
          embedding,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Create skill error:', error);
        return null;
      }

      return data as Skill;
    } catch (error) {
      console.error('Create skill failed:', error);
      return null;
    }
  }

  /**
   * Get skill by ID
   */
  async getById(id: string): Promise<Skill | null> {
    try {
      const { data, error } = await this.client
        .from('skills')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get skill error:', error);
        return null;
      }

      return data as Skill;
    } catch (error) {
      console.error('Get skill failed:', error);
      return null;
    }
  }

  /**
   * Update skill
   */
  async update(id: string, input: UpdateSkillInput, userId?: string): Promise<Skill | null> {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        console.error('Skill not found');
        return null;
      }

      // Generate new embedding if name or description changed
      let embedding = existing.embedding;
      if (input.nome || input.descricao) {
        embedding = await this.generateEmbedding(
          `${input.nome || existing.nome} ${input.descricao || existing.descricao} ${input.categoria || existing.categoria}`
        );
      }

      const updateData: any = {
        ...(input.nome !== undefined && { nome: input.nome }),
        ...(input.descricao !== undefined && { descricao: input.descricao }),
        ...(input.categoria !== undefined && { categoria: input.categoria }),
        ...(input.entrada !== undefined && { entrada: input.entrada }),
        ...(input.saida !== undefined && { saida: input.saida }),
        ...(input.triggers !== undefined && { triggers: input.triggers }),
        ...(input.dependencias !== undefined && { dependencias: input.dependencias }),
        ...(input.ativa !== undefined && { ativa: input.ativa }),
        embedding,
        updated_by: userId
      };

      const { data, error } = await this.client
        .from('skills')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update skill error:', error);
        return null;
      }

      return data as Skill;
    } catch (error) {
      console.error('Update skill failed:', error);
      return null;
    }
  }

  /**
   * Delete skill
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.client.from('skills').delete().eq('id', id);

      if (error) {
        console.error('Delete skill error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete skill failed:', error);
      return false;
    }
  }

  /**
   * Search skills
   */
  async search(
    query: string,
    agente?: string,
    categoria?: SkillCategory,
    limit: number = 20
  ): Promise<Skill[]> {
    try {
      let supabaseQuery = this.client
        .from('skills')
        .select('*')
        .eq('ativa', true)
        .order('updated_at', { ascending: false });

      if (agente) {
        supabaseQuery = supabaseQuery.eq('agente', agente);
      }

      if (categoria) {
        supabaseQuery = supabaseQuery.eq('categoria', categoria);
      }

      const { data, error } = await supabaseQuery.limit(limit * 2);

      if (error) {
        console.error('Search skills error:', error);
        return [];
      }

      // Filter by query
      const queryLower = query.toLowerCase();
      const results = (data || [])
        .filter((skill: any) => {
          return (
            skill.nome.toLowerCase().includes(queryLower) ||
            skill.descricao.toLowerCase().includes(queryLower) ||
            skill.categoria.toLowerCase().includes(queryLower)
          );
        })
        .slice(0, limit);

      return results as Skill[];
    } catch (error) {
      console.error('Search skills failed:', error);
      return [];
    }
  }

  /**
   * Get skills by category
   */
  async getByCategory(categoria: SkillCategory, limit: number = 50): Promise<Skill[]> {
    try {
      const { data, error } = await this.client
        .from('skills')
        .select('*')
        .eq('categoria', categoria)
        .eq('ativa', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get by category error:', error);
        return [];
      }

      return (data || []) as Skill[];
    } catch (error) {
      console.error('Get by category failed:', error);
      return [];
    }
  }

  /**
   * Get skills by agent
   */
  async getByAgent(agente: string, limit: number = 50): Promise<Skill[]> {
    try {
      const { data, error } = await this.client
        .from('skills')
        .select('*')
        .eq('agente', agente)
        .eq('ativa', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get by agent error:', error);
        return [];
      }

      return (data || []) as Skill[];
    } catch (error) {
      console.error('Get by agent failed:', error);
      return [];
    }
  }

  /**
   * Get related skills based on dependencies and triggers
   */
  async getRelated(id: string, limit: number = 5): Promise<Skill[]> {
    try {
      const skill = await this.getById(id);
      if (!skill) return [];

      const { data, error } = await this.client
        .from('skills')
        .select('*')
        .neq('id', id)
        .eq('ativa', true)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Get related error:', error);
        return [];
      }

      // Filter related skills (dependencies or shared triggers)
      const results = (data || [])
        .filter((other: any) => {
          return (
            skill.dependencias.includes(other.id) ||
            other.dependencias.includes(skill.id) ||
            skill.triggers.some((t: string) => other.triggers.includes(t))
          );
        })
        .slice(0, limit);

      return results as Skill[];
    } catch (error) {
      console.error('Get related failed:', error);
      return [];
    }
  }

  /**
   * Recommend skills for an agent based on context
   */
  async recommendSkillsForAgent(
    agente: string,
    contexto: string,
    limit: number = 10
  ): Promise<SkillRecommendation[]> {
    try {
      // Get all active skills for the agent
      const skills = await this.getByAgent(agente, 100);

      if (skills.length === 0) {
        return [];
      }

      // Generate embedding for context
      const contextEmbedding = await this.generateEmbedding(contexto);

      // Score skills based on context relevance
      const recommendations: SkillRecommendation[] = skills
        .map(skill => {
          let score = 0;
          const contextLower = contexto.toLowerCase();

          // Keyword matching
          if (skill.nome.toLowerCase().includes(contextLower)) score += 0.4;
          if (skill.descricao.toLowerCase().includes(contextLower)) score += 0.3;
          if (skill.categoria.toLowerCase().includes(contextLower)) score += 0.2;

          // Trigger matching
          if (skill.triggers.some(t => contextLower.includes(t.toLowerCase()))) {
            score += 0.1;
          }

          return {
            skill,
            score: Math.min(score, 1),
            reason: this.getRecommendationReason(skill, contexto)
          };
        })
        .filter(rec => rec.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Recommend skills failed:', error);
      return [];
    }
  }

  /**
   * Get recommendation reason
   */
  private getRecommendationReason(skill: Skill, contexto: string): string {
    const contextLower = contexto.toLowerCase();

    if (skill.nome.toLowerCase().includes(contextLower)) {
      return `Skill "${skill.nome}" matches the context`;
    }

    if (skill.descricao.toLowerCase().includes(contextLower)) {
      return `Skill description matches the context`;
    }

    if (skill.triggers.some(t => contextLower.includes(t.toLowerCase()))) {
      return `Skill triggers match the context`;
    }

    return `Skill "${skill.nome}" is relevant to this context`;
  }

  /**
   * Get all unique agents with skills
   */
  async getAgents(): Promise<string[]> {
    try {
      const { data, error } = await this.client
        .from('skills')
        .select('agente')
        .eq('ativa', true)
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
   * Get all skill categories
   */
  async getCategories(): Promise<SkillCategory[]> {
    return ['automacao', 'analise', 'criacao', 'integracao', 'validacao'];
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    ativas: number;
    inativas: number;
    byCategory: { [key in SkillCategory]: number };
    byAgent: { [key: string]: number };
  }> {
    try {
      const { data, error, count } = await this.client
        .from('skills')
        .select('*', { count: 'exact' });

      if (error) {
        console.error('Get stats error:', error);
        return {
          total: 0,
          ativas: 0,
          inativas: 0,
          byCategory: { automacao: 0, analise: 0, criacao: 0, integracao: 0, validacao: 0 },
          byAgent: {}
        };
      }

      const byCategory: { [key in SkillCategory]: number } = {
        automacao: 0,
        analise: 0,
        criacao: 0,
        integracao: 0,
        validacao: 0
      };
      const byAgent: { [key: string]: number } = {};
      let ativas = 0;
      let inativas = 0;

      (data || []).forEach((skill: any) => {
        byCategory[skill.categoria as SkillCategory]++;
        byAgent[skill.agente] = (byAgent[skill.agente] || 0) + 1;

        if (skill.ativa) {
          ativas++;
        } else {
          inativas++;
        }
      });

      return {
        total: count || 0,
        ativas,
        inativas,
        byCategory,
        byAgent
      };
    } catch (error) {
      console.error('Get stats failed:', error);
      return {
        total: 0,
        ativas: 0,
        inativas: 0,
        byCategory: { automacao: 0, analise: 0, criacao: 0, integracao: 0, validacao: 0 },
        byAgent: {}
      };
    }
  }
}

export default SkillsService;
