#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDI2MiwiZXhwIjoyMDkwODAwMjYyfQ.kV_iFypk00cXplJNUnSW8FEz04v2HD9z5lO5X9eJFag';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verificar() {
  const { data, error } = await supabase
    .from('giles_knowledge')
    .select('doc_id, embedding')
    .not('embedding', 'is', null)
    .limit(1);
  
  if (error || !data || data.length === 0) {
    console.log('❌ Nenhum embedding encontrado');
    return;
  }
  
  const registro = data[0];
  const embedding = registro.embedding;
  
  console.log('✅ EMBEDDING VERIFICADO\n');
  console.log(`📄 Doc ID: ${registro.doc_id}`);
  console.log(`📐 Tipo: ${typeof embedding}`);
  
  if (Array.isArray(embedding)) {
    console.log(`📐 Dimensão: ${embedding.length} dimensões`);
    console.log(`\n🔢 Primeiros 5 valores:`);
    console.log(`   [${embedding.slice(0, 5).map(v => v.toFixed(6)).join(', ')}...]`);
  } else if (typeof embedding === 'string') {
    console.log(`📐 É uma string - provavelmente JSON`);
    try {
      const parsed = JSON.parse(embedding);
      console.log(`📐 Dimensão após parse: ${parsed.length} dimensões`);
    } catch (e) {
      console.log(`📐 Conteúdo: ${embedding.substring(0, 100)}...`);
    }
  } else {
    console.log(`📐 Valor: ${embedding}`);
  }
}

verificar().catch(console.error);
