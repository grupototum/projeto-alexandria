import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Função para calcular similaridade de cosseno
function cosineSimilarity(a, b) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

async function testarBuscaRAG(pergunta) {
  console.log(`\n🔍 PERGUNTA: "${pergunta}"\n`);
  
  // 1. Gerar embedding da pergunta
  console.log('🧠 Gerando embedding...');
  const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
  const embeddingResult = await embeddingModel.embedContent(pergunta);
  let embedding = embeddingResult.embedding.values;
  
  // Truncar para 768D (MRL)
  embedding = embedding.slice(0, 768);
  console.log(`   ✅ Embedding gerado: ${embedding.length}D`);
  
  // 2. Buscar no Supabase
  console.log('\n📚 Buscando no Alexandria...');
  const { data: resultados, error } = await supabase
    .from('giles_knowledge')
    .select('*')
    .not('embedding', 'is', null)
    .limit(50);
  
  if (error) {
    console.error('❌ Erro na busca:', error);
    return;
  }
  
  // Calcular similaridade manualmente
  const comSimilaridade = resultados.map(doc => {
    // O embedding pode vir como string JSON ou array
    const docEmbedding = typeof doc.embedding === 'string' 
      ? JSON.parse(doc.embedding) 
      : doc.embedding;
    return {
      ...doc,
      similarity: cosineSimilarity(embedding, docEmbedding)
    };
  });
  
  // Ordenar por similaridade
  comSimilaridade.sort((a, b) => b.similarity - a.similarity);
  
  // Pegar top 5
  const topResultados = comSimilaridade.slice(0, 5);
  
  // 3. Mostrar resultados
  console.log(`\n📊 RESULTADOS ENCONTRADOS: ${topResultados?.length || 0}\n`);
  console.log('='.repeat(80));
  
  topResultados?.forEach((doc, i) => {
    const similarity = (doc.similarity * 100).toFixed(1);
    console.log(`\n[${i + 1}] Similaridade: ${similarity}% | DOC: ${doc.doc_id}`);
    console.log('-'.repeat(80));
    console.log(doc.content.substring(0, 300) + (doc.content.length > 300 ? '...' : ''));
  });
  
  console.log('\n' + '='.repeat(80));
  
  // 4. Responder com contexto (simulação RAG simples)
  if (topResultados && topResultados.length > 0) {
    console.log('\n💡 RESPOSTA SINTETIZADA (RAG):\n');
    console.log(`Baseado nos ${topResultados.length} documentos mais relevantes encontrados:`);
    console.log(`- Documentos: ${[...new Set(topResultados.map(r => r.doc_id))].join(', ')}`);
    console.log(`- Similaridade média: ${(topResultados.reduce((a, r) => a + r.similarity, 0) / topResultados.length * 100).toFixed(1)}%`);
  } else {
    console.log('\n⚠️  Nenhum resultado relevante encontrado (threshold: 50%)');
  }
}

// Testes
const perguntas = [
  'Como criar uma proposta comercial?',
  'Qual o processo de onboarding de novo cliente?',
  'Como enviar relatório semanal?',
  'Quem é responsável pelo atendimento ao cliente?'
];

console.log('🏛️  ALEXANDRIA - TESTE RAG\n');
console.log('Testando busca semântica nos POPs migrados...\n');

(async () => {
  for (const pergunta of perguntas) {
    await testarBuscaRAG(pergunta);
    console.log('\n\n' + '─'.repeat(80) + '\n');
  }
})();
