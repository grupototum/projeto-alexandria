#!/usr/bin/env node
/**
 * Teste rápido do ingestionService
 * Valida chunking semântico sem precisar de credenciais
 */

import * as fs from 'fs';

// Simular as funções de chunking para testar
const CONFIG = {
  MAX_CHUNK_SIZE: 1500,
  MIN_CHUNK_SIZE: 200,
  OVERLAP_SIZE: 300,
};

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
  if (text.includes('erro') || text.includes('bug') || text.includes('falha')) tags.add('troubleshooting');
  if (text.includes('sla') || text.includes('prazo')) tags.add('sla');
  if (pathStr.includes('atendimento')) tags.add('atendimento');

  return Array.from(tags);
}

// Teste
console.log('🧪 Teste de Chunking - Alexandria\n');

const testFiles = ['POP-001-teste.md', 'POP-002-complexo.md'];

for (const file of testFiles) {
  console.log(`\n📄 ${file}`);
  console.log('='.repeat(50));
  
  const content = fs.readFileSync(file, 'utf-8');
  const sections = parseMarkdown(content);
  
  console.log(`✅ Seções encontradas: ${sections.length}`);
  
  sections.forEach((section, i) => {
    console.log(`\n  ${i + 1}. ${section.title}`);
    console.log(`     Path: ${section.path.join(' > ')}`);
    console.log(`     Nível: ${section.level}`);
    console.log(`     Tamanho: ${section.content.length} chars`);
    
    const entities = extractEntities(section.content);
    const tags = inferTags(section.content, section.path);
    
    if (Object.values(entities).some(arr => arr.length > 0)) {
      console.log(`     Entidades:`, JSON.stringify(entities, null, 2).replace(/\n/g, ' '));
    }
    if (tags.length > 0) {
      console.log(`     Tags: [${tags.join(', ')}]`);
    }
  });
}

console.log('\n\n✅ Teste de chunking concluído!');
console.log('💡 Para teste completo (com embeddings), configure:');
console.log('   SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY');
