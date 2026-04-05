#!/usr/bin/env node
/**
 * Teste de Gemini Embeddings - Modelos corretos
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = 'AIzaSyBylRgKAiV84y2HVwq9aNxllfciOVlqz0U';

console.log('🧪 Testando modelos de embedding corretos...\n');

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const models = [
  'gemini-embedding-001',
  'gemini-embedding-2-preview'
];

for (const modelName of models) {
  try {
    console.log(`Testando ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.embedContent('Teste de conexão Alexandria');
    console.log(`✅ ${modelName} FUNCIONA!`);
    console.log(`   Dimensão: ${result.embedding.values.length}`);
    console.log(`   Primeiros 5 valores: [${result.embedding.values.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]\n`);
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message}\n`);
  }
}
