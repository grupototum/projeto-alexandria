# Alexandria - Central de Conhecimento Integrada

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-Em%20Desenvolvimento-yellow)

## 🎯 Visão Geral

**Alexandria** é uma plataforma web completa de gerenciamento de conhecimento integrada, projetada para ser a central de inteligência de organizações. Combina busca semântica híbrida, gerenciamento de contextos para agentes IA, catálogo de skills e monitoramento de gateway em uma única interface intuitiva.

## ✨ Funcionalidades Principais

### 1. **Portal de POPs** 📋
- CRUD completo de Procedimentos Operacionais Padrão
- Busca semântica híbrida (embeddings + full-text)
- Versionamento automático com histórico
- Filtros por departamento, status e tags
- Recomendações de POPs relacionados
- Status: draft, review, approved, deprecated

### 2. **Context Hub** 🧠
- Gerenciador de contextos para agentes IA
- 5 tipos de contexto: personality, memory, knowledge, process, client
- Transformação automática entre formatos: JSON, Markdown, YAML, Prompt, Summary
- Consolidação de múltiplos contextos em prompt único
- Versionamento com rastreamento de mudanças
- Busca por agente, tipo e conteúdo

### 3. **Central de Skills** ⚡
- Catálogo de habilidades com 5 categorias: automação, análise, criação, integração, validação
- Definição de schemas de entrada/saída (JSON Schema)
- Triggers e dependências entre skills
- Recomendações inteligentes baseadas em contexto do agente
- Busca semântica por intenção
- Estatísticas de skills ativas/inativas

### 4. **Dashboard OpenClaw** 📊
- Monitoramento em tempo real do gateway
- Visualização de skills instaladas com status
- Logs e métricas (total de skills, prontas, requerem setup, erros)
- Alertas e notificações
- Estatísticas de uso

## 🏗️ Arquitetura Técnica

### Frontend
- **React 19** com TypeScript
- **Tailwind CSS 4** para styling
- **shadcn/ui** para componentes reutilizáveis
- **Wouter** para roteamento
- **tRPC** para comunicação com backend

### Backend
- **Node.js** com Express 4
- **tRPC 11** para APIs type-safe
- **Zod** para validação de schemas
- **Supabase** (PostgreSQL) com extensão pgvector
- **Google Gemini** para embeddings (768D via MRL) e transformações

### Banco de Dados
- **Supabase (PostgreSQL)**
- Extensão **pgvector** para busca vetorial
- Tabelas: `giles_knowledge`, `pops`, `contexts`, `skills`
- Campos de embedding (vector 768D)
- Metadados em JSONB

## 📦 Serviços Backend

### ingestionService.ts
- Chunking hierárquico respeitando estrutura de headings
- Deduplicação via SHA-256
- Geração de embeddings com Google Gemini
- Processamento em lotes com backoff exponencial
- Extração de entidades (siglas, códigos, datas, emails, valores)
- Inferência automática de tags

### knowledgeService.ts
- Busca híbrida: semântica (embeddings) + full-text (PostgreSQL FTS)
- Recuperação por documento, tag, entidade
- Estatísticas da base de conhecimento
- Pesos configuráveis para balancear relevância

### popsService.ts
- CRUD completo com versionamento automático
- Busca semântica com embeddings
- Filtros por departamento e status
- Histórico de versões com rastreamento
- Recomendações de POPs relacionados
- Estatísticas por status e departamento

### contextTransformService.ts
- Gerenciamento de contextos para agentes IA
- Transformação entre formatos via Gemini
- Consolidação de múltiplos contextos
- Versionamento automático
- Busca por agente, tipo e conteúdo

### skillsService.ts
- Catálogo de skills com categorias
- Definição de schemas de entrada/saída
- Triggers e dependências
- Recomendações inteligentes
- Busca semântica por intenção
- Estatísticas

## 🚀 Quick Start

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- Conta Supabase
- Chave de API Google Gemini

### Instalação

```bash
# Clone o repositório
git clone https://github.com/grupototum/projeto-alexandria.git
cd projeto-alexandria

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais

# Inicie o servidor de desenvolvimento
pnpm dev
```

### Variáveis de Ambiente Necessárias

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Google Gemini
GOOGLE_GEMINI_API_KEY=your-gemini-key

# OAuth
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# Banco de Dados
DATABASE_URL=mysql://user:password@host:port/database

# Segurança
JWT_SECRET=your-jwt-secret
```

## 📚 Endpoints tRPC

### Knowledge
- `alexandria.knowledge.search(query, limit)` - Busca híbrida
- `alexandria.knowledge.getById(id)` - Obter por ID
- `alexandria.knowledge.getByDocId(docId)` - Obter por documento
- `alexandria.knowledge.getByTag(tag)` - Obter por tag
- `alexandria.knowledge.getStats()` - Estatísticas

### POPs
- `alexandria.pops.create(input)` - Criar POP
- `alexandria.pops.getById(id)` - Obter POP
- `alexandria.pops.update(id, data)` - Atualizar POP
- `alexandria.pops.search(query, departamento?, limit?)` - Buscar POPs
- `alexandria.pops.getByDepartment(departamento)` - Obter por departamento
- `alexandria.pops.getRelated(id)` - Obter POPs relacionados
- `alexandria.pops.getVersionHistory(popId)` - Histórico de versões
- `alexandria.pops.getStats()` - Estatísticas

### Context
- `alexandria.context.create(input)` - Criar contexto
- `alexandria.context.getById(id)` - Obter contexto
- `alexandria.context.update(id, data)` - Atualizar contexto
- `alexandria.context.search(query, agente?, tipo?, limit?)` - Buscar contextos
- `alexandria.context.transform(content, sourceFormat, targetFormat)` - Transformar formato
- `alexandria.context.consolidate(contextIds, outputFormat?)` - Consolidar contextos
- `alexandria.context.getStats()` - Estatísticas

### Skills
- `alexandria.skills.create(input)` - Criar skill
- `alexandria.skills.getById(id)` - Obter skill
- `alexandria.skills.update(id, data)` - Atualizar skill
- `alexandria.skills.search(query, agente?, categoria?, limit?)` - Buscar skills
- `alexandria.skills.recommend(agente, contexto, limit?)` - Recomendações
- `alexandria.skills.getStats()` - Estatísticas

## 🗂️ Estrutura do Projeto

```
alexandria/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Home, POPs, Context, Skills, OpenClaw)
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/           # Utilitários e configurações
│   │   └── App.tsx        # Roteamento principal
│   └── public/            # Arquivos estáticos
├── server/                # Backend Node.js
│   ├── routers/           # Routers tRPC
│   │   └── alexandria.ts  # Router principal
│   ├── ingestionService.ts    # Serviço de ingestão
│   ├── knowledgeService.ts    # Serviço de conhecimento
│   ├── popsService.ts         # Serviço de POPs
│   ├── contextTransformService.ts  # Serviço de contextos
│   ├── skillsService.ts       # Serviço de skills
│   ├── db.ts              # Helpers de banco de dados
│   └── _core/             # Configuração interna
├── drizzle/               # Schema e migrações
│   └── schema.ts          # Definição de tabelas
├── shared/                # Código compartilhado
└── package.json           # Dependências

```

## 🧪 Testes

```bash
# Executar testes
pnpm test

# Testes com cobertura
pnpm test:coverage

# Watch mode
pnpm test:watch
```

## 📖 Documentação

- [Guia de Arquitetura](./docs/ARCHITECTURE.md)
- [Guia de API](./docs/API.md)
- [Guia de Desenvolvimento](./docs/DEVELOPMENT.md)

## 🔄 Fluxo de Desenvolvimento

1. **Ingestão de Conhecimento**
   - Documentos Markdown são processados pelo ingestionService
   - Chunking hierárquico respeita estrutura de headings
   - Embeddings gerados via Google Gemini
   - Dados armazenados em Supabase com pgvector

2. **Busca e Recuperação**
   - knowledgeService oferece busca híbrida
   - Semântica: similaridade de embeddings
   - Full-text: busca PostgreSQL FTS
   - Resultados combinados e ranqueados

3. **Gerenciamento de POPs**
   - POPs criados com status draft
   - Versionamento automático ao atualizar
   - Busca semântica e filtros
   - Recomendações de POPs relacionados

4. **Contextos para Agentes**
   - Múltiplos tipos de contexto
   - Transformação entre formatos
   - Consolidação em prompts únicos
   - Histórico de versões

5. **Recomendações de Skills**
   - Análise de contexto do agente
   - Busca semântica por intenção
   - Recomendações baseadas em similaridade
   - Sugestões de skills relacionados

## 🤝 Contribuindo

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Autores

- **Grupo Totum** - Desenvolvimento inicial

## 📞 Suporte

Para suporte, abra uma issue no repositório GitHub ou entre em contato através de [support@grupototum.com](mailto:support@grupototum.com).

## 🗺️ Roadmap

- [ ] Fase 6: Implementar módulos frontend (POPs, Context Hub, Skills, OpenClaw)
- [ ] Fase 7: Integração completa e testes
- [ ] [ ] Autenticação OAuth2 avançada
- [ ] Notificações em tempo real via WebSocket
- [ ] Dashboard de analytics
- [ ] Exportação de relatórios
- [ ] Integração com ferramentas externas
- [ ] API REST adicional
- [ ] Documentação interativa

## 🚀 Migração em Massa

Para migrar todos os POPs de uma vez:

```bash
# Configurar credenciais
export SUPABASE_URL="https://..."
export SUPABASE_ANON_KEY="..."
export GEMINI_API_KEY="..."

# Teste (dry run)
node migrate-pops.mjs --dir=./docs/pops --dry-run

# Migração real
node migrate-pops.mjs --dir=./docs/pops --dominio=operacao
```

Veja [MIGRATION.md](./MIGRATION.md) para detalhes completos.

---

**Alexandria v1.0.0** • Plataforma de Gerenciamento de Conhecimento com IA
