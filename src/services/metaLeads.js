import { normalizarTelefone, chaveTelefone } from "./telefone.js";

// Leitura dos leads dos formulários instantâneos (Lead Ads) pela Graph API.
// Token só por variável de ambiente; nunca logar a URL (o "next" do
// paginador carrega o access_token).
const GRAPH = "https://graph.facebook.com/v21.0";

function token() {
  return process.env.META_LEADS_TOKEN || process.env.META_WA_TOKEN;
}

// "2026-09-24T14:03:11+0000" -> "2026-09-24 14:03:11" (UTC, formato do SQLite).
export function createdTimeParaSqlite(createdTime) {
  const iso = String(createdTime).replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`created_time inválido: ${createdTime}`);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export function interpretarLead(raw) {
  const campos = {};
  for (const f of raw.field_data ?? []) campos[String(f.name).toLowerCase()] = f.values?.[0] ?? null;
  const achar = (regex) => {
    const chave = Object.keys(campos).find((k) => regex.test(k));
    return chave ? campos[chave] : null;
  };
  const telefoneBruto = campos.phone_number ?? achar(/phone|telefone|whats|celular/);
  const nome =
    campos.full_name ??
    ([campos.first_name, campos.last_name].filter(Boolean).join(" ") || achar(/nome|name/));
  const telefone = normalizarTelefone(telefoneBruto);
  return {
    leadgenId: raw.id,
    formId: raw.form_id ?? null,
    campaignId: raw.campaign_id ?? null,
    adId: raw.ad_id ?? null,
    nome: nome ? String(nome).trim() : null,
    telefone,
    telefoneChave: telefone ? chaveTelefone(telefone) : null,
    criadoMetaEm: createdTimeParaSqlite(raw.created_time),
  };
}

export async function buscarLeadsDoForm({ formId, desdeEpoch = null }) {
  const t = token();
  if (!t) throw new Error("META_LEADS_TOKEN (ou META_WA_TOKEN) não configurado.");
  const params = new URLSearchParams({
    fields: "id,created_time,field_data,campaign_id,ad_id,form_id",
    limit: "100",
    access_token: t,
  });
  if (desdeEpoch) {
    params.set("filtering", JSON.stringify([{ field: "time_created", operator: "GREATER_THAN", value: desdeEpoch }]));
  }
  let url = `${GRAPH}/${encodeURIComponent(formId)}/leads?${params}`;
  const leads = [];
  for (let pagina = 0; url && pagina < 50; pagina++) {
    const res = await fetch(url);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Meta leads do form ${formId}: ${body.error?.message ?? `HTTP ${res.status}`}`);
    for (const raw of body.data ?? []) leads.push(interpretarLead({ ...raw, form_id: raw.form_id ?? formId }));
    url = body.paging?.next ?? null;
  }
  return leads;
}
