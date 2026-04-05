#!/usr/bin/env node
/**
 * Script de Migração em Massa - Alexandria v2
 * 
 * Usa Gemini embeddings reais (768D via MRL) com rate limiting
 * 
 * ⚠️ PRÉ-REQUISITO: Execute no Supabase:
 * UPDATE giles_knowledge SET embedding = NULL;
 * ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(768);
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Configuração
const CONFIG = {
  BATCH_SIZE: 5,           // Chunks por batch (baixo por causa da API)
  DELAY_BETWEEN_CHUNKS_MS: 300,  // 300ms entre chunks (evita rate limit)
  DELAY_BETWEEN_FILES_MS: 2000,  // 2s entre arquivos
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // Exponential backoff
  SUPPORTED_EXTENSIONS: ['.md', '.txt', '.markdown'],
  EMBEDDING_DIMENSION: 768  // MRL: 768, 1536 ou 3072
};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Credenciais
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDI2MiwiZXhwIjoyMDkwODAwMjYyfQ.kV_iFypk00cXplJNUnSW8FEz04v2HD9z5lO5X9eJFag';
const GEMINI_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBylRgKAiV84y2HVwq9aNxllfciOVlqz0U';

// Inicializar clientes
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

/**
 * Encontra todos os arquivos compatíveis
 */
function findFiles(dirPath, recursive = true) {
  const files = [];
  
  function scan(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && recursive) {
        scan(fullPath);
      } else if (stat.isFile()) {
        const ext = path.extname(item).toLowerCase();
        if (CONFIG.SUPPORTED_EXTENSIONS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scan(dirPath);
  return files.sort();
}

/**
 * Extrai docId do nome do arquivo
 */
function extractDocId(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename
    .replace(/[-_](v\d+|final|revisado|draft|teste)$/i, '')
    .replace(/\s+/g, '-')
    .toUpperCase();
}

/**
 * Parse de markdown com hierarquia
 */
function parseMarkdown(content) {
  const lines = content.split('\n');
  const sections = [];
  let currentSection = null;
  let contentBuffer = [];
  const headingStack = [];

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

/**
 * Gera embedding com retry
 */
async function generateEmbedding(text, retries = 0) {
  try {
    const result = await embeddingModel.embedContent(text);
    const fullEmbedding = result.embedding.values;
    // MRL: Truncate to 768 dimensions (first dimensions contain most information)
    return fullEmbedding.slice(0, CONFIG.EMBEDDING_DIMENSION);
  } catch (error) {
    if (retries < CONFIG.MAX_RETRIES) {
      const delay = CONFIG.RETRY_DELAYS[retries] || 4000;
      log(`    ⏳ Rate limit, aguardando ${delay}ms...`, 'yellow');
      await sleep(delay);
      return generateEmbedding(text, retries + 1);
    }
    throw error;
  }
}

/**
 * Extrai entidades do texto
 */
function extractEntities(text) {
  const dedup = (arr) => [...new Set(arr)];
  return {
    siglas: dedup(text.match(/\b[A-Z]{2,6}\b/g) || []),
    codigos: dedup(text.match(/\b[A-Z]+-\d{3,}\b/g) || []),
    datas: dedup(text.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g) || []),
    emails: dedup(text.match(/\S+@\S+\.\S+/g) || []),
    valores: dedup(text.match(/R\$\s*[\d.,]+/g) || [])
  };
}

/**
 * Inferência de tags
 */
function inferTags(content, hierarchy) {
  const tags = new Set();
  const text = content.toLowerCase();
  const pathStr = hierarchy.join(' ').toLowerCase();

  if (text.includes('checklist')) tags.add('checklist');
  if (text.includes('procedimento') || text.includes('passo')) tags.add('procedimento');
  if (text.includes('erro') || text.includes('bug') || text.includes('falha')) tags.add('troubleshooting');
  if (text.includes('sla') || text.includes('prazo')) tags.add('sla');
  if (pathStr.includes('atendimento')) tags.add('atendimento');
  if (pathStr.includes('venda')) tags.add('vendas');
  if (pathStr.includes('tecnico') || text.includes('api')) tags.add('tecnico');
  if (text.includes('backup')) tags.add('backup');
  if (text.includes('deploy')) tags.add('deploy');

  return Array.from(tags);
}

/**
 * Gera hash SHA-256
 */
function generateHash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Processa um arquivo
 */
async function processFile(filePath, docId, dominio) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = parseMarkdown(content);
  
  const chunks = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const textToEmbed = section.content || section.title;
    
    if (textToEmbed.length === 0) continue;

    log(`    Chunk ${i + 1}/${sections.length}: "${section.title.substring(0, 35)}..."`, 'gray');
    
    // Gerar embedding
    const embedding = await generateEmbedding(textToEmbed);
    log(`      Embedding: ${embedding.length}D`, 'gray');
    
    chunks.push({
      doc_id: docId,
      content: textToEmbed,
      content_hash: generateHash(`${docId}:${i}:${textToEmbed}`),
      hierarchical_path: section.path.join(' > '),
      embedding: embedding,
      metadata: {
        dominio,
        hierarchy: section.path,
        level: section.level,
        position: i,
        is_complete: true,
        entities: extractEntities(textToEmbed),
        tags: inferTags(textToEmbed, section.path),
        char_count: textToEmbed.length,
        word_count: textToEmbed.split(/\s+/).filter(w => w).length,
        source_file: path.basename(filePath)
      }
    });

    // Rate limiting entre chunks
    if (i < sections.length - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_CHUNKS_MS);
    }
  }
  
  return chunks;
}

/**
 * Insere chunks no Supabase
 */
async function insertChunks(chunks) {
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const chunk of chunks) {
    const { error } = await supabase
      .from('giles_knowledge')
      .insert({
        doc_id: chunk.doc_id,
        content: chunk.content,
        content_hash: chunk.content_hash,
        hierarchical_path: chunk.hierarchical_path,
        embedding: chunk.embedding,
        metadata: chunk.metadata
      });

    if (error) {
      if (error.code === '23505') { // Duplicate
        skipped++;
      } else if (error.message.includes('dimensions')) {
        log(`      ❌ ERRO DE DIMENSÃO: ${error.message}`, 'red');
        log(`      💡 Execute: ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(3072);`, 'yellow');
        failed++;
        throw new Error('Dimensão incorreta. Atualize o schema do Supabase.');
      } else {
        log(`      ❌ Erro: ${error.message}`, 'red');
        failed++;
      }
    } else {
      inserted++;
    }
  }

  return { inserted, skipped, failed };
}

/**
 * Migração em massa
 */
async function migratePops(options) {
  const startTime = Date.now();
  const { dirPath, dominio = 'geral', dryRun = false } = options;

  log('\n🏛️  ALEXANDRIA - MIGRAÇÃO EM MASSA v2 (Gemini Real)\n', 'cyan');
  log(`📁 Diretório: ${dirPath}`);
  log(`🏷️  Domínio: ${dominio}`);
  log(`🧪 Dry Run: ${dryRun ? 'SIM' : 'Não'}\n`);

  // Verificar conexões
  log('🔌 Testando conexões...', 'blue');
  try {
    const { data: testData } = await supabase.from('giles_knowledge').select('count').limit(1);
    log('   ✅ Supabase conectado', 'green');
    
    const testEmbed = await generateEmbedding('test');
    log(`   ✅ Gemini funcionando (${testEmbed.length}D)\n`, 'green');
  } catch (error) {
    log(`   ❌ Erro: ${error.message}\n`, 'red');
    process.exit(1);
  }

  // Encontrar arquivos
  log('🔍 Buscando arquivos...', 'blue');
  const files = findFiles(dirPath);
  
  if (files.length === 0) {
    log('❌ Nenhum arquivo encontrado!', 'red');
    process.exit(1);
  }

  log(`✅ Encontrados ${files.length} arquivo(s)\n`, 'green');

  if (dryRun) {
    log('📋 Arquivos que seriam processados:\n', 'yellow');
    files.forEach((f, i) => {
      const docId = extractDocId(f);
      log(`  ${i + 1}. ${path.basename(f)} → ${docId}`);
    });
    log('\n🧪 Dry run concluído.', 'cyan');
    return;
  }

  // Estatísticas
  const stats = {
    totalFiles: files.length,
    processedFiles: 0,
    failedFiles: 0,
    totalChunks: 0,
    insertedChunks: 0,
    skippedChunks: 0,
    failedChunks: 0,
    errors: []
  };

  // Processar arquivos
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docId = extractDocId(file);
    const progress = `[${i + 1}/${files.length}]`;

    log(`${progress} 📄 ${path.basename(file)}`, 'cyan');
    log(`    ID: ${docId}`, 'gray');

    try {
      // Processar arquivo (gerar chunks com embeddings)
      const chunks = await processFile(file, docId, dominio);
      stats.totalChunks += chunks.length;
      
      log(`    ${chunks.length} chunks gerados`, 'green');

      // Inserir no Supabase
      const result = await insertChunks(chunks);
      stats.insertedChunks += result.inserted;
      stats.skippedChunks += result.skipped;
      stats.failedChunks += result.failed;
      stats.processedFiles++;

      log(`    ✅ ${result.inserted} novos | ${result.skipped} pulados\n`, 'green');

    } catch (error) {
      log(`    ❌ FALHA: ${error.message}\n`, 'red');
      stats.failedFiles++;
      stats.errors.push({ file: path.basename(file), docId, error: error.message });
    }

    // Delay entre arquivos
    if (i < files.length - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_FILES_MS);
    }
  }

  // Relatório final
  const duration = Date.now() - startTime;

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RELATÓRIO DE MIGRAÇÃO', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  log(`⏱️  Duração: ${(duration / 1000).toFixed(1)}s (${(duration / 60000).toFixed(1)}min)`);
  log(`📄 Arquivos: ${stats.processedFiles}/${stats.totalFiles} processados`);
  log(`❌ Falhas: ${stats.failedFiles}`);
  log(`🧩 Chunks: ${stats.totalChunks} total`);
  log(`   ✅ Inseridos: ${stats.insertedChunks}`);
  log(`   ⏭️  Pulados: ${stats.skippedChunks}`);
  log(`   ❌ Falhos: ${stats.failedChunks}`);

  if (stats.errors.length > 0) {
    log('\n⚠️  ERROS:', 'red');
    stats.errors.forEach(e => {
      log(`  - ${e.file}: ${e.error}`, 'red');
    });
  }

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    options,
    stats: {
      ...stats,
      duration_seconds: duration / 1000
    },
    files: files.map(f => ({
      path: f,
      docId: extractDocId(f)
    }))
  };

  const reportPath = `migration-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n💾 Relatório: ${reportPath}`, 'blue');

  if (stats.failedFiles === 0) {
    log('\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n', 'green');
  } else {
    log(`\n⚠️  CONCLUÍDA COM ${stats.failedFiles} ERRO(S)\n`, 'yellow');
  }
}

// CLI
const args = process.argv.slice(2);
const dirArg = args.find(a => a.startsWith('--dir='))?.split('=')[1];
const dominioArg = args.find(a => a.startsWith('--dominio='))?.split('=')[1] || 'geral';
const dryRunArg = args.includes('--dry-run');
const helpArg = args.includes('--help');

if (helpArg || !dirArg) {
  console.log(`
🏛️  Alexandria - Migração em Massa v2 (Gemini Real)

Uso:
  node migrate-pops-v2.mjs --dir=./caminho/dos/pops [opções]

⚠️  PRÉ-REQUISITO:
  Execute no Supabase SQL Editor:
  ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(3072);

Opções:
  --dir=PATH          Diretório com os arquivos (obrigatório)
  --dominio=NOME      Domínio/categoria (default: geral)
  --dry-run           Simulação (não envia dados)
  --help              Mostra esta ajuda

Exemplos:
  # Simulação
  node migrate-pops-v2.mjs --dir=./docs/pops --dry-run

  # Migração real
  node migrate-pops-v2.mjs --dir=./docs/pops --dominio=atendimento

  # Migração recursiva
  node migrate-pops-v2.mjs --dir=./docs --dominio=operacao

Configuração via variáveis de ambiente:
  SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY
`);
  process.exit(0);
}

// Executar
migratePops({
  dirPath: dirArg,
  dominio: dominioArg,
  dryRun: dryRunArg
}).catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});
