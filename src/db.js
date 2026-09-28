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
-- Trilha "Ao Vivo": grupo, molde e árvore completamente separados do
-- Gravado (grupos diferentes, cadência diferente, link diferente).
CREATE TABLE IF NOT EXISTS grupo_modelo_ao_vivo (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nome TEXT NOT NULL,
  imagem_url TEXT,
  descricao TEXT,
  audio_url TEXT,
  ultimo_group_id TEXT,
  ultimo_invite_url TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Igual arvore_grupos, mas pro Ao Vivo — inclui participantes (checado a
-- cada 30min) e criado_por_lotacao_de (aponta pro grupo que transbordou,
-- pra nunca criar um segundo grupo extra do mesmo transbordamento).
CREATE TABLE IF NOT EXISTS arvore_grupos_ao_vivo (
  id TEXT PRIMARY KEY,
  nome TEXT,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo',
  criado_por_lotacao_de TEXT,
  participantes INTEGER,
  participantes_atualizado_em TEXT,
  criado_em TEXT NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Recuperação de leads: formulários instantâneos do Meta (cada form_id
-- pertence a UMA trilha) e os leads puxados de lá. O sistema cruza o telefone
-- do lead com os membros dos grupos Ativos da trilha e manda um template
-- oficial do WhatsApp pra quem se cadastrou e não entrou no grupo.
CREATE TABLE IF NOT EXISTS meta_forms (
  form_id TEXT PRIMARY KEY,
  trilha TEXT NOT NULL CHECK (trilha IN ('ao-vivo', 'gravado')),
  nome TEXT,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
-- status: novo | no_grupo | enviando | enviado | falha | sem_whatsapp |
-- duplicado | expirado. "enviando" nunca é reenviado sozinho (se o processo
-- caiu no meio, não dá pra saber se o template saiu).
CREATE TABLE IF NOT EXISTS leads_meta (
  leadgen_id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL,
  trilha TEXT NOT NULL,
  nome TEXT,
  telefone TEXT,
  telefone_chave TEXT,
  campaign_id TEXT,
  ad_id TEXT,
  criado_meta_em TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo',
  tentativas INTEGER NOT NULL DEFAULT 0,
  wa_message_id TEXT,
  erro TEXT,
  enviado_em TEXT,
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_leads_meta_status ON leads_meta (trilha, status, criado_meta_em);
CREATE INDEX IF NOT EXISTS idx_leads_meta_chave ON leads_meta (telefone_chave);

-- Quem entrou em cada grupo (telefone normalizado). Alimentada pela
-- sincronização de membros; a recuperação de leads consulta SÓ esta tabela,
-- nunca a Evolution. Quem entrou e saiu continua aqui (nunca reenviar).
CREATE TABLE IF NOT EXISTS membros_grupos (
  group_id TEXT NOT NULL,
  trilha TEXT NOT NULL,
  telefone_chave TEXT NOT NULL,
  telefone TEXT NOT NULL,
  primeira_vez_em TEXT NOT NULL DEFAULT (datetime('now')),
  visto_em TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, telefone_chave)
);
CREATE INDEX IF NOT EXISTS idx_membros_chave ON membros_grupos (telefone_chave);
-- Última sincronização COMPLETA de membros por trilha e quais grupos ela
-- cobriu. Sem sincronização recente a recuperação não envia nada.
CREATE TABLE IF NOT EXISTS sync_membros (
  trilha TEXT PRIMARY KEY,
  sincronizado_em TEXT,
  grupos TEXT,
  total INTEGER,
  erro TEXT,
  tentado_em TEXT
);
`);

// Migração: bancos criados antes do campo "link" existir na árvore_grupos.
const colunas = db.prepare(`PRAGMA table_info(arvore_grupos)`).all();
if (!colunas.some((c) => c.name === "link")) {
  db.exec(`ALTER TABLE arvore_grupos ADD COLUMN link TEXT`);
}
if (!colunas.some((c) => c.name === "participantes")) {
  db.exec(`ALTER TABLE arvore_grupos ADD COLUMN participantes INTEGER`);
}
if (!colunas.some((c) => c.name === "participantes_atualizado_em")) {
  db.exec(`ALTER TABLE arvore_grupos ADD COLUMN participantes_atualizado_em TEXT`);
}

// Migração: coluna "audio_url" no grupo_modelo_ao_vivo (adicionada depois
// de descobrir que o Ao Vivo também manda áudio da Nina, na terça).
const colunasModeloAoVivo = db.prepare(`PRAGMA table_info(grupo_modelo_ao_vivo)`).all();
if (colunasModeloAoVivo.length > 0 && !colunasModeloAoVivo.some((c) => c.name === "audio_url")) {
  db.exec(`ALTER TABLE grupo_modelo_ao_vivo ADD COLUMN audio_url TEXT`);
}

// Migração: coluna "link_override" no arvore_grupos_ao_vivo — permite
// definir um link diferente do padrão (link_ao_vivo) só pra um grupo
// específico, sem afetar os outros. Usado pra testes pontuais.
const colunasAoVivo = db.prepare(`PRAGMA table_info(arvore_grupos_ao_vivo)`).all();
if (colunasAoVivo.length > 0 && !colunasAoVivo.some((c) => c.name === "link_override")) {
  db.exec(`ALTER TABLE arvore_grupos_ao_vivo ADD COLUMN link_override TEXT`);
}

// Migração: coluna "ativo" no fluxos_config (chave liga/desliga por fluxo).
const colunasFluxos = db.prepare(`PRAGMA table_info(fluxos_config)`).all();
if (!colunasFluxos.some((c) => c.name === "ativo")) {
  db.exec(`ALTER TABLE fluxos_config ADD COLUMN ativo INTEGER`);
}
