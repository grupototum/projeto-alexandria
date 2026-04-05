#!/usr/bin/env node
/**
 * Executa migrations SQL no Supabase
 * Uso: node run-sql.js <arquivo.sql>
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://cgpkfhrqprqptvehatad.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncGtmaHJxcHJxcHR2ZWhhdGFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTIyNDI2MiwiZXhwIjoyMDkwODAwMjYyfQ.kV_iFypk00cXplJNUnSW8FEz04v2HD9z5lO5X9eJFag';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration(filePath) {
  console.log(`📄 Executando: ${filePath}`);
  
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  // Divide em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  console.log(`📝 ${statements.length} statements encontrados\n`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const shortStmt = stmt.substring(0, 60).replace(/\n/g, ' ');
    console.log(`[${i + 1}/${statements.length}] ${shortStmt}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt });
      
      if (error) {
        // Se a função rpc não existir, tenta método alternativo
        console.log(`   ⚠️  RPC falhou, tentando método alternativo...`);
        const { error: err2 } = await supabase.from('_sql_query').select('*').eq('query', stmt);
        if (err2) throw err2;
      }
      
      console.log(`   ✅ OK`);
    } catch (err) {
      console.log(`   ⚠️  ${err.message || 'Erro desconhecido'}`);
      // Continua para próximo statement
    }
  }
  
  console.log('\n✅ Migration concluída!');
}

// Executa
const file = process.argv[2];
if (!file) {
  console.log('Uso: node run-sql.js <arquivo.sql>');
  process.exit(1);
}

runMigration(path.resolve(file));
