import {
  criarGrupo as evoCriarGrupo,
  atualizarImagemDoGrupo,
  definirConfiguracaoDoGrupo,
  buscarLinkDeConvite,
  atualizarParticipantes,
} from "../../services/evolution.js";
import {
  lerModeloDoGrupoAoVivo,
  gravarResultadoNoModeloAoVivo,
  adicionarNaArvoreDeGruposAoVivo,
  buscarGrupoPendenteAoVivo,
  existeGrupoAtivoAoVivo,
} from "../../services/gruposStoreAoVivo.js";

// Mesmo número fixo usado pelo Gravado, só pra viabilizar a criação do
// grupo (o WhatsApp exige pelo menos 1 participante).
const PARTICIPANTE_INICIAL = "+5491127807405";

// Admins: Nina e Pedro confirmados no fluxo real do n8n ("Criar o Grupo
// Automaticamente" — Ao Vivo). Matheus usa o mesmo número já validado no
// Gravado — o número antigo salvo no fluxo do Ao Vivo (DDD 41) estava
// dando "forbidden" ao promover, provavelmente desatualizado.
const ADMINS_PADRAO = ["+5511989790926", "+5511934601392", "+5511997921913"];

function normalizarNumero(numero) {
  return numero.replace(/[^\d]/g, "");
}

// Espelha o fluxo real "Criar o Grupo Automaticamente" do n8n (trilha Ao
// Vivo, confirmado ativo). `criadoPorLotacaoDe` é passado quando este
// grupo nasce porque o grupo anterior transbordou (951+ participantes) —
// nesse caso ele já nasce Ativo mesmo com outro grupo ainda ativo, porque
// os dois precisam receber os disparos ao mesmo tempo.
export async function executarCriarGrupoAoVivo({ log = console.log, criadoPorLotacaoDe = null } = {}) {
  const admins = [...new Set(ADMINS_PADRAO.map(normalizarNumero))];

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-criar-grupo] ${passo}`, dados ?? "");
  };

  if (!criadoPorLotacaoDe && (await buscarGrupoPendenteAoVivo())) {
    throw new Error(
      "Já existe um grupo Ao Vivo Pendente aguardando ativação. Ele vira Ativo sozinho quando o grupo atual for encerrado."
    );
  }
  const statusInicial = criadoPorLotacaoDe ? "Ativo" : existeGrupoAtivoAoVivo() ? "Pendente" : "Ativo";

  const modelo = lerModeloDoGrupoAoVivo();
  registrar("1. Lido o molde do grupo Ao Vivo", modelo);

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

  gravarResultadoNoModeloAoVivo({ groupId, inviteUrl });
  registrar("7. Link e id gravados de volta no molde (banco local)");

  adicionarNaArvoreDeGruposAoVivo({ groupId, nome: modelo.nome, link: inviteUrl, status: statusInicial, criadoPorLotacaoDe });
  registrar(
    statusInicial === "Ativo"
      ? "8. Grupo adicionado como Ativo na árvore Ao Vivo — já entra nos disparos"
      : "8. Grupo adicionado como Pendente na árvore Ao Vivo — já existe outro Ativo; este só entra nos disparos quando o atual for encerrado"
  );

  return { groupId, inviteUrl, status: statusInicial, passos };
}
