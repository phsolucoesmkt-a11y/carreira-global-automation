import { atualizarNomeDoGrupo, enviarTexto, buscarParticipantesDoGrupo } from "../services/evolution.js";
import { db } from "../db.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../services/config.js";
import { LINK_DA_LIVE_PADRAO, LINK_REPLAY_PADRAO } from "../services/linkDaLive.js";
import { TEXTOS_PADRAO } from "./textosPadrao.js";
import { atualizarParticipantesDoGrupo, marcarGrupoInativo, promoverGruposPendentes } from "../services/gruposStore.js";

function gruposAtivos() {
  return db.prepare(`SELECT id, nome FROM arvore_grupos WHERE status = 'Ativo'`).all();
}

function montarMensagem(template) {
  const link = lerConfiguracao("link_da_live", LINK_DA_LIVE_PADRAO);
  const replay = lerConfiguracao("link_replay", LINK_REPLAY_PADRAO);
  return template.replaceAll("{{link}}", link).replaceAll("{{replay}}", replay);
}

async function executarRenomear(chave, log) {
  const campos = lerCamposDoFluxo(chave, TEXTOS_PADRAO[chave]);
  const grupos = gruposAtivos();
  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[${chave}] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: campos.prefixoNome });
    registrar(`2. Nome do grupo atualizado (${grupo.nome ?? grupo.id})`, { novoNome: campos.prefixoNome });
  }

  return { totalGrupos: grupos.length, passos };
}

// Igual executarRenomear, mas além de renomear guarda quantas pessoas
// ficaram no grupo (contagem final) e marca como Inativo na árvore.
async function executarEncerrarGrupo(chave, log) {
  const campos = lerCamposDoFluxo(chave, TEXTOS_PADRAO[chave]);
  const grupos = gruposAtivos();
  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[${chave}] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: campos.prefixoNome });
    let totalParticipantes = null;
    try {
      const participantes = await buscarParticipantesDoGrupo({ groupJid: grupo.id });
      totalParticipantes = participantes.length;
      atualizarParticipantesDoGrupo(grupo.id, totalParticipantes);
    } catch (err) {
      registrar(`2b. Falha ao contar participantes (${grupo.nome ?? grupo.id})`, { erro: err.message });
    }
    marcarGrupoInativo(grupo.id);
    registrar(`2. Grupo encerrado e marcado como Inativo (${grupo.nome ?? grupo.id})`, { novoNome: campos.prefixoNome, participantes: totalParticipantes });
  }

  const promovidos = promoverGruposPendentes();
  if (promovidos.length > 0) {
    registrar("3. Grupo(s) Pendente(s) promovido(s) a Ativo — já criados com antecedência, agora entram nos disparos", {
      grupos: promovidos.map((g) => g.nome ?? g.id),
    });
  }

  return { totalGrupos: grupos.length, passos };
}

async function executarMensagem(chave, log) {
  const campos = lerCamposDoFluxo(chave, TEXTOS_PADRAO[chave]);
  const mensagem = montarMensagem(campos.mensagem);
  const grupos = gruposAtivos();
  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[${chave}] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await enviarTexto({ remoteJid: grupo.id, texto: mensagem });
    registrar(`2. Mensagem enviada (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}

// Espelha o fluxo de sexta-feira (pós-workshop / última chance) — 4
// gatilhos independentes na sexta + 1 no sábado de manhã fechando o
// grupo. Cada um vira uma função separada, igual "Durante a Live".
export const executarUltimaChance = ({ log = console.log } = {}) => executarRenomear("sexta-ultima-chance", log);
export const executarAvisoExtensao = ({ log = console.log } = {}) => executarMensagem("sexta-aviso-extensao", log);
export const executarSexta13h = ({ log = console.log } = {}) => executarMensagem("sexta-13h", log);
export const executarContaRapida = ({ log = console.log } = {}) => executarMensagem("sexta-conta-rapida", log);
export const executarSexta17h = ({ log = console.log } = {}) => executarMensagem("sexta-17h", log);
export const executarUltimaMensagem = ({ log = console.log } = {}) => executarMensagem("sexta-ultima-mensagem", log);
export const executarSexta22h = ({ log = console.log } = {}) => executarMensagem("sexta-22h", log);
export const executarGrupoEncerrado = ({ log = console.log } = {}) => executarEncerrarGrupo("sabado-grupo-encerrado", log);
