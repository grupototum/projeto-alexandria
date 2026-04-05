-- Atualizar dimensão do embedding para 3072 (Gemini embedding-001)
-- Limpa dados antigos primeiro (se mudando de tamanho diferente)
UPDATE giles_knowledge SET embedding = NULL;

-- Altera o tipo da coluna
ALTER TABLE giles_knowledge 
ALTER COLUMN embedding TYPE vector(3072);
