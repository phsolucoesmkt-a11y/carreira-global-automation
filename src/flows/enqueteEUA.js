import { atualizarNomeDoGrupo, enviarTexto, enviarEnquete, enviarAudio } from "../services/evolution.js";
import { db } from "../db.js";
import { lerModeloDoGrupo } from "../services/gruposStore.js";
import { lerCamposDoFluxo } from "../services/config.js";
import { dataDoWorkshopGravado } from "../services/dataWorkshop.js";
import { TEXTOS_PADRAO } from "./textosPadrao.js";

const DEFAULTS_E_AMANHA = TEXTOS_PADRAO["e-amanha"];
const DEFAULTS_AUDIO_NINA = TEXTOS_PADRAO["audio-nina"];

function gruposAtivos() {
  return db.prepare(`SELECT id, nome FROM arvore_grupos WHERE status = 'Ativo'`).all();
}

// Espelha a parte "É amanhã" do fluxo "Enquete de trabalhar nos estados
// unidos": renomeia o grupo pra "É AMANHÃ", manda a pergunta e a enquete.
// Dispara 1 dia antes do workshop (quarta, se o workshop é quinta).
export async function executarEAmanha({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("e-amanha", DEFAULTS_E_AMANHA);
  const grupos = gruposAtivos();
  const modelo = lerModeloDoGrupo();
  const nomeBase = modelo.nome.replace(/^[^\wÀ-ÿ]+/u, "").trim(); // tira o emoji da frente
  const novoNome = `${campos.prefixoNome} | ${nomeBase} - ${dataDoWorkshopGravado()}`;

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[e-amanha] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: novoNome });
    registrar(`2. Nome do grupo atualizado (${grupo.nome ?? grupo.id})`, { novoNome });

    await enviarTexto({ remoteJid: grupo.id, texto: campos.pergunta });
    registrar(`3. Pergunta enviada (${grupo.nome ?? grupo.id})`);

    await enviarEnquete({ remoteJid: grupo.id, pergunta: campos.enquetePergunta, opcoes: campos.enqueteOpcoes });
    registrar(`4. Enquete enviada (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}

// Espelha a parte "Audio Nina" do mesmo fluxo: avisa e manda o áudio.
export async function executarAudioNina({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("audio-nina", DEFAULTS_AUDIO_NINA);
  const grupos = gruposAtivos();
  const modelo = lerModeloDoGrupo();
  if (!modelo.audio) throw new Error("Molde do grupo não tem 'audio' configurado (campo Áudio Nina).");

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[audio-nina] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await enviarTexto({ remoteJid: grupo.id, texto: campos.avisoTexto });
    registrar(`2. Aviso enviado (${grupo.nome ?? grupo.id})`);

    await enviarAudio({ remoteJid: grupo.id, audioUrl: modelo.audio });
    registrar(`3. Áudio enviado (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}
