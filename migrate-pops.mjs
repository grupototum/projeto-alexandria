#!/usr/bin/env node
/**
 * Script de Migração em Massa - Alexandria
 * 
 * Migra todos os POPs da pasta /docs/pops para o Supabase
 * Uso: node migrate-pops.mjs --dir=./docs/pops --dominio=operacao
 */

import { IngestionService } from './server/ingestionService.js';
import * as fs from 'fs';
import * as path from 'path';

// Configuração
const CONFIG = {
  BATCH_SIZE: 10,        // Arquivos por rodada
  DELAY_BETWEEN_FILES_MS: 2000,  // 2s entre arquivos (evita rate limit)
  MAX_RETRIES: 3,
  SUPPORTED_EXTENSIONS: ['.md', '.txt', '.markdown']
};

// Cores para console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Encontra todos os arquivos compatíveis em um diretório
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
  return files.sort(); // Ordem alfabética
}

/**
 * Extrai docId do nome do arquivo
 */
function extractDocId(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  // Remove sufixos comuns
  return basename
    .replace(/[-_](v\d+|final|revisado|draft)$/i, '')
    .replace(/\s+/g, '-')
    .toUpperCase();
}

/**
 * Migração em massa
 */
async function migratePops(options) {
  const startTime = Date.now();
  const {
    dirPath,
    dominio = 'geral',
    recursive = true,
    dryRun = false
  } = options;

  log('\n🏛️  ALEXANDRIA - MIGRAÇÃO EM MASSA\n', 'cyan');
  log(`📁 Diretório: ${dirPath}`);
  log(`🏷️  Domínio: ${dominio}`);
  log(`🔄 Recursivo: ${recursive ? 'Sim' : 'Não'}`);
  log(`🧪 Dry Run: ${dryRun ? 'SIM (simulação)' : 'Não'}\n`);

  // Verificar credenciais
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    log('❌ ERRO: Variáveis de ambiente não configuradas!', 'red');
    log('\nConfigure:');
    log('  export SUPABASE_URL="https://..."');
    log('  export SUPABASE_ANON_KEY="eyJ..."');
    log('  export GEMINI_API_KEY="..."\n');
    process.exit(1);
  }

  // Encontrar arquivos
  log('🔍 Buscando arquivos...', 'blue');
  const files = findFiles(dirPath, recursive);
  
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
    log('\n🧪 Dry run concluído. Nenhum dado foi enviado.', 'cyan');
    return;
  }

  // Inicializar serviço
  log('🔌 Conectando aos serviços...\n', 'blue');
  const service = new IngestionService(supabaseUrl, supabaseKey, geminiKey);

  // Estatísticas
  const stats = {
    total: files.length,
    processed: 0,
    skipped: 0,
    failed: 0,
    chunksCreated: 0,
    errors: []
  };

  // Processar em batches
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const docId = extractDocId(file);
    const progress = `[${i + 1}/${files.length}]`;

    log(`${progress} 📄 ${path.basename(file)}`, 'cyan');
    log(`    ID: ${docId}`);

    let retries = 0;
    let success = false;

    while (!success && retries <= CONFIG.MAX_RETRIES) {
      try {
        const result = await service.ingestDocument(file, {
          docId,
          dominio
        });

        stats.processed += result.processed;
        stats.skipped += result.skipped;
        stats.chunksCreated += result.processed;

        if (result.failed > 0) {
          log(`    ⚠️  ${result.failed} chunks falharam`, 'yellow');
        }

        log(`    ✅ ${result.processed} novos | ${result.skipped} pulados | ${result.duration_ms}ms\n`, 'green');
        success = true;

      } catch (error) {
        retries++;
        if (retries <= CONFIG.MAX_RETRIES) {
          const delay = Math.pow(2, retries) * 1000;
          log(`    ⏳ Erro, tentando novamente em ${delay}ms... (${retries}/${CONFIG.MAX_RETRIES})`, 'yellow');
          await sleep(delay);
        } else {
          log(`    ❌ FALHA: ${error.message}\n`, 'red');
          stats.failed++;
          stats.errors.push({
            file: path.basename(file),
            docId,
            error: error.message
          });
        }
      }
    }

    // Delay entre arquivos (exceto o último)
    if (i < files.length - 1) {
      await sleep(CONFIG.DELAY_BETWEEN_FILES_MS);
    }
  }

  // Relatório final
  const duration = Date.now() - startTime;

  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RELATÓRIO DE MIGRAÇÃO', 'cyan');
  log('='.repeat(60) + '\n', 'cyan');

  log(`⏱️  Duração total: ${(duration / 1000).toFixed(1)}s`);
  log(`📄 Arquivos: ${stats.total}`);
  log(`✅ Processados: ${stats.total - stats.failed}`);
  log(`⏭️  Pulados (hash duplicado): ${stats.skipped}`);
  log(`❌ Falhas: ${stats.failed}`);
  log(`🧩 Chunks criados: ${stats.chunksCreated}\n`);

  if (stats.errors.length > 0) {
    log('⚠️  ERROS:', 'red');
    stats.errors.forEach(e => {
      log(`  - ${e.file}: ${e.error}`, 'red');
    });
    log('');
  }

  // Salvar relatório em arquivo
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
  log(`💾 Relatório salvo em: ${reportPath}\n`, 'blue');

  // Resumo
  if (stats.failed === 0) {
    log('🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n', 'green');
  } else {
    log(`⚠️  MIGRAÇÃO CONCLUÍDA COM ${stats.failed} ERRO(S)\n`, 'yellow');
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI
const args = process.argv.slice(2);
const dirArg = args.find(a => a.startsWith('--dir='))?.split('=')[1];
const dominioArg = args.find(a => a.startsWith('--dominio='))?.split('=')[1] || 'geral';
const dryRunArg = args.includes('--dry-run');
const helpArg = args.includes('--help');

if (helpArg || !dirArg) {
  console.log(`
🏛️  Alexandria - Migração em Massa de POPs

Uso:
  node migrate-pops.mjs --dir=./caminho/dos/pops [opções]

Opções:
  --dir=PATH          Diretório com os arquivos (obrigatório)
  --dominio=NOME      Domínio/categoria (default: geral)
  --dry-run           Simulação (não envia dados)
  --help              Mostra esta ajuda

Exemplos:
  # Simulação
  node migrate-pops.mjs --dir=./docs/pops --dry-run

  # Migração real
  export SUPABASE_URL="..."
  export SUPABASE_ANON_KEY="..."
  export GEMINI_API_KEY="..."
  node migrate-pops.mjs --dir=./docs/pops --dominio=atendimento

  # Migração recursiva (padrão)
  node migrate-pops.mjs --dir=./docs --dominio=operacao
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
