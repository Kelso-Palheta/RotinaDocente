import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { criarJogador, criarMundo, passoFisica } from '@/dominio/revisao-autonoma/plataforma';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { criarHandlerRevisaoAutonoma } from '@/infraestrutura/revisao-autonoma/httpServidor';
import { requisitarLivre } from '@/components/revisao-autonoma/api';

const sha = (v) => createHash('sha256').update(v).digest('hex');

function criarStoreMemoria(inicial = {}) {
  const docs = new Map(Object.entries(inicial));
  const store = {
    docs,
    async get(p) {
      return docs.has(p) ? structuredClone(docs.get(p)) : null;
    },
    async list(p, filtros = []) {
      return [...docs]
        .filter(
          ([k, d]) =>
            k.startsWith(`${p}/`) &&
            !k.slice(p.length + 1).includes('/') &&
            filtros.every(([c, op, v]) => op === '==' && d[c] === v),
        )
        .map(([, d]) => structuredClone(d));
    },
    async transaction(fn) {
      const writes = new Map();
      const ler = (f) => {
        if (writes.size) throw new Error('Leitura após escrita.');
        return f();
      };
      const res = await fn({
        get: (p) => ler(() => store.get(p)),
        list: (p, f) => ler(() => store.list(p, f)),
        set: (p, d) => writes.set(p, structuredClone(d)),
      });
      for (const [p, d] of writes) docs.set(p, d);
      return res;
    },
  };
  return store;
}

describe('Revisão Autônoma — jogabilidade real, segurança, privacidade e timeout', () => {
  it.each([1, 2, 3])('jogabilidade fase %i: percurso físico coleta todas as 5 estrelas, ativa checkpoint e alcança o portal', (fase) => {
    const mundo = criarMundo(fase);
    let p = criarJogador(mundo);
    const coletadas = new Set();
    let checkpointAtivado = false;
    const passos = (entrada, frames) => {
      for (let i = 0; i < frames; i++) {
        p = passoFisica(p, entrada, mundo, 1 / 60);
        if (p.checkpoint.x >= 1000) checkpointAtivado = true;
        for (const [idx, e] of mundo.estrelas.entries()) {
          if (!coletadas.has(idx) && Math.abs(p.x + 14 - e.x) < 38 && Math.abs(p.y + 20 - e.y) < 50) {
            coletadas.add(idx);
          }
        }
      }
    };
    const andarAte = (xAlvo) => {
      for (let i = 0; i < 600 && p.x < xAlvo; i++) passos({ direita: true }, 1);
    };

    // 1) Sobe na Plataforma 1 (x: 290..480, y: 345) e coleta Estrela 1
    andarAte(215);
    passos({ direita: true, pular: true }, 1);
    passos({ direita: true }, 42);
    expect(p.noChao).toBe(true);
    expect(p.y + p.h).toBeCloseTo(mundo.plataformas[0].y, 1);

    // 2) Pula da Plataforma 1 para Plataforma 2 (x: 560..740) e coleta Estrela 2
    andarAte(450);
    passos({ direita: true, pular: true }, 1);
    passos({ direita: true }, 48);
    expect(p.noChao).toBe(true);
    expect(p.y + p.h).toBeCloseTo(mundo.plataformas[1].y, 1);

    // 3) Desce ao chão e ativa checkpoint em x > 1000
    andarAte(1015);
    passos({}, 25);
    expect(checkpointAtivado).toBe(true);

    // 4) Sobe na Plataforma 3 (x: 1050..1230, y: 340) e coleta Estrela 3
    passos({ esquerda: true }, 20);
    passos({ direita: true, pular: true }, 1);
    passos({ direita: true }, 45);
    expect(p.noChao).toBe(true);
    expect(p.y + p.h).toBeCloseTo(mundo.plataformas[2].y, 1);

    // 5) Pula da Plataforma 3 para Plataforma 4 (x: 1320..1520) e coleta Estrela 4
    andarAte(1205);
    passos({ direita: true, pular: true }, 1);
    passos({ direita: true }, 52);
    expect(p.noChao).toBe(true);
    expect(p.y + p.h).toBeCloseTo(mundo.plataformas[3].y, 1);

    // 6) Desce com segurança após obstáculo 2, pula obstáculo 3 (x: 1840), coleta Estrela 5 e entra no portal (x: 2090)
    andarAte(1780);
    passos({}, 30);
    passos({ direita: true, pular: true }, 1);
    passos({ direita: true }, 45);
    andarAte(1920);
    passos({ direita: true, pular: true }, 1);
    passos({ direita: true }, 35);
    andarAte(2095);

    expect(coletadas.size).toBe(5);
    expect(p.x + p.w).toBeGreaterThan(mundo.portal.x);
  });

  it('edição da questão via AulaGamificadaService retira liberação e bloqueia sessão ativa; mudança de turma filtra histórico', async () => {
    const loginKey = sha('aluno-teste');
    const prof = { tipo: 'professor', uid: 'prof1' };
    const aluno = { tipo: 'aluno', loginKey };
    const questao = {
      id: 'q1',
      professorId: 'prof1',
      revision: 1,
      status: 'revisada',
      disciplina: 'Biologia',
      anoEscolar: '9º ano',
      conteudo: 'Fotossíntese',
      dificuldade: 'facil',
      tipo: 'multipla_escolha',
      enunciado: 'Qual gás a planta absorve?',
      explicacao: 'Absorve CO2.',
      alternativas: [
        { id: 'a', texto: 'CO2' },
        { id: 'b', texto: 'Hélio' },
      ],
      respostaCorreta: 'a',
    };
    const store = criarStoreMemoria({
      'aulaGamificadaDocentes/prof1/questoes/q1': questao,
      'professores/prof1/turmas/data': {
        turmas: [
          { id: 't1', nome: '9º A', alunos: [{ id: 'al1', nome: 'Ana' }] },
          { id: 't2', nome: '9º B', alunos: [{ id: 'al1', nome: 'Ana' }] },
        ],
      },
      [`alunoLogin/${loginKey}/vinculos/prof1`]: { professorUid: 'prof1', turmaId: 't1', alunoId: 'al1' },
    });

    let seq = 0;
    const revService = new RevisaoAutonomaService({ store, agora: () => 10_000, gerarId: () => `ses_${++seq}` });
    const agService = new AulaGamificadaService({ store, agora: () => 20_000, gerarId: () => `id_${++seq}` });

    // Professor libera questão
    const pub = await revService.publicar(prof, { questaoId: 'q1', expectedRevision: 1, turmaIds: ['t1'] });
    expect(pub.questao.revisaoAutonomaLiberada).toBe(true);
    expect((await revService.catalogo(aluno)).conteudos).toHaveLength(1);

    // Aluno inicia sessão
    const { sessao } = await revService.criarSessao(aluno, {
      professorId: 'prof1',
      disciplina: 'Biologia',
      conteudo: 'Fotossíntese',
      dificuldade: 'facil',
      quantidade: 1,
      requestId: 'req-criar-1',
    });

    // RequestId reutilizado com outro payload falha com 409
    await expect(
      revService.criarSessao(aluno, {
        professorId: 'prof1',
        disciplina: 'Biologia',
        conteudo: 'Fotossíntese',
        dificuldade: 'facil',
        quantidade: 2,
        requestId: 'req-criar-1',
      }),
    ).rejects.toMatchObject({ status: 409 });

    // Professor edita a questão -> volta a rascunho e retira a liberação
    await agService.salvarQuestao(prof, {
      requestId: 'edit-q1',
      expectedRevision: pub.questao.revision,
      questao: { ...questao, enunciado: 'Enunciado editado pelo docente' },
    });
    expect((await revService.catalogo(aluno)).conteudos).toHaveLength(0);
    await expect(revService.obterSessao(aluno, sessao.id)).rejects.toMatchObject({ status: 403 });

    // Mudança de turma do aluno filtra histórico da turma anterior
    store.docs.set(`alunoLogin/${loginKey}/vinculos/prof1`, { professorUid: 'prof1', turmaId: 't2', alunoId: 'al1' });
    expect((await revService.historico(aluno)).sessoes).toHaveLength(0);
  });

  it('httpServidor retorna 400 para URI malformada e 403 quando ator não é professor em /publicar', async () => {
    const handler = criarHandlerRevisaoAutonoma({
      service: {},
      autenticar: async () => null,
    });
    const rBadUri = await handler(new Request('http://localhost/api/revisao-autonoma/sessoes/%E0%A4%A'));
    expect(rBadUri.status).toBe(400);

    const rPub = await handler(
      new Request('http://localhost/api/revisao-autonoma/publicar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
    );
    expect(rPub.status).toBe(403);
  });

  it('api.js impõe timeout explícito e rejeita com status 408 sem travar carregamento', async () => {
    const fetchOrig = globalThis.fetch;
    globalThis.fetch = vi.fn((_url, init) =>
      new Promise((_res, rej) => {
        init?.signal?.addEventListener('abort', () => rej(new DOMException('Aborted', 'AbortError')));
      }),
    );
    try {
      await expect(requisitarLivre('catalogo', { timeoutMs: 25 })).rejects.toMatchObject({
        status: 408,
        timeout: true,
      });
    } finally {
      globalThis.fetch = fetchOrig;
    }
  });
});
