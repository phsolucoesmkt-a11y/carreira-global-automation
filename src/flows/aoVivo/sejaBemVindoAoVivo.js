import { enviarVideo, enviarTexto, enviarEnquete } from "../../services/evolution.js";
import { gruposAtivosAoVivo } from "../../services/gruposStoreAoVivo.js";
import { lerCamposDoFluxo } from "../../services/config.js";
import { TEXTOS_AO_VIVO_PADRAO } from "../textosAoVivoPadrao.js";

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Espelha "Envia mensagem de Seja Bem Vindo" (Ao Vivo, confirmado ativo no
// n8n) — segunda-feira 20h, 2 dias antes do evento de quarta.
export async function executarSejaBemVindoAoVivo({ log = console.log, esperaMs = 60_000 } = {}) {
  const campos = lerCamposDoFluxo("aovivo-seja-bem-vindo", TEXTOS_AO_VIVO_PADRAO["aovivo-seja-bem-vindo"]);
  const grupos = gruposAtivosAoVivo();

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-seja-bem-vindo] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await enviarVideo({ remoteJid: grupo.id, videoUrl: campos.videoUrl });
    registrar(`2. Vídeo enviado (${grupo.nome ?? grupo.id})`);

    await esperar(esperaMs);

    await enviarTexto({ remoteJid: grupo.id, texto: campos.texto });
    registrar(`3. Texto enviado (${grupo.nome ?? grupo.id})`);

    await esperar(esperaMs);

    await enviarEnquete({ remoteJid: grupo.id, pergunta: campos.enquetePergunta, opcoes: campos.enqueteOpcoes });
    registrar(`4. Enquete enviada (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}
