import { atualizarNomeDoGrupo, enviarTexto } from "../../services/evolution.js";
import { gruposAtivosAoVivo, gruposInativosRecentesAoVivo } from "../../services/gruposStoreAoVivo.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../../services/config.js";
import { LINK_AO_VIVO_PADRAO } from "../../services/linkAoVivo.js";
import { TEXTOS_AO_VIVO_PADRAO } from "../textosAoVivoPadrao.js";

// Espelha o workflow "Dia Seguinte 'uma notícia que eu NÃO esperava dar.'"
// (Ao Vivo, confirmado ativo no n8n) — 3 mensagens na quinta (dia depois
// do evento de quarta) + 1 renomeio na sexta de manhã encerrando de vez.
// O n8n original tinha 2 pedaços desconectados (nó "Última chance" e um
// "Boa noite, suporte encerrando" — nenhum dos dois tinha gatilho ligado,
// nunca disparavam de verdade) — não replicados aqui por não fazerem
// parte do fluxo real.

function montarMensagem(template) {
  const link = lerConfiguracao("link_ao_vivo", LINK_AO_VIVO_PADRAO);
  return template.replaceAll("{{link}}", link);
}

async function executarMensagem(chave, log) {
  const campos = lerCamposDoFluxo(chave, TEXTOS_AO_VIVO_PADRAO[chave]);
  const mensagem = montarMensagem(campos.mensagem);
  const grupos = gruposAtivosAoVivo();

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

export const executarAvisoExtensaoAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-aviso-extensao", log);
export const executarContaRapidaAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-conta-rapida", log);
export const executarUltimaMensagemAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-ultima-mensagem", log);

// Sexta 08h15: renomeia o(s) grupo(s) encerrado(s) recentemente (pelo
// "Fim do dia" de quarta) pra "Grupo encerrado" — não manda mensagem, só
// cosmético, igual o fluxo real do n8n.
export async function executarGrupoEncerradoAoVivo({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("aovivo-grupo-encerrado", TEXTOS_AO_VIVO_PADRAO["aovivo-grupo-encerrado"]);
  const grupos = gruposInativosRecentesAoVivo();

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-grupo-encerrado] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos encerrados recentemente encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: campos.prefixoNome });
    registrar(`2. Nome do grupo atualizado (${grupo.nome ?? grupo.id})`, { novoNome: campos.prefixoNome });
  }

  return { totalGrupos: grupos.length, passos };
}
