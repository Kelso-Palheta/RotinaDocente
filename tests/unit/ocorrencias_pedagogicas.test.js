import { describe, it, expect } from 'vitest';
import {
  adicionarOcorrencia,
  filtrarOcorrencias,
  removerOcorrencia,
  TIPOS_OCORRENCIA,
} from '../../frontend/src/dominio/diario/ocorrenciasPedagogicas';

describe('UT-32: Diário de Bordo & Ocorrências Pedagógicas (RN-58)', () => {
  const ocorrenciasIniciais = [
    {
      id: 'oc-1',
      data: '2026-03-10',
      tipo: 'pedagogica',
      titulo: 'Dificuldade na interpretação de texto dissertativo',
      descricao: 'Aluno apresentou bloqueio na elaboração da tese inicial.',
      alunoIds: ['aluno-1'],
      visivelFamilia: true,
      criadoEm: '2026-03-10T10:00:00Z',
    },
    {
      id: 'oc-2',
      data: '2026-03-12',
      tipo: 'elogio',
      titulo: 'Destaque na mediação do debate em grupo',
      descricao: 'Liderança colaborativa e excelente argumentação oral.',
      alunoIds: ['aluno-2'],
      visivelFamilia: true,
      criadoEm: '2026-03-12T14:30:00Z',
    },
    {
      id: 'oc-3',
      data: '2026-03-15',
      tipo: 'comportamental',
      titulo: 'Dispersão contínua com celular durante a aula',
      descricao: 'Foi advertido verbalmente e orientado a guardar o aparelho na mochila.',
      alunoIds: ['aluno-1'],
      visivelFamilia: false,
      criadoEm: '2026-03-15T09:15:00Z',
    },
  ];

  it('deve listar os 4 tipos canônicos de ocorrência suportados', () => {
    expect(TIPOS_OCORRENCIA).toContain('pedagogica');
    expect(TIPOS_OCORRENCIA).toContain('comportamental');
    expect(TIPOS_OCORRENCIA).toContain('elogio');
    expect(TIPOS_OCORRENCIA).toContain('alinhamento_familia');
  });

  it('deve adicionar uma nova ocorrência válida com ID e ordenação por data decrescente', () => {
    const nova = {
      data: '2026-03-20',
      tipo: 'alinhamento_familia',
      titulo: 'Reunião de alinhamento com a mãe do estudante',
      descricao: 'Alinhada a rotina de estudos em casa e uso do cronograma.',
      alunoIds: ['aluno-1'],
      visivelFamilia: true,
    };

    const resultado = adicionarOcorrencia(ocorrenciasIniciais, nova);

    expect(resultado.length).toBe(4);
    // A ocorrência mais recente (2026-03-20) deve estar na primeira posição
    expect(resultado[0].data).toBe('2026-03-20');
    expect(resultado[0].id).toBeDefined();
    expect(resultado[0].criadoEm).toBeDefined();
    expect(resultado[0].tipo).toBe('alinhamento_familia');
  });

  it('deve rejeitar ocorrência com tipo inválido ou campos obrigatórios vazios', () => {
    expect(() =>
      adicionarOcorrencia(ocorrenciasIniciais, {
        data: '2026-03-10',
        tipo: 'tipo_invalido',
        titulo: 'Teste',
        descricao: 'Desc',
      })
    ).toThrow(/tipo/i);

    expect(() =>
      adicionarOcorrencia(ocorrenciasIniciais, {
        data: '2026-03-10',
        tipo: 'pedagogica',
        titulo: '',
        descricao: 'Desc',
      })
    ).toThrow(/título/i);

    expect(() =>
      adicionarOcorrencia(ocorrenciasIniciais, {
        data: '2026-03-10',
        tipo: 'pedagogica',
        titulo: 'Título',
        descricao: '   ',
      })
    ).toThrow(/descrição/i);
  });

  it('deve filtrar ocorrências por tipo, alunoId, termo de busca e visibilidade para a família', () => {
    // Filtro por tipo
    const apenasElogios = filtrarOcorrencias(ocorrenciasIniciais, { tipo: 'elogio' });
    expect(apenasElogios.length).toBe(1);
    expect(apenasElogios[0].id).toBe('oc-2');

    // Filtro por alunoId
    const ocorrenciasAluno1 = filtrarOcorrencias(ocorrenciasIniciais, { alunoId: 'aluno-1' });
    expect(ocorrenciasAluno1.length).toBe(2);

    // Filtro por termo textual (case insensitive)
    const buscaDebate = filtrarOcorrencias(ocorrenciasIniciais, { termo: 'DEBATE' });
    expect(buscaDebate.length).toBe(1);
    expect(buscaDebate[0].id).toBe('oc-2');

    // Filtro apenas visíveis para família
    const paraFamilia = filtrarOcorrencias(ocorrenciasIniciais, { apenasFamilia: true });
    expect(paraFamilia.length).toBe(2);
    expect(paraFamilia.every((o) => o.visivelFamilia)).toBe(true);
  });

  it('deve remover uma ocorrência pelo ID de forma imutável', () => {
    const atualizadas = removerOcorrencia(ocorrenciasIniciais, 'oc-2');
    expect(atualizadas.length).toBe(2);
    expect(atualizadas.find((o) => o.id === 'oc-2')).toBeUndefined();
    // O array original deve permanecer inalterado
    expect(ocorrenciasIniciais.length).toBe(3);
  });
});
