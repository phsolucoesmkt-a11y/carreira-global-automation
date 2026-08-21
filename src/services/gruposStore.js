import { db } from "../db.js";

// Lê o molde do grupo (equivalente a ler a Página1 da planilha).
export function lerModeloDoGrupo() {
  const row = db.prepare(`SELECT * FROM grupo_modelo WHERE id = 1`).get();
  if (!row) throw new Error("Molde do grupo ainda não configurado (tabela grupo_modelo vazia).");
  return {
    nome: row.nome,
    imagem: row.imagem_url,
    descricao: row.descricao,
    audio: row.audio_url,
  };
}

// Igual lerModeloDoGrupo, mas traz tudo (inclusive o resultado da última
// criação) — usado pra exibir na tela.
export function lerModeloCompleto() {
  return db.prepare(`SELECT * FROM grupo_modelo WHERE id = 1`).get() ?? null;
}

// Cria ou substitui o molde por completo (nome/imagem/descrição/áudio).
export function definirModeloDoGrupo({ nome, imagemUrl, descricao, audioUrl }) {
  db.prepare(
    `INSERT INTO grupo_modelo (id, nome, imagem_url, descricao, audio_url)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome = excluded.nome, imagem_url = excluded.imagem_url,
       descricao = excluded.descricao, audio_url = excluded.audio_url,
       atualizado_em = datetime('now')`
  ).run(nome, imagemUrl ?? null, descricao ?? null, audioUrl ?? null);
}

// Espelha "atualizo a coluna link do grupo e o id do grupo": só esses dois
// campos mudam a cada criação, o resto do molde continua igual.
export function gravarResultadoNoModelo({ groupId, inviteUrl }) {
  db.prepare(
    `UPDATE grupo_modelo SET ultimo_group_id = ?, ultimo_invite_url = ?, atualizado_em = datetime('now') WHERE id = 1`
  ).run(groupId, inviteUrl);
}

// Substitui "Adiciona na árvore dos Grupos". `status` normalmente é 'Ativo',
// mas pode nascer 'Pendente' quando já existe um grupo Ativo rodando essa
// semana (grupo criado com antecedência, só ativa quando o outro encerrar).
export function adicionarNaArvoreDeGrupos({ groupId, nome, link, status = "Ativo" }) {
  db.prepare(
    `INSERT INTO arvore_grupos (id, nome, link, status) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, nome = excluded.nome, link = excluded.link, atualizado_em = datetime('now')`
  ).run(groupId, nome, link ?? null, status);
}

// Existe algum grupo aguardando ativação (criado com antecedência, ainda
// fora dos disparos)?
export function buscarGrupoPendente() {
  return db.prepare(`SELECT * FROM arvore_grupos WHERE status = 'Pendente' ORDER BY criado_em DESC LIMIT 1`).get() ?? null;
}

export function existeGrupoAtivo() {
  return !!db.prepare(`SELECT 1 FROM arvore_grupos WHERE status = 'Ativo' LIMIT 1`).get();
}

// Promove o(s) grupo(s) pendente(s) pra Ativo — chamado quando o grupo
// atual é encerrado, pra destravar os disparos no grupo que já estava
// esperando. Retorna os grupos promovidos.
export function promoverGruposPendentes() {
  const pendentes = db.prepare(`SELECT * FROM arvore_grupos WHERE status = 'Pendente'`).all();
  if (pendentes.length > 0) {
    db.prepare(`UPDATE arvore_grupos SET status = 'Ativo', atualizado_em = datetime('now') WHERE status = 'Pendente'`).run();
  }
  return pendentes;
}

export function listarArvoreDeGrupos() {
  return db.prepare(`SELECT * FROM arvore_grupos ORDER BY criado_em DESC`).all();
}

export function buscarGrupoPorId(id) {
  return db.prepare(`SELECT * FROM arvore_grupos WHERE id = ?`).get(id) ?? null;
}

// Guarda a contagem de participantes mais recente (consultada na Evolution
// API sob demanda, não fica preso a nenhum fluxo automático).
export function atualizarParticipantesDoGrupo(id, total) {
  db.prepare(
    `UPDATE arvore_grupos SET participantes = ?, participantes_atualizado_em = datetime('now') WHERE id = ?`
  ).run(total, id);
}

// Marca o grupo como Inativo (ex.: quando o fluxo de sábado encerra o
// grupo) — mantém o registro na árvore pra histórico, só muda o status.
export function marcarGrupoInativo(id) {
  db.prepare(
    `UPDATE arvore_grupos SET status = 'Inativo', atualizado_em = datetime('now') WHERE id = ?`
  ).run(id);
}
