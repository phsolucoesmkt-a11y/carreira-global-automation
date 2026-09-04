import { enviarTexto } from "../../services/evolution.js";
import { gruposAtivosAoVivo } from "../../services/gruposStoreAoVivo.js";
import { GRUPO_INTERNO_NINA_JID } from "../../services/grupoInterno.js";
import { lerCamposDoFluxo } from "../../services/config.js";
import { TEXTOS_INTERNO_PADRAO } from "../textosInternoPadrao.js";

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Grupo Ao Vivo Ativo mais recente — se a lotação tiver criado um grupo
// extra e os dois estiverem Ativos, usa o mais novo (link mais fresco).
function grupoAoVivoMaisRecente() {
  const grupos = gruposAtivosAoVivo();
  if (grupos.length === 0) return null;
  return grupos.reduce((mais, atual) => (atual.criado_em > mais.criado_em ? atual : mais));
}

// Espelha o fluxo interno "Sexta 16h": manda o link do grupo Ao Vivo pro
// grupo interno da equipe, espera 5min, cobra a Nina pelo link da próxima
// semana no YouTube. Um único fluxo, igual o n8n original — nunca toca em
// grupo de lead, só no grupo interno fixo.
export async function executarLinkAoVivoNina({ log = console.log, esperaMs = 5 * 60_000 } = {}) {
  const campos = lerCamposDoFluxo("interno-link-ao-vivo", TEXTOS_INTERNO_PADRAO["interno-link-ao-vivo"]);

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[interno-link-ao-vivo] ${passo}`, dados ?? "");
  };

  const grupo = grupoAoVivoMaisRecente();
  if (!grupo || !grupo.link) {
    registrar("1. Nenhum grupo Ao Vivo Ativo com link registrado — nada enviado", { grupoEncontrado: !!grupo });
    return { totalGrupos: 0, passos };
  }
  registrar("1. Grupo Ao Vivo Ativo encontrado", { id: grupo.id, link: grupo.link });

  const mensagemLink = campos.mensagemLink.replaceAll("{{link}}", grupo.link);
  await enviarTexto({ remoteJid: GRUPO_INTERNO_NINA_JID, texto: mensagemLink });
  registrar("2. Link do grupo Ao Vivo enviado pro grupo interno");

  await esperar(esperaMs);

  await enviarTexto({ remoteJid: GRUPO_INTERNO_NINA_JID, texto: campos.mensagemCobranca });
  registrar("3. Cobrança do link do YouTube enviada pro grupo interno");

  return { totalGrupos: 1, passos };
}
