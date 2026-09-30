import { NextResponse } from 'next/server';
import { gerarLoginKey, resolverLoginsAlunos, resolverLoginUnico } from '@/utils/diario/loginAluno';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dashboard-gestao-notas';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function firestorePatch(path, fields, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${FIRESTORE_BASE}/${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore ${res.status}: ${err.slice(0, 200)}`);
  }
  return res.json();
}

async function firestoreGetNome(path, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${FIRESTORE_BASE}/${path}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Firestore ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  return { nome: json.fields?.nome?.stringValue || '' };
}

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: 'NULL_VALUE' };
  if (typeof v === 'number') return { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFirestoreValue) } };
  }
  if (typeof v === 'object') {
    const fields = {};
    for (const [k, val] of Object.entries(v)) {
      if (val !== undefined) fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

export async function POST(request) {
  try {
    // Extrai o token de autenticação do header
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Acesso não autorizado. Token de autenticação ausente.' }, { status: 401 });
    }

    const { userId, nomeProfessor, turmas } = await request.json();

    if (!userId || typeof userId !== 'string' || !Array.isArray(turmas) || turmas.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos ou incompletos.' }, { status: 400 });
    }

    // Monta a lista plana de todos os alunos a serem publicados,
    // já com a resolução de homônimos por turma (RN-45)
    const studentTasks = [];
    for (const turma of turmas) {
      const resolvidos = resolverLoginsAlunos(turma.alunos || []);
      for (const resolvido of resolvidos) {
        studentTasks.push({ aluno: resolvido.aluno, turma, homonimo: resolvido.homonimo });
      }
    }

    let total = 0;
    let erros = 0;
    let semData = 0;
    const alunosSemData = [];
    const errosDetails = [];

    const publishSingleStudent = async ({ aluno, turma, homonimo }) => {
      if (!aluno.dataNascimento) {
        return { status: 'semData', aluno: { nome: aluno.nome, turma: turma.nome } };
      }

      try {
        const buscarDoc = async (loginCandidato) => {
          const key = await gerarLoginKey(loginCandidato);
          return firestoreGetNome(`alunoLogin/${key}`, token);
        };
        const resolucao = await resolverLoginUnico(aluno.nome, aluno.dataNascimento, buscarDoc, { homonimo });
        if (resolucao.conflito || !resolucao.login) {
          return {
            status: 'error',
            error: 'Colisão de login com outro aluno — resolva homônimos manualmente',
            nome: aluno.nome,
          };
        }
        const loginStr = resolucao.login;
        const loginKey = await gerarLoginKey(loginStr);
        const now = new Date().toISOString();

        const recordId = `${userId}_${turma.id}_${aluno.id}`;
        const notaFields = toFirestoreValue({
          nome: aluno.nome,
          bimestres: turma.bimestres || {},
          atualizadoEm: now,
        }).mapValue.fields;

        // Executa as 3 operações do aluno em paralelo
        await Promise.all([
          firestorePatch(`alunoLogin/${loginKey}`, {
            nome: { stringValue: aluno.nome },
            login: { stringValue: loginStr },
          }, token),
          firestorePatch(`alunoLogin/${loginKey}/vinculos/${userId}`, {
            professorUid: { stringValue: userId },
            turmaId: { stringValue: turma.id },
            turmaNome: { stringValue: turma.nome },
            alunoId: { stringValue: aluno.id },
            modulo: { stringValue: 'diario' },
            nomeProfessor: { stringValue: nomeProfessor || 'Professor' },
            atualizadoEm: { stringValue: now },
          }, token),
          firestorePatch(`notasAluno/${recordId}`, notaFields, token),
        ]);

        return { status: 'ok' };
      } catch (e) {
        console.error(`Erro aluno ${aluno.nome}:`, e.message);
        return { status: 'error', error: e.message, nome: aluno.nome };
      }
    };

    // Processa os alunos em lotes concorrentes (chunks de 15 simultâneos)
    const BATCH_SIZE = 15;
    for (let i = 0; i < studentTasks.length; i += BATCH_SIZE) {
      const batch = studentTasks.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(publishSingleStudent));

      for (const res of results) {
        if (res.status === 'ok') {
          total++;
        } else if (res.status === 'semData') {
          semData++;
          alunosSemData.push(res.aluno);
        } else if (res.status === 'error') {
          erros++;
          errosDetails.push(res.error);
        }
      }
    }

    return NextResponse.json({ total, erros, errosDetails, semData, alunosSemData });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
