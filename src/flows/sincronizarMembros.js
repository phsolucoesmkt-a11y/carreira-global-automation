import { db } from "../db.js";
import { buscarParticipantesDoGrupo } from "../services/evolution.js";
import { chaveTelefone, telefoneDoParticipante } from "../services/telefone.js";
import { TRILHAS_RECUPERACAO, gruposAtivosDaTrilha } from "../services/membrosStore.js";

export const CHAVE_SYNC_MEMBROS = "recuperacao-membros";

// Guarda no banco quem está nos grupos Ativos de cada trilha. É a ÚNICA parte
// da recuperação que fala com a Evolution: 1 chamada por grupo ativo por
// execução (a fila da Evolution já espaça as chamadas). Se um grupo falhar
// (Evolution fora, lista vazia, maioria de ids @lid sem telefone), nada é
// gravado pra ele e a sincronização da trilha NÃO conta como completa —
// aí a recuperação para de enviar sozinha até a próxima sincronização boa.
export async function executarSincronizarMembros({ log = console.log } = {}) {
  const resumo = { trilhas: {} };
  const upsert = db.prepare(
    `INSERT INTO membros_grupos (group_id, trilha, telefone_chave, telefone) VALUES (?, ?, ?, ?)
     ON CONFLICT(group_id, telefone_chave) DO UPDATE SET visto_em = datetime('now')`
  );
  const gravarSync = db.prepare(
    `INSERT INTO sync_membros (trilha, sincronizado_em, grupos, total, erro, tentado_em)
     VALUES (@trilha, @sincronizado_em, @grupos, @total, @erro, datetime('now'))
     ON CONFLICT(trilha) DO UPDATE SET sincronizado_em = @sincronizado_em, grupos = @grupos, total = @total, erro = @erro, tentado_em = datetime('now')`
  );

  for (const trilha of TRILHAS_RECUPERACAO) {
    const grupos = gruposAtivosDaTrilha(trilha);
    const r = (resumo.trilhas[trilha] = { grupos: grupos.length, sincronizados: [], erros: [] });
    if (grupos.length === 0) continue;

    for (const g of grupos) {
      try {
        const participantes = await buscarParticipantesDoGrupo({ groupJid: g.id });
        if (participantes.length === 0) throw new Error("voltou sem participantes");
        const numeros = [];
        for (const p of participantes) {
          const tel = telefoneDoParticipante(p);
          if (tel) numeros.push(tel);
        }
        if (numeros.length / participantes.length < 0.8) {
          throw new Error(`só ${numeros.length}/${participantes.length} participantes vieram com telefone (ids @lid)`);
        }
        db.transaction(() => {
          for (const tel of numeros) upsert.run(g.id, trilha, chaveTelefone(tel), tel);
        })();
        r.sincronizados.push({ grupo: g.id, membros: numeros.length });
        log(`[membros] ${trilha} ${g.nome ?? g.id}: ${numeros.length} membros`);
      } catch (err) {
        r.erros.push(`${g.nome ?? g.id}: ${err.message}`);
        log(`[membros] ${trilha} ${g.nome ?? g.id}: falhou — ${err.message}`);
      }
    }

    const completo = r.erros.length === 0;
    const total = db.prepare(`SELECT COUNT(DISTINCT telefone_chave) AS n FROM membros_grupos WHERE trilha = ?`).get(trilha).n;
    const atual = db.prepare(`SELECT sincronizado_em, grupos FROM sync_membros WHERE trilha = ?`).get(trilha);
    gravarSync.run({
      trilha,
      sincronizado_em: completo ? new Date().toISOString().slice(0, 19).replace("T", " ") : atual?.sincronizado_em ?? null,
      grupos: completo ? JSON.stringify(grupos.map((g) => g.id)) : atual?.grupos ?? "[]",
      total,
      erro: completo ? null : r.erros.join(" | "),
    });
  }
  return resumo;
}
