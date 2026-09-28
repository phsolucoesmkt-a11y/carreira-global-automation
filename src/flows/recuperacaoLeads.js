import { db } from "../db.js";
import { lerCamposDoFluxo } from "../services/config.js";
import { buscarLeadsDoForm } from "../services/metaLeads.js";
import { enviarTemplate } from "../services/whatsappCloud.js";
import { primeiroNome } from "../services/telefone.js";
import { TRILHAS_RECUPERACAO, gruposAtivosDaTrilha, chavesDeMembros, statusDaSincronizacao } from "../services/membrosStore.js";
import { TEXTOS_RECUPERACAO_PADRAO } from "./textosRecuperacaoPadrao.js";

export const CHAVE_RECUPERACAO = "recuperacao-leads";
const TRILHAS = TRILHAS_RECUPERACAO;

// Erros da Cloud API que significam "pare o lote agora" (limite/qualidade),
// "esse número não tem WhatsApp" (definitivo) ou "tente de novo depois".
const CODIGOS_LIMITE = new Set([130429, 131048, 131056, 80007]);
const CODIGOS_SEM_WHATSAPP = new Set([131026, 131021]);
// Erro de configuração do template (parâmetros/botão errados, template não
// aprovado): não é culpa do lead — devolve pra fila e para o lote, senão
// todos os leads virariam "falha" por um erro nosso.
const CODIGOS_CONFIG = new Set([132000, 132001, 132005, 132007, 132012, 132015, 132016, 132068, 132069]);

function sincronizarLeads(janelaHoras, log, resumo) {
  const forms = db.prepare(`SELECT * FROM meta_forms WHERE ativo = 1`).all();
  const inserir = db.prepare(
    `INSERT OR IGNORE INTO leads_meta
       (leadgen_id, form_id, trilha, nome, telefone, telefone_chave, campaign_id, ad_id, criado_meta_em, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  return Promise.all(
    forms.map(async (form) => {
      try {
        const ultimo = db
          .prepare(`SELECT MAX(criado_meta_em) AS m FROM leads_meta WHERE form_id = ?`)
          .get(form.form_id).m;
        const base = ultimo ? new Date(ultimo.replace(" ", "T") + "Z").getTime() - 3600_000 : Date.now() - janelaHoras * 3600_000;
        const desdeEpoch = Math.floor(Math.max(base, Date.now() - janelaHoras * 3600_000) / 1000);
        const leads = await buscarLeadsDoForm({ formId: form.form_id, desdeEpoch });
        let novos = 0;
        for (const l of leads) {
          const r = inserir.run(
            l.leadgenId, form.form_id, form.trilha, l.nome, l.telefone, l.telefoneChave,
            l.campaignId, l.adId, l.criadoMetaEm, l.telefone ? "novo" : "sem_telefone"
          );
          novos += r.changes;
        }
        resumo.sincronizados[form.form_id] = { buscados: leads.length, novos };
        log(`[recuperacao] form ${form.form_id} (${form.trilha}): ${leads.length} buscados, ${novos} novos`);
      } catch (err) {
        resumo.erros.push(`sync form ${form.form_id}: ${err.message}`);
        log(`[recuperacao] falha ao sincronizar form ${form.form_id}: ${err.message}`);
      }
    })
  );
}

export async function executarRecuperacaoLeads({ log = console.log } = {}) {
  const campos = lerCamposDoFluxo(CHAVE_RECUPERACAO, TEXTOS_RECUPERACAO_PADRAO[CHAVE_RECUPERACAO]);
  const real = campos.modo === "real";
  const loteMaximo = Math.max(1, Number(campos.loteMaximo) || 1);
  const espera = Math.max(0, Number(campos.esperaMinutos) || 0);
  const janela = Math.max(1, Number(campos.janelaHoras) || 48);
  const resumo = { modo: campos.modo, sincronizados: {}, trilhas: {}, erros: [] };

  await sincronizarLeads(janela, log, resumo);

  db.prepare(
    `UPDATE leads_meta SET status = 'expirado', atualizado_em = datetime('now')
     WHERE status = 'novo' AND criado_meta_em < datetime('now', ?)`
  ).run(`-${janela} hours`);

  for (const trilha of TRILHAS) {
    const template = trilha === "ao-vivo" ? campos.templateAoVivo : campos.templateGravado;
    const r = (resumo.trilhas[trilha] = { template: template || null, enviados: 0, simulados: [], jaNoGrupo: 0 });

    const pendentes = db.prepare(`SELECT * FROM leads_meta WHERE trilha = ? AND status = 'novo' ORDER BY criado_meta_em`).all(trilha);
    if (pendentes.length === 0) continue;
    if (!template) { r.aviso = "sem template configurado"; continue; }

    const grupos = gruposAtivosDaTrilha(trilha);
    if (grupos.length === 0) { r.aviso = "nenhum grupo Ativo na trilha"; continue; }

    const sync = statusDaSincronizacao(trilha, grupos.map((g) => g.id), Number(campos.frescorMinutos) || 30);
    if (!sync.ok) {
      r.aviso = `nada enviado: ${sync.motivo}`;
      resumo.erros.push(`${trilha}: ${sync.motivo}`);
      log(`[recuperacao] ${trilha}: ${r.aviso}`);
      continue;
    }
    const membros = chavesDeMembros(grupos.map((g) => g.id));

    const marcar = db.prepare(`UPDATE leads_meta SET status = ?, erro = ?, atualizado_em = datetime('now') WHERE leadgen_id = ?`);
    const limite = Date.now() - espera * 60_000;
    const jaEnviouParaTelefone = db.prepare(`SELECT 1 FROM leads_meta WHERE telefone_chave = ? AND trilha = ? AND status IN ('enviado','enviando') LIMIT 1`);
    let processados = 0;
    const vistos = new Set(); // telefones já escolhidos nesta execução

    for (const lead of pendentes) {
      if (membros.has(lead.telefone_chave)) {
        marcar.run("no_grupo", null, lead.leadgen_id);
        r.jaNoGrupo++;
        continue;
      }
      if (new Date(lead.criado_meta_em.replace(" ", "T") + "Z").getTime() > limite) continue; // ainda dentro da espera
      if (vistos.has(lead.telefone_chave) || jaEnviouParaTelefone.get(lead.telefone_chave, trilha)) {
        marcar.run("duplicado", "mesmo telefone já recebeu o template", lead.leadgen_id);
        continue;
      }
      if (processados >= loteMaximo) continue;
      processados++;
      vistos.add(lead.telefone_chave);

      if (!real) { r.simulados.push({ leadgenId: lead.leadgen_id, nome: lead.nome }); continue; }

      db.prepare(`UPDATE leads_meta SET status = 'enviando', tentativas = tentativas + 1, atualizado_em = datetime('now') WHERE leadgen_id = ?`).run(lead.leadgen_id);
      try {
        const { wamid } = await enviarTemplate({
          para: lead.telefone,
          template,
          idioma: campos.idioma,
          variaveis: [primeiroNome(lead.nome)],
          botaoUrlSufixo: (trilha === "ao-vivo" ? campos.botaoSufixoAoVivo : campos.botaoSufixoGravado) || null,
        });
        db.prepare(`UPDATE leads_meta SET status = 'enviado', wa_message_id = ?, erro = NULL, enviado_em = datetime('now'), atualizado_em = datetime('now') WHERE leadgen_id = ?`).run(wamid, lead.leadgen_id);
        r.enviados++;
      } catch (err) {
        if (CODIGOS_CONFIG.has(err.codigo)) {
          db.prepare(`UPDATE leads_meta SET status = 'novo', tentativas = MAX(0, tentativas - 1), erro = ?, atualizado_em = datetime('now') WHERE leadgen_id = ?`).run(err.message, lead.leadgen_id);
          r.aviso = `template mal configurado, lote interrompido e lead devolvido à fila: ${err.message}`;
          log(`[recuperacao] ${trilha}: ${r.aviso}`);
          break;
        }
        const limitou = CODIGOS_LIMITE.has(err.codigo);
        const semZap = CODIGOS_SEM_WHATSAPP.has(err.codigo);
        const transitorio = !err.http || err.http >= 500 || limitou;
        // Erro transitório volta pra fila (até 3 tentativas); "enviando" só
        // fica preso se o processo morrer no meio de uma chamada.
        const proximo = semZap ? "sem_whatsapp" : transitorio && lead.tentativas + 1 < 3 ? "novo" : "falha";
        marcar.run(proximo, err.message, lead.leadgen_id);
        log(`[recuperacao] ${trilha}: falha ao enviar (${lead.leadgen_id}): ${err.message}`);
        if (limitou) { r.aviso = `limite da Cloud API atingido, lote interrompido: ${err.message}`; break; }
      }
    }
  }
  return resumo;
}
