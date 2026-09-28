import { db } from "../db.js";

export const TRILHAS_RECUPERACAO = ["ao-vivo", "gravado"];

export function gruposAtivosDaTrilha(trilha) {
  const tabela = trilha === "ao-vivo" ? "arvore_grupos_ao_vivo" : "arvore_grupos";
  return db.prepare(`SELECT id, nome FROM ${tabela} WHERE status = 'Ativo'`).all();
}

// Telefones (chave normalizada) que já entraram em algum dos grupos dados.
export function chavesDeMembros(groupIds) {
  if (groupIds.length === 0) return new Set();
  const marcas = groupIds.map(() => "?").join(",");
  const linhas = db.prepare(`SELECT DISTINCT telefone_chave FROM membros_grupos WHERE group_id IN (${marcas})`).all(...groupIds);
  return new Set(linhas.map((l) => l.telefone_chave));
}

// A sincronização é "fresca" se terminou há menos de `frescorMinutos` E cobriu
// todos os grupos Ativos de hoje (grupo criado depois da última sincronização
// ainda não tem membros no banco — enviar antes disso mandaria template pra
// quem já entrou nele).
export function statusDaSincronizacao(trilha, groupIds, frescorMinutos) {
  const s = db.prepare(`SELECT * FROM sync_membros WHERE trilha = ?`).get(trilha);
  if (!s || !s.sincronizado_em) return { ok: false, motivo: "membros nunca sincronizados" };
  const idade = Date.now() - new Date(s.sincronizado_em.replace(" ", "T") + "Z").getTime();
  if (idade > frescorMinutos * 60_000) {
    return { ok: false, motivo: `sincronização de membros com ${Math.round(idade / 60000)} min (limite ${frescorMinutos})` };
  }
  const cobertos = new Set(JSON.parse(s.grupos || "[]"));
  const faltando = groupIds.filter((g) => !cobertos.has(g));
  if (faltando.length > 0) return { ok: false, motivo: `grupo ainda não sincronizado: ${faltando.join(", ")}` };
  return { ok: true };
}
