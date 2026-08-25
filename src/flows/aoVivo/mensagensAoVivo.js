import { atualizarNomeDoGrupo, enviarTexto, enviarVideo } from "../../services/evolution.js";
import {
  gruposAtivosAoVivo,
  lerModeloDoGrupoAoVivo,
  marcarGrupoAoVivoInativo,
  promoverGruposPendentesAoVivo,
} from "../../services/gruposStoreAoVivo.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../../services/config.js";
import { LINK_AO_VIVO_PADRAO } from "../../services/linkAoVivo.js";
import { TEXTOS_AO_VIVO_PADRAO } from "../textosAoVivoPadrao.js";

function montarMensagem(template) {
  const link = lerConfiguracao("link_ao_vivo", LINK_AO_VIVO_PADRAO);
  return template.replaceAll("{{link}}", link);
}

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Espelha "Envia Mensagem do 'É hoje'" (Ao Vivo): renomeia o grupo, manda
// o vídeo, espera 1min, manda o texto.
export async function executarEHojeAoVivo({ log = console.log, esperaMs = 60_000 } = {}) {
  const campos = lerCamposDoFluxo("aovivo-e-hoje", TEXTOS_AO_VIVO_PADRAO["aovivo-e-hoje"]);
  const grupos = gruposAtivosAoVivo();
  const modelo = lerModeloDoGrupoAoVivo();
  const nomeBase = modelo.nome.replace(/^[^\wÀ-ÿ]+/u, "").trim();
  const novoNome = `${campos.prefixoNome} | ${nomeBase}`;

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-e-hoje] ${passo}`, dados ?? "");
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

// Genérico: renomeia (se tiver prefixoNome) e manda uma mensagem de texto
// pra todos os grupos Ao Vivo ativos.
async function executarMensagem(chave, log, { renomear = false } = {}) {
  const campos = lerCamposDoFluxo(chave, TEXTOS_AO_VIVO_PADRAO[chave]);
  const grupos = gruposAtivosAoVivo();
  const modelo = renomear ? lerModeloDoGrupoAoVivo() : null;
  const nomeBase = modelo ? modelo.nome.replace(/^[^\wÀ-ÿ]+/u, "").trim() : null;
  const novoNome = renomear ? `${campos.prefixoNome} | ${nomeBase}` : null;
  const mensagem = campos.mensagem ? montarMensagem(campos.mensagem) : null;

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[${chave}] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    if (renomear) {
      await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: novoNome });
      registrar(`2. Nome do grupo atualizado (${grupo.nome ?? grupo.id})`, { novoNome });
    }
    if (mensagem) {
      await enviarTexto({ remoteJid: grupo.id, texto: mensagem });
      registrar(`${renomear ? "3" : "2"}. Mensagem enviada (${grupo.nome ?? grupo.id})`);
    }
  }

  return { totalGrupos: grupos.length, passos };
}

export const executar2HorasAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-2-horas", log, { renomear: true });
export const executar1HoraAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-1-hora", log, { renomear: true });
export const executar10MinutosAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-10-minutos", log, { renomear: true });
export const executarEstamosAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-estamos-ao-vivo", log, { renomear: true });
export const executar20h10AoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-durante-live-20h10", log);
export const executar20h20AoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-durante-live-20h20", log);
export const executar20h30AoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-durante-live-20h30", log);
export const executar20h40AoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-durante-live-20h40", log);
export const executar20h50AoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-durante-live-20h50", log);

// Última mensagem do dia (23h05): manda o texto e já encerra o(s) grupo(s)
// ativos — no Ao Vivo não existe extensão pro dia seguinte como no Gravado,
// o evento é só naquele dia.
export async function executarFimDoDiaAoVivo({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("aovivo-fim-do-dia", TEXTOS_AO_VIVO_PADRAO["aovivo-fim-do-dia"]);
  const mensagem = montarMensagem(campos.mensagem);
  const grupos = gruposAtivosAoVivo();

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-fim-do-dia] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await enviarTexto({ remoteJid: grupo.id, texto: mensagem });
    marcarGrupoAoVivoInativo(grupo.id);
    registrar(`2. Mensagem enviada e grupo encerrado (${grupo.nome ?? grupo.id})`);
  }

  const promovidos = promoverGruposPendentesAoVivo();
  if (promovidos.length > 0) {
    registrar("3. Grupo(s) Pendente(s) promovido(s) a Ativo", { grupos: promovidos.map((g) => g.nome ?? g.id) });
  }

  return { totalGrupos: grupos.length, passos };
}
