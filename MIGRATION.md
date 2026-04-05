# 🚀 Migração em Massa - Alexandria v2

Script para migrar todos os POPs de uma vez usando **Gemini embeddings reais** (3072 dimensões).

## ⚠️ Pré-requisito CRÍTICO

O schema do Supabase precisa ser atualizado para suportar 3072 dimensões:

```sql
-- Execute no Supabase SQL Editor
ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(3072);
```

## 📋 Pré-requisitos

1. **Credenciais configuradas (já estão no .env.local):**
```bash
# Supabase
SUPABASE_URL=https://cgpkfhrqprqptvehatad.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Gemini (funcionando!)
GEMINI_API_KEY=AIzaSyBylRgKAiV84y2HVwq9aNxllfciOVlqz0U
```

2. **Arquivos organizados:**
```
docs/
└── pops/
    ├── POP-001-atendimento.md
    ├── POP-002-crm.md
    └── ...
```

## 🧪 Teste (Dry Run)

Antes de migrar de verdade, simule:

```bash
cd projeto-alexandria
node migrate-pops-v2.mjs --dir=./docs/pops --dry-run
```

## 🚀 Migração Real

### Passo 1: Atualizar Schema
```sql
-- No Supabase Dashboard → SQL Editor
ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(3072);
```

### Passo 2: Rodar Migração
```bash
cd projeto-alexandria

# Todos os POPs
node migrate-pops-v2.mjs --dir=./docs/pops

# Por categoria
node migrate-pops-v2.mjs --dir=./docs/pops/atendimento --dominio=atendimento
node migrate-pops-v2.mjs --dir=./docs/pops/tecnico --dominio=tecnico
node migrate-pops-v2.mjs --dir=./docs/pops/vendas --dominio=vendas
```

## 📊 O que o script faz

1. **Testa conexões** - Supabase + Gemini
2. **Busca arquivos** - Encontra todos `.md`, `.txt`, `.markdown`
3. **Parse markdown** - Extrai hierarquia de headings
4. **Gera embeddings** - Via Gemini (3072D) com rate limiting
5. **Insere no Supabase** - Em batches com hash cache
6. **Gera relatório** - JSON com estatísticas completas

## ⚡ Rate Limiting

O script respeita limites da API Gemini:
- **300ms** entre chunks
- **2 segundos** entre arquivos
- **3 tentativas** com exponential backoff em erros

## 📈 Estimativa de Tempo

| POPs | Chunks Estimados | Tempo |
|------|------------------|-------|
| 10 | ~70 | ~3 minutos |
| 50 | ~350 | ~15 minutos |
| 100 | ~700 | ~30 minutos |

## 🆘 Em caso de erro

### Erro: "expected X dimensions, not 768"
**Solução:** Execute o SQL de atualização do schema (veja Pré-requisito CRÍTICO acima)

### Erro: "column cannot have more than 2000 dimensions"
**Solução:** Você está tentando usar 3072D. O script agora usa 768D que é compatível com HNSW.

### Migração parou no meio
**O que fazer:** Rode de novo. O hash cache vai pular os já processados.

```bash
# Continuar de onde parou
node migrate-pops-v2.mjs --dir=./docs/pops --dominio=operacao
```

## ✅ Verificação pós-migração

No Supabase Dashboard:
```sql
-- Quantos chunks?
SELECT COUNT(*) FROM giles_knowledge;

-- Por domínio
SELECT metadata->>'dominio' as dominio, COUNT(*) 
FROM giles_knowledge 
GROUP BY metadata->>'dominio';

-- Últimos documentos
SELECT doc_id, hierarchical_path, created_at 
FROM giles_knowledge 
ORDER BY created_at DESC 
LIMIT 10;

-- Teste de busca vetorial
SELECT doc_id, content,
  embedding <=> (
    SELECT embedding FROM giles_knowledge WHERE doc_id = 'POP-001' LIMIT 1
  ) as distance
FROM giles_knowledge
ORDER BY distance
LIMIT 5;
```

## 📁 Estrutura de pastas sugerida

```
docs/pops/
├── atendimento/
│   ├── POP-001-saudacao.md
│   ├── POP-002-gatilhos.md
│   └── POP-003-sla.md
├── tecnico/
│   ├── POP-101-api.md
│   ├── POP-102-deploy.md
│   └── POP-103-backup.md
├── vendas/
│   ├── POP-201-prospeccao.md
│   └── POP-202-proposta.md
└── rh/
    ├── POP-301-onboarding.md
    └── POP-302-ferias.md
```

Migração por pasta:
```bash
node migrate-pops-v2.mjs --dir=./docs/pops/atendimento --dominio=atendimento
node migrate-pops-v2.mjs --dir=./docs/pops/tecnico --dominio=tecnico
node migrate-pops-v2.mjs --dir=./docs/pops/vendas --dominio=vendas
node migrate-pops-v2.mjs --dir=./docs/pops/rh --dominio=rh
```

## 📄 Arquivos de Relatório

Cada migração gera um arquivo `migration-report-{timestamp}.json` com:
- Estatísticas completas
- Lista de arquivos processados
- Erros encontrados
- Duração total

---

## 🎯 Resumo do Processo

```bash
# 1. Atualizar schema (uma vez)
# No Supabase SQL Editor:
# ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(3072);

# 2. Testar (dry run)
node migrate-pops-v2.mjs --dir=./docs/pops --dry-run

# 3. Migrar
node migrate-pops-v2.mjs --dir=./docs/pops --dominio=operacao

# 4. Verificar
# No Supabase: SELECT COUNT(*) FROM giles_knowledge;
```

---

*Script v2 - Usa Gemini embeddings reais (3072D)*
 SELECT COUNT(*) FROM giles_knowledge;
```

---

*Script v2 - Usa Gemini embeddings reais (3072D)*
