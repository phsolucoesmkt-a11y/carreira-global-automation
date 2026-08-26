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
import { executarEHoje, executar14h, executar17h, executar22h05Encerramento, executar23h } from "./flows/quintaFeira.js";
import {
  executarUltimaChance,
  executarAvisoExtensao,
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
import { lerModeloCompleto, definirModeloDoGrupo, listarArvoreDeGrupos, buscarGrupoPorId, atualizarParticipantesDoGrupo, adicionarNaArvoreDeGrupos } from "./services/gruposStore.js";
import { buscarParticipantesDoGrupo } from "./services/evolution.js";
import { registrarExecucao, listarExecucoes, ultimaExecucaoPorFluxo } from "./services/execucoes.js";
import { createSessionToken, verifySessionToken, parseCookies } from "./services/session.js";
import { lerCamposDoFluxo, salvarCamposDoFluxo, lerCronDoFluxo, salvarCronDoFluxo, lerAtivoDoFluxo, salvarAtivoDoFluxo, lerConfiguracao, definirConfiguracao } from "./services/config.js";
import { LINK_DA_LIVE_PADRAO, LINK_REPLAY_PADRAO } from "./services/linkDaLive.js";
import { cronParaTexto } from "./services/cronTexto.js";

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
} from "./services/gruposStoreAoVivo.js";
import { LINK_AO_VIVO_PADRAO } from "./services/linkAoVivo.js";

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
  { chave: "22h05-encerramento", nome: "Encerramos o Workshop (22h05)", dia: "Quinta-feira", cronPadrao: "5 22 * * 4", executar: () => executar22h05Encerramento(), defaults: TEXTOS_PADRAO["22h05-encerramento"] },
  { chave: "23h-fim-do-dia", nome: "Fim do dia (23h)", dia: "Quinta-feira", cronPadrao: "5 23 * * 4", executar: () => executar23h(), defaults: TEXTOS_PADRAO["23h-fim-do-dia"] },
  { chave: "sexta-ultima-chance", nome: "Sexta — Renomeia 'Última chance'", dia: "Sexta-feira", cronPadrao: "11 10 * * 5", executar: () => executarUltimaChance(), defaults: TEXTOS_PADRAO["sexta-ultima-chance"] },
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
  { chave: "aovivo-22h05-encerramento", nome: "Ao Vivo — Encerramos o Workshop (22h05)", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "5 22 * * 3", executar: () => executar22h05EncerramentoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-22h05-encerramento"] },
  { chave: "aovivo-fim-do-dia", nome: "Ao Vivo — Fim do dia (23h05)", dia: "Quarta-feira", trilha: "ao-vivo", cronPadrao: "5 23 * * 3", executar: () => executarFimDoDiaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-fim-do-dia"] },
  { chave: "aovivo-aviso-extensao", nome: "Ao Vivo — Aviso de extensão (manhã)", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "12 10 * * 4", executar: () => executarAvisoExtensaoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-aviso-extensao"] },
  { chave: "aovivo-13h", nome: "Ao Vivo — Lembrete 13h", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 13 * * 4", executar: () => executar13hAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-13h"] },
  { chave: "aovivo-conta-rapida", nome: "Ao Vivo — Conta rápida (tarde)", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "15 15 * * 4", executar: () => executarContaRapidaAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-conta-rapida"] },
  { chave: "aovivo-17h", nome: "Ao Vivo — Lembrete 17h", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 17 * * 4", executar: () => executar17hAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-17h"] },
  { chave: "aovivo-ultima-mensagem", nome: "Ao Vivo — Última mensagem (noite)", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 19 * * 4", executar: () => executarUltimaMensagemAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-ultima-mensagem"] },
  { chave: "aovivo-22h", nome: "Ao Vivo — Lembrete 22h", dia: "Quinta-feira", trilha: "ao-vivo", cronPadrao: "0 22 * * 4", executar: () => executar22hAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-22h"] },
  { chave: "aovivo-grupo-encerrado", nome: "Ao Vivo — Grupo encerrado (renomeia)", dia: "Sexta-feira", trilha: "ao-vivo", cronPadrao: "15 8 * * 5", executar: () => executarGrupoEncerradoAoVivo(), defaults: TEXTOS_AO_VIVO_PADRAO["aovivo-grupo-encerrado"] },
  { chave: "aovivo-checa-lotacao", nome: "Ao Vivo — Checa lotação (a cada 30min)", dia: "Contínuo", trilha: "ao-vivo", cronPadrao: "*/30 * * * *", executar: () => executarChecaLotacaoAoVivo(), defaults: null },
];

async function executarFluxo(fluxo, origem) {
  try {
    const resultado = await fluxo.executar();
    registrarExecucao({ fluxo: fluxo.chave, origem, status: "sucesso", detalhe: resultado });
    console.log(`[${origem}] ${fluxo.chave} executado com sucesso`);
    return resultado;
  } catch (err) {
    registrarExecucao({ fluxo: fluxo.chave, origem, status: "erro", detalhe: { error: err.message } });
    console.error(`[${origem}] falha ao executar ${fluxo.chave}:`, err.message);
    throw err;
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

app.get("/api/execucoes", (req, res) => {
  const limit = Number(req.query.limit) || 30;
  res.json({ execucoes: listarExecucoes(limit) });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Carreira Global Automation rodando em http://localhost:${PORT}`);
});
