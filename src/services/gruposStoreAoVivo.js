import { db } from "../db.js";

// Espelha gruposStore.js, mas pra trilha "Ao Vivo" — tabelas totalmente
// separadas do Gravado (grupo_modelo_ao_vivo / arvore_grupos_ao_vivo).

export function lerModeloDoGrupoAoVivo() {
  const row = db.prepare(`SELECT * FROM grupo_modelo_ao_vivo WHERE id = 1`).get();
  if (!row) throw new Error("Molde do grupo Ao Vivo ainda não configurado (tabela grupo_modelo_ao_vivo vazia).");
  return { nome: row.nome, imagem: row.imagem_url, descricao: row.descricao, audio: row.audio_url };
}

export function lerModeloCompletoAoVivo() {
  return db.prepare(`SELECT * FROM grupo_modelo_ao_vivo WHERE id = 1`).get() ?? null;
}

export function definirModeloDoGrupoAoVivo({ nome, imagemUrl, descricao, audioUrl }) {
  db.prepare(
    `INSERT INTO grupo_modelo_ao_vivo (id, nome, imagem_url, descricao, audio_url)
     VALUES (1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nome = excluded.nome, imagem_url = excluded.imagem_url,
       descricao = excluded.descricao, audio_url = excluded.audio_url, atualizado_em = datetime('now')`
  ).run(nome, imagemUrl ?? null, descricao ?? null, audioUrl ?? null);
}

export function gravarResultadoNoModeloAoVivo({ groupId, inviteUrl }) {
  db.prepare(
    `UPDATE grupo_modelo_ao_vivo SET ultimo_group_id = ?, ultimo_invite_url = ?, atualizado_em = datetime('now') WHERE id = 1`
  ).run(groupId, inviteUrl);
}

export function adicionarNaArvoreDeGruposAoVivo({ groupId, nome, link, status = "Ativo", criadoPorLotacaoDe = null }) {
  db.prepare(
    `INSERT INTO arvore_grupos_ao_vivo (id, nome, link, status, criado_por_lotacao_de) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET status = excluded.status, nome = excluded.nome, link = excluded.link, atualizado_em = datetime('now')`
  ).run(groupId, nome, link ?? null, status, criadoPorLotacaoDe);
}

export function listarArvoreDeGruposAoVivo() {
  return db.prepare(`SELECT * FROM arvore_grupos_ao_vivo ORDER BY criado_em DESC`).all();
}

export function buscarGrupoAoVivoPorId(id) {
  return db.prepare(`SELECT * FROM arvore_grupos_ao_vivo WHERE id = ?`).get(id) ?? null;
}

export function gruposAtivosAoVivo() {
  return db.prepare(`SELECT * FROM arvore_grupos_ao_vivo WHERE status = 'Ativo'`).all();
}

export function atualizarParticipantesDoGrupoAoVivo(id, total) {
  db.prepare(
    `UPDATE arvore_grupos_ao_vivo SET participantes = ?, participantes_atualizado_em = datetime('now') WHERE id = ?`
  ).run(total, id);
}

// Grupos Inativo encerrados recentemente (últimos 4 dias) — usado pelo
// fluxo de sexta 08h15 que renomeia pra "Grupo encerrado" o(s) grupo(s)
// fechado(s) pelo "Fim do dia" de quarta, sem mexer em grupos antigos.
export function gruposInativosRecentesAoVivo() {
  return db.prepare(`SELECT * FROM arvore_grupos_ao_vivo WHERE status = 'Inativo' AND atualizado_em >= datetime('now', '-4 days')`).all();
}

export function marcarGrupoAoVivoInativo(id) {
  db.prepare(`UPDATE arvore_grupos_ao_vivo SET status = 'Inativo', atualizado_em = datetime('now') WHERE id = ?`).run(id);
}

// Mesma lógica de "Pendente" que existe no Gravado: se já tem um grupo
// Ativo, o próximo nasce Pendente e só assume quando o atual for encerrado.
export function buscarGrupoPendenteAoVivo() {
  return db.prepare(`SELECT * FROM arvore_grupos_ao_vivo WHERE status = 'Pendente' ORDER BY criado_em DESC LIMIT 1`).get() ?? null;
}

export function existeGrupoAtivoAoVivo() {
  return !!db.prepare(`SELECT 1 FROM arvore_grupos_ao_vivo WHERE status = 'Ativo' LIMIT 1`).get();
}

export function promoverGruposPendentesAoVivo() {
  const pendentes = db.prepare(`SELECT * FROM arvore_grupos_ao_vivo WHERE status = 'Pendente'`).all();
  if (pendentes.length > 0) {
    db.prepare(`UPDATE arvore_grupos_ao_vivo SET status = 'Ativo', atualizado_em = datetime('now') WHERE status = 'Pendente'`).run();
  }
  return pendentes;
}

// Link específico pra esse grupo (sobrescreve o link_ao_vivo global só
// pra ele) — usado pra testes pontuais sem afetar os outros grupos.
// Passar null/vazio remove a exceção e volta a usar o link padrão.
export function definirLinkOverrideAoVivo(id, link) {
  db.prepare(`UPDATE arvore_grupos_ao_vivo SET link_override = ? WHERE id = ?`).run(link || null, id);
}

// Já existe um grupo criado por causa da lotação DESTE grupo específico?
// Evita criar um segundo grupo extra do mesmo transbordamento a cada
// checagem de 30 em 30 minutos.
export function jaTemGrupoExtraPara(groupId) {
  return !!db.prepare(`SELECT 1 FROM arvore_grupos_ao_vivo WHERE criado_por_lotacao_de = ? LIMIT 1`).get(groupId);
}
