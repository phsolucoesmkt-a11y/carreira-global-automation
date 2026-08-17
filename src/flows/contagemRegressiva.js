import { atualizarNomeDoGrupo, enviarTexto } from "../services/evolution.js";
import { db } from "../db.js";
import { lerModeloDoGrupo } from "../services/gruposStore.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../services/config.js";
import { LINK_DA_LIVE_PADRAO } from "../services/linkDaLive.js";
import { TEXTOS_PADRAO } from "./textosPadrao.js";

function gruposAtivos() {
  return db.prepare(`SELECT id, nome FROM arvore_grupos WHERE status = 'Ativo'`).all();
}

function nomeBaseDoGrupo() {
  const modelo = lerModeloDoGrupo();
  return modelo.nome.replace(/^[^\wÀ-ÿ]+/u, "").trim(); // tira o emoji da frente
}

// A mensagem salva usa {{link}} onde deveria entrar o link da live —
// assim trocar o link num lugar só (config) atualiza todo mundo que
// referencia ele, sem precisar editar o texto de cada fluxo.
function montarMensagem(template) {
  const link = lerConfiguracao("link_da_live", LINK_DA_LIVE_PADRAO);
  return template.replaceAll("{{link}}", link);
}

// Genérico: renomeia cada grupo ativo com o prefixo da etapa e manda a
// mensagem correspondente. Espelha o padrão comum aos 4 fluxos de
// contagem regressiva (2h / 1h / 10min / Estamos ao vivo).
async function executarEtapa({ chave, defaults, log }) {
  const { prefixoNome, mensagem: template } = lerCamposDoFluxo(chave, defaults);
  const mensagem = montarMensagem(template);
  const grupos = gruposAtivos();
  const nomeBase = nomeBaseDoGrupo();
  const novoNome = `${prefixoNome} | ${nomeBase}`;

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[contagem] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: novoNome });
    registrar(`2. Nome do grupo atualizado (${grupo.nome ?? grupo.id})`, { novoNome });

    await enviarTexto({ remoteJid: grupo.id, texto: mensagem });
    registrar(`3. Mensagem enviada (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}

export async function executar2Horas({ log = console.log } = {}) {
  return executarEtapa({ log, chave: "2-horas", defaults: TEXTOS_PADRAO["2-horas"] });
}

export async function executar1Hora({ log = console.log } = {}) {
  return executarEtapa({ log, chave: "1-hora", defaults: TEXTOS_PADRAO["1-hora"] });
}

export async function executar10Minutos({ log = console.log } = {}) {
  return executarEtapa({ log, chave: "10-minutos", defaults: TEXTOS_PADRAO["10-minutos"] });
}

export async function executarEstamosAoVivo({ log = console.log } = {}) {
  return executarEtapa({ log, chave: "estamos-ao-vivo", defaults: TEXTOS_PADRAO["estamos-ao-vivo"] });
}
