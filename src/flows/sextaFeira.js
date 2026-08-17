import { atualizarNomeDoGrupo, enviarTexto } from "../services/evolution.js";
import { db } from "../db.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../services/config.js";
import { LINK_DA_LIVE_PADRAO } from "../services/linkDaLive.js";
import { TEXTOS_PADRAO } from "./textosPadrao.js";

const LINK_REPLAY_PADRAO = "https://event.webinarjam.com/n5lzxq/go/live/8wgpzntztps0so";

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
export const executarContaRapida = ({ log = console.log } = {}) => executarMensagem("sexta-conta-rapida", log);
export const executarUltimaMensagem = ({ log = console.log } = {}) => executarMensagem("sexta-ultima-mensagem", log);
export const executarGrupoEncerrado = ({ log = console.log } = {}) => executarRenomear("sabado-grupo-encerrado", log);
