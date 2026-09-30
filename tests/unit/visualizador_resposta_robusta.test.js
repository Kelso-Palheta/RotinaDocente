import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('@/hooks/useAIConfig', () => ({
  useAIConfig: () => ({ temChave: false, getAIHeaders: () => ({}) }),
}));

import { VisualizadorAtividadeAdaptada } from '@/components/adaptacoes/VisualizadorAtividadeAdaptada';
import { normalizarRespostaGeracao } from '@/dominio/adaptacoes/RespostaGeracaoAdaptada';

const NOOPS = {
  onVoltar: () => {},
  onSalvarNoBanco: () => {},
  onAbrirBanco: () => {},
  onSalvarQuestoesNoBanco: () => {},
  onSalvarQuestaoIndividual: () => {},
};

const respostaCanonica = () => ({
  sucesso: true,
  titulo: 'Fotossíntese Adaptada',
  disciplina: 'Ciências',
  anoEscolar: '7º Ano',
  aluno: { nome: 'Lucas', necessidades: ['tea'] },
  diretrizesHarmonizadas: ['Linguagem direta e literal'],
  atividadeAdaptada: {
    instrucoesAluno: 'Leia cada questão com calma.',
    questoes: [
      {
        numero: 1,
        enunciado: 'O que é fotossíntese?',
        tipo: 'discursiva_curta',
        alternativas: [],
      },
    ],
  },
  guiaMediacao: {
    objetivoPedagogicoInalterado: 'Compreender a transformação de energia.',
    tempoEstimado: '30 minutos.',
    passoAPassoProfessor: ['Apoie a leitura do enunciado.'],
    antecipacaoComportamental: 'Ofereça pausas se necessário.',
    criteriosAvaliacaoFlexibilizada: 'Aceitar resposta oral.',
  },
});

const renderizar = (resultado) =>
  renderToString(
    React.createElement(VisualizadorAtividadeAdaptada, { resultado, ...NOOPS })
  );

describe('UT-40 (RN-48): VisualizadorAtividadeAdaptada tolera respostas malformadas da IA', () => {
  it('(a) renderiza com guiaMediacao, atividadeAdaptada, aluno e diretrizesHarmonizadas nulos', () => {
    const resposta = {
      ...respostaCanonica(),
      guiaMediacao: null,
      atividadeAdaptada: null,
      aluno: null,
      diretrizesHarmonizadas: null,
    };
    expect(() => renderizar(resposta)).not.toThrow();
  });

  it('(b) renderiza com atividadeAdaptada.questoes como objeto mapeado (não-array)', () => {
    const resposta = {
      ...respostaCanonica(),
      atividadeAdaptada: {
        instrucoesAluno: 'Leia.',
        questoes: {
          1: { numero: 1, enunciado: 'Q mapeada', tipo: 'discursiva_curta', alternativas: [] },
        },
      },
    };
    expect(() => renderizar(resposta)).not.toThrow();
  });

  it('(d) renderiza com enunciado de questão como objeto aninhado', () => {
    const resposta = respostaCanonica();
    resposta.atividadeAdaptada.questoes[0].enunciado = { texto: 'Enunciado em objeto' };
    expect(() => renderizar(resposta)).not.toThrow();
  });

  it('mantém a forma feliz canônica intacta (título e enunciado renderizados)', () => {
    const html = renderizar(respostaCanonica());
    expect(html).toContain('Fotossíntese Adaptada');
    expect(html).toContain('O que é fotossíntese?');
  });
});

describe('UT-40 (RN-48): normalizarRespostaGeracao (domínio puro)', () => {
  it('(c) diretrizesHarmonizadas como string vira array de um item; null vira array vazio', () => {
    expect(
      normalizarRespostaGeracao({ diretrizesHarmonizadas: 'Linguagem direta' })
        .diretrizesHarmonizadas
    ).toEqual(['Linguagem direta']);
    expect(
      normalizarRespostaGeracao({ diretrizesHarmonizadas: null })
        .diretrizesHarmonizadas
    ).toEqual([]);
  });

  it('objetos estruturais nulos viram objetos e listas nulas viram arrays', () => {
    const normalizada = normalizarRespostaGeracao({
      atividadeAdaptada: null,
      guiaMediacao: null,
      aluno: null,
    });
    expect(normalizada.atividadeAdaptada).toEqual({ questoes: [] });
    expect(normalizada.guiaMediacao).toEqual({ passoAPassoProfessor: [] });
    expect(normalizada.aluno).toEqual({ necessidades: [] });
  });

  it('questoes como objeto mapeado vira array de questões com alternativas em array', () => {
    const normalizada = normalizarRespostaGeracao({
      atividadeAdaptada: {
        questoes: {
          1: { numero: 1, enunciado: 'Q1', alternativas: 'A) um' },
        },
      },
    });
    expect(Array.isArray(normalizada.atividadeAdaptada.questoes)).toBe(true);
    expect(normalizada.atividadeAdaptada.questoes).toHaveLength(1);
    expect(normalizada.atividadeAdaptada.questoes[0].alternativas).toEqual(['A) um']);
  });

  it('preserva campos desconhecidos e a forma feliz canônica', () => {
    const canonica = respostaCanonica();
    const normalizada = normalizarRespostaGeracao(canonica);
    expect(normalizada).toEqual(canonica);
    expect(normalizada.campanhaExtra).toBeUndefined();
    const comExtra = { ...canonica, campoDesconhecido: 'mantido' };
    expect(normalizarRespostaGeracao(comExtra).campoDesconhecido).toBe('mantido');
  });
});
