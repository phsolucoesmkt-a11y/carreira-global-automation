import {
  criarGrupo as evoCriarGrupo,
  atualizarImagemDoGrupo,
  definirConfiguracaoDoGrupo,
  buscarLinkDeConvite,
  atualizarParticipantes,
} from "../services/evolution.js";
import { lerModeloDoGrupo, gravarResultadoNoModelo, adicionarNaArvoreDeGrupos } from "../services/gruposStore.js";

// Número usado só pra viabilizar a criação do grupo (o WhatsApp exige
// pelo menos 1 participante) — mesmo número fixo do fluxo original no n8n.
const PARTICIPANTE_INICIAL = "+5491127807405";

// Sempre adicionados como admin em todo grupo criado — manual ou automático.
const ADMINS_PADRAO = ["+5511997921913", "+5511934601392"]; // Alexandre e Matheus

function normalizarNumero(numero) {
  return numero.replace(/[^\d]/g, "");
}

// Replica passo a passo o fluxo "Criar o Grupo Automaticamente" (Gravado,
// Página1): lê o molde -> cria grupo -> adiciona admins extras -> foto ->
// só admin manda -> só admin edita -> link de convite -> grava link+id de
// volta no molde -> marca Ativo na árvore de grupos.
// Diferença do original no n8n: molde e árvore de grupos agora vivem no
// banco local (SQLite), não mais no Google Sheets. O molde é reaproveitado
// toda vez (nome/imagem/descrição fixos), só link e id do grupo mudam —
// igual o usuário mantém a planilha manualmente hoje.
export async function executarCriarGrupo({ log = console.log, adminsParaAdicionar = [] } = {}) {
  const numerosUnicos = new Set([...ADMINS_PADRAO, ...adminsParaAdicionar].map(normalizarNumero));
  const admins = [...numerosUnicos];

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[criar-grupo] ${passo}`, dados ?? "");
  };

  const modelo = lerModeloDoGrupo();
  registrar("1. Lido o molde do grupo (Página1)", modelo);

  const grupo = await evoCriarGrupo({
    nome: modelo.nome,
    descricao: modelo.descricao,
    participanteInicial: PARTICIPANTE_INICIAL,
  });
  const groupId = grupo?.data?.id ?? grupo?.id;
  if (!groupId) throw new Error(`Evolution API não retornou o id do grupo criado: ${JSON.stringify(grupo)}`);
  registrar("2. Grupo criado", { groupId });

  await atualizarParticipantes({ groupJid: groupId, action: "add", participantes: admins });
  await atualizarParticipantes({ groupJid: groupId, action: "promote", participantes: admins });
  registrar("2b. Admins adicionados e promovidos", { admins });

  if (modelo.imagem) {
    await atualizarImagemDoGrupo({ groupJid: groupId, imagemUrl: modelo.imagem });
    registrar("3. Foto do grupo atualizada");
  } else {
    registrar("3. Sem imagem configurada, pulando");
  }

  await definirConfiguracaoDoGrupo({ groupJid: groupId, action: "announcement" });
  registrar("4. Configurado: só admin manda mensagem");

  await definirConfiguracaoDoGrupo({ groupJid: groupId, action: "locked" });
  registrar("5. Configurado: só admin edita configurações");

  const invite = await buscarLinkDeConvite({ groupJid: groupId });
  const inviteUrl = invite?.inviteUrl;
  registrar("6. Link de convite obtido", { inviteUrl });

  gravarResultadoNoModelo({ groupId, inviteUrl });
  registrar("7. Link e id gravados de volta no molde (banco local)");

  adicionarNaArvoreDeGrupos({ groupId, nome: modelo.nome, link: inviteUrl });
  registrar("8. Grupo adicionado como Ativo na árvore de grupos (banco local)");

  return { groupId, inviteUrl, passos };
}
