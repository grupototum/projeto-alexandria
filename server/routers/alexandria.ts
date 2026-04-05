import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { KnowledgeService } from '../knowledgeService';
import { POPsService } from '../popsService';
import { ContextTransformService } from '../contextTransformService';
import { SkillsService } from '../skillsService';
import { ENV } from '../_core/env';

// ==========================================
// INITIALIZE SERVICES
// ==========================================

const knowledgeService = new KnowledgeService(
  ENV.supabaseUrl,
  ENV.supabaseAnonKey,
  ENV.googleGeminiApiKey
);

const popsService = new POPsService(
  ENV.supabaseUrl,
  ENV.supabaseAnonKey,
  ENV.googleGeminiApiKey
);

const contextService = new ContextTransformService(
  ENV.supabaseUrl,
  ENV.supabaseAnonKey,
  ENV.googleGeminiApiKey
);

const skillsService = new SkillsService(
  ENV.supabaseUrl,
  ENV.supabaseAnonKey,
  ENV.googleGeminiApiKey
);

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

const SearchQuerySchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(10)
});

const POPCreateSchema = z.object({
  departamento: z.string().min(1),
  titulo: z.string().min(1),
  conteudo: z.string().min(1),
  gatilhos: z.array(z.string()).optional(),
  slas: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'approved', 'deprecated']).optional()
});

const POPUpdateSchema = z.object({
  titulo: z.string().optional(),
  conteudo: z.string().optional(),
  gatilhos: z.array(z.string()).optional(),
  slas: z.record(z.string(), z.string()).optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'review', 'approved', 'deprecated']).optional(),
  mudancas: z.string().optional()
});

const ContextCreateSchema = z.object({
  tipo: z.enum(['personality', 'memory', 'knowledge', 'process', 'client']),
  agente: z.string().min(1),
  titulo: z.string().min(1),
  conteudo: z.string().min(1),
  formato: z.enum(['json', 'markdown', 'yaml', 'prompt', 'summary']).optional(),
  tags: z.array(z.string()).optional()
});

const ContextUpdateSchema = z.object({
  titulo: z.string().optional(),
  conteudo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  mudancas: z.string().optional()
});

const SkillCreateSchema = z.object({
  nome: z.string().min(1),
  descricao: z.string().min(1),
  agente: z.string().min(1),
  categoria: z.enum(['automacao', 'analise', 'criacao', 'integracao', 'validacao']),
  entrada: z.record(z.string(), z.object({
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional()
  })).optional(),
  saida: z.record(z.string(), z.object({
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional()
  })).optional(),
  triggers: z.array(z.string()).optional(),
  dependencias: z.array(z.string()).optional()
});

const SkillUpdateSchema = z.object({
  nome: z.string().optional(),
  descricao: z.string().optional(),
  categoria: z.enum(['automacao', 'analise', 'criacao', 'integracao', 'validacao']).optional(),
  entrada: z.record(z.string(), z.object({
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional()
  })).optional(),
  saida: z.record(z.string(), z.object({
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean().optional()
  })).optional(),
  triggers: z.array(z.string()).optional(),
  dependencias: z.array(z.string()).optional(),
  ativa: z.boolean().optional()
});

// ==========================================
// ROUTERS
// ==========================================

export const alexandriaRouter = router({
  // Health check
  healthCheck: publicProcedure.query(async () => {
    try {
      const stats = await knowledgeService.getStats();
      return {
        status: 'ok',
        knowledge: { total: stats.total },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: 'Failed to connect to knowledge base',
        timestamp: new Date().toISOString()
      };
    }
  }),

  // ==========================================
  // KNOWLEDGE ROUTES
  // ==========================================
  knowledge: router({
    search: publicProcedure.input(SearchQuerySchema).query(async ({ input }) => {
      return knowledgeService.hybridSearch(input.query, { limit: input.limit });
    }),

    getById: publicProcedure.input(z.string()).query(async ({ input }) => {
      return knowledgeService.getById(input);
    }),

    getByDocId: publicProcedure.input(z.string()).query(async ({ input }) => {
      return knowledgeService.getByDocId(input);
    }),

    getByTag: publicProcedure.input(z.string()).query(async ({ input }) => {
      return knowledgeService.getByTag(input);
    }),

    getDocuments: publicProcedure.query(async () => {
      return knowledgeService.getDocuments();
    }),

    getTags: publicProcedure.query(async () => {
      return knowledgeService.getTags();
    }),

    getStats: publicProcedure.query(async () => {
      return knowledgeService.getStats();
    }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
      return knowledgeService.deleteById(input);
    }),

    deleteByDocId: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
      return knowledgeService.deleteByDocId(input);
    })
  }),

  // ==========================================
  // POPS ROUTES
  // ==========================================
  pops: router({
    create: protectedProcedure.input(POPCreateSchema).mutation(async ({ input, ctx }) => {
      return popsService.create(input, ctx.user?.id.toString());
    }),

    getById: publicProcedure.input(z.string()).query(async ({ input }) => {
      return popsService.getById(input);
    }),

    update: protectedProcedure
      .input(z.object({ id: z.string(), data: POPUpdateSchema }))
      .mutation(async ({ input, ctx }) => {
        return popsService.update(input.id, input.data, ctx.user?.id.toString());
      }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
      return popsService.delete(input);
    }),

    search: publicProcedure
      .input(z.object({ query: z.string(), departamento: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return popsService.search(input.query, input.departamento, input.limit);
      }),

    getByDepartment: publicProcedure.input(z.string()).query(async ({ input }) => {
      return popsService.getByDepartment(input);
    }),

    getByStatus: publicProcedure.input(z.enum(['draft', 'review', 'approved', 'deprecated'])).query(async ({ input }) => {
      return popsService.getByStatus(input);
    }),

    getDepartamentos: publicProcedure.query(async () => {
      return popsService.getDepartamentos();
    }),

    getRelated: publicProcedure.input(z.string()).query(async ({ input }) => {
      return popsService.getRelated(input);
    }),

    getVersionHistory: publicProcedure.input(z.string()).query(async ({ input }) => {
      return popsService.getVersionHistory(input);
    }),

    getVersion: publicProcedure
      .input(z.object({ popId: z.string(), versao: z.number() }))
      .query(async ({ input }) => {
        return popsService.getVersion(input.popId, input.versao);
      }),

    getStats: publicProcedure.query(async () => {
      return popsService.getStats();
    })
  }),

  // ==========================================
  // CONTEXT ROUTES
  // ==========================================
  context: router({
    create: protectedProcedure.input(ContextCreateSchema).mutation(async ({ input, ctx }) => {
      return contextService.create(input, ctx.user?.id.toString());
    }),

    getById: publicProcedure.input(z.string()).query(async ({ input }) => {
      return contextService.getById(input);
    }),

    update: protectedProcedure
      .input(z.object({ id: z.string(), data: ContextUpdateSchema }))
      .mutation(async ({ input, ctx }) => {
        return contextService.update(input.id, input.data, ctx.user?.id.toString());
      }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
      return contextService.delete(input);
    }),

    search: publicProcedure
      .input(z.object({
        query: z.string(),
        agente: z.string().optional(),
        tipo: z.enum(['personality', 'memory', 'knowledge', 'process', 'client']).optional(),
        limit: z.number().optional()
      }))
      .query(async ({ input }) => {
        return contextService.search(input.query, input.agente, input.tipo, input.limit);
      }),

    getByAgent: publicProcedure.input(z.string()).query(async ({ input }) => {
      return contextService.getByAgent(input);
    }),

    getByType: publicProcedure.input(z.enum(['personality', 'memory', 'knowledge', 'process', 'client'])).query(async ({ input }) => {
      return contextService.getByType(input);
    }),

    getAgents: publicProcedure.query(async () => {
      return contextService.getAgents();
    }),

    transform: publicProcedure
      .input(z.object({
        content: z.string(),
        sourceFormat: z.enum(['json', 'markdown', 'yaml', 'prompt', 'summary']),
        targetFormat: z.enum(['json', 'markdown', 'yaml', 'prompt', 'summary'])
      }))
      .query(async ({ input }) => {
        return contextService.transformFormat(input.content, input.sourceFormat, input.targetFormat);
      }),

    consolidate: publicProcedure
      .input(z.object({
        contextIds: z.array(z.string()),
        outputFormat: z.enum(['json', 'markdown', 'yaml', 'prompt', 'summary']).optional()
      }))
      .query(async ({ input }) => {
        return contextService.consolidateContexts(input.contextIds, input.outputFormat);
      }),

    getVersionHistory: publicProcedure.input(z.string()).query(async ({ input }) => {
      return contextService.getVersionHistory(input);
    }),

    getStats: publicProcedure.query(async () => {
      return contextService.getStats();
    })
  }),

  // ==========================================
  // SKILLS ROUTES
  // ==========================================
  skills: router({
    create: protectedProcedure.input(SkillCreateSchema).mutation(async ({ input, ctx }) => {
      return skillsService.create(input, ctx.user?.id.toString());
    }),

    getById: publicProcedure.input(z.string()).query(async ({ input }) => {
      return skillsService.getById(input);
    }),

    update: protectedProcedure
      .input(z.object({ id: z.string(), data: SkillUpdateSchema }))
      .mutation(async ({ input, ctx }) => {
        return skillsService.update(input.id, input.data, ctx.user?.id.toString());
      }),

    delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
      return skillsService.delete(input);
    }),

    search: publicProcedure
      .input(z.object({
        query: z.string(),
        agente: z.string().optional(),
        categoria: z.enum(['automacao', 'analise', 'criacao', 'integracao', 'validacao']).optional(),
        limit: z.number().optional()
      }))
      .query(async ({ input }) => {
        return skillsService.search(input.query, input.agente, input.categoria, input.limit);
      }),

    getByCategory: publicProcedure
      .input(z.enum(['automacao', 'analise', 'criacao', 'integracao', 'validacao']))
      .query(async ({ input }) => {
        return skillsService.getByCategory(input);
      }),

    getByAgent: publicProcedure.input(z.string()).query(async ({ input }) => {
      return skillsService.getByAgent(input);
    }),

    getRelated: publicProcedure.input(z.string()).query(async ({ input }) => {
      return skillsService.getRelated(input);
    }),

    recommend: publicProcedure
      .input(z.object({
        agente: z.string(),
        contexto: z.string(),
        limit: z.number().optional()
      }))
      .query(async ({ input }) => {
        return skillsService.recommendSkillsForAgent(input.agente, input.contexto, input.limit);
      }),

    getCategories: publicProcedure.query(async () => {
      return skillsService.getCategories();
    }),

    getAgents: publicProcedure.query(async () => {
      return skillsService.getAgents();
    }),

    getStats: publicProcedure.query(async () => {
      return skillsService.getStats();
    })
  })
});

export type AlexandriaRouter = typeof alexandriaRouter;
