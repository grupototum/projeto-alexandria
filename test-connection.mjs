#!/usr/bin/env node
/**
 * Teste de Conexão - Alexandria
 * Valida Supabase + Gemini + Ingestão
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';

const SUPABASE_URL = 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMjQyNjIsImV4cCI6MjA5MDgwMDI2Mn0.fXMvQhyLQXLgD_rK-slcHO4Jd_XF8mR_kYFTDHCsoxw';
const GEMINI_KEY = 'AIzaSyDupAbfzyv4T4Kve9FFb9VEC1Bwfe7HJHs';

console.log('🧪 TESTE DE CONEXÃO - ALEXANDRIA\n');

// Teste 1: Supabase
console.log('1️⃣ Testando Supabase...');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: tables, error: tablesError } = await supabase
  .from('giles_knowledge')
  .select('count')
  .limit(1);

if (tablesError) {
  console.log('   ❌ Erro:', tablesError.message);
} else {
  console.log('   ✅ Supabase conectado!');
}

// Teste 2: Gemini
console.log('\n2️⃣ Testando Gemini...');
const genAI = new GoogleGenerativeAI(GEMINI_KEY);

try {
  // Tentar com modelos disponíveis
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent('Teste de conexão');
  console.log('   ✅ Gemini conectado!');
  console.log('   📏 Dimensão do embedding:', result.embedding.values.length);
} catch (error) {
  console.log('   ❌ Erro com text-embedding-004:', error.message);
  try {
    const model2 = genAI.getGenerativeModel({ model: 'embedding-001' });
    const result2 = await model2.embedContent('Teste de conexão');
    console.log('   ✅ Gemini conectado (embedding-001)!');
    console.log('   📏 Dimensão:', result2.embedding.values.length);
  } catch (error2) {
    console.log('   ❌ Erro com embedding-001:', error2.message);
  }
}

// Teste 3: Schema
console.log('\n3️⃣ Verificando schema da tabela...');
const { data: columns, error: schemaError } = await supabase
  .rpc('get_table_columns', { table_name: 'giles_knowledge' });

if (schemaError) {
  console.log('   ⚠️  Não foi possível verificar schema (função RPC não existe)');
  console.log('   ℹ️  Isso é normal, continuando...');
} else {
  console.log('   ✅ Schema verificado');
}

// Teste 4: Contagem atual
console.log('\n4️⃣ Verificando dados existentes...');
const { count, error: countError } = await supabase
  .from('giles_knowledge')
  .select('*', { count: 'exact', head: true });

if (countError) {
  console.log('   ❌ Erro:', countError.message);
} else {
  console.log(`   📊 Registros existentes: ${count || 0}`);
}

console.log('\n✅ Teste de conexão concluído!');
