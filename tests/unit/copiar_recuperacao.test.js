import { describe, expect, it } from 'vitest';
import {
  CODIGOS_COPIA,
  avaliarDestinosCopia,
  montarAtividadeCopiada,
  projetarConteudoRecuperacao,
  validarDestinoCopia,
  validarOrigemCopia,
} from '@/dominio/atividades/copiarRecuperacao';

const origem = () => ({
  id: 'origem-1',
  professorId: 'p',
  finalidade: 'recuperacao_semestral',
  conjuntoRecuperacaoId: 'c1',
  conjuntoVersao: 4,
  semestre: '1',
  anoLetivo: '2026',
  turmaIds: ['t1'],
  turmas: ['t1'],
  destinatariosIds: ['a'],
  titulo: 'Recuperação de frações',
  notaMaxima: 4,
  status: 'ativa',
  dataEntrega: new Date('2026-03-01T23:59:00'),
  publicado: true,
  token: 'segredo-da-origem',
  alunoId: 'a',
  resposta: 'resposta discente',
  feedback: 'feedback discente',
  nota: 3,
  historico: [{ nota: 2 }],
  metadados: { alunoId: 'a' },
  questoes: [
    {
      id: 'q1',
      numero: 1,
      tipo: 'objetiva',
      enunciado: 'Qual é a fração equivalente?',
      notaMaxima: 2,
      rubrica: 'Critério',
      alternativas: [
        { id: 'A', texto: '1/2', correta: true, alunoId: 'a' },
        { id: 'B', texto: '2/3', resposta: 'x' },
      ],
      gabarito: 'A',
      imagens: [
        { base64: 'data:image/png;base64,AAAA', alunoId: 'a', token: 'x' },
        { url: 'https://exemplo.test/figura.png', publico: false },
      ],
      textoApoio: 'Texto de apoio da questão',
      scaffolding: 'Dica',
      apoioVisualDescricao: 'Uma pizza dividida',
      resposta: 'A',
      alunoId: 'a',
      token: 'x',
      feedback: 'y',
    },
    {
      id: 'q2',
      tipo: 'discursiva',
      enunciado: 'Explique o cálculo.',
      notaMaxima: 2,
      rubrica: 'Clareza',
      alternativas: [],
      imagens: [{ url: 'blob:https://localhost/123' }, { file: { name: 'x.png' } }],
      resposta: '...',
    },
  ],
  textosBase: [
    { id: 'tx1', html: '<p>Base</p>', aposQuestao: 0, alunoId: 'a', token: 'x' },
  ],
  materiais: [
    {
      id: 'm1',
      tipo: 'texto',
      nome: 'Material',
      texto: 'Conteúdo do material',
      textoExtraido: '',
      arquivoLocal: { name: 'x' },
      _extracting: true,
      alunoId: 'a',
    },
    { id: 'm2', tipo: 'arquivo', nome: 'Sem texto', arquivoLocal: { name: 'y.pdf' } },
  ],
  materialApoio: { nome: 'Apoio', textoExtraido: 'Texto de apoio', alunoId: 'a' },
});

const turmaB = {
  id: 't2',
  nome: 'Turma B',
  anoLetivo: 2026,
  alunos: [{ id: 'b', nome: 'Bia' }, { id: 'c', nome: 'Caio' }],
};

const destino = (extra = {}) => ({
  id: 'c2',
  professorId: 'p',
  turmaId: 't2',
  anoLetivo: '2026',
  semestre: '2',
  destinatariosIds: ['b'],
  atividadeIds: [],
  escalas: {},
  estado: 'rascunho',
  versao: 3,
  ...extra,
});

const dadosRevisados = (extra = {}) => ({
  ...projetarConteudoRecuperacao(origem(), { professorId: 'p' }),
  id: 'atv_nova',
  dataEntrega: new Date('2099-05-01T23:59:00'),
  ...extra,
});

const codigo = fn => {
  try {
    fn();
  } catch (error) {
    return error.code;
  }
  return null;
};

describe('R82-01: projeção por campos permitidos', () => {
  it('copia apenas conteúdo revisável, mantendo gabarito e referências de alternativas', () => {
    const projecao = projetarConteudoRecuperacao(origem(), { professorId: 'p' });

    expect(Object.keys(projecao).sort()).toEqual([
      'avisos', 'materiais', 'materialApoio', 'questoes', 'textosBase', 'titulo',
    ]);
    expect(projecao.titulo).toBe('Recuperação de frações');

    expect(Object.keys(projecao.questoes[0]).sort()).toEqual([
      'alternativas', 'apoioVisualDescricao', 'enunciado', 'gabarito', 'id',
      'imagens', 'notaMaxima', 'numero', 'rubrica', 'scaffolding', 'textoApoio', 'tipo',
    ]);
    expect(projecao.questoes[0].gabarito).toBe('A');
    expect(projecao.questoes[0].alternativas).toEqual([
      { id: 'A', texto: '1/2' },
      { id: 'B', texto: '2/3' },
    ]);
    expect(projecao.questoes[0].imagens).toEqual([
      { base64: 'data:image/png;base64,AAAA' },
      { url: 'https://exemplo.test/figura.png' },
    ]);

    expect(projecao.textosBase).toEqual([{ id: 'tx1', html: '<p>Base</p>', aposQuestao: 0 }]);
    expect(projecao.materiais).toEqual([{
      id: 'm1', tipo: 'texto', nome: 'Material', texto: 'Conteúdo do material', textoExtraido: '',
    }]);
    expect(projecao.materialApoio).toEqual({ nome: 'Apoio', textoExtraido: 'Texto de apoio' });

    const serializado = JSON.stringify(projecao);
    for (const proibido of [
      'resposta discente', 'feedback discente', 'segredo-da-origem', 'publicado',
      'historico', 'metadados', 'arquivoLocal', '_extracting', 'correta', 'alunoId',
      'token', 'file',
    ]) {
      expect(serializado).not.toContain(proibido);
    }
  });

  it('não anuncia imagem local ou referência blob como cópia válida', () => {
    const projecao = projetarConteudoRecuperacao(origem(), { professorId: 'p' });

    expect(projecao.questoes[1].imagens).toEqual([]);
    expect(projecao.avisos.map(a => a.codigo)).toContain('IMAGEM_INDISPONIVEL');
    expect(projecao.avisos.some(a => a.questaoId === 'q2')).toBe(true);
    expect(projecao.avisos.map(a => a.codigo)).toContain('MATERIAL_INDISPONIVEL');
    expect(JSON.stringify(projecao)).not.toMatch(/blob:|file:/);
  });

  it('produz clone independente: mutar a cópia não altera a origem', () => {
    const base = origem();
    const projecao = projetarConteudoRecuperacao(base, { professorId: 'p' });

    projecao.titulo = 'Outro título';
    projecao.questoes[0].enunciado = 'Outro enunciado';
    projecao.questoes[0].alternativas[0].texto = 'Alterada';
    projecao.questoes[0].imagens[0].base64 = 'data:image/png;base64,BBBB';
    projecao.textosBase[0].html = '<p>Alterado</p>';
    projecao.materiais[0].texto = 'Alterado';
    projecao.materialApoio.textoExtraido = 'Alterado';

    expect(base.titulo).toBe('Recuperação de frações');
    expect(base.questoes[0].enunciado).toBe('Qual é a fração equivalente?');
    expect(base.questoes[0].alternativas[0].texto).toBe('1/2');
    expect(base.questoes[0].imagens[0].base64).toBe('data:image/png;base64,AAAA');
    expect(base.textosBase[0].html).toBe('<p>Base</p>');
    expect(base.materiais[0].texto).toBe('Conteúdo do material');
    expect(base.materialApoio.textoExtraido).toBe('Texto de apoio');
  });

  it('recusa origem de outra conta, não recuperação e atividade adaptada com explicação', () => {
    expect(codigo(() => validarOrigemCopia(origem(), { professorId: 'outro' })))
      .toBe(CODIGOS_COPIA.OUTRA_CONTA);
    expect(codigo(() => validarOrigemCopia({ ...origem(), finalidade: 'regular' }, { professorId: 'p' })))
      .toBe(CODIGOS_COPIA.ORIGEM_INVALIDA);
    expect(codigo(() => validarOrigemCopia({ ...origem(), alunoExclusivoId: 'a' }, { professorId: 'p' })))
      .toBe(CODIGOS_COPIA.ADAPTADA);
    expect(codigo(() => validarOrigemCopia({ ...origem(), tipoAtividade: 'adaptada' }, { professorId: 'p' })))
      .toBe(CODIGOS_COPIA.ADAPTADA);
  });
});

describe('R82-03: destino elegível e revalidação', () => {
  it('lista apenas conjuntos próprios de outra turma, vigentes, com ano e alunos compatíveis', () => {
    const conjuntos = [
      destino(),
      destino({ id: 'c1', turmaId: 't1', destinatariosIds: ['a'] }),
      destino({ id: 'cancelado', estado: 'cancelado' }),
      destino({ id: 'congelado', congelado: true }),
      destino({ id: 'outro-ano', anoLetivo: '2025' }),
      destino({ id: 'sem-aluno', destinatariosIds: ['fora'] }),
      destino({ id: 'cheio', escalas: { x: 10 }, atividadeIds: ['x'] }),
      destino({ id: 'alheio', professorId: 'outro' }),
    ];

    const { elegiveis, indisponiveis } = avaliarDestinosCopia({
      conjuntos,
      turmas: [{ id: 't1', nome: 'Turma A', anoLetivo: 2026 }, turmaB],
      professorId: 'p',
      origem: origem(),
    });

    expect(elegiveis.map(d => d.conjunto.id)).toEqual(['c2']);
    expect(elegiveis[0]).toMatchObject({ restante: 10, cabe: true, completaComCopia: false });
    expect(indisponiveis.map(d => [d.conjunto.id, d.motivo])).toEqual([
      ['c1', 'mesma_turma'],
      ['cancelado', 'cancelado'],
      ['congelado', 'congelado'],
      ['outro-ano', 'ano_incompativel'],
      ['sem-aluno', 'aluno_fora_da_turma'],
      ['cheio', 'saldo_insuficiente'],
      ['alheio', 'outra_conta'],
    ]);
  });

  it('revalida conta, turma, estado, versão, ano, destinatários e saldo', () => {
    const base = {
      origem: origem(),
      destino: destino(),
      professorId: 'p',
      turma: turmaB,
      versaoEsperada: 3,
      pontos: 4,
    };

    expect(codigo(() => validarDestinoCopia(base))).toBeNull();
    expect(codigo(() => validarDestinoCopia({ ...base, professorId: 'outro' })))
      .toBe(CODIGOS_COPIA.OUTRA_CONTA);
    expect(codigo(() => validarDestinoCopia({ ...base, destino: destino({ turmaId: 't1' }) })))
      .toBe(CODIGOS_COPIA.MESMA_TURMA);
    expect(codigo(() => validarDestinoCopia({ ...base, destino: destino({ estado: 'cancelado' }) })))
      .toBe(CODIGOS_COPIA.DESTINO_CANCELADO);
    expect(codigo(() => validarDestinoCopia({ ...base, destino: destino({ congelado: true }) })))
      .toBe(CODIGOS_COPIA.DESTINO_CONGELADO);
    expect(codigo(() => validarDestinoCopia({ ...base, destino: destino({ versao: 4 }) })))
      .toBe(CODIGOS_COPIA.DESTINO_OBSOLETO);
    expect(codigo(() => validarDestinoCopia({ ...base, destino: destino({ anoLetivo: '2025' }) })))
      .toBe(CODIGOS_COPIA.ANO_INCOMPATIVEL);
    expect(codigo(() => validarDestinoCopia({ ...base, destino: destino({ destinatariosIds: ['fora'] }) })))
      .toBe(CODIGOS_COPIA.DESTINATARIO_INVALIDO);
    expect(codigo(() => validarDestinoCopia({
      ...base,
      destino: destino({ escalas: { outra: 7 }, atividadeIds: ['outra'] }),
    }))).toBe(CODIGOS_COPIA.SALDO_INSUFICIENTE);
  });
});

describe('R82-02/R82-04: montagem da nova atividade', () => {
  it('usa novo ID, contexto do destino, prazo confirmado e tokens apenas do destino', () => {
    const payload = montarAtividadeCopiada({
      origem: origem(),
      destino: destino(),
      professorId: 'p',
      turmaDestino: turmaB,
      dados: dadosRevisados(),
      versaoEsperada: 3,
    });

    expect(payload).toMatchObject({
      id: 'atv_nova',
      finalidade: 'recuperacao_semestral',
      conjuntoRecuperacaoId: 'c2',
      conjuntoVersao: 3,
      turmaIds: ['t2'],
      turmas: ['t2'],
      semestre: '2',
      anoLetivo: '2026',
      destinatariosIds: ['b'],
      notaMaxima: 4,
      titulo: 'Recuperação de frações',
    });
    expect(payload.alunosPorTurma).toEqual({ t2: [{ id: 'b', nome: 'Bia' }] });
    expect(payload.dataEntrega.toISOString()).toBe(new Date('2099-05-01T23:59:00').toISOString());
    expect(payload.questoes[0].gabarito).toBe('A');
    expect(payload.questoes[0].alternativas[0]).toEqual({ id: 'A', texto: '1/2' });

    const serializado = JSON.stringify(payload);
    for (const proibido of [
      'origem-1', 'resposta discente', 'feedback discente', 'segredo-da-origem',
      'alunoExclusivoId', 'historico', 'metadados', 'publicado', 'token',
    ]) {
      expect(serializado).not.toContain(proibido);
    }
    expect(payload.dataEntrega.toISOString()).not.toBe(origem().dataEntrega.toISOString());
  });

  it('recusa origem adaptada, ID reutilizado, prazo inválido e conteúdo sem gabarito válido', () => {
    const base = {
      origem: origem(),
      destino: destino(),
      professorId: 'p',
      turmaDestino: turmaB,
      dados: dadosRevisados(),
      versaoEsperada: 3,
    };

    expect(codigo(() => montarAtividadeCopiada({
      ...base,
      origem: { ...origem(), alunoExclusivoId: 'a' },
    }))).toBe(CODIGOS_COPIA.ADAPTADA);

    expect(codigo(() => montarAtividadeCopiada({
      ...base,
      dados: dadosRevisados({ id: 'origem-1' }),
    }))).toBe(CODIGOS_COPIA.ID_INVALIDO);

    expect(codigo(() => montarAtividadeCopiada({
      ...base,
      dados: dadosRevisados({ dataEntrega: 'data-invalida' }),
    }))).toBe(CODIGOS_COPIA.PRAZO_INVALIDO);

    expect(codigo(() => montarAtividadeCopiada({
      ...base,
      dados: dadosRevisados({
        questoes: [{
          id: 'q1', tipo: 'objetiva', enunciado: 'Qual?', notaMaxima: 4,
          alternativas: [{ id: 'A', texto: 'Certa' }, { id: 'B', texto: 'Errada' }],
          gabarito: 'C',
        }],
      }),
    }))).toBe(CODIGOS_COPIA.CONTEUDO_INVALIDO);
  });
});
