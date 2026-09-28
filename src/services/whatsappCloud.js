// Envio de template oficial pela WhatsApp Cloud API (Meta) — canal separado
// da Evolution (Baileys), funciona mesmo com a instância fora do ar.
// Credenciais só por variável de ambiente (nunca no banco/painel).
const GRAPH = "https://graph.facebook.com/v21.0";

export function cloudApiConfigurada() {
  return Boolean(process.env.META_WA_TOKEN && process.env.META_WA_PHONE_NUMBER_ID);
}

export async function enviarTemplate({ para, template, idioma = "pt_BR", variaveis = [], botaoUrlSufixo = null }) {
  const token = process.env.META_WA_TOKEN;
  const phoneId = process.env.META_WA_PHONE_NUMBER_ID;
  if (!token || !phoneId) throw new Error("META_WA_TOKEN / META_WA_PHONE_NUMBER_ID não configurados.");

  const payload = {
    messaging_product: "whatsapp",
    to: para,
    type: "template",
    template: { name: template, language: { code: idioma } },
  };
  const components = [];
  if (variaveis.length > 0) {
    components.push({ type: "body", parameters: variaveis.map((text) => ({ type: "text", text })) });
  }
  // Botão de URL dinâmica (ex.: https://dominio/r/{{1}}): o sufixo entra aqui.
  if (botaoUrlSufixo) {
    components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: botaoUrlSufixo }] });
  }
  if (components.length > 0) payload.template.components = components;

  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = body.error ?? {};
    throw Object.assign(new Error(`WhatsApp Cloud API: ${e.message ?? "erro"} (código ${e.code ?? "?"}, HTTP ${res.status})`), {
      codigo: e.code ?? null,
      http: res.status,
    });
  }
  return { wamid: body.messages?.[0]?.id ?? null };
}
