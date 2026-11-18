import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebase-admin';
import { getSessionFromRequest } from '@/lib/aluno/session';

const negar = () =>
  Object.assign(new Error('Sessão inválida ou expirada.'), { status: 401 });
const uidValido = (uid) =>
  typeof uid === 'string' &&
  uid.length > 0 &&
  uid.length <= 128 &&
  !/[\/\\\x00-\x1f]/.test(uid);
const loginValido = (loginKey) =>
  typeof loginKey === 'string' && /^[a-f0-9]{64}$/.test(loginKey);

/**
 * Autenticação própria do módulo: Bearer Firebase para docentes e cookie de
 * sessão do Portal para estudantes. Dependências injetáveis para testes.
 */
export function criarAcessoAulaGamificada({
  obterAuth = () => getAuth(getAdminApp()),
  lerSessao = getSessionFromRequest,
} = {}) {
  async function autenticar(request) {
    const authorization = request.headers.get('authorization');
    if (authorization !== null) {
      const match = /^Bearer ([^\s]+)$/i.exec(authorization);
      if (!match) throw negar();
      try {
        const token = await obterAuth().verifyIdToken(match[1], true);
        if (!uidValido(token.uid)) throw negar();
        return { tipo: 'professor', uid: token.uid };
      } catch {
        throw negar();
      }
    }
    try {
      const sessao = await lerSessao(request);
      if (!sessao || !loginValido(sessao.loginKey)) throw negar();
      return { tipo: 'aluno', loginKey: sessao.loginKey };
    } catch {
      throw negar();
    }
  }

  return { autenticar };
}

const acesso = criarAcessoAulaGamificada();
export const autenticarAulaGamificada = acesso.autenticar;
