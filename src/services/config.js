import { db } from "../db.js";

// Configurações globais compartilhadas entre fluxos (ex: link da live).
export function lerConfiguracao(chave, valorPadrao = null) {
  const row = db.prepare(`SELECT valor FROM configuracoes WHERE chave = ?`).get(chave);
  return row ? row.valor : valorPadrao;
}

export function definirConfiguracao(chave, valor) {
  db.prepare(
    `INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
     ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor`
  ).run(chave, valor);
}

// Campos editáveis de um fluxo (mensagem, enquete, prefixo etc.) — cada
// fluxo define seus próprios `defaults`; o que estiver salvo no banco
// sobrescreve, campo a campo.
export function lerCamposDoFluxo(chave, defaults) {
  const row = db.prepare(`SELECT campos FROM fluxos_config WHERE chave = ?`).get(chave);
  const salvos = row?.campos ? JSON.parse(row.campos) : {};
  return { ...defaults, ...salvos };
}

export function salvarCamposDoFluxo(chave, campos) {
  const atual = lerCamposDoFluxo(chave, {});
  const novo = { ...atual, ...campos };
  db.prepare(
    `INSERT INTO fluxos_config (chave, campos, atualizado_em) VALUES (?, ?, datetime('now'))
     ON CONFLICT(chave) DO UPDATE SET campos = excluded.campos, atualizado_em = datetime('now')`
  ).run(chave, JSON.stringify(novo));
}

export function lerCronDoFluxo(chave, cronPadrao) {
  const row = db.prepare(`SELECT cron FROM fluxos_config WHERE chave = ?`).get(chave);
  return row?.cron || cronPadrao;
}

export function salvarCronDoFluxo(chave, cron) {
  db.prepare(
    `INSERT INTO fluxos_config (chave, cron, atualizado_em) VALUES (?, ?, datetime('now'))
     ON CONFLICT(chave) DO UPDATE SET cron = excluded.cron, atualizado_em = datetime('now')`
  ).run(chave, cron);
}
