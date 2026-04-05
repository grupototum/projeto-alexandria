#!/usr/bin/env node
/**
 * Teste de Ingestão - Alexandria (sem Gemini)
 * Valida chunking e inserção no Supabase com embedding mock
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as crypto from 'crypto';

const SUPABASE_URL = 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDI2MiwiZXhwIjoyMDkwODAwMjYyfQ.kV_iFypk00cXplJNUnSW8FEz04v2HD9z5lO5X9eJFag';

console.log('🧪 TESTE DE INGESTÃO - ALEXANDRIA\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Funções de chunking (copiadas do ingestionService)
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

// Mock de embedding (vetor de 768 dimensões)
function generateMockEmbedding(seed) {
  const vec = [];
  for (let i = 0; i < 768; i++) {
    // Pseudo-random baseado no seed para consistência
    vec.push(Math.sin(seed * i) * 0.5);
  }
  return vec;
}

// Teste principal
async function runTest() {
  const filePath = 'POP-001-teste.md';
  const docId = 'POP-001';
  const dominio = 'atendimento';

  console.log(`📄 Processando: ${filePath}\n`);

  // 1. Ler e parsear
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = parseMarkdown(content);
  console.log(`✅ ${sections.length} seções encontradas`);

  // 2. Criar chunks (simplificado - um chunk por seção)
  const chunks = sections.map((section, idx) => ({
    doc_id: docId,
    content: section.content || section.title,
    content_hash: generateSHA256(`${docId}:${idx}:${section.content || section.title}`),
    hierarchical_path: section.path.join(' > '),
    embedding: generateMockEmbedding(idx),
    metadata: {
      hierarchy: section.path,
      level: section.level,
      position: idx,
      is_complete: true,
      entities: extractEntities(section.content || ''),
      tags: inferTags(section.content || '', section.path),
      char_count: (section.content || '').length,
      word_count: (section.content || '').split(/\s+/).filter(w => w).length
    }
  })).filter(c => c.content.length > 0);

  console.log(`✅ ${chunks.length} chunks gerados`);

  // 3. Inserir no Supabase
  console.log('\n☁️  Inserindo no Supabase...');
  
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
        console.log(`   ⏭️  Chunk ${chunk.metadata.position} já existe (pulando)`);
      } else {
        console.log(`   ❌ Erro no chunk ${chunk.metadata.position}:`, error.message);
      }
    } else {
      console.log(`   ✅ Chunk ${chunk.metadata.position} inserido`);
    }
  }

  // 4. Verificar resultado
  console.log('\n📊 Verificando dados...');
  const { count } = await supabase
    .from('giles_knowledge')
    .select('*', { count: 'exact', head: true });

  console.log(`   Total de registros: ${count}`);

  const { data: sample } = await supabase
    .from('giles_knowledge')
    .select('*')
    .limit(2);

  console.log('\n📋 Exemplo de dados inseridos:');
  sample.forEach((row, i) => {
    console.log(`\n   Registro ${i + 1}:`);
    console.log(`   - Doc ID: ${row.doc_id}`);
    console.log(`   - Path: ${row.hierarchical_path}`);
    console.log(`   - Content: ${row.content.substring(0, 50)}...`);
    console.log(`   - Tags: ${row.metadata.tags?.join(', ') || 'nenhuma'}`);
  });

  console.log('\n✅ Teste de ingestão concluído!');
}

runTest().catch(console.error);
