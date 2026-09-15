// Campanha "Live 1 · Gisleine" — reengajamento pontual dos grupos antigos
// "Workshop Vagas Internacionais" (levantamento Black Friday) antes da live
// de terça, 22/09, às 8h. Diferente das trilhas Gravado/Ao Vivo/Interno, não
// tem um "grupo vigente" único: dispara pra uma lista fixa de grupos já
// encerrados. Só a instância nina_web3 está ativa (nina_web2 caiu) — grupos
// dela ficam de fora. Também ficam de fora os grupos que estiverem Ativo
// nas trilhas Gravado/Ao Vivo essa semana, pra nunca mexer num grupo em uso.
import {
  atualizarNomeDoGrupo,
  atualizarImagemDoGrupo,
  atualizarDescricaoDoGrupo,
  enviarImagem,
  enviarEnquete,
  enviarAudio,
} from "../services/evolution.js";
import { db } from "../db.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../services/config.js";
import { ultimaExecucaoPorFluxo } from "../services/execucoes.js";
import { listarGruposBlackFriday } from "../services/blackFriday.js";
import { TEXTOS_LIVE1_PADRAO } from "./textosLive1Padrao.js";

// Grupo criado pelo próprio bot, com o número certo (5511530401649) já
// garantido como membro/admin — único lugar seguro pra validar entrega real
// antes de disparar pros 28 grupos de lead de verdade.
const GRUPO_DE_TESTE = { id: "120363412496355826@g.us", nome: "Teste Mensagens Novas", instancia: "nina_web3" };

function idsAtivosDestaSemana() {
  const gravado = db.prepare(`SELECT id FROM arvore_grupos WHERE status = 'Ativo'`).all().map((r) => r.id);
  const aoVivo = db.prepare(`SELECT id FROM arvore_grupos_ao_vivo WHERE status = 'Ativo'`).all().map((r) => r.id);
  return new Set([...gravado, ...aoVivo]);
}

// Só os grupos da nina_web3 (única instância ativa hoje), fora os que
// estiverem em uso pela semana normal de funil. Em "modo teste" (toggle na
// aba Configurações), manda só pro grupo de teste — pra validar entrega
// antes de rodar pros 28 grupos de lead de verdade.
export function gruposAlvoLive1() {
  if (lerConfiguracao("live1_modo", "producao") === "teste") return [GRUPO_DE_TESTE];
  const emUso = idsAtivosDestaSemana();
  return listarGruposBlackFriday().filter((g) => g.instancia === "nina_web3" && !emUso.has(g.id));
}

// Evita reenviar pros grupos que já receberam com sucesso na última
// execução desse mesmo fluxo — importante porque essa campanha é disparada
// manualmente e pode precisar rodar de novo só pros que faltaram.
function gruposPendentes(chave, grupos) {
  const ultima = ultimaExecucaoPorFluxo(chave);
  if (ultima?.status !== "sucesso") return grupos;
  let detalhe;
  try {
    detalhe = JSON.parse(ultima.detalhe ?? "{}");
  } catch {
    detalhe = {};
  }
  const jaEnviados = new Set(detalhe.sucesso ?? []);
  return grupos.filter((g) => !jaEnviados.has(g.id));
}

function criarRegistrador(chave, log) {
  const passos = [];
  return {
    passos,
    registrar(passo, dados) {
      passos.push({ passo, dados });
      log(`[${chave}] ${passo}`, dados ?? "");
    },
  };
}

// Roda `acao(grupo)` grupo a grupo (a fila global do evolution.js já espaça
// as chamadas de 3 a 15s) — uma falha num grupo não derruba os demais.
async function paraCadaGrupo(grupos, acao) {
  const sucesso = [];
  const falha = [];
  for (const grupo of grupos) {
    try {
      await acao(grupo);
      sucesso.push(grupo.id);
    } catch (err) {
      falha.push({ id: grupo.id, nome: grupo.nome, erro: err.message });
    }
  }
  return { sucesso, falha };
}

// Tenta uma ação que exige o bot ser admin do grupo (nome/foto/descrição).
// Se não for admin (ou qualquer outro erro), registra o aviso e segue pra
// próxima etapa — isso nunca pode bloquear o envio do banner, que é o que
// realmente importa pro lead.
async function tentarComoAdmin(rotulo, acao, avisos) {
  try {
    await acao();
  } catch (err) {
    avisos.push(`${rotulo}: ${err.message}`);
  }
}

// Terça — abertura: renomeia, troca foto e descrição do grupo (best-effort,
// só funciona se o bot ainda for admin — muitos desses grupos antigos já
// tiraram o bot da administração) e manda o banner de anúncio da live com a
// legenda, que é o que precisa chegar independente das outras 3 falharem.
export async function executarLive1Abertura({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("live1-abertura", TEXTOS_LIVE1_PADRAO["live1-abertura"]);
  const grupos = gruposPendentes("live1-abertura", gruposAlvoLive1());
  const { registrar } = criarRegistrador("live1-abertura", log);
  registrar("1. Grupos-alvo (nina_web3, fora de uso, ainda não enviados)", { total: grupos.length });

  if (!campos.fotoGrupoUrl || !campos.imagemUrl) {
    registrar("Pulado — falta configurar fotoGrupoUrl e/ou imagemUrl pelo painel");
    return { pulado: true, motivo: "faltam mídias configuradas", total: grupos.length };
  }

  const sucesso = [];
  const falha = [];
  for (const grupo of grupos) {
    const avisos = [];
    await tentarComoAdmin("nome", () => atualizarNomeDoGrupo({ groupJid: grupo.id, nome: campos.nome }), avisos);
    await tentarComoAdmin("foto", () => atualizarImagemDoGrupo({ groupJid: grupo.id, imagemUrl: campos.fotoGrupoUrl }), avisos);
    await tentarComoAdmin("descricao", () => atualizarDescricaoDoGrupo({ groupJid: grupo.id, descricao: campos.descricao }), avisos);
    try {
      await enviarImagem({ remoteJid: grupo.id, imagemUrl: campos.imagemUrl, legenda: campos.legenda });
      sucesso.push(grupo.id);
      if (avisos.length) registrar(`Aviso (${grupo.nome ?? grupo.id}) — banner enviado, mas:`, avisos);
    } catch (err) {
      falha.push({ id: grupo.id, nome: grupo.nome, erro: err.message, avisos });
    }
  }
  registrar("2. Concluído", { enviados: sucesso.length, falhas: falha.length });
  return { total: grupos.length, sucesso, falha };
}

// Quarta 12h30 — banner com a mensagem que a Gisleine mandou pra Nina.
export async function executarLive1MensagemGisleine({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("live1-mensagem-gisleine", TEXTOS_LIVE1_PADRAO["live1-mensagem-gisleine"]);
  const grupos = gruposPendentes("live1-mensagem-gisleine", gruposAlvoLive1());
  const { registrar } = criarRegistrador("live1-mensagem-gisleine", log);
  registrar("1. Grupos-alvo (ainda não enviados)", { total: grupos.length });

  if (!campos.imagemUrl) {
    registrar("Pulado — falta configurar imagemUrl pelo painel");
    return { pulado: true, motivo: "falta imagemUrl", total: grupos.length };
  }

  const resultado = await paraCadaGrupo(grupos, (grupo) =>
    enviarImagem({ remoteJid: grupo.id, imagemUrl: campos.imagemUrl, legenda: campos.legenda })
  );
  registrar("2. Concluído", { enviados: resultado.sucesso.length, falhas: resultado.falha.length });
  return { total: grupos.length, ...resultado };
}

// Quinta 10h — áudio 1 (roteiro pra Nina gravar). Se ainda não tiver o
// audioUrl configurado, pula sem erro — o sábado assume o conteúdo dele
// como reserva (ver executarLive1Audio2).
export async function executarLive1Audio1({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("live1-audio1", TEXTOS_LIVE1_PADRAO["live1-audio1"]);
  const grupos = gruposPendentes("live1-audio1", gruposAlvoLive1());
  const { registrar } = criarRegistrador("live1-audio1", log);
  registrar("1. Grupos-alvo (ainda não enviados)", { total: grupos.length });

  if (!campos.audioUrl) {
    registrar("Pulado — áudio 1 ainda não gravado/configurado");
    return { enviado: false, pulado: true, motivo: "falta audioUrl", total: grupos.length };
  }

  const resultado = await paraCadaGrupo(grupos, (grupo) => enviarAudio({ remoteJid: grupo.id, audioUrl: campos.audioUrl }));
  registrar("2. Concluído", { enviados: resultado.sucesso.length, falhas: resultado.falha.length });
  return { enviado: true, total: grupos.length, ...resultado };
}

// Sexta 12h30 — enquete sobre o que perguntar pra Gisleine.
export async function executarLive1Enquete({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("live1-enquete", TEXTOS_LIVE1_PADRAO["live1-enquete"]);
  const grupos = gruposPendentes("live1-enquete", gruposAlvoLive1());
  const { registrar } = criarRegistrador("live1-enquete", log);
  registrar("1. Grupos-alvo (ainda não enviados)", { total: grupos.length });

  const resultado = await paraCadaGrupo(grupos, (grupo) =>
    enviarEnquete({ remoteJid: grupo.id, pergunta: campos.enquetePergunta, opcoes: campos.enqueteOpcoes })
  );
  registrar("2. Concluído", { enviados: resultado.sucesso.length, falhas: resultado.falha.length });
  return { total: grupos.length, ...resultado };
}

// Sábado 10h — áudio 2. Regra do roteiro: se o áudio 1 não saiu na quinta
// (pulado ou com erro), manda o conteúdo do áudio 1 no lugar do áudio 2.
export async function executarLive1Audio2({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("live1-audio2", TEXTOS_LIVE1_PADRAO["live1-audio2"]);
  const campos1 = lerCamposDoFluxo("live1-audio1", TEXTOS_LIVE1_PADRAO["live1-audio1"]);
  const grupos = gruposPendentes("live1-audio2", gruposAlvoLive1());
  const { registrar } = criarRegistrador("live1-audio2", log);
  registrar("1. Grupos-alvo (ainda não enviados)", { total: grupos.length });

  const ultimaAudio1 = ultimaExecucaoPorFluxo("live1-audio1");
  const audio1Saiu = ultimaAudio1?.status === "sucesso" && (() => {
    try {
      return JSON.parse(ultimaAudio1.detalhe ?? "{}").enviado === true;
    } catch {
      return false;
    }
  })();

  const audioUrl = audio1Saiu ? campos.audioUrl : campos1.audioUrl;
  const usandoReserva = !audio1Saiu;
  registrar("2. Decisão de qual áudio mandar", { audio1Saiu, usandoReserva });

  if (!audioUrl) {
    registrar("Pulado — nenhum audioUrl disponível (nem áudio 1, nem áudio 2)");
    return { enviado: false, pulado: true, usandoReserva, total: grupos.length };
  }

  const resultado = await paraCadaGrupo(grupos, (grupo) => enviarAudio({ remoteJid: grupo.id, audioUrl }));
  registrar("3. Concluído", { enviados: resultado.sucesso.length, falhas: resultado.falha.length });
  return { enviado: true, usandoReserva, total: grupos.length, ...resultado };
}
