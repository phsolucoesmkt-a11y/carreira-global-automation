import { atualizarNomeDoGrupo, enviarTexto, enviarEnquete, enviarAudio } from "../../services/evolution.js";
import { gruposAtivosAoVivo, lerModeloDoGrupoAoVivo } from "../../services/gruposStoreAoVivo.js";
import { lerCamposDoFluxo } from "../../services/config.js";
import { TEXTOS_AO_VIVO_PADRAO } from "../textosAoVivoPadrao.js";

const DEFAULTS_E_AMANHA = TEXTOS_AO_VIVO_PADRAO["aovivo-e-amanha"];
const DEFAULTS_AUDIO_NINA = TEXTOS_AO_VIVO_PADRAO["aovivo-audio-nina"];

// Espelha "Envia mensagem do 'Enquete de trabalhar nos estados unidos'"
// (Ao Vivo, confirmado ativo no n8n — um único workflow com 2 gatilhos:
// "É amanhã" terça 11h e "Audio Nina" terça 18h). Dispara 1 dia antes do
// evento de quarta.
export async function executarEAmanhaAoVivo({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("aovivo-e-amanha", DEFAULTS_E_AMANHA);
  const grupos = gruposAtivosAoVivo();
  const modelo = lerModeloDoGrupoAoVivo();
  const nomeBase = modelo.nome.replace(/^[^\wÀ-ÿ]+/u, "").trim();
  const novoNome = `${campos.prefixoNome} | ${nomeBase}`;

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-e-amanha] ${passo}`, dados ?? "");
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

export async function executarAudioNinaAoVivo({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("aovivo-audio-nina", DEFAULTS_AUDIO_NINA);
  const grupos = gruposAtivosAoVivo();
  const modelo = lerModeloDoGrupoAoVivo();

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-audio-nina] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  if (!modelo.audio) {
    registrar("2. Sem áudio configurado no molde Ao Vivo — nada a enviar");
    return { totalGrupos: grupos.length, passos };
  }

  for (const grupo of grupos) {
    await enviarTexto({ remoteJid: grupo.id, texto: campos.avisoTexto });
    registrar(`2. Aviso enviado (${grupo.nome ?? grupo.id})`);

    await enviarAudio({ remoteJid: grupo.id, audioUrl: modelo.audio });
    registrar(`3. Áudio enviado (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}
