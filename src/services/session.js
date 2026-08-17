import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET || "carreira-global-automation-dev-secret";
const SEVEN_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export function createSessionToken(user) {
  const expiresAt = Date.now() + SEVEN_DIAS_MS;
  const payload = `${user}:${expiresAt}`;
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySessionToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const [user, expiresAtStr, sig] = decoded.split(":");
    const expiresAt = Number(expiresAtStr);
    const payload = `${user}:${expiresAtStr}`;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    if (sig !== expectedSig) return null;
    if (Date.now() > expiresAt) return null;
    return { user };
  } catch {
    return null;
  }
}

export function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}
