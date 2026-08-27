import { atualizarNomeDoGrupo, enviarTexto, enviarVideo } from "../../services/evolution.js";
import { gruposAtivosAoVivo, lerModeloDoGrupoAoVivo } from "../../services/gruposStoreAoVivo.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../../services/config.js";
import { LINK_AO_VIVO_PADRAO } from "../../services/linkAoVivo.js";
import { TEXTOS_AO_VIVO_PADRAO } from "../textosAoVivoPadrao.js";

// `grupo.link_override`, se definido, sobrescreve o link_ao_vivo global
// só pra esse grupo específico (usado em testes pontuais).
function montarMensagem(template, grupo) {
  const link = grupo?.link_override || lerConfiguracao("link_ao_vivo", LINK_AO_VIVO_PADRAO);
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
    if (campos.mensagem) {
      const mensagem = montarMensagem(campos.mensagem, grupo);
      await enviarTexto({ remoteJid: grupo.id, texto: mensagem });
      registrar(`${renomear ? "3" : "2"}. Mensagem enviada (${grupo.nome ?? grupo.id})`, grupo.link_override ? { linkUsado: "override" } : undefined);
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
export const executar22h05EncerramentoAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-22h05-encerramento", log);

// Última mensagem do dia (23h05): só manda o texto — igual o "23h fim do
// dia" do Gravado, o grupo continua Ativo até a quinta inteira (aviso de
// extensão, lembretes de 13h/17h/22h etc. dependem disso). Quem encerra de
// verdade o grupo é o "Grupo encerrado" de sexta de manhã (espelhando o
// "sábado grupo encerrado" do Gravado, um dia depois do último lembrete).
export async function executarFimDoDiaAoVivo({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("aovivo-fim-do-dia", TEXTOS_AO_VIVO_PADRAO["aovivo-fim-do-dia"]);
  const grupos = gruposAtivosAoVivo();

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-fim-do-dia] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    const mensagem = montarMensagem(campos.mensagem, grupo);
    await enviarTexto({ remoteJid: grupo.id, texto: mensagem });
    registrar(`2. Mensagem enviada (${grupo.nome ?? grupo.id})`);
  }

  return { totalGrupos: grupos.length, passos };
}
