import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as xlsx from 'xlsx';
import {
  normalizarNecessidadesTexto,
  parsePlanilhaAlunos,
  gerarModeloPlanilhaExemplo,
} from '../../frontend/src/dominio/adaptacoes/ImportadorAlunosLote';
import { AlunoAdaptadoRepository } from '../../frontend/src/infraestrutura/adaptacoes/AlunoAdaptadoRepository';

describe('UT-24 (RN-41): Importador em Lote de Estudantes PEI / Inclusivos', () => {
  describe('normalizarNecessidadesTexto', () => {
    it('deve mapear termos comuns e siglas para o ID oficial da categoria', () => {
      expect(normalizarNecessidadesTexto('Autismo')).toEqual(['tea']);
      expect(normalizarNecessidadesTexto('TEA')).toEqual(['tea']);
      expect(normalizarNecessidadesTexto('Asperger')).toEqual(['tea']);
      expect(normalizarNecessidadesTexto('Deficiência Intelectual')).toEqual(['di']);
      expect(normalizarNecessidadesTexto('DI')).toEqual(['di']);
      expect(normalizarNecessidadesTexto('TDAH')).toEqual(['tdah']);
      expect(normalizarNecessidadesTexto('Hiperatividade e Desatenção')).toEqual(['tdah']);
      expect(normalizarNecessidadesTexto('Baixa Visão')).toEqual(['baixa_visao']);
      expect(normalizarNecessidadesTexto('Cegueira')).toEqual(['cegueira']);
      expect(normalizarNecessidadesTexto('Surdez')).toEqual(['surdez']);
      expect(normalizarNecessidadesTexto('Deficiente Auditivo')).toEqual(['surdez']);
      expect(normalizarNecessidadesTexto('Física / Motora')).toEqual(['motora']);
      expect(normalizarNecessidadesTexto('Cadeirante')).toEqual(['motora']);
      expect(normalizarNecessidadesTexto('Dislexia')).toEqual(['dislexia']);
      expect(normalizarNecessidadesTexto('Discalculia')).toEqual(['discalculia']);
      expect(normalizarNecessidadesTexto('Altas Habilidades')).toEqual(['ah_sd']);
      expect(normalizarNecessidadesTexto('Superdotação')).toEqual(['ah_sd']);
      expect(normalizarNecessidadesTexto('AH/SD')).toEqual(['ah_sd']);
    });

    it('deve identificar e combinar múltiplas deficiências na mesma célula', () => {
      const res1 = normalizarNecessidadesTexto('Autismo e TDAH');
      expect(res1).toContain('tea');
      expect(res1).toContain('tdah');
      expect(res1.length).toBe(2);

      const res2 = normalizarNecessidadesTexto('TEA, Deficiência Intelectual; Baixa Visão');
      expect(res2).toEqual(expect.arrayContaining(['tea', 'di', 'baixa_visao']));
      expect(res2.length).toBe(3);

      const res3 = normalizarNecessidadesTexto('Dislexia + TDAH');
      expect(res3).toEqual(expect.arrayContaining(['dislexia', 'tdah']));
    });

    it('deve retornar array vazio se não houver termos reconhecidos', () => {
      expect(normalizarNecessidadesTexto('')).toEqual([]);
      expect(normalizarNecessidadesTexto(null)).toEqual([]);
      expect(normalizarNecessidadesTexto('Outra condição não listada')).toEqual([]);
    });
  });

  describe('parsePlanilhaAlunos', () => {
    it('deve extrair e instanciar alunos inclusivos a partir de um buffer de Excel (.xlsx)', async () => {
      // Cria workbook em memória
      const dados = [
        {
          'Nome do Aluno': 'Ana Beatriz Mastop',
          Turma: '101',
          Deficiência: 'Autismo (TEA)',
          'Nível de Suporte': '1',
          Hiperfoco: 'Desenho e Artes',
          Observações: 'Prefere instruções visuais curtas',
        },
        {
          'Nome do Aluno': 'Lucas Gabriel Souza',
          Turma: '102',
          Deficiência: 'TDAH e Dislexia',
          'Nível de Suporte': '2',
          Hiperfoco: 'Robótica e Jogos',
          Observações: 'Gosta de pausas de 5 minutos',
        },
        {
          'Nome do Aluno': 'Mariana Lima',
          Turma: '103',
          Deficiência: 'Baixa Visão',
          'Nível de Suporte': 1,
          Hiperfoco: '',
          Observações: 'Necessita fonte ampliada 20pt',
        },
      ];

      const ws = xlsx.utils.json_to_sheet(dados);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Estudantes');
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const resultado = await parsePlanilhaAlunos(buffer);
      expect(resultado.sucesso).toBe(true);
      expect(resultado.alunos.length).toBe(3);

      const aluno1 = resultado.alunos[0];
      expect(aluno1.nome).toBe('Ana Beatriz Mastop');
      expect(aluno1.turmaNome).toBe('101');
      expect(aluno1.necessidades).toEqual(['tea']);
      expect(aluno1.nivelSuporte).toBe(1);
      expect(aluno1.hiperfoco).toBe('Desenho e Artes');

      const aluno2 = resultado.alunos[1];
      expect(aluno2.nome).toBe('Lucas Gabriel Souza');
      expect(aluno2.turmaNome).toBe('102');
      expect(aluno2.necessidades).toEqual(expect.arrayContaining(['tdah', 'dislexia']));
      expect(aluno2.nivelSuporte).toBe(2);
    });

    it('deve extrair alunos de texto em formato CSV com ponto-e-vírgula', async () => {
      const csvContent =
        'Nome;Turma;Deficiência;Nível\n' +
        'Gabriel Oliveira;3º Ano B;Surdez;1\n' +
        'Beatriz Castro;2º Ano A;Deficiência Intelectual e TEA;2\n';

      const resultado = await parsePlanilhaAlunos(csvContent);
      expect(resultado.sucesso).toBe(true);
      expect(resultado.alunos.length).toBe(2);

      expect(resultado.alunos[0].nome).toBe('Gabriel Oliveira');
      expect(resultado.alunos[0].turmaNome).toBe('3º Ano B');
      expect(resultado.alunos[0].necessidades).toEqual(['surdez']);

      expect(resultado.alunos[1].nome).toBe('Beatriz Castro');
      expect(resultado.alunos[1].necessidades).toEqual(expect.arrayContaining(['di', 'tea']));
    });

    it('deve ignorar linhas sem nome ou sem deficiência e registrar nos alertas', async () => {
      const dados = [
        { Nome: '', Turma: '101', Deficiência: 'TEA' }, // Sem nome
        { Nome: 'João Sem Deficiência', Turma: '102', Deficiência: '' }, // Sem deficiência
        { Nome: 'Pedro Válido', Turma: '103', Deficiência: 'TDAH' }, // Válido
      ];
      const ws = xlsx.utils.json_to_sheet(dados);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Alunos');
      const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

      const resultado = await parsePlanilhaAlunos(buffer);
      expect(resultado.alunos.length).toBe(1);
      expect(resultado.alunos[0].nome).toBe('Pedro Válido');
      expect(resultado.avisos.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('gerarModeloPlanilhaExemplo', () => {
    it('deve gerar dados ou arquivo de modelo com colunas recomendadas', () => {
      const modelo = gerarModeloPlanilhaExemplo();
      expect(modelo).toBeDefined();
      expect(modelo.colunas).toContain('Nome');
      expect(modelo.colunas).toContain('Turma');
      expect(modelo.colunas).toContain('Deficiência');
      expect(modelo.linhasExemplo.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('IT-08 (RN-41): Persistência em Lote de Alunos no Repositório', () => {
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockStorage[key] = String(value);
      }),
      removeItem: vi.fn((key) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    });
    vi.restoreAllMocks();
  });


  it('deve salvar lista de múltiplos alunos simultaneamente com salvarAlunosLote', async () => {
    const repository = new AlunoAdaptadoRepository();
    const mockAlunos = [
      {
        id: 'aluno_1',
        nome: 'Aluno Um',
        turmaNome: 'Turma A',
        necessidades: ['tea'],
        nivelSuporte: 1,
      },
      {
        id: 'aluno_2',
        nome: 'Aluno Dois',
        turmaNome: 'Turma B',
        necessidades: ['tdah', 'dislexia'],
        nivelSuporte: 2,
      },
    ];

    const salvos = await repository.salvarAlunosLote('prof_123', mockAlunos);
    expect(salvos.length).toBe(2);

    const listados = await repository.listarAlunos('prof_123');
    expect(listados.length).toBe(2);
    expect(listados[0].nome).toBe('Aluno Um');
    expect(listados[1].nome).toBe('Aluno Dois');
  });
});
