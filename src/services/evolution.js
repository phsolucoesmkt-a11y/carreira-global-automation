const BASE_URL = process.env.EVOLUTION_BASE_URL;
const INSTANCE = process.env.EVOLUTION_INSTANCE;
const API_KEY = process.env.EVOLUTION_API_KEY;

function headers() {
  return { apikey: API_KEY, "Content-Type": "application/json" };
}

async function call(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers: headers() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Evolution API ${path} falhou: HTTP ${res.status} — ${JSON.stringify(body)}`);
  }
  return body;
}

// Espelha o nó "Criar um novo grupo": cria com 1 participante fixo (a API
// do WhatsApp exige pelo menos um pra criar o grupo).
export async function criarGrupo({ nome, descricao, participanteInicial }) {
  return call(`/group/create/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({
      subject: nome,
      description: descricao,
      participants: [participanteInicial],
    }),
  });
}

// Espelha "Atualizar imagem do grupo": aceita link do Google Drive no
// mesmo formato de compartilhamento usado na planilha e converte pro link
// de download direto, igual a expressão do n8n fazia.
function driveShareLinkParaDownload(url) {
  return url
    .replace("/file/d/", "/uc?export=download&id=")
    .replace("/view?usp=sharing", "")
    .replace("/view", "");
}

export async function atualizarImagemDoGrupo({ groupJid, imagemUrl }) {
  return call(`/group/updateGroupPicture/${INSTANCE}?groupJid=${encodeURIComponent(groupJid)}`, {
    method: "POST",
    body: JSON.stringify({ image: driveShareLinkParaDownload(imagemUrl) }),
  });
}

// Espelha "Somente Adm Envia" (action: announcement) e
// "Somente Adm Edita Configurações" (action: locked).
export async function definirConfiguracaoDoGrupo({ groupJid, action }) {
  return call(`/group/updateSetting/${INSTANCE}?groupJid=${encodeURIComponent(groupJid)}`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

// Espelha "Buscar link de convite".
export async function buscarLinkDeConvite({ groupJid }) {
  return call(`/group/inviteCode/${INSTANCE}?groupJid=${encodeURIComponent(groupJid)}`);
}

// action: "add" | "remove" | "promote" | "demote"
export async function atualizarParticipantes({ groupJid, action, participantes }) {
  return call(`/group/updateParticipant/${INSTANCE}?groupJid=${encodeURIComponent(groupJid)}`, {
    method: "POST",
    body: JSON.stringify({ action, participants: participantes }),
  });
}

// Espelha "Enviar texto".
export async function enviarTexto({ remoteJid, texto }) {
  return call(`/message/sendText/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({ number: remoteJid, text: texto }),
  });
}

// Espelha "Enviar video de Boas Vindas" (aceita link do Drive no formato
// de compartilhamento ou já como link direto de download).
export async function enviarVideo({ remoteJid, videoUrl, legenda }) {
  return call(`/message/sendMedia/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({
      number: remoteJid,
      mediatype: "video",
      media: driveShareLinkParaDownload(videoUrl),
      caption: legenda,
    }),
  });
}

// Espelha "Enviar enquete2".
export async function enviarEnquete({ remoteJid, pergunta, opcoes }) {
  return call(`/message/sendPoll/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({
      number: remoteJid,
      name: pergunta,
      selectableCount: 1,
      values: opcoes,
    }),
  });
}

// Espelha "Atualizar nome do grupo".
export async function atualizarNomeDoGrupo({ groupJid, nome }) {
  return call(`/group/updateGroupSubject/${INSTANCE}?groupJid=${encodeURIComponent(groupJid)}`, {
    method: "POST",
    body: JSON.stringify({ subject: nome }),
  });
}

// Espelha "Enviar audio".
export async function enviarAudio({ remoteJid, audioUrl }) {
  return call(`/message/sendMedia/${INSTANCE}`, {
    method: "POST",
    body: JSON.stringify({
      number: remoteJid,
      mediatype: "audio",
      media: driveShareLinkParaDownload(audioUrl),
    }),
  });
}
