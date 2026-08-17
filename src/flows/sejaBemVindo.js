import { enviarVideo, enviarTexto, enviarEnquete } from "../services/evolution.js";
import { db } from "../db.js";
import { lerCamposDoFluxo } from "../services/config.js";
import { TEXTOS_PADRAO } from "./textosPadrao.js";

const DEFAULTS = TEXTOS_PADRAO["seja-bem-vindo"];

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Espelha "Envia mensagem de Seja Bem Vindo": pra cada grupo Ativo na
// árvore de grupos, manda vídeo -> espera 1min -> texto -> espera 1min ->
// enquete. Diferença do original: lê os grupos ativos do banco local
// (arvore_grupos), não mais do Google Sheets.
export async function executarSejaBemVindo({ log = console.log, esperaMs = 60_000 } = {}) {
  const campos = lerCamposDoFluxo("seja-bem-vindo", DEFAULTS);
  const grupos = db.prepare(`SELECT id, nome FROM arvore_grupos WHERE status = 'Ativo'`).all();
  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[seja-bem-vindo] ${passo}`, dados ?? "");
  };

  registrar("1. Grupos ativos encontrados", { total: grupos.length, grupos: grupos.map((g) => g.id) });

  for (const grupo of grupos) {
    await enviarVideo({ remoteJid: grupo.id, videoUrl: campos.videoUrl });
    registrar(`2. Vídeo enviado para ${grupo.nome ?? grupo.id}`);

    await esperar(esperaMs);

    await enviarTexto({ remoteJid: grupo.id, texto: campos.texto });
    registrar(`3. Texto enviado para ${grupo.nome ?? grupo.id}`);

    await esperar(esperaMs);

    await enviarEnquete({ remoteJid: grupo.id, pergunta: campos.enquetePergunta, opcoes: campos.enqueteOpcoes });
    registrar(`4. Enquete enviada para ${grupo.nome ?? grupo.id}`);
  }

  return { totalGrupos: grupos.length, passos };
}
