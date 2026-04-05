# Alexandria - TODO List

## FASE 1: Setup Inicial
- [x] Inicializar projeto com scaffold web-db-user
- [ ] Ler skills relevantes (skill-creator, lead-research-assistant)
- [ ] Configurar Google Gemini API

## FASE 2: Serviço de Ingestão (Giles Knowledge)
- [x] Implementar ingestionService.ts com chunking hierárquico
- [x] Deduplicação via SHA-256
- [x] Geração de embeddings com Google Gemini
- [x] Processamento em lotes com backoff exponencial
- [x] Extração de entidades (siglas, códigos, datas, emails, valores)
- [x] Inferência de tags
- [x] Testes unitários para ingestionService
- [ ] Integrar ingestionService nos endpoints tRPC

## FASE 3: Banco de Dados e Serviços Backend
- [ ] Criar tabelas: pops, contexts, skills (knowledge já existe)
- [ ] Configurar extensão pgvector
- [ ] Criar índices para busca vetorial
- [ ] Configurar RLS (Row Level Security)
- [x] Implementar knowledgeService (busca híbrida)
- [x] Implementar popsService (CRUD + versionamento)
- [x] Implementar contextTransformService (transformações)
- [x] Implementar skillsService (recomendações)

## FASE 4: Endpoints tRPC
- [ ] Criar router alexandria.pops.*
- [ ] Criar router alexandria.context.*
- [ ] Criar router alexandria.skills.*
- [ ] Criar router openclaw.*
- [ ] Implementar health checks

## FASE 5: Frontend Base
- [x] Criar componentes UI reutilizáveis (shadcn/ui)
- [x] Implementar layout com sidebar (AlexandriaLayout)
- [x] Criar página Home com dashboard
- [x] Configurar navegação entre módulos

## FASE 6: Módulos Frontend
- [ ] Implementar Portal de POPs
- [ ] Implementar Context Hub
- [ ] Implementar Central de Skills
- [ ] Implementar Dashboard OpenClaw

## FASE 7: Integração e Testes
- [ ] Testes unitários com vitest (cobertura 80%+)
- [ ] Testar busca semântica
- [ ] Testar transformações de formato
- [ ] Validar recomendações inteligentes
- [ ] Testes de integração

## FASE 8: Refinamento e Deploy
- [ ] Otimizar performance de buscas
- [ ] Adicionar loading states e error handling
- [ ] Implementar refresh automático (polling 30s)
- [ ] Documentação de APIs
- [ ] Preparar para deploy

## FASE 9: Entrega
- [ ] Criar checkpoint final
- [ ] Documentação completa
- [ ] URL de acesso funcional
- [ ] Exemplos de uso
