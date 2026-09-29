import { describe, it, expect } from 'vitest';
import {
  CATEGORIAS_DEFICIENCIA,
  CATEGORIAS_MAP,
} from '../../frontend/src/dominio/adaptacoes/CategoriasDeficiencia';
import { normalizarNecessidadesTexto } from '../../frontend/src/dominio/adaptacoes/ImportadorAlunosLote';
import {
  sanitizarNecessidades,
  criarAlunoDiario,
  atualizarAlunoDiario,
} from '../../frontend/src/dominio/diario/AlunoDiario';

const IDS_BASE = [
  'tea', 'di', 'tdah', 'baixa_visao', 'cegueira',
  'surdez', 'motora', 'dislexia', 'discalculia', 'ah_sd',
];
const IDS_AMPLIADOS = ['epilepsia', 'ansiedade', 'toc', 'conduta', 'outras_condicoes'];

describe('UT-29 (RN-32): Catálogo Ampliado de 15 Categorias DUA', () => {
  it('deve conter as 10 categorias base e as 5 categorias ampliadas', () => {
    const ids = CATEGORIAS_DEFICIENCIA.map((c) => c.id);
    IDS_BASE.forEach((id) => expect(ids).toContain(id));
    IDS_AMPLIADOS.forEach((id) => expect(ids).toContain(id));
    expect(CATEGORIAS_DEFICIENCIA.length).toBe(15);
    expect(Object.keys(CATEGORIAS_MAP).length).toBe(15);
  });

  it('todas as categorias devem possuir id, nome, tag, descricao e diretrizesDUA não vazias', () => {
    CATEGORIAS_DEFICIENCIA.forEach((cat) => {
      expect(cat.id).toBeDefined();
      expect(cat.nome).toBeDefined();
      expect(cat.tag).toBeDefined();
      expect(cat.descricao).toBeDefined();
      expect(Array.isArray(cat.diretrizesDUA)).toBe(true);
      expect(cat.diretrizesDUA.length).toBeGreaterThan(0);
    });
  });

  it('as categorias ampliadas devem cobrir as condições da lista PCD com diretrizes próprias', () => {
    expect(obterDiretrizes('epilepsia').join(' ')).toMatch(/estrobosc|piscant/i);
    expect(obterDiretrizes('ansiedade').join(' ')).toMatch(/tempo adicional|acolhedor/i);
    expect(obterDiretrizes('toc').join(' ')).toMatch(/pausa|prazo/i);
    expect(obterDiretrizes('conduta').join(' ')).toMatch(/reforço positivo|blocos curtos/i);
    expect(obterDiretrizes('outras_condicoes').join(' ')).toMatch(/relatório|acompanhamento|individualiza/i);
  });
});

function obterDiretrizes(id) {
  return CATEGORIAS_MAP[id]?.diretrizesDUA || [];
}

describe('UT-30 (RN-41): Sinônimos Corrigidos do Normalizador', () => {
  it('deve mapear F71 "Retardo Moderado" para di', () => {
    expect(normalizarNecessidadesTexto('F71 Retardo Moderado')).toEqual(['di']);
    expect(normalizarNecessidadesTexto('F71.1 Retardo Mental Moderado')).toEqual(['di']);
  });

  it('deve mapear a grafia "TDH" para tdah', () => {
    expect(normalizarNecessidadesTexto('TDH')).toEqual(['tdah']);
    expect(normalizarNecessidadesTexto('F42 Transt. Obsessivo Compulsivo/TDH')).toEqual(['tdah', 'toc']);
  });

  it('deve mapear dificuldade com cálculo para discalculia', () => {
    expect(normalizarNecessidadesTexto('dificuldade com cálculo matemático')).toEqual(['discalculia']);
  });

  it('deve mapear epilepsia (G40 / Pré-Epilepsia) para epilepsia', () => {
    expect(normalizarNecessidadesTexto('CID G40- Epilepsia')).toEqual(['epilepsia']);
    expect(normalizarNecessidadesTexto('G40.9 Pré-Epilepsia')).toEqual(['epilepsia']);
  });

  it('deve mapear transtornos de ansiedade (F40/F41/fobia social) para ansiedade', () => {
    expect(normalizarNecessidadesTexto('F40.1-Fobia Social')).toEqual(['ansiedade']);
    expect(normalizarNecessidadesTexto('F41.2')).toEqual(['ansiedade']);
    expect(normalizarNecessidadesTexto('sintomas típicos de ansiedade')).toEqual(['ansiedade']);
  });

  it('deve mapear TOC (F42 / obsessivo-compulsivo) para toc', () => {
    expect(normalizarNecessidadesTexto('F42')).toEqual(['toc']);
    expect(normalizarNecessidadesTexto('Obsessivo Compulsivo')).toEqual(['toc']);
  });

  it('deve mapear transtornos de conduta (F91 / opositor / hipercinético) para conduta', () => {
    expect(normalizarNecessidadesTexto('F91')).toEqual(['conduta']);
    expect(normalizarNecessidadesTexto('Transt. Opositor Desafiador')).toEqual(['conduta']);
    expect(normalizarNecessidadesTexto('Transt. Hipercinético de conduta')).toEqual(['conduta']);
  });

  it('deve mapear outras condições de saúde (hidrocefalia / síndromes / Q90) para outras_condicoes', () => {
    expect(normalizarNecessidadesTexto('Hidrocefalia')).toEqual(['outras_condicoes']);
    expect(normalizarNecessidadesTexto('Q90.1 SINDROMES EDWADS e PATAU')).toEqual(['outras_condicoes']);
    expect(normalizarNecessidadesTexto('CID sob investigação sendo acompanhado no CAPS')).toEqual(['outras_condicoes']);
  });

  it('não deve gerar falso-positivo em textos genéricos', () => {
    expect(normalizarNecessidadesTexto('Outra condição não listada')).toEqual([]);
    expect(normalizarNecessidadesTexto('')).toEqual([]);
    expect(normalizarNecessidadesTexto(null)).toEqual([]);
  });
});

describe('UT-31 (RN-41 & RN-43): Cobertura Integral da Lista PCD 2026 (13 estudantes)', () => {
  const listaPCD2026 = [
    { nome: 'Ana Beatriz de França Mastop', turma: '101', texto: 'investigando suspeita de AUTISMO LEVE, dificuldade com cálculo matemático, sem laudo', esperado: ['tea', 'discalculia'] },
    { nome: 'Gabriel Nascimento de Souza', turma: '102', texto: 'CID F-71 Retardo Moderado, F84 AUTISTA, G 40 EPILEPSIA, Q90.1 SINDROMES EDWADS e PATAU - malformações com risco de morte, com laudo', esperado: ['tea', 'di', 'epilepsia', 'outras_condicoes'] },
    { nome: 'Marcos da Silva Sousa', turma: '102', texto: 'CID F42 Transt. Obsessivo Compulsivo/TDH, F84.0 AUTISTA', esperado: ['toc', 'tdah', 'tea'] },
    { nome: 'Mateus da Silva Sousa', turma: '102', texto: 'CID 10:F40.1-Fobia Social e CID11: 6B04- Social Auxiety Disorder - tem sintomas típicos de ansiedade quando avaliado negativamente 6B04- Obsessivo-Compulssive Disorder / 6A03 Devolupmental Learning Disorder, 6A02 AUTISMO SPECTRUM DISORDER', esperado: ['ansiedade', 'toc', 'tea'] },
    { nome: 'Kayque Gustavo Santana', turma: '103', texto: 'Hidrocefalia, CID sob investigação sendo acompanhado no CAPS, precisa de acompanhamento e ajuda para fazer suas atividades, escreve devagar e não ler, sem laudo', esperado: ['outras_condicoes'] },
    { nome: 'Ismael Pereira Lobato', turma: '103', texto: 'AUTISTA nível 1 e Transt. Opositor Desafiador, com laudo', esperado: ['tea', 'conduta'] },
    { nome: 'Lucas dos Santos Rosário', turma: '103', texto: 'CID 10: F81.0. Transt. Específico de LEITURA, DISLEXIA, transt. Das habilidades escolares. Não faz tarefas só, precisa de ajuda do professor', esperado: ['dislexia'] },
    { nome: 'Felipe Lopes Cardoso', turma: '1ºano', texto: 'CID F84.0 e F11 - Autismo e atraso Intelectual, ler pouco e não consegue pedir ajuda para o professor, com laudo', esperado: ['tea', 'di'] },
    { nome: 'Suelem Vitória Monteiro dos Santos', turma: '103', texto: 'CID 10: F84.1 - Autismo Atípico, limitação social, Laboral e Cognitiva', esperado: ['tea'] },
    { nome: 'Gabryelle Aquino da Silva', turma: '103', texto: 'CID: F41.2 e F70.0 - Retardo Mental e Deficiência Intelectual Leve, precisa de ajuda do professor para leitura e escrita', esperado: ['ansiedade', 'di'] },
    { nome: 'Bruno Silva da Costa', turma: '203', texto: 'CID F84.1 AUTISTA ATÍPICO, F91 Transt. Hipercinético de conduta. TDH, F71.1 Retardo Mental Moderado, não ler', esperado: ['tea', 'conduta', 'tdah', 'di'] },
    { nome: 'Kauã Ronaldo Pantoja de Sousa', turma: '302', texto: 'CID G40 - Epilepsia, com laudo', esperado: ['epilepsia'] },
    { nome: 'Lucas Sousa da Silva', turma: '302', texto: 'G40.9 Pré-Epilepsia, em pesquisa sem laudo', esperado: ['epilepsia'] },
  ];

  it('deve reconhecer ao menos 1 categoria para todos os 13 estudantes', () => {
    listaPCD2026.forEach((aluno) => {
      const ids = normalizarNecessidadesTexto(aluno.texto);
      expect(ids.length, `${aluno.nome} ficou sem nenhuma categoria`).toBeGreaterThan(0);
    });
  });

  it('deve reconhecer todas as condições essenciais de cada estudante', () => {
    listaPCD2026.forEach((aluno) => {
      const ids = normalizarNecessidadesTexto(aluno.texto);
      aluno.esperado.forEach((esperado) => {
        expect(ids, `${aluno.nome} deveria mapear "${esperado}" (obteve: ${ids.join(', ')})`).toContain(esperado);
      });
    });
  });

  it('não deve inventar categorias não descritas na lista (ex.: aluno sem deficiência mapeada)', () => {
    expect(normalizarNecessidadesTexto('sem deficiência declarada')).toEqual([]);
  });
});

describe('UT-32 (RN-43): Entidade AlunoDiario do Diário Pedagógico', () => {
  describe('sanitizarNecessidades', () => {
    it('deve manter apenas IDs válidos do catálogo, sem duplicatas e em ordem de entrada', () => {
      expect(sanitizarNecessidades(['tea', 'TEA ', 'invalido', 'di', 42, null, 'di']))
        .toEqual(['tea', 'di']);
    });

    it('deve retornar array vazio para entradas que não são array', () => {
      expect(sanitizarNecessidades(null)).toEqual([]);
      expect(sanitizarNecessidades(undefined)).toEqual([]);
      expect(sanitizarNecessidades('tea')).toEqual([]);
      expect(sanitizarNecessidades({ 0: 'tea' })).toEqual([]);
    });

    it('deve descartar todas as categorias ampliadas inválidas antigas sem quebrar', () => {
      expect(sanitizarNecessidades(['epilepsia', 'ansiedade', 'toc', 'conduta', 'outras_condicoes']))
        .toEqual(['epilepsia', 'ansiedade', 'toc', 'conduta', 'outras_condicoes']);
    });
  });

  describe('criarAlunoDiario', () => {
    it('deve criar aluno com necessidades sanitizadas', () => {
      const aluno = criarAlunoDiario({
        id: 'al_1',
        nome: 'Gabriel Nascimento de Souza',
        dataNascimento: '1503',
        necessidades: ['tea', 'falso_id', 'epilepsia'],
      });
      expect(aluno).toEqual({
        id: 'al_1',
        nome: 'Gabriel Nascimento de Souza',
        dataNascimento: '1503',
        necessidades: ['tea', 'epilepsia'],
      });
    });

    it('deve omitir o campo necessidades quando vazio ou todo inválido (dados legados)', () => {
      const semNec = criarAlunoDiario({ id: 'al_2', nome: 'Aluno Comum' });
      expect('necessidades' in semNec).toBe(false);

      const invalidas = criarAlunoDiario({ id: 'al_3', nome: 'Outro', necessidades: ['nao_existe'] });
      expect('necessidades' in invalidas).toBe(false);

      const vazio = criarAlunoDiario({ id: 'al_4', nome: 'Mais Um', necessidades: [] });
      expect('necessidades' in vazio).toBe(false);
    });

    it('deve omitir dataNascimento vazia', () => {
      const aluno = criarAlunoDiario({ id: 'al_5', nome: 'Sem Data', dataNascimento: '' });
      expect('dataNascimento' in aluno).toBe(false);
    });
  });

  describe('atualizarAlunoDiario', () => {
    it('deve fazer merge preservando nome, id e dataNascimento', () => {
      const aluno = criarAlunoDiario({ id: 'al_6', nome: 'Suelem', dataNascimento: '0101', necessidades: ['tea'] });
      const atualizado = atualizarAlunoDiario(aluno, { necessidades: ['tea', 'di'] });
      expect(atualizado.id).toBe('al_6');
      expect(atualizado.nome).toBe('Suelem');
      expect(atualizado.dataNascimento).toBe('0101');
      expect(atualizado.necessidades).toEqual(['tea', 'di']);
    });

    it('deve sanitizar necessidades atualizadas e remover o campo quando esvaziado', () => {
      const aluno = criarAlunoDiario({ id: 'al_7', nome: 'Bruno', necessidades: ['tea'] });

      const comInvalidas = atualizarAlunoDiario(aluno, { necessidades: ['tea', 'id_invalido'] });
      expect(comInvalidas.necessidades).toEqual(['tea']);

      const esvaziado = atualizarAlunoDiario(aluno, { necessidades: [] });
      expect('necessidades' in esvaziado).toBe(false);

      const comLixo = atualizarAlunoDiario(aluno, { necessidades: ['lixo1', 'lixo2'] });
      expect('necessidades' in comLixo).toBe(false);
    });

    it('deve alterar outros campos sem tocar nas necessidades quando não informadas', () => {
      const aluno = criarAlunoDiario({ id: 'al_8', nome: 'Ana', necessidades: ['tea', 'discalculia'] });
      const atualizado = atualizarAlunoDiario(aluno, { dataNascimento: '2802' });
      expect(atualizado.necessidades).toEqual(['tea', 'discalculia']);
      expect(atualizado.dataNascimento).toBe('2802');
    });
  });
});
