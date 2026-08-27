import { atualizarNomeDoGrupo, enviarTexto, buscarParticipantesDoGrupo } from "../../services/evolution.js";
import {
  gruposAtivosAoVivo,
  atualizarParticipantesDoGrupoAoVivo,
  marcarGrupoAoVivoInativo,
  promoverGruposPendentesAoVivo,
} from "../../services/gruposStoreAoVivo.js";
import { lerCamposDoFluxo, lerConfiguracao } from "../../services/config.js";
import { LINK_AO_VIVO_PADRAO } from "../../services/linkAoVivo.js";
import { TEXTOS_AO_VIVO_PADRAO } from "../textosAoVivoPadrao.js";

// Espelha o workflow "Dia Seguinte 'uma notícia que eu NÃO esperava dar.'"
// (Ao Vivo, confirmado ativo no n8n) — 3 mensagens na quinta (dia depois
// do evento de quarta) + 1 renomeio na sexta de manhã encerrando de vez.
// O n8n original tinha 2 pedaços desconectados (nó "Última chance" e um
// "Boa noite, suporte encerrando" — nenhum dos dois tinha gatilho ligado,
// nunca disparavam de verdade) — não replicados aqui por não fazerem
// parte do fluxo real.

// `grupo.link_override`, se definido, sobrescreve o link_ao_vivo global
// só pra esse grupo específico (usado em testes pontuais).
function montarMensagem(template, grupo) {
  const link = grupo?.link_override || lerConfiguracao("link_ao_vivo", LINK_AO_VIVO_PADRAO);
  return template.replaceAll("{{link}}", link);
}

async function executarMensagem(chave, log) {
  const campos = lerCamposDoFluxo(chave, TEXTOS_AO_VIVO_PADRAO[chave]);
  const grupos = gruposAtivosAoVivo();

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[${chave}] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    const mensagem = montarMensagem(campos.mensagem, grupo);
    await enviarTexto({ remoteJid: grupo.id, texto: mensagem });
    registrar(`2. Mensagem enviada (${grupo.nome ?? grupo.id})`, grupo.link_override ? { linkUsado: "override" } : undefined);
  }

  return { totalGrupos: grupos.length, passos };
}

export const executarAvisoExtensaoAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-aviso-extensao", log);
export const executar13hAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-13h", log);
export const executarContaRapidaAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-conta-rapida", log);
export const executar17hAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-17h", log);
export const executarUltimaMensagemAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-ultima-mensagem", log);
export const executar22hAoVivo = ({ log = console.log } = {}) => executarMensagem("aovivo-22h", log);

// Sexta 08h15: espelha o "sábado grupo encerrado" do Gravado — um dia
// depois do último lembrete (quinta), fecha de vez o(s) grupo(s) ainda
// Ativo(s): renomeia, conta os participantes finais e marca Inativo.
// Antes disso era o "Fim do dia" de quarta que fechava o grupo, mas isso
// deixava os lembretes de quinta (13h/17h/22h etc.) sem nenhum grupo Ativo
// pra mandar mensagem — corrigido pra seguir o mesmo padrão do Gravado.
export async function executarGrupoEncerradoAoVivo({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo("aovivo-grupo-encerrado", TEXTOS_AO_VIVO_PADRAO["aovivo-grupo-encerrado"]);
  const grupos = gruposAtivosAoVivo();

  const passos = [];
  const registrar = (passo, dados) => {
    passos.push({ passo, dados });
    log(`[aovivo-grupo-encerrado] ${passo}`, dados ?? "");
  };
  registrar("1. Grupos ativos encontrados", { total: grupos.length });

  for (const grupo of grupos) {
    await atualizarNomeDoGrupo({ groupJid: grupo.id, nome: campos.prefixoNome });
    let totalParticipantes = null;
    try {
      const participantes = await buscarParticipantesDoGrupo({ groupJid: grupo.id });
      totalParticipantes = participantes.length;
      atualizarParticipantesDoGrupoAoVivo(grupo.id, totalParticipantes);
    } catch (err) {
      registrar(`2b. Falha ao contar participantes (${grupo.nome ?? grupo.id})`, { erro: err.message });
    }
    marcarGrupoAoVivoInativo(grupo.id);
    registrar(`2. Grupo encerrado e marcado como Inativo (${grupo.nome ?? grupo.id})`, { novoNome: campos.prefixoNome, participantes: totalParticipantes });
  }

  const promovidos = promoverGruposPendentesAoVivo();
  if (promovidos.length > 0) {
    registrar("3. Grupo(s) Pendente(s) promovido(s) a Ativo — já criados com antecedência, agora entram nos disparos", {
      grupos: promovidos.map((g) => g.nome ?? g.id),
    });
  }

  return { totalGrupos: grupos.length, passos };
}
