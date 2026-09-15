import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { gerarLoginKey } from '@/utils/diario/loginAluno';
import { signSessionToken, COOKIE_NAME, TOKEN_EXPIRY_SECONDS } from '@/lib/aluno/session';

export async function POST(request) {
  let loginKey;
  try {
    const db = getAdminDb();
    const { login } = await request.json();

    if (!login || typeof login !== 'string' || login.trim().length < 3) {
      return NextResponse.json(
        { error: 'Login inválido. Informe o primeiro nome e os 4 dígitos do nascimento (ex: MARIA1503).' },
        { status: 400 }
      );
    }

    const cleanLogin = login
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    loginKey = await gerarLoginKey(cleanLogin);

    // 1. Busca na base de login do aluno no Firestore (tenta lowercase e fallback)
    let snap = await db.doc(`alunoLogin/${loginKey}`).get();

    if (!snap.exists) {
      // Fallback para hashes legados
      const upperKey = await gerarLoginKey(cleanLogin.toUpperCase());
      const upperSnap = await db.doc(`alunoLogin/${upperKey}`).get();
      if (upperSnap.exists) {
        snap = upperSnap;
        loginKey = upperKey;
      }
    }

    if (!snap.exists) {
      return NextResponse.json(
        { error: 'Aluno não localizado. Verifique se o nome e a data de nascimento estão corretos.' },
        { status: 404 }
      );
    }

    const baseData = snap.data();

    // 2. Busca os vínculos com professores
    const vinculosSnap = await db.collection(`alunoLogin/${loginKey}/vinculos`).get();
    let vinculos = vinculosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (vinculos.length === 0 && baseData.professorUid) {
      vinculos.push({
        id: baseData.professorUid,
        professorUid: baseData.professorUid,
        turmaId: baseData.turmaId || 'N/A',
        modulo: baseData.modulo || 'diario',
        nomeProfessor: baseData.nomeProfessor || 'Professor',
      });
    }

    // 3. Emite o Token Criptografado
    const sessionPayload = {
      loginKey,
      nome: baseData.nome,
      login: baseData.login,
      vinculos,
    };

    const token = signSessionToken(sessionPayload);

    // 4. Configura o Cookie Seguro HttpOnly
    const response = NextResponse.json({
      success: true,
      aluno: {
        nome: baseData.nome,
        login: baseData.login,
        loginKey,
        vinculos,
      },
    });

    const isProd = process.env.NODE_ENV === 'production';

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRY_SECONDS,
    });

    return response;
  } catch (error) {
    console.error('[/api/aluno/login] Erro no servidor:', error);
    const msg = process.env.NODE_ENV === 'development'
      ? `Erro interno ao processar o login do aluno: ${error?.message || error}`
      : 'Erro interno ao processar o login do aluno.';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
