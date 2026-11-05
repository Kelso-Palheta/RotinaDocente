import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { getSessionFromRequest, signSessionToken, verifySessionToken } from '@/lib/aluno/session';

const DURACAO_MIDIA_MS = 30 * 60 * 1000;
const COOKIE_MIDIA = 'revisao_midia';
const negar = () => Object.assign(new Error('Sessão inválida ou expirada.'), { status: 401 });
const uidValido = uid => typeof uid === 'string' && uid.length > 0 && uid.length <= 128 && !/[\/\\\x00-\x1f]/.test(uid);

/** Dependências injetáveis para verificar revogação sem credenciais em testes. */
export function criarAcessoRevisao({
  obterAuth = () => getAuth(getAdminApp()), lerSessao = getSessionFromRequest,
  assinarToken = signSessionToken, verificarToken = verifySessionToken,
  agora = () => Date.now(), producao = process.env.NODE_ENV === 'production',
} = {}) {
  async function autenticar(request) {
    const authorization = request.headers.get('authorization');
    if (authorization !== null) {
      const match = /^Bearer ([^\s]+)$/i.exec(authorization);
      if (!match) throw negar();
      try {
        const token = await obterAuth().verifyIdToken(match[1], true);
        if (!uidValido(token.uid) || !Number.isFinite(token.auth_time)) throw negar();
        return { tipo: 'professor', uid: token.uid, authTime: token.auth_time };
      } catch { throw negar(); }
    }
    try {
      const sessao = await lerSessao(request);
      if (!sessao || typeof sessao.loginKey !== 'string' || !/^[a-f0-9]{64}$/.test(sessao.loginKey)) throw negar();
      return { tipo: 'aluno', loginKey: sessao.loginKey };
    } catch { throw negar(); }
  }

  async function emitirCookieMidia(ator) {
    if (ator?.tipo !== 'professor') return null;
    if (!uidValido(ator.uid) || !Number.isFinite(ator.authTime) || ator.authTime <= 0) throw negar();
    const token = assinarToken({ finalidade: COOKIE_MIDIA, professorUid: ator.uid, authTime: ator.authTime, emitidoEm: agora(), validadeMs: DURACAO_MIDIA_MS });
    return `${COOKIE_MIDIA}=${token}; Path=/api/revisao/; HttpOnly; SameSite=Lax; Max-Age=1800${producao ? '; Secure' : ''}`;
  }

  async function autorizarMidia(request) {
    // Bearer explícito jamais deve cair para outro cookie se for inválido.
    if (request.headers.has('authorization')) return autenticar(request);
    const cookies = (request.headers.get('cookie') || '').split(';').map(c => c.trim().split('='));
    const token = cookies.find(([nome]) => nome === COOKIE_MIDIA)?.slice(1).join('=');
    if (!token) return autenticar(request);
    try {
      const payload = verificarToken(token);
      const tempo = agora();
      if (!payload || payload.finalidade !== COOKIE_MIDIA || !uidValido(payload.professorUid) ||
        payload.validadeMs !== DURACAO_MIDIA_MS || !Number.isFinite(payload.emitidoEm) ||
        payload.emitidoEm > tempo || payload.emitidoEm + DURACAO_MIDIA_MS <= tempo ||
        !Number.isFinite(payload.authTime) || payload.authTime <= 0 || payload.authTime * 1000 > payload.emitidoEm) throw negar();
      const user = await obterAuth().getUser(payload.professorUid);
      const revogadoEm = user.tokensValidAfterTime ? Date.parse(user.tokensValidAfterTime) : 0;
      if (user.disabled || !Number.isFinite(revogadoEm) || payload.authTime * 1000 < revogadoEm) throw negar();
      return { tipo: 'professor', uid: payload.professorUid, authTime: payload.authTime };
    } catch { throw negar(); }
  }
  return { autenticar, autorizarMidia, emitirCookieMidia };
}

const acesso = criarAcessoRevisao();
export const autenticarRevisao = acesso.autenticar;
export const autorizarMidiaRevisao = acesso.autorizarMidia;
export const emitirCookieMidiaRevisao = acesso.emitirCookieMidia;
