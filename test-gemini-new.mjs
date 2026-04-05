#!/usr/bin/env node
/**
 * Teste rápido de Gemini Embeddings - Nova chave
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEY = 'AIzaSyBylRgKAiV84y2HVwq9aNxllfciOVlqz0U';

console.log('🧪 Testando nova chave Gemini...\n');

const genAI = new GoogleGenerativeAI(GEMINI_KEY);

const models = [
  'text-embedding-004',
  'embedding-001', 
  'text-embedding-005'
];

for (const modelName of models) {
  try {
    console.log(`Testando ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.embedContent('Teste de conexão Alexandria');
    console.log(`✅ ${modelName} FUNCIONA!`);
    console.log(`   Dimensão: ${result.embedding.values.length}\n`);
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message}\n`);
  }
}
