import { atualizarNomeDoGrupo, enviarTexto, enviarVideo } from "../services/evolution.js";
import { db } from "../db.js";
import { lerModeloDoGrupo } from "../services/gruposStore.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../services/config.js";
import { LINK_DA_LIVE_PADRAO } from "../services/linkDaLive.js";
import { TEXTOS_PADRAO } from "./textosPadrao.js";

function gruposAtivos() {
  return db.prepare(`SELECT id, nome FROM arvore_grupos WHERE status = 'Ativo'`).all();
}

function montarMensagem(template) {
  const link = lerConfiguracao("link_da_live", LINK_DA_LIVE_PADRAO);
  return template.replaceAll("{{link}}", link);
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Espelha "Envia Mensagem do 'É hoje'": renomeia o grupo, manda o vídeo,
// espera 1min, manda o texto.
export async function executarEHoje({ log = console.log, esperaMs = 60_000 } = {}) {
  const campos = lerCamposDoFluxo("e-hoje", TEXTOS_PADRAO["e-hoje"]);
  const grupos = gruposAtivos();
  const modelo = lerModeloDoGrupo();
  const nomeBase = modelo.nome.replace(/^[^\wÀ-ÿ]+/u, "").trim();
  const novoNome = `${campos.prefixoNome} | ${nomeBase}`;

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[e-hoje] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: novoNome });
    registrar(`2. Nome do grupo atualizado (${grupo.nome ?? grupo.id})`, { novoNome });

    await enviarVideo({ remoteJid: grupo.id, videoUrl: campos.videoUrl });
    registrar(`3. Vídeo enviado (${grupo.nome ?? grupo.id})`);

    await esperar(esperaMs);

    await enviarTexto({ remoteJid: grupo.id, texto: campos.texto });
    registrar(`4. Texto enviado (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}

// Genérico: manda uma única mensagem de texto pra todos os grupos ativos.
// Usado pelos fluxos 14h, 17h e 23h (fim do dia), que só mandam texto,
// sem renomear o grupo.
async function executarMensagemSimples({ chave, log }) {
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

export async function executar14h({ log = console.log } = {}) {
  return executarMensagemSimples({ chave: "14h", log });
}

export async function executar17h({ log = console.log } = {}) {
  return executarMensagemSimples({ chave: "17h", log });
}

// Espelha "23hrs fim do dia": manda a última mensagem do dia. (O passo
// original que registrava o grupo numa aba de arquivo separada no Sheets
// não foi replicado — o histórico de execuções deste sistema já cobre
// esse registro.)
export async function executar23h({ log = console.log } = {}) {
  return executarMensagemSimples({ chave: "23h-fim-do-dia", log });
}
