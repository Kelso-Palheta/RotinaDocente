import crypto from 'crypto';
import { readFileSync } from 'node:fs';

let segredoLocal;
function segredoSessao() {
  const configurado = process.env.ALUNO_SESSION_SECRET || process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET;
  if (configurado) return configurado;
  // Compatibilidade de deploy: credencial administrativa já configurada fornece segredo privado estável.
  const conta = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : process.env.GOOGLE_APPLICATION_CREDENTIALS ? JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8')) : null;
  if (conta?.private_key) return crypto.createHmac('sha256', conta.private_key).update('rotina-docente:aluno-session:v2').digest('hex');
  if (process.env.NODE_ENV === 'production') throw new Error('Configure ALUNO_SESSION_SECRET ou a credencial administrativa do Firebase.');
  segredoLocal ||= crypto.randomBytes(32).toString('hex');
  return segredoLocal;
}
const COOKIE_NAME = 'aluno_session';
const TOKEN_EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 7 dias

/**
 * Cria um token assinado criptograficamente com HMAC-SHA256.
 * Formato: base64(payload).base64(signature)
 */
export function signSessionToken(payload) {
  const data = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
    iat: Math.floor(Date.now() / 1000),
  };

  const payloadB64 = Buffer.from(JSON.stringify(data)).toString('base64url');
  const hmac = crypto.createHmac('sha256', segredoSessao());
  hmac.update(payloadB64);
  const signatureB64 = hmac.digest('base64url');

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifica e decodifica o token de sessão do aluno.
 * Retorna o payload se válido ou null se corrompido/expirado.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;

  // Verifica assinatura
  const hmac = crypto.createHmac('sha256', segredoSessao());
  hmac.update(payloadB64);
  const expectedSig = hmac.digest('base64url');

  const recebida = Buffer.from(signatureB64);
  const esperada = Buffer.from(expectedSig);
  if (recebida.length !== esperada.length || !crypto.timingSafeEqual(recebida, esperada)) {
    return null; // Assinatura inválida (tentativa de adulteração)
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    
    // Verifica expiração
    const now = Math.floor(Date.now() / 1000);
    if (!Number.isFinite(payload.exp) || payload.exp <= now) {
      return null; // Token expirado
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper para extrair o token do cookie da requisição
 */
export function getSessionFromRequest(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k, v.join('=')];
    })
  );

  const token = cookies[COOKIE_NAME];
  return verifySessionToken(token);
}

export { COOKIE_NAME, TOKEN_EXPIRY_SECONDS };
