#!/usr/bin/env node
/**
 * Teste COMPLETO - Alexandria com Embeddings Reais (Gemini)
 * 
 * ⚠️ ATENÇÃO: O schema do Supabase precisa ser atualizado!
 * Execute no SQL Editor do Supabase:
 * ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(3072);
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as crypto from 'crypto';

const SUPABASE_URL = 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDI2MiwiZXhwIjoyMDkwODAwMjYyfQ.kV_iFypk00cXplJNUnSW8FEz04v2HD9z5lO5X9eJFag';
const GEMINI_KEY = 'AIzaSyBylRgKAiV84y2HVwq9aNxllfciOVlqz0U';

console.log('🧪 TESTE COMPLETO - ALEXANDRIA COM EMBEDDINGS REAIS (768D via MRL)\n');
console.log('⚠️  Lembre-se de atualizar o schema para VECTOR(768)!\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// Funções auxiliares
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

function generateSHA256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

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

function inferTags(content, hierarchy) {
  const tags = new Set();
  const text = content.toLowerCase();
  const pathStr = hierarchy.join(' ').toLowerCase();

  if (text.includes('checklist')) tags.add('checklist');
  if (text.includes('procedimento') || text.includes('passo')) tags.add('procedimento');
  if (text.includes('erro') || text.includes('bug')) tags.add('troubleshooting');
  if (text.includes('sla') || text.includes('prazo')) tags.add('sla');
  if (pathStr.includes('atendimento')) tags.add('atendimento');

  return Array.from(tags);
}

// Teste principal
async function runTest() {
  const filePath = 'docs/pops/POP-001-teste.md';
  const docId = 'POP-001';

  console.log(`📄 Processando: ${filePath}\n`);

  // 1. Ler e parsear
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = parseMarkdown(content);
  console.log(`✅ ${sections.length} seções encontradas`);

  // 2. Gerar embeddings para cada chunk
  console.log('\n🧠 Gerando embeddings com Gemini...');
  
  const chunks = [];
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const textToEmbed = section.content || section.title;
    
    if (textToEmbed.length === 0) continue;

    console.log(`   Chunk ${i}: "${section.title.substring(0, 40)}..."`);
    
    try {
      const result = await embeddingModel.embedContent(textToEmbed);
      const fullEmbedding = result.embedding.values;
      // MRL: Truncate to 768 dimensions (first dimensions contain most information)
      const embedding = fullEmbedding.slice(0, 768);
      
      console.log(`      Embedding: ${embedding.length} dimensões`);

      chunks.push({
        doc_id: docId,
        content: textToEmbed,
        content_hash: generateSHA256(`${docId}:${i}:${textToEmbed}`),
        hierarchical_path: section.path.join(' > '),
        embedding: embedding,
        metadata: {
          hierarchy: section.path,
          level: section.level,
          position: i,
          is_complete: true,
          entities: extractEntities(textToEmbed),
          tags: inferTags(textToEmbed, section.path),
          char_count: textToEmbed.length,
          word_count: textToEmbed.split(/\s+/).filter(w => w).length
        }
      });

      // Delay para não sobrecarregar API
      if (i < sections.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (error) {
      console.log(`      ❌ Erro: ${error.message}`);
    }
  }

  console.log(`\n✅ ${chunks.length} chunks com embeddings gerados`);

  // 3. Inserir no Supabase
  console.log('\n☁️  Inserindo no Supabase...');
  
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
        console.log(`   ⏭️  "${chunk.hierarchical_path.substring(0, 40)}..." já existe`);
        skipped++;
      } else if (error.message.includes('dimensions')) {
        console.log(`   ❌ ERRO DE DIMENSÃO: ${error.message}`);
        console.log(`      💡 Execute: ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(3072);`);
        failed++;
        break; // Parar no primeiro erro de dimensão
      } else {
        console.log(`   ❌ Erro: ${error.message}`);
        failed++;
      }
    } else {
      console.log(`   ✅ "${chunk.hierarchical_path.substring(0, 40)}..." inserido`);
      inserted++;
    }
  }

  // 4. Resumo
  console.log('\n' + '='.repeat(50));
  console.log('📊 RESULTADO');
  console.log('='.repeat(50));
  console.log(`✅ Inseridos: ${inserted}`);
  console.log(`⏭️  Pulados (duplicados): ${skipped}`);
  console.log(`❌ Falhas: ${failed}`);

  if (failed > 0 && failed < chunks.length) {
    console.log('\n⚠️  Execute no SQL Editor do Supabase:');
    console.log('ALTER TABLE giles_knowledge ALTER COLUMN embedding TYPE vector(768);');
  }

  console.log('\n✅ Teste concluído!');
}

runTest().catch(console.error);
