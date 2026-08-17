import { db } from "../db.js";

export function registrarExecucao({ fluxo, origem, status, detalhe }) {
  db.prepare(`INSERT INTO execucoes (fluxo, origem, status, detalhe) VALUES (?, ?, ?, ?)`).run(
    fluxo,
    origem,
    status,
    detalhe ? JSON.stringify(detalhe) : null
  );
}

export function listarExecucoes(limit = 30) {
  return db.prepare(`SELECT * FROM execucoes ORDER BY executado_em DESC LIMIT ?`).all(limit);
}

export function ultimaExecucaoPorFluxo(fluxo) {
  return db.prepare(`SELECT * FROM execucoes WHERE fluxo = ? ORDER BY executado_em DESC LIMIT 1`).get(fluxo);
}
