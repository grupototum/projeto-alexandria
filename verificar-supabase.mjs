#!/usr/bin/env node
/**
 * Verificação rápida dos dados no Supabase
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDI2MiwiZXhwIjoyMDkwODAwMjYyfQ.kV_iFypk00cXplJNUnSW8FEz04v2HD9z5lO5X9eJFag';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificar() {
  console.log('🔍 VERIFICAÇÃO DO SUPABASE\n');
  
  // 1. Contar total
  const { count, error: countError } = await supabase
    .from('giles_knowledge')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.log('❌ Erro:', countError.message);
    return;
  }
  
  console.log(`📊 Total de registros: ${count}\n`);
  
  // 2. Ver últimos registros
  const { data: registros, error } = await supabase
    .from('giles_knowledge')
    .select('id, doc_id, hierarchical_path, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error) {
    console.log('❌ Erro:', error.message);
    return;
  }
  
  console.log('📋 Últimos registros inseridos:');
  registros.forEach((r, i) => {
    console.log(`\n  ${i + 1}. ${r.doc_id}`);
    console.log(`     Path: ${r.hierarchical_path.substring(0, 50)}...`);
    console.log(`     Domínio: ${r.metadata?.dominio || 'N/A'}`);
    console.log(`     Tags: ${r.metadata?.tags?.join(', ') || 'N/A'}`);
    console.log(`     Data: ${new Date(r.created_at).toLocaleString()}`);
  });
  
  // 3. Verificar dimensão do embedding
  const { data: sample } = await supabase
    .from('giles_knowledge')
    .select('embedding')
    .limit(1)
    .single();
  
  if (sample?.embedding) {
    console.log(`\n✅ Dimensão do embedding: ${sample.embedding.length}D`);
  }
  
  console.log('\n✅ Verificação concluída!');
}

verificar().catch(console.error);
