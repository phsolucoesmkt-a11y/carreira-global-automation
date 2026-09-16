import "dotenv/config";
process.env.TZ = process.env.TZ || "America/Sao_Paulo";
import express from "express";
import cron from "node-cron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { executarCriarGrupo } from "./flows/criarGrupo.js";
import { executarSejaBemVindo } from "./flows/sejaBemVindo.js";
import { executarEAmanha, executarAudioNina } from "./flows/enqueteEUA.js";
import { executar2Horas, executar1Hora, executar10Minutos, executarEstamosAoVivo } from "./flows/contagemRegressiva.js";
import { executarEHoje, executar14h, executar17h, executar22h05Encerramento, executar23h, executarQA, executarOfertaQuinta } from "./flows/quintaFeira.js";
import {
  executarUltimaChance,
  executarAvisoExtensao,
  executarOfertaSexta,
  executarSexta13h,
  executarContaRapida,
  executarSexta17h,
  executarUltimaMensagem,
  executarSexta22h,
  executarGrupoEncerrado,
} from "./flows/sextaFeira.js";
import {
  executar20h10,
  executar20h20,
  executar20h30,
  executar20h40,
  executar20h50,
  executarCarrinhoAberto,
  executarGarantindoVaga,
} from "./flows/duranteALive.js";
import { TEXTOS_PADRAO } from "./flows/textosPadrao.js";
import { lerModeloCompleto, definirModeloDoGrupo, listarArvoreDeGrupos, buscarGrupoPorId, atualizarParticipantesDoGrupo, adicionarNaArvoreDeGrupos, grupoVigente } from "./services/gruposStore.js";
import { buscarParticipantesDoGrupo } from "./services/evolution.js";
import { registrarExecucao, listarExecucoes, ultimaExecucaoPorFluxo } from "./services/execucoes.js";
import { createSessionToken, verifySessionToken, parseCookies } from "./services/session.js";
import { lerCamposDoFluxo, salvarCamposDoFluxo, lerCronDoFluxo, salvarCronDoFluxo, lerAtivoDoFluxo, salvarAtivoDoFluxo, lerConfiguracao, definirConfiguracao } from "./services/config.js";
import { LINK_DA_LIVE_PADRAO, LINK_REPLAY_PADRAO } from "./services/linkDaLive.js";
import { cronParaTexto } from "./services/cronTexto.js";
import { listarGruposBlackFriday, resumoInstanciasBlackFriday } from "./services/blackFriday.js";

// Campanha pontual "Live 1 · Gisleine" (grupos antigos, reengajamento).
import {
  executarLive1Abertura,
  executarLive1MensagemGisleine,
  executarLive1Audio1,
  executarLive1Enquete,
  executarLive1Audio2,
} from "./flows/live1Gisleine.js";
import { TEXTOS_LIVE1_PADRAO } from "./flows/textosLive1Padrao.js";

// Trilha Ao Vivo — separada do Gravado (grupo, molde e link próprios).
import { executarCriarGrupoAoVivo } from "./flows/aoVivo/criarGrupoAoVivo.js";
import { executarSejaBemVindoAoVivo } from "./flows/aoVivo/sejaBemVindoAoVivo.js";
import { executarEAmanhaAoVivo, executarAudioNinaAoVivo } from "./flows/aoVivo/enqueteEUAAoVivo.js";
import {
  executarAvisoExtensaoAoVivo,
  executar13hAoVivo,
  executarContaRapidaAoVivo,
  executar17hAoVivo,
  executarUltimaMensagemAoVivo,
  executar22hAoVivo,
  executarGrupoEncerradoAoVivo,
  executarOfertaQuintaAoVivo,
} from "./flows/aoVivo/posEventoAoVivo.js";
import {
  executarEHojeAoVivo,
  executar2HorasAoVivo,
  executar1HoraAoVivo,
  executar10MinutosAoVivo,
  executarEstamosAoVivo as executarEstamosAoVivoAoVivo,
  executar20h10AoVivo,
  executar20h20AoVivo,
  executar20h30AoVivo,
  executar20h40AoVivo,
  executar20h50AoVivo,
  executar22h05EncerramentoAoVivo,
  executarFimDoDiaAoVivo,
  executarQAAoVivo,
  executarOfertaQuartaAoVivo,
} from "./flows/aoVivo/mensagensAoVivo.js";
import { executarChecaLotacaoAoVivo } from "./flows/aoVivo/checaLotacaoAoVivo.js";
import { TEXTOS_AO_VIVO_PADRAO } from "./flows/textosAoVivoPadrao.js";
import {
  lerModeloCompletoAoVivo,
  definirModeloDoGrupoAoVivo,
  listarArvoreDeGruposAoVivo,
  buscarGrupoAoVivoPorId,
  atualizarParticipantesDoGrupoAoVivo,
  adicionarNaArvoreDeGruposAoVivo,
  definirLinkOverrideAoVivo,
  grupoAoVivoVigente,
} from "./services/gruposStoreAoVivo.js";
import { LINK_AO_VIVO_PADRAO } from "./services/linkAoVivo.js";

// Trilha Interno — grupo fixo da equipe, nunca um grupo de lead.
import { executarLinkAoVivoNina } from "./flows/interno/linkAoVivoNina.js";
import { TEXTOS_INTERNO_PADRAO } from "./flows/textosInternoPadrao.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3100);
const USER = process.env.BASIC_AUTH_USER;
const PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const COOKIE_NAME = "cga_session";

// Registro central de todos os fluxos automatizados: chave (usada na URL),
// nome pra mostrar, horário padrão (usado se ninguém editou ainda) e a
// função que executa de verdade. A interface e o agendador usam essa
// mesma lista. `defaults` é null pro "criar-grupo" porque ele não manda
// mensagem própria — usa o molde do grupo (aba Editar > Molde).
const FLUXOS = [
  { chave: "criar-grupo", nome: "Criar o Grupo", dia: "Segunda-feira", cronPadrao: "50 18 * * 1", executar: () => executarCriarGrupo({}), defaults: null },
  { chave: "seja-bem-vindo", nome: "Seja Bem Vindo", dia: "Terça-feira", cronPadrao: "0 20 * * 2", executar: () => executarSejaBemVindo(), defaults: TEXTOS_PADRAO["seja-bem-vindo"] },
  { chave: "e-amanha", nome: "É Amanhã (enquete EUA)", dia: "Quarta-feira", cronPadrao: "0 11 * * 3", executar: () => executarEAmanha(), defaults: TEXTOS_PADRAO["e-amanha"] },
  { chave: "audio-nina", nome: "Áudio da Nina", dia: "Quarta-feira", cronPadrao: "0 18 * * 3", executar: () => executarAudioNina(), defaults: TEXTOS_PADRAO["audio-nina"] },
  { chave: "2-horas", nome: "Faltam 2 horas", dia: "Quinta-feira", cronPadrao: "0 18 * * 4", executar: () => executar2Horas(), defaults: TEXTOS_PADRAO["2-horas"] },
  { chave: "1-hora", nome: "Falta 1 hora", dia: "Quinta-feira", cronPadrao: "0 19 * * 4", executar: () => executar1Hora(), defaults: TEXTOS_PADRAO["1-hora"] },
  { chave: "10-minutos", nome: "Faltam 10 minutos", dia: "Quinta-feira", cronPadrao: "50 19 * * 4", executar: () => executar10Minutos(), defaults: TEXTOS_PADRAO["10-minutos"] },
  { chave: "estamos-ao-vivo", nome: "Estamos ao vivo", dia: "Quinta-feira", cronPadrao: "1 20 * * 4", executar: () => executarEstamosAoVivo(), defaults: TEXTOS_PADRAO["estamos-ao-vivo"] },
  { chave: "e-hoje", nome: "É Hoje", dia: "Quinta-feira", cronPadrao: "0 11 * * 4", executar: () => executarEHoje(), defaults: TEXTOS_PADRAO["e-hoje"] },
  { chave: "14h", nome: "Mensagem das 14h", dia: "Quinta-feira", cronPadrao: "0 14 * * 4", executar: () => executar14h(), defaults: TEXTOS_PADRAO["14h"] },
  { chave: "17h", nome: "Mensagem das 17h", dia: "Quinta-feira", cronPadrao: "0 17 * * 4", executar: () => executar17h(), defaults: TEXTOS_PADRAO["17h"] },
  { chave: "durante-live-20h10", nome: "Durante a Live — 20h10", dia: "Quinta-feira", cronPadrao: "12 20 * * 4", executar: () => executar20h10(), defaults: TEXTOS_PADRAO["durante-live-20h10"] },
  { chave: "durante-live-20h20", nome: "Durante a Live — 20h20", dia: "Quinta-feira", cronPadrao: "22 20 * * 4", executar: () => executar20h20(), defaults: TEXTOS_PADRAO["durante-live-20h20"] },
  { chave: "durante-live-20h30", nome: "Durante a Live — 20h30", dia: "Quinta-feira", cronPadrao: "30 20 * * 4", executar: () => executar20h30(), defaults: TEXTOS_PADRAO["durante-live-20h30"] },
  { chave: "durante-live-20h40", nome: "Durante a Live — 20h40", dia: "Quinta-feira", cronPadrao: "40 20 * * 4", executar: () => executar20h40(), defaults: TEXTOS_PADRAO["durante-live-20h40"] },
  { chave: "durante-live-20h50", nome: "Durante a Live — 20h50", dia: "Quinta-feira", cronPadrao: "50 20 * * 4", executar: () => executar20h50(), defaults: TEXTOS_PADRAO["durante-live-20h50"] },
  { chave: "durante-live-carrinho-aberto", nome: "Durante a Live — Carrinho aberto", dia: "Quinta-feira", cronPadrao: "54 20 * * 4", executar: () => executarCarrinhoAberto(), defaults: TEXTOS_PADRAO["durante-live-carrinho-aberto"] },
  { chave: "durante-live-garantindo-vaga", nome: "Durante a Live — Já tem gente garantindo vaga", dia: "Quinta-feira", cronPadrao: "3 21 * * 4", executar: () => executarGarantindoVaga(), defaults: TEXTOS_PADRAO["durante-live-garantindo-vaga"] },
  { chave: "qa", nome: "Q&A (21h45)", dia: "Quinta-feira", cronPadrao: "45 21 * * 4", executar: () => executarQA(), defaults: TEXTOS_PADRAO["qa"] },
  { chave: "oferta-quinta", nome: "Oferta com imagem (22h00)", dia: "Quinta-feira", cronPadrao: "0 22 * * 4", executar: () => executarOfertaQuinta(), defaults: TEXTOS_PADRAO["oferta-quinta"] },
  { chave: "22h05-encerramento", nome: "Encerramos o Workshop (22h05)", dia: "Quinta-feira", cronPadrao: "5 22 * * 4", executar: () => executar22h05Encerramento(), defaults: TEXTOS_PADRAO["22h05-encerramento"] },
  { chave: "23h-fim-do-dia", nome: "Fim do dia (23h)", dia: "Quinta-feira", cronPadrao: "5 23 * * 4", executar: () => executar23h(), defaults: TEXTOS_PADRAO["23h-fim-do-dia"] },
  { chave: "sexta-ultima-chance", nome: "Sexta — Renomeia 'Última chance'", dia: "Sexta-feira", cronPadrao: "11 10 * * 5", executar: () => executarUltimaChance(), defaults: TEXTOS_PADRAO["sexta-ultima-chance"] },
  { chave: "oferta-sexta", nome: "Sexta — Oferta detalhada (11h20)", dia: "Sexta-feira", cronPadrao: "20 11 * * 5", executar: () => executarOfertaSexta(), defaults: TEXTOS_PADRAO["oferta-sexta"] },
  { chave: "sexta-aviso-extensao", nome: "Sexta — Aviso de extensão (manhã)", dia: "Sexta-feira", cronPadrao: "12 10 * * 5", executar: () => executarAvisoExtensao(), defaults: TEXTOS_PADRAO["sexta-aviso-extensao"] },
  { chave: "sexta-13h", nome: "Sexta — Lembrete 13h", dia: "Sexta-feira", cronPadrao: "0 13 * * 5", executar: () => executarSexta13h(), defaults: TEXTOS_PADRAO["sexta-13h"] },
  { chave: "sexta-conta-rapida", nome: "Sexta — Conta rápida (tarde)", dia: "Sexta-feira", cronPadrao: "0 15 * * 5", executar: () => executarContaRapida(), defaults: TEXTOS_PADRAO["sexta-conta-rapida"] },
  { chave: "sexta-17h", nome: "Sexta — Lembrete 17h", dia: "Sexta-feira", cronPadrao: "0 17 * * 5", executar: () => executarSexta17h(), defaults: TEXTOS_PADRAO["sexta-17h"] },
  { chave: "sexta-ultima-mensagem", nome: "Sexta — Última mensagem (noite)", dia: "Sexta-feira", cronPadrao: "5 19 * * 5", executar: () => executarUltimaMensagem(), defaults: TEXTOS_PADRAO["sexta-ultima-mensagem"] },
  { chave: "sexta-22h", nome: "Sexta — Lembrete 22h", dia: "Sexta-feira", cronPadrao: "0 22 * * 5", executar: () => executarSexta22h(), defaults: TEXTOS_PADRAO["sexta-22h"] },
  { chave: "sabado-grupo-encerrado", nome: "Sábado — Grupo encerrado", dia: "Sábado", cronPadrao: "15 8 * * 6", executar: () => executarGrupoEncerrado(), defaults: TEXTOS_PADRAO["sabado-grupo-encerrado"] },

  // Trilha Ao Vivo — evento ao vivo via YouTube, sempre quarta-feira.
  // Grupo criado com antecedência (sexta), aquecimento segunda/terça,
  // evento na quarta, pós-evento quinta, encerramento cosmético sexta.
  { chave: "aovivo-criar-grupo", nome: "Ao Vivo — Criar o Grupo", dia: "Sexta-feira", trilha: "ao-vivo", cronPadrao: "0 9 * * 5", executar: () => executarCriarGrupoAoVivo({}), defaults: null },
  { chave: "aovivo-seja-bem-vindo", nome: "Ao Vivo — Seja Bem Vindo", dia: "Segunda-feira", trilha: "ao-vivo", cronPadrao: "0 20 * * 1", executar: () => executarSejaBemVindoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-seja-bem-vindo"] },
  { chave: "aovivo-e-amanha", nome: "Ao Vivo — É Amanhã (enquete EUA)", dia: "Terça-feira", trilha: "ao-vivo", cronPadrao: "0 11 * * 2", executar: () => executarEAmanhaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-e-amanha"] },
  { chave: "aovivo-audio-nina", nome: "Ao Vivo — Áudio da Nina", dia: "Terça-feira", trilha: "ao-vivo", cronPadrao: "0 18 * * 2", executar: () => executarAudioNinaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-audio-nina"] },
  { chave: "aovivo-e-hoje", nome: "Ao Vivo — É Hoje", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "0 11 * * 3", executar: () => executarEHojeAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-e-hoje"] },
  { chave: "aovivo-2-horas", nome: "Ao Vivo — Faltam 2 horas", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "0 18 * * 3", executar: () => executar2HorasAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-2-horas"] },
  { chave: "aovivo-1-hora", nome: "Ao Vivo — Falta 1 hora", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "0 19 * * 3", executar: () => executar1HoraAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-1-hora"] },
  { chave: "aovivo-10-minutos", nome: "Ao Vivo — Faltam 10 minutos", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "50 19 * * 3", executar: () => executar10MinutosAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-10-minutos"] },
  { chave: "aovivo-estamos-ao-vivo", nome: "Ao Vivo — Estamos ao vivo", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "1 20 * * 3", executar: () => executarEstamosAoVivoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-estamos-ao-vivo"] },
  { chave: "aovivo-durante-live-20h10", nome: "Ao Vivo — Durante a Live 20h10", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "10 20 * * 3", executar: () => executar20h10AoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-durante-live-20h10"] },
  { chave: "aovivo-durante-live-20h20", nome: "Ao Vivo — Durante a Live 20h20", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "20 20 * * 3", executar: () => executar20h20AoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-durante-live-20h20"] },
  { chave: "aovivo-durante-live-20h30", nome: "Ao Vivo — Durante a Live 20h30", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "30 20 * * 3", executar: () => executar20h30AoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-durante-live-20h30"] },
  { chave: "aovivo-durante-live-20h40", nome: "Ao Vivo — Durante a Live 20h40", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "40 20 * * 3", executar: () => executar20h40AoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-durante-live-20h40"] },
  { chave: "aovivo-durante-live-20h50", nome: "Ao Vivo — Durante a Live 20h50", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "50 20 * * 3", executar: () => executar20h50AoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-durante-live-20h50"] },
  { chave: "aovivo-qa", nome: "Ao Vivo — Q&A (21h45)", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "45 21 * * 3", executar: () => executarQAAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-qa"] },
  { chave: "aovivo-oferta-quarta", nome: "Ao Vivo — Oferta com imagem (22h00)", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "0 22 * * 3", executar: () => executarOfertaQuartaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-oferta-quarta"] },
  { chave: "aovivo-22h05-encerramento", nome: "Ao Vivo — Encerramos o Workshop (22h05)", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "5 22 * * 3", executar: () => executar22h05EncerramentoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-22h05-encerramento"] },
  { chave: "aovivo-fim-do-dia", nome: "Ao Vivo — Fim do dia (23h05)", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "5 23 * * 3", executar: () => executarFimDoDiaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-fim-do-dia"] },
  { chave: "aovivo-aviso-extensao", nome: "Ao Vivo — Aviso de extensão (manhã)", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "12 10 * * 4", executar: () => executarAvisoExtensaoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-aviso-extensao"] },
  { chave: "aovivo-oferta-quinta", nome: "Ao Vivo — Oferta detalhada (11h20)", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "20 11 * * 4", executar: () => executarOfertaQuintaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-oferta-quinta"] },
  { chave: "aovivo-13h", nome: "Ao Vivo — Lembrete 13h", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 13 * * 4", executar: () => executar13hAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-13h"] },
  { chave: "aovivo-conta-rapida", nome: "Ao Vivo — Conta rápida (tarde)", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "15 15 * * 4", executar: () => executarContaRapidaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-conta-rapida"] },
  { chave: "aovivo-17h", nome: "Ao Vivo — Lembrete 17h", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 17 * * 4", executar: () => executar17hAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-17h"] },
  { chave: "aovivo-ultima-mensagem", nome: "Ao Vivo — Última mensagem (noite)", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 19 * * 4", executar: () => executarUltimaMensagemAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-ultima-mensagem"] },
  { chave: "aovivo-22h", nome: "Ao Vivo — Lembrete 22h", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 22 * * 4", executar: () => executar22hAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-22h"] },
  { chave: "aovivo-grupo-encerrado", nome: "Ao Vivo — Grupo encerrado (renomeia)", dia: "Sexta-feira", trilha: "ao-vivo", cronPadrao: "15 8 * * 5", executar: () => executarGrupoEncerradoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-grupo-encerrado"] },
  { chave: "aovivo-checa-lotacao", nome: "Ao Vivo — Checa lotação (a cada 30min)", dia: "Contínuo", trilha: "ao-vivo", cronPadrao: "*/30 * * * *", executar: () => executarChecaLotacaoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-checa-lotacao"] },
  { chave: "interno-link-ao-vivo", nome: "Interno — Link Ao Vivo + Cobrança Nina", dia: "Sexta-feira", trilha: "interno", cronPadrao: "0 16 * * 5", executar: () => executarLinkAoVivoNina(), defaults: TEXTOS_INTERNO_PADRAO["interno-link-ao-vivo"] },

  // Campanha pontual "Live 1 · Gisleine" — reengajamento dos grupos antigos
  // (nina_web3) antes da live de terça, 22/09, às 8h. Cron fixo por data
  // (dia/mês), não por dia-da-semana recorrente, porque é um evento único
  // desta semana — desligar (toggle) ou apagar depois que passar.
  // Cron em lista de horários (não um horário único) só por hoje, 16/09:
  // dispara a cada 30min entre 10h-21h, processando no máximo `loteMaximo`
  // grupos pendentes por vez (campos editáveis) — evita rajada grande de
  // download do mesmo banner no Google Drive, que passou a bloquear como
  // abuso depois de ~10 downloads seguidos e travava o envio real da
  // mensagem. Grupos já enviados com sucesso nunca são reprocessados
  // (gruposPendentes olha o histórico inteiro). Depois de hoje, pode voltar
  // a ser um horário único ou ser desligado pelo toggle "Automático".
  { chave: "live1-abertura", nome: "Live 1 — Abertura (nome, foto, descrição, banner)", dia: "Quarta, 16/09", trilha: "live1", cronPadrao: "*/15 * 16 9 *", executar: () => executarLive1Abertura(), defaults: TEXTOS_LIVE1_PADRAO["live1-abertura"] },
  { chave: "live1-mensagem-gisleine", nome: "Live 1 — Mensagem da Gisleine (12h30)", dia: "Quarta, 16/09", trilha: "live1", cronPadrao: "15,45 10-21 16 9 *", executar: () => executarLive1MensagemGisleine(), defaults: TEXTOS_LIVE1_PADRAO["live1-mensagem-gisleine"] },
  { chave: "live1-audio1", nome: "Live 1 — Áudio 1 da Nina (10h)", dia: "Quinta, 17/09", trilha: "live1", cronPadrao: "0 10 17 9 *", executar: () => executarLive1Audio1(), defaults: TEXTOS_LIVE1_PADRAO["live1-audio1"] },
  { chave: "live1-enquete", nome: "Live 1 — Enquete (12h30)", dia: "Sexta, 18/09", trilha: "live1", cronPadrao: "30 12 18 9 *", executar: () => executarLive1Enquete(), defaults: TEXTOS_LIVE1_PADRAO["live1-enquete"] },
  { chave: "live1-audio2", nome: "Live 1 — Áudio 2 da Nina (10h)", dia: "Sábado, 19/09", trilha: "live1", cronPadrao: "0 10 19 9 *", executar: () => executarLive1Audio2(), defaults: TEXTOS_LIVE1_PADRAO["live1-audio2"] },
];

// Trava por chave de fluxo — impede que cron automático e clique manual (ou
// duas execuções automáticas quase simultâneas) rodem o MESMO fluxo ao mesmo
// tempo, o que já causou envio duplicado pros mesmos grupos (histórico de
// 16/09: fluxo "preso" de um processo anterior terminou depois do redeploy,
// sobrepondo com a execução nova e reenviando pros mesmos 7 grupos).
const fluxosEmExecucao = new Set();

async function executarFluxo(fluxo, origem) {
  if (fluxosEmExecucao.has(fluxo.chave)) {
    console.log(`[${origem}] ${fluxo.chave} já está em execução, pulando`);
    return { pulado: true, motivo: "execução concorrente evitada" };
  }
  fluxosEmExecucao.add(fluxo.chave);
  try {
    const resultado = await fluxo.executar();
    registrarExecucao({ fluxo: fluxo.chave, origem, status: "sucesso", detalhe: resultado });
    console.log(`[${origem}] ${fluxo.chave} executado com sucesso`);
    return resultado;
  } catch (err) {
    registrarExecucao({ fluxo: fluxo.chave, origem, status: "erro", detalhe: { error: err.message } });
    console.error(`[${origem}] falha ao executar ${fluxo.chave}:`, err.message);
    throw err;
  } finally {
    fluxosEmExecucao.delete(fluxo.chave);
  }
}

// Tarefas de cron atualmente agendadas, por chave de fluxo — guardamos a
// referência pra poder parar e recriar quando o horário for editado.
const tarefasAgendadas = new Map();

function agendarFluxo(fluxo) {
  const anterior = tarefasAgendadas.get(fluxo.chave);
  if (anterior) anterior.stop();
  const expressao = lerCronDoFluxo(fluxo.chave, fluxo.cronPadrao);
  const tarefa = cron.schedule(
    expressao,
    () => {
      if (!lerAtivoDoFluxo(fluxo.chave)) {
        console.log(`[automatico] ${fluxo.chave} pausado, pulando disparo automático`);
        return;
      }
      executarFluxo(fluxo, "automatico");
    },
    { timezone: "America/Sao_Paulo" }
  );
  tarefasAgendadas.set(fluxo.chave, tarefa);
}

for (const fluxo of FLUXOS) agendarFluxo(fluxo);

// Redirect público pro tráfego pago (Google/Meta Ads apontam pra cá em vez
// de pra planilha do Google Sheets do fluxo antigo em n8n). Sempre manda
// pro grupo vigente de cada trilha — troca sozinho quando o grupo atual é
// substituído (lotação no Ao Vivo, ou virada de semana no Gravado), sem
// precisar trocar link em nenhum lugar manualmente. Sem autenticação de
// propósito: é a URL pública que fica no anúncio.
//
// "Modo neutro": o Meta Ads rastreia o destino do link antes de aceitar o
// anúncio e, se detectar que é um redirect pro WhatsApp, recusa o formato
// "Website" e força "Conversar no WhatsApp". Pra contornar isso, cada rota
// tem um modo configurável (padrão "grupo"): em "neutro" ela serve uma
// página comum, sem redirecionar — dá pra publicar o anúncio nesse modo e
// só depois trocar pra "grupo" pelo painel (aba Configurações), sem
// precisar mexer no link já cadastrado no anúncio.
function paginaNeutraDeAds() {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Workshop Vagas Internacionais</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1115;color:#eaeaea;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px}
.box{max-width:420px}
h1{font-size:22px;margin:0 0 12px}
p{color:#9aa0a6;line-height:1.5}</style></head>
<body><div class="box">
<h1>Inscrição recebida ✅</h1>
<p>Você garantiu sua vaga no Workshop Vagas Internacionais. Em breve você vai receber o acesso.</p>
</div></body></html>`;
}

app.get("/r/ao-vivo-oficial", (_req, res) => {
  if (lerConfiguracao("redirect_ao_vivo_modo", "grupo") === "neutro") {
    res.set("Content-Type", "text/html; charset=utf-8").send(paginaNeutraDeAds());
    return;
  }
  const grupo = grupoAoVivoVigente();
  if (!grupo || !grupo.link) {
    console.error("[redirect] /r/ao-vivo-oficial sem grupo Ativo com link — não deu pra redirecionar");
    res.status(503).send("Estamos preparando o grupo do Workshop Ao Vivo. Tente novamente em alguns minutos.");
    return;
  }
  res.redirect(302, grupo.link);
});

app.get("/r/ao-vivo-2", (_req, res) => {
  if (lerConfiguracao("redirect_ao_vivo_2_modo", "grupo") === "neutro") {
    res.set("Content-Type", "text/html; charset=utf-8").send(paginaNeutraDeAds());
    return;
  }
  const grupo = grupoVigente();
  if (!grupo || !grupo.link) {
    console.error("[redirect] /r/ao-vivo-2 sem grupo Ativo com link — não deu pra redirecionar");
    res.status(503).send("Estamos preparando o grupo do Workshop. Tente novamente em alguns minutos.");
    return;
  }
  res.redirect(302, grupo.link);
});

app.post("/api/login", (req, res) => {
  const { user, password } = req.body ?? {};
  if (!USER || !PASSWORD) return res.status(500).json({ error: "Login não configurado no servidor." });
  if (user === USER && password === PASSWORD) {
    const token = createSessionToken(user);
    res.setHeader("Set-Cookie", `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`);
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Usuário ou senha incorretos." });
});

app.post("/api/logout", (_req, res) => {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
  res.json({ ok: true });
});

if (USER && PASSWORD) {
  app.use((req, res, next) => {
    if (req.path === "/login.html" || req.path.startsWith("/api/login")) return next();
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[COOKIE_NAME];
    const session = token && verifySessionToken(token);
    if (session) return next();
    if (req.path.startsWith("/api/")) return res.status(401).json({ error: "Não autenticado." });
    res.redirect("/login.html");
  });
} else {
  console.warn("[server] BASIC_AUTH_USER/BASIC_AUTH_PASSWORD não configurados — painel sem autenticação!");
}

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/me", (req, res) => {
  const cookies = parseCookies(req.headers.cookie);
  const session = verifySessionToken(cookies[COOKIE_NAME] ?? "");
  res.json({ user: session?.user ?? (USER && PASSWORD ? null : "sem-login") });
});

app.get("/api/grupo-modelo", (_req, res) => {
  res.json({ modelo: lerModeloCompleto() });
});

app.put("/api/grupo-modelo", (req, res) => {
  const { nome, imagemUrl, descricao, audioUrl } = req.body ?? {};
  if (!nome) return res.status(400).json({ error: "Campo 'nome' é obrigatório." });
  definirModeloDoGrupo({ nome, imagemUrl, descricao, audioUrl });
  res.json({ ok: true });
});

app.get("/api/arvore-grupos", (_req, res) => {
  res.json({ grupos: listarArvoreDeGrupos() });
});

// Cadastro manual: usado quando um grupo foi criado direto no WhatsApp
// (fora do fluxo "Criar o Grupo") e precisa entrar na árvore pra receber
// os disparos. Faz upsert pelo id — também serve pra corrigir nome/link/
// status de um grupo já cadastrado.
app.post("/api/arvore-grupos", (req, res) => {
  const { groupId, nome, link, status } = req.body ?? {};
  if (!groupId) return res.status(400).json({ error: "Campo 'groupId' é obrigatório." });
  if (status && !["Ativo", "Pendente", "Inativo"].includes(status)) {
    return res.status(400).json({ error: "Campo 'status' precisa ser Ativo, Pendente ou Inativo." });
  }
  adicionarNaArvoreDeGrupos({ groupId, nome: nome || groupId, link: link || null, status: status || "Ativo" });
  res.json({ ok: true });
});

app.put("/api/arvore-grupos/:id/status", (req, res) => {
  const grupo = buscarGrupoPorId(req.params.id);
  if (!grupo) return res.status(404).json({ error: "Grupo não encontrado." });
  const { status } = req.body ?? {};
  if (!["Ativo", "Pendente", "Inativo"].includes(status)) {
    return res.status(400).json({ error: "Campo 'status' precisa ser Ativo, Pendente ou Inativo." });
  }
  adicionarNaArvoreDeGrupos({ groupId: grupo.id, nome: grupo.nome, link: grupo.link, status });
  res.json({ ok: true });
});

app.get("/api/fluxos", (_req, res) => {
  const lista = FLUXOS.map((f) => {
    const cronAtual = lerCronDoFluxo(f.chave, f.cronPadrao);
    return {
      chave: f.chave,
      nome: f.nome,
      dia: f.dia,
      trilha: f.trilha || "gravado",
      quando: cronParaTexto(cronAtual),
      editavel: f.defaults !== null,
      ativo: lerAtivoDoFluxo(f.chave),
      ultimaExecucao: ultimaExecucaoPorFluxo(f.chave) ?? null,
    };
  });
  res.json({ fluxos: lista });
});

app.post("/api/fluxos/:chave/executar", async (req, res) => {
  const fluxo = FLUXOS.find((f) => f.chave === req.params.chave);
  if (!fluxo) return res.status(404).json({ error: "Fluxo não encontrado." });
  try {
    const resultado = await executarFluxo(fluxo, "manual");
    res.json({ ok: true, ...resultado });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Liga/desliga o disparo automático de um fluxo (não afeta "Executar agora").
app.put("/api/fluxos/:chave/ativo", (req, res) => {
  const fluxo = FLUXOS.find((f) => f.chave === req.params.chave);
  if (!fluxo) return res.status(404).json({ error: "Fluxo não encontrado." });
  const { ativo } = req.body ?? {};
  if (typeof ativo !== "boolean") return res.status(400).json({ error: "Campo 'ativo' precisa ser true ou false." });
  salvarAtivoDoFluxo(fluxo.chave, ativo);
  res.json({ ok: true, ativo });
});

// Campos de mensagem + horário editáveis de um fluxo.
app.get("/api/fluxos/:chave/editar", (req, res) => {
  const fluxo = FLUXOS.find((f) => f.chave === req.params.chave);
  if (!fluxo) return res.status(404).json({ error: "Fluxo não encontrado." });
  if (!fluxo.defaults) return res.status(400).json({ error: "Este fluxo não tem conteúdo editável (usa o molde do grupo)." });
  res.json({
    campos: lerCamposDoFluxo(fluxo.chave, fluxo.defaults),
    cron: lerCronDoFluxo(fluxo.chave, fluxo.cronPadrao),
  });
});

app.put("/api/fluxos/:chave/editar", (req, res) => {
  const fluxo = FLUXOS.find((f) => f.chave === req.params.chave);
  if (!fluxo) return res.status(404).json({ error: "Fluxo não encontrado." });
  const { campos, cron: novoCron } = req.body ?? {};
  if (campos && fluxo.defaults) salvarCamposDoFluxo(fluxo.chave, campos);
  if (novoCron) {
    salvarCronDoFluxo(fluxo.chave, novoCron);
    agendarFluxo(fluxo);
  }
  res.json({ ok: true });
});

// Link da live: um lugar só que atualiza todo fluxo que referencia
// {{link}} na mensagem.
app.get("/api/config/link-da-live", (_req, res) => {
  res.json({ link: lerConfiguracao("link_da_live", LINK_DA_LIVE_PADRAO) });
});

app.put("/api/config/link-da-live", (req, res) => {
  const { link } = req.body ?? {};
  if (!link) return res.status(400).json({ error: "Campo 'link' é obrigatório." });
  definirConfiguracao("link_da_live", link);
  res.json({ ok: true });
});

// Link do replay: usado nas mensagens de sexta-feira ({{replay}}).
app.get("/api/config/link-replay", (_req, res) => {
  res.json({ link: lerConfiguracao("link_replay", LINK_REPLAY_PADRAO) });
});

app.put("/api/config/link-replay", (req, res) => {
  const { link } = req.body ?? {};
  if (!link) return res.status(400).json({ error: "Campo 'link' é obrigatório." });
  definirConfiguracao("link_replay", link);
  res.json({ ok: true });
});

// Consulta a Evolution API na hora e atualiza a contagem de participantes
// guardada pra esse grupo (sob demanda — nenhum fluxo automático chama isso
// pros grupos ainda ativos, só o de sábado quando o grupo é encerrado).
app.post("/api/arvore-grupos/:id/atualizar-participantes", async (req, res) => {
  const grupo = buscarGrupoPorId(req.params.id);
  if (!grupo) return res.status(404).json({ error: "Grupo não encontrado." });
  try {
    const participantes = await buscarParticipantesDoGrupo({ groupJid: grupo.id });
    atualizarParticipantesDoGrupo(grupo.id, participantes.length);
    res.json({ ok: true, participantes: participantes.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ===== Trilha Ao Vivo — molde, árvore de grupos e link, tudo separado do Gravado =====

app.get("/api/grupo-modelo-ao-vivo", (_req, res) => {
  res.json({ modelo: lerModeloCompletoAoVivo() });
});

app.put("/api/grupo-modelo-ao-vivo", (req, res) => {
  const { nome, imagemUrl, descricao, audioUrl } = req.body ?? {};
  if (!nome) return res.status(400).json({ error: "Campo 'nome' é obrigatório." });
  definirModeloDoGrupoAoVivo({ nome, imagemUrl, descricao, audioUrl });
  res.json({ ok: true });
});

app.get("/api/arvore-grupos-ao-vivo", (_req, res) => {
  res.json({ grupos: listarArvoreDeGruposAoVivo() });
});

app.post("/api/arvore-grupos-ao-vivo", (req, res) => {
  const { groupId, nome, link, status } = req.body ?? {};
  if (!groupId) return res.status(400).json({ error: "Campo 'groupId' é obrigatório." });
  if (status && !["Ativo", "Pendente", "Inativo"].includes(status)) {
    return res.status(400).json({ error: "Campo 'status' precisa ser Ativo, Pendente ou Inativo." });
  }
  adicionarNaArvoreDeGruposAoVivo({ groupId, nome: nome || groupId, link: link || null, status: status || "Ativo" });
  res.json({ ok: true });
});

app.put("/api/arvore-grupos-ao-vivo/:id/status", (req, res) => {
  const grupo = buscarGrupoAoVivoPorId(req.params.id);
  if (!grupo) return res.status(404).json({ error: "Grupo não encontrado." });
  const { status } = req.body ?? {};
  if (!["Ativo", "Pendente", "Inativo"].includes(status)) {
    return res.status(400).json({ error: "Campo 'status' precisa ser Ativo, Pendente ou Inativo." });
  }
  adicionarNaArvoreDeGruposAoVivo({ groupId: grupo.id, nome: grupo.nome, link: grupo.link, status });
  res.json({ ok: true });
});

app.put("/api/arvore-grupos-ao-vivo/:id/link-override", (req, res) => {
  const grupo = buscarGrupoAoVivoPorId(req.params.id);
  if (!grupo) return res.status(404).json({ error: "Grupo não encontrado." });
  const { link } = req.body ?? {};
  definirLinkOverrideAoVivo(req.params.id, link);
  res.json({ ok: true });
});

app.post("/api/arvore-grupos-ao-vivo/:id/atualizar-participantes", async (req, res) => {
  const grupo = buscarGrupoAoVivoPorId(req.params.id);
  if (!grupo) return res.status(404).json({ error: "Grupo não encontrado." });
  try {
    const participantes = await buscarParticipantesDoGrupo({ groupJid: grupo.id });
    atualizarParticipantesDoGrupoAoVivo(grupo.id, participantes.length);
    res.json({ ok: true, participantes: participantes.length });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/api/config/link-ao-vivo", (_req, res) => {
  res.json({ link: lerConfiguracao("link_ao_vivo", LINK_AO_VIVO_PADRAO) });
});

app.put("/api/config/link-ao-vivo", (req, res) => {
  const { link } = req.body ?? {};
  if (!link) return res.status(400).json({ error: "Campo 'link' é obrigatório." });
  definirConfiguracao("link_ao_vivo", link);
  res.json({ ok: true });
});

// Modo dos links de redirect (/r/ao-vivo e /r/ao-vivo-2) usados no tráfego
// pago — "grupo" (padrão) redireciona pro grupo vigente de verdade,
// "neutro" serve uma página comum, pra passar pela verificação de link do
// Meta Ads antes de trocar de volta.
app.get("/api/config/redirect-modo", (_req, res) => {
  res.json({
    aoVivo: lerConfiguracao("redirect_ao_vivo_modo", "grupo"),
    aoVivo2: lerConfiguracao("redirect_ao_vivo_2_modo", "grupo"),
  });
});

app.put("/api/config/redirect-modo", (req, res) => {
  const { rota, modo } = req.body ?? {};
  if (!["ao-vivo", "ao-vivo-2"].includes(rota)) {
    return res.status(400).json({ error: "Campo 'rota' precisa ser 'ao-vivo' ou 'ao-vivo-2'." });
  }
  if (!["grupo", "neutro"].includes(modo)) {
    return res.status(400).json({ error: "Campo 'modo' precisa ser 'grupo' ou 'neutro'." });
  }
  definirConfiguracao(rota === "ao-vivo" ? "redirect_ao_vivo_modo" : "redirect_ao_vivo_2_modo", modo);
  res.json({ ok: true });
});

// Modo da campanha "Live 1" — "producao" (padrão) manda pros 28 grupos
// reais da nina_web3; "teste" manda só pro grupo "Teste Mensagens Novas",
// pra validar entrega antes de disparar pros grupos de lead de verdade.
app.get("/api/config/live1-modo", (_req, res) => {
  res.json({ modo: lerConfiguracao("live1_modo", "producao") });
});

app.put("/api/config/live1-modo", (req, res) => {
  const { modo } = req.body ?? {};
  if (!["producao", "teste"].includes(modo)) {
    return res.status(400).json({ error: "Campo 'modo' precisa ser 'producao' ou 'teste'." });
  }
  definirConfiguracao("live1_modo", modo);
  res.json({ ok: true });
});

// Base de grupos levantada pra Black Friday — só controle/visualização.
// Snapshot estático (não chama a Evolution API), read-only: sem rota de
// escrita aqui, nenhum envio de mensagem nem alteração de grupo.
app.get("/api/grupos-black-friday", (_req, res) => {
  res.json({ grupos: listarGruposBlackFriday(), resumo: resumoInstanciasBlackFriday() });
});

app.get("/api/execucoes", (req, res) => {
  const limit = Number(req.query.limit) || 30;
  res.json({ execucoes: listarExecucoes(limit) });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Carreira Global Automation rodando em http://localhost:${PORT}`);
});
