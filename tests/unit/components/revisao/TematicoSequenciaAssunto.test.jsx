import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { PrepararAulaoTematico } from '@/components/revisao/PrepararAulaoTematico';

afterEach(() => {
  cleanup();
});

const conteudosMock = [
  {
    id: 'aula-a',
    titulo: 'Vanguardas Europeias',
    resumo: 'Resumo A',
    apta: true,
  },
  {
    id: 'aula-b',
    titulo: 'Modernismo Brasileiro',
    resumo: 'Resumo B',
    apta: true,
  },
];

const questoesMock = [
  {
    id: 'q1',
    tema: 'Cubismo',
    conteudoIds: ['aula-a'],
    apta: true,
  },
  {
    id: 'q2',
    tema: 'Antropofagia',
    conteudoIds: ['aula-b'],
    apta: true,
  },
  {
    id: 'q-multi',
    tema: 'Conexão Transatlântica',
    conteudoIds: ['aula-a', 'aula-b'],
    apta: true,
  },
];

const turmasMock = [{ id: 't1', nome: '3º Ano A', alunos: [{ id: 'a1' }] }];

describe('PrepararAulaoTematico — Sequência por assunto', () => {
  it('exibe as questões agrupadas por assunto com aviso se algum assunto estiver sem questões', () => {
    const selecao = {
      titulo: 'Revisão ENEM',
      turmaIds: ['t1'],
      conteudoIds: ['aula-a', 'aula-b'],
      quantidadeQuestoes: 2,
      questaoIds: ['q1', 'q-multi'],
      atribuicoes: {
        q1: 'aula-a',
        'q-multi': 'aula-a', // Ambas em aula-a! aula-b fica sem questões
      },
      duracaoSegundos: 60,
      duracaoPorQuestao: {},
      modoFluxo: 'sequencia_assunto',
    };

    render(
      <PrepararAulaoTematico
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecao}
        onAlterar={vi.fn()}
        onCriar={vi.fn()}
      />
    );

    // Deve indicar aviso para o assunto aula-b sem questões
    expect(screen.getByRole('heading', { name: /Modernismo Brasileiro/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Vanguardas Europeias/i })).toBeInTheDocument();
    expect(screen.getByText(/Sem questões vinculadas/i)).toBeInTheDocument();

    // Botão de criar desabilitado porque aula-b não tem questões
    const btnCriar = screen.getByRole('button', { name: /Criar Aulão/i });
    expect(btnCriar).toBeDisabled();
  });

  it('permite alternar o vínculo de questão compartilhada entre assuntos selecionados', () => {
    const onAlterar = vi.fn();
    const selecao = {
      titulo: 'Revisão ENEM',
      turmaIds: ['t1'],
      conteudoIds: ['aula-a', 'aula-b'],
      quantidadeQuestoes: 2,
      questaoIds: ['q1', 'q-multi'],
      atribuicoes: {
        q1: 'aula-a',
        'q-multi': 'aula-a',
      },
      duracaoSegundos: 60,
      duracaoPorQuestao: {},
      modoFluxo: 'sequencia_assunto',
    };

    render(
      <PrepararAulaoTematico
        conteudos={conteudosMock}
        questoes={questoesMock}
        turmas={turmasMock}
        selecao={selecao}
        onAlterar={onAlterar}
        onCriar={vi.fn()}
      />
    );

    // Encontra o seletor de vínculo para q-multi
    const seletorVinculo = screen.getByTestId('select-vinculo-q-multi');
    expect(seletorVinculo).toBeInTheDocument();
    expect(seletorVinculo.value).toBe('aula-a');

    // Troca para aula-b
    fireEvent.change(seletorVinculo, { target: { value: 'aula-b' } });

    expect(onAlterar).toHaveBeenCalledWith(
      expect.objectContaining({
        atribuicoes: expect.objectContaining({
          'q-multi': 'aula-b',
        }),
      })
    );
  });
});
