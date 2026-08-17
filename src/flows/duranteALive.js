import { enviarTexto } from "../services/evolution.js";
import { db } from "../db.js";
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

// Os 7 momentos de "Durante a Live" são gatilhos independentes no
// original (cada um dispara na hora dele, não em sequência numa única
// execução) — por isso viram 7 funções separadas aqui também, cada uma
// com seu próprio horário automático.
async function executarMomento(chave, log) {
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

export const executar20h10 = ({ log = console.log } = {}) => executarMomento("durante-live-20h10", log);
export const executar20h20 = ({ log = console.log } = {}) => executarMomento("durante-live-20h20", log);
export const executar20h30 = ({ log = console.log } = {}) => executarMomento("durante-live-20h30", log);
export const executar20h40 = ({ log = console.log } = {}) => executarMomento("durante-live-20h40", log);
export const executar20h50 = ({ log = console.log } = {}) => executarMomento("durante-live-20h50", log);
export const executarCarrinhoAberto = ({ log = console.log } = {}) => executarMomento("durante-live-carrinho-aberto", log);
export const executarGarantindoVaga = ({ log = console.log } = {}) => executarMomento("durante-live-garantindo-vaga", log);
