// Normaliza telefone de lead (Meta manda "+5511999998888", às vezes sem +
// ou sem DDI) pra só dígitos com DDI. Sem "+" e com 10/11 dígitos, assume
// Brasil — formulário de campanha brasileira.
export function normalizarTelefone(bruto) {
  const texto = String(bruto ?? "").trim();
  let d = texto.replace(/\D/g, "").replace(/^0+/, "");
  if (!d) return null;
  if (!texto.startsWith("+") && (d.length === 10 || d.length === 11)) d = "55" + d;
  const internacional = texto.startsWith("+");
  if (d.length > 15 || d.length < (internacional ? 8 : 12)) return null;
  return d;
}

// Chave de comparação: celular brasileiro com ou sem o 9º dígito é a mesma
// pessoa (o WhatsApp antigo guardava sem o 9). Só o 13-dígitos que começa
// com 55 + DDD + 9 perde o 9.
export function chaveTelefone(digitos) {
  if (digitos.startsWith("55") && digitos.length === 13 && digitos[4] === "9") {
    return digitos.slice(0, 4) + digitos.slice(5);
  }
  return digitos;
}

export function primeiroNome(nome) {
  const p = String(nome ?? "").trim().split(/\s+/)[0];
  if (!p) return "tudo bem";
  return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
}

// Só dígitos do participante de um grupo. A Evolution devolve `id` em
// @s.whatsapp.net ou @lid (id anônimo, sem telefone) e, na v2, `phoneNumber`
// quando resolve. Retorna null se só há @lid.
export function telefoneDoParticipante(p) {
  const fonte = p.phoneNumber || p.id || "";
  if (!p.phoneNumber && String(fonte).endsWith("@lid")) return null;
  const d = String(fonte).split("@")[0].replace(/\D/g, "");
  return d || null;
}
