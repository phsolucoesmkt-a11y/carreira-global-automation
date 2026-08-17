import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDir = process.env.DATA_DIR || path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "automation.sqlite"));
db.pragma("journal_mode = WAL");

db.exec(`
-- Molde do grupo (equivalente à "Página1" da planilha "Grupos Webnario").
-- Uma linha só, reaproveitada toda semana: nome/imagem/descrição/áudio ficam
-- fixos e só ultimo_group_id / ultimo_invite_url mudam a cada criação —
-- exatamente como o usuário mantém a planilha manualmente hoje.
CREATE TABLE IF NOT EXISTS grupo_modelo (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nome TEXT NOT NULL,
  imagem_url TEXT,
  descricao TEXT,
  audio_url TEXT,
  ultimo_group_id TEXT,
  ultimo_invite_url TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Substitui a "árvore de grupos": todo grupo que este sistema criou/gerencia,
-- com o status atual (Ativo/Inativo).
CREATE TABLE IF NOT EXISTS arvore_grupos (
  id TEXT PRIMARY KEY,
  nome TEXT,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Histórico de execuções dos fluxos (manuais ou automáticas), pra dar pra
-- ver na interface depois que rodou de verdade.
CREATE TABLE IF NOT EXISTS execucoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fluxo TEXT NOT NULL,
  origem TEXT NOT NULL,
  status TEXT NOT NULL,
  detalhe TEXT,
  executado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Configurações globais, tipo o link da live — muda aqui, atualiza em
-- todo fluxo que referencia esse valor (chave/valor simples).
CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor TEXT
);

-- Conteúdo e horário editáveis de cada fluxo. Cada fluxo tem um "campos"
-- em JSON com o que faz sentido pra ele (mensagem, enquete, prefixo do
-- nome do grupo etc.) — os arquivos de fluxo usam o que tiver aqui, e
-- caem pro texto padrão embutido no código se ainda não foi customizado.
CREATE TABLE IF NOT EXISTS fluxos_config (
  chave TEXT PRIMARY KEY,
  cron TEXT,
  campos TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// Migração: bancos criados antes do campo "link" existir na árvore_grupos.
const colunas = db.prepare(`PRAGMA table_info(arvore_grupos)`).all();
if (!colunas.some((c) => c.name === "link")) {
  db.exec(`ALTER TABLE arvore_grupos ADD COLUMN link TEXT`);
}
