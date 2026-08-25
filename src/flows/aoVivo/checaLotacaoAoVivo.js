import { buscarParticipantesDoGrupo } from "../../services/evolution.js";
import {
  gruposAtivosAoVivo,
  atualizarParticipantesDoGrupoAoVivo,
  jaTemGrupoExtraPara,
} from "../../services/gruposStoreAoVivo.js";
import { executarCriarGrupoAoVivo } from "./criarGrupoAoVivo.js";

// Espelha "Consulta se o grupo vigente possui 950 pessoas" — o real
// threshold confirmado no n8n é índice 950 do array (ou seja, 951+
// participantes). Corrige o bug conhecido do fluxo original: lá, o grupo
// extra criado por lotação nunca era vinculado à árvore como Ativo, então
// nunca recebia nenhuma mensagem. Aqui ele nasce Ativo de verdade.
const LIMITE_PARTICIPANTES = 951;

export async function executarChecaLotacaoAoVivo({ log = console.log } = {}) {
  const grupos = gruposAtivosAoVivo();
  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-checa-lotacao] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    const participantes = await buscarParticipantesDoGrupo({ groupJid: grupo.id });
    const total = participantes.length;
    atualizarParticipantesDoGrupoAoVivo(grupo.id, total);
    registrar(`2. Participantes contados (${grupo.nome ?? grupo.id})`, { total });

    if (total >= LIMITE_PARTICIPANTES) {
      if (jaTemGrupoExtraPara(grupo.id)) {
        registrar(`3. Limite atingido, mas já existe grupo extra pra esse (${grupo.nome ?? grupo.id})`, { total });
        continue;
      }
      registrar(`3. Limite de ${LIMITE_PARTICIPANTES} atingido — criando grupo extra (${grupo.nome ?? grupo.id})`, { total });
      const resultado = await executarCriarGrupoAoVivo({ log, criadoPorLotacaoDe: grupo.id });
      registrar("4. Grupo extra criado e já Ativo", { novoGroupId: resultado.groupId });
    }
  }

  return { totalGrupos: grupos.length, passos };
}
