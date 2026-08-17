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
import { executarEHoje, executar14h, executar17h, executar23h } from "./flows/quintaFeira.js";
import {
  executarUltimaChance,
  executarAvisoExtensao,
  executarContaRapida,
  executarUltimaMensagem,
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
import { lerModeloCompleto, definirModeloDoGrupo, listarArvoreDeGrupos } from "./services/gruposStore.js";
import { registrarExecucao, listarExecucoes, ultimaExecucaoPorFluxo } from "./services/execucoes.js";
import { createSessionToken, verifySessionToken, parseCookies } from "./services/session.js";
import { lerCamposDoFluxo, salvarCamposDoFluxo, lerCronDoFluxo, salvarCronDoFluxo, lerConfiguracao, definirConfiguracao } from "./services/config.js";
import { LINK_DA_LIVE_PADRAO, LINK_REPLAY_PADRAO } from "./services/linkDaLive.js";
import { cronParaTexto } from "./services/cronTexto.js";

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
  { chave: "criar-grupo", nome: "Criar o Grupo", cronPadrao: "50 18 * * 1", executar: () => executarCriarGrupo({}), defaults: null },
  { chave: "seja-bem-vindo", nome: "Seja Bem Vindo", cronPadrao: "0 20 * * 2", executar: () => executarSejaBemVindo(), defaults: TEXTOS_PADRAO["seja-bem-vindo"] },
  { chave: "e-amanha", nome: "É Amanhã (enquete EUA)", cronPadrao: "0 11 * * 3", executar: () => executarEAmanha(), defaults: TEXTOS_PADRAO["e-amanha"] },
  { chave: "audio-nina", nome: "Áudio da Nina", cronPadrao: "0 18 * * 3", executar: () => executarAudioNina(), defaults: TEXTOS_PADRAO["audio-nina"] },
  { chave: "2-horas", nome: "Faltam 2 horas", cronPadrao: "0 18 * * 4", executar: () => executar2Horas(), defaults: TEXTOS_PADRAO["2-horas"] },
  { chave: "1-hora", nome: "Falta 1 hora", cronPadrao: "0 19 * * 4", executar: () => executar1Hora(), defaults: TEXTOS_PADRAO["1-hora"] },
  { chave: "10-minutos", nome: "Faltam 10 minutos", cronPadrao: "50 19 * * 4", executar: () => executar10Minutos(), defaults: TEXTOS_PADRAO["10-minutos"] },
  { chave: "estamos-ao-vivo", nome: "Estamos ao vivo", cronPadrao: "1 20 * * 4", executar: () => executarEstamosAoVivo(), defaults: TEXTOS_PADRAO["estamos-ao-vivo"] },
  { chave: "e-hoje", nome: "É Hoje", cronPadrao: "0 11 * * 4", executar: () => executarEHoje(), defaults: TEXTOS_PADRAO["e-hoje"] },
  { chave: "14h", nome: "Mensagem das 14h", cronPadrao: "0 14 * * 4", executar: () => executar14h(), defaults: TEXTOS_PADRAO["14h"] },
  { chave: "17h", nome: "Mensagem das 17h", cronPadrao: "0 17 * * 4", executar: () => executar17h(), defaults: TEXTOS_PADRAO["17h"] },
  { chave: "durante-live-20h10", nome: "Durante a Live — 20h10", cronPadrao: "12 20 * * 4", executar: () => executar20h10(), defaults: TEXTOS_PADRAO["durante-live-20h10"] },
  { chave: "durante-live-20h20", nome: "Durante a Live — 20h20", cronPadrao: "22 20 * * 4", executar: () => executar20h20(), defaults: TEXTOS_PADRAO["durante-live-20h20"] },
  { chave: "durante-live-20h30", nome: "Durante a Live — 20h30", cronPadrao: "30 20 * * 4", executar: () => executar20h30(), defaults: TEXTOS_PADRAO["durante-live-20h30"] },
  { chave: "durante-live-20h40", nome: "Durante a Live — 20h40", cronPadrao: "40 20 * * 4", executar: () => executar20h40(), defaults: TEXTOS_PADRAO["durante-live-20h40"] },
  { chave: "durante-live-20h50", nome: "Durante a Live — 20h50", cronPadrao: "50 20 * * 4", executar: () => executar20h50(), defaults: TEXTOS_PADRAO["durante-live-20h50"] },
  { chave: "durante-live-carrinho-aberto", nome: "Durante a Live — Carrinho aberto", cronPadrao: "54 20 * * 4", executar: () => executarCarrinhoAberto(), defaults: TEXTOS_PADRAO["durante-live-carrinho-aberto"] },
  { chave: "durante-live-garantindo-vaga", nome: "Durante a Live — Já tem gente garantindo vaga", cronPadrao: "3 21 * * 4", executar: () => executarGarantindoVaga(), defaults: TEXTOS_PADRAO["durante-live-garantindo-vaga"] },
  { chave: "23h-fim-do-dia", nome: "Fim do dia (23h)", cronPadrao: "5 23 * * 4", executar: () => executar23h(), defaults: TEXTOS_PADRAO["23h-fim-do-dia"] },
  { chave: "sexta-ultima-chance", nome: "Sexta — Renomeia 'Última chance'", cronPadrao: "11 10 * * 5", executar: () => executarUltimaChance(), defaults: TEXTOS_PADRAO["sexta-ultima-chance"] },
  { chave: "sexta-aviso-extensao", nome: "Sexta — Aviso de extensão (manhã)", cronPadrao: "12 10 * * 5", executar: () => executarAvisoExtensao(), defaults: TEXTOS_PADRAO["sexta-aviso-extensao"] },
  { chave: "sexta-conta-rapida", nome: "Sexta — Conta rápida (tarde)", cronPadrao: "0 15 * * 5", executar: () => executarContaRapida(), defaults: TEXTOS_PADRAO["sexta-conta-rapida"] },
  { chave: "sexta-ultima-mensagem", nome: "Sexta — Última mensagem (noite)", cronPadrao: "5 19 * * 5", executar: () => executarUltimaMensagem(), defaults: TEXTOS_PADRAO["sexta-ultima-mensagem"] },
  { chave: "sabado-grupo-encerrado", nome: "Sábado — Grupo encerrado", cronPadrao: "15 8 * * 6", executar: () => executarGrupoEncerrado(), defaults: TEXTOS_PADRAO["sabado-grupo-encerrado"] },
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
  const tarefa = cron.schedule(expressao, () => executarFluxo(fluxo, "automatico"), { timezone: "America/Sao_Paulo" });
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

app.get("/api/fluxos", (_req, res) => {
  const lista = FLUXOS.map((f) => {
    const cronAtual = lerCronDoFluxo(f.chave, f.cronPadrao);
    return {
      chave: f.chave,
      nome: f.nome,
      quando: cronParaTexto(cronAtual),
      editavel: f.defaults !== null,
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

app.get("/api/execucoes", (req, res) => {
  const limit = Number(req.query.limit) || 30;
  res.json({ execucoes: listarExecucoes(limit) });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Carreira Global Automation rodando em http://localhost:${PORT}`);
});
