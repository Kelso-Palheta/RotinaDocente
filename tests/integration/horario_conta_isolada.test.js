/**
 * RN-76 — Meu Horário Escolar: isolamento por conta, migração conferida e estado real de salvamento.
 * Reproduções históricas em docs/analises/evidencias-meu-horario/reproducao.test.js.
 */
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { HorarioRepository, LOCAL_STORAGE_KEY } from '@/infraestrutura/horario/HorarioRepository';

const criarStorage = () => {
  const dados = {};
  vi.stubGlobal('localStorage', {
    getItem: (chave) => (chave in dados ? dados[chave] : null),
    setItem: (chave, valor) => { dados[chave] = String(valor); },
    removeItem: (chave) => { delete dados[chave]; },
    clear: () => { Object.keys(dados).forEach((chave) => delete dados[chave]); },
  });
  return dados;
};

const criarNuvem = ({ falharLeitura = false, falharEscrita = false } = {}) => {
  const docs = {};
  const db = {
    collection: (colecao) => ({
      doc: (id) => ({
        set: async (dados) => {
          if (falharEscrita) throw new Error('Nuvem indisponível');
          docs[`${colecao}/${id}`] = JSON.parse(JSON.stringify(dados));
        },
        get: async () => {
          if (falharLeitura) throw new Error('Nuvem indisponível');
          const dados = docs[`${colecao}/${id}`];
          return { exists: Boolean(dados), data: () => dados };
        },
      }),
    }),
  };
  return { db, docs };
};

const gradePrivada = (materia) => ({ schedule: { seg_m1: { subject: materia, grade: '101', room: 'Sala 1' } } });

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('UT-50 — isolamento entre contas', () => {
  test('conta B sem documento não recebe a grade da conta A', async () => {
    criarStorage();
    const { db } = criarNuvem();
    const repo = new HorarioRepository({ firestoreDb: db });

    await repo.salvarGrade('conta-a', gradePrivada('Disciplina privada A'));

    const contaB = await repo.carregarGrade('conta-b');
    expect(contaB.schedule).toEqual({});
    expect(JSON.stringify(contaB)).not.toContain('Disciplina privada A');
  });

  test('a chave base guarda apenas índice, sem aulas da conta autenticada', async () => {
    const dados = criarStorage();
    const { db } = criarNuvem();

    await new HorarioRepository({ firestoreDb: db }).salvarGrade('conta-a', gradePrivada('Disciplina privada A'));

    const bruto = dados[LOCAL_STORAGE_KEY];
    expect(bruto).toBeDefined();
    const indice = JSON.parse(bruto);
    expect(indice.schedule).toBeUndefined();
    expect(indice.conta).toBe('conta-a');
    expect(bruto).not.toContain('Disciplina privada A');
    expect(dados[`${LOCAL_STORAGE_KEY}:conta-a`]).toContain('Disciplina privada A');
  });
});

describe('UT-51 — estado real de salvamento', () => {
  test('nuvem e local gravados informam estado nuvem', async () => {
    criarStorage();
    const { db } = criarNuvem();
    const resultado = await new HorarioRepository({ firestoreDb: db }).salvarGrade('conta-a', gradePrivada('Arte'));
    expect(resultado.persistencia).toEqual({ local: 'ok', nuvem: 'ok', estado: 'nuvem' });
  });

  test('nuvem fora e local gravado informam pendente, preservando o payload', async () => {
    criarStorage();
    const { db } = criarNuvem({ falharEscrita: true });
    const resultado = await new HorarioRepository({ firestoreDb: db }).salvarGrade('conta-a', gradePrivada('Arte'));
    expect(resultado.schedule.seg_m1.subject).toBe('Arte');
    expect(resultado.persistencia).toEqual({ local: 'ok', nuvem: 'falha', estado: 'pendente' });
  });

  test('local e nuvem fora informam falha em vez de sucesso', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('Sem espaço'); } });
    const { db } = criarNuvem({ falharEscrita: true });
    const resultado = await new HorarioRepository({ firestoreDb: db }).salvarGrade('conta-a', gradePrivada('Arte'));
    expect(resultado.persistencia).toEqual({ local: 'falha', nuvem: 'falha', estado: 'falha' });
  });

  test('anônimo grava somente local', async () => {
    criarStorage();
    const resultado = await new HorarioRepository().salvarGrade(null, gradePrivada('Arte'));
    expect(resultado.persistencia).toEqual({ local: 'ok', nuvem: 'nao_aplicavel', estado: 'local' });
  });
});

describe('UT-52 — origem do carregamento', () => {
  test('nuvem disponível informa origem nuvem', async () => {
    criarStorage();
    const { db } = criarNuvem();
    const repo = new HorarioRepository({ firestoreDb: db });
    await repo.salvarGrade('conta-a', gradePrivada('Arte'));
    const carregado = await repo.carregarGrade('conta-a');
    expect(carregado.persistencia.origem).toBe('nuvem');
    expect(carregado.schedule.seg_m1.subject).toBe('Arte');
  });

  test('nuvem fora usa cache da mesma conta e informa origem local', async () => {
    criarStorage();
    const repo = new HorarioRepository({ firestoreDb: criarNuvem().db });
    await repo.salvarGrade('conta-a', gradePrivada('Arte'));

    const offline = new HorarioRepository({ firestoreDb: criarNuvem({ falharLeitura: true }).db });
    const carregado = await offline.carregarGrade('conta-a');
    expect(carregado.persistencia.origem).toBe('local');
    expect(carregado.schedule.seg_m1.subject).toBe('Arte');
  });

  test('conta nova sem documento começa vazia, sem demonstração', async () => {
    criarStorage();
    const { db } = criarNuvem();
    const carregado = await new HorarioRepository({ firestoreDb: db }).carregarGrade('conta-nova');
    expect(carregado.persistencia.origem).toBe('padrao');
    expect(carregado.schedule).toEqual({});
  });
});

describe('UT-53 — rascunho legado só migra com confirmação', () => {
  const legado = JSON.stringify({ teacherName: 'Prof. Antigo', shift: 'manha', schedule: { seg_m1: { subject: 'Rascunho antigo' } }, updatedAt: '2026-01-02T10:00:00.000Z' });

  test('detecta, não aplica automaticamente e migra apenas quando confirmado', async () => {
    const dados = criarStorage();
    dados[LOCAL_STORAGE_KEY] = legado;
    const repo = new HorarioRepository();

    expect(repo.detectarCacheLegado()).toMatchObject({ disponivel: true, aulas: 1, atualizadoEm: '2026-01-02T10:00:00.000Z' });

    const contaB = await repo.carregarGrade('conta-b');
    expect(contaB.schedule).toEqual({});
    expect(repo.migrarCacheLegado('conta-b', false)).toBeNull();

    const migrado = repo.migrarCacheLegado('conta-b', true);
    expect(migrado.schedule.seg_m1.subject).toBe('Rascunho antigo');

    const depois = await repo.carregarGrade('conta-b');
    expect(depois.schedule.seg_m1.subject).toBe('Rascunho antigo');
    expect(repo.detectarCacheLegado().disponivel).toBe(false);
  });

  test('descartar retira a oferta sem apagar a grade da conta', async () => {
    const dados = criarStorage();
    dados[LOCAL_STORAGE_KEY] = legado;
    const repo = new HorarioRepository();

    repo.descartarCacheLegado('conta-b');
    expect(repo.detectarCacheLegado().disponivel).toBe(false);
    expect((await repo.carregarGrade('conta-b')).schedule).toEqual({});
  });
});

describe('UT-52 — modo real permanece estrito', () => {
  test('somenteReal lê a nuvem sem usar cache local', async () => {
    criarStorage();
    const { db } = criarNuvem();
    const repo = new HorarioRepository({ firestoreDb: db });
    await repo.salvarGrade('conta-a', gradePrivada('Arte'));

    const real = await repo.carregarGrade('conta-a', { somenteReal: true });
    expect(real.schedule.seg_m1.subject).toBe('Arte');
    expect(await repo.carregarGrade(null, { somenteReal: true })).toBeNull();
  });
});
