import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrepararSala } from '@/components/aula-gamificada/PrepararSala';

const TURMAS = [
  {
    id: 'turma-2b',
    nome: '2º Ano B',
    alunos: [
      { id: 'al-1', nome: 'Ana Clara' },
      { id: 'al-2', nome: 'Bruno Lima' },
      { id: 'al-3', nome: 'Carla Souza' },
    ],
  },
];

const QUESTOES = [
  {
    id: 'q-rev-mc',
    revision: 2,
    disciplina: 'Matemática',
    anoEscolar: '2º ano EM',
    conteudo: 'Funções',
    dificuldade: 'medio',
    tipo: 'multipla_escolha',
    enunciado: 'Qual o vértice da parábola y = x^2?',
    status: 'revisada',
  },
  {
    id: 'q-rasc-mc',
    revision: 1,
    disciplina: 'Matemática',
    anoEscolar: '2º ano EM',
    conteudo: 'Funções',
    dificuldade: 'facil',
    tipo: 'multipla_escolha',
    enunciado: 'Questão ainda em rascunho',
    status: 'rascunho',
  },
  {
    id: 'q-rev-pares',
    revision: 2,
    disciplina: 'Arte',
    anoEscolar: '3º ano EM',
    conteudo: 'Vanguardas',
    dificuldade: 'medio',
    tipo: 'pares',
    enunciado: 'Relacione a vanguarda ao artista.',
    status: 'revisada',
  },
];

describe('Aula Gamificada — preparação de sala, equipes e compatibilidade de questões', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('informa regra de equipes, bloqueia questões incompatíveis ou em rascunho e cria sala conforme contrato', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({
        sala: {
          codigo: 'EQP2026',
          revision: 1,
          titulo: 'Gincana de Funções',
          modalidade: 'equipes',
          turmaIds: ['turma-2b'],
          questaoIds: ['q-rev-mc'],
          tempoSegundos: 60,
          equipes: [{ id: 'eq-1', nome: 'Equipe Alfa', participanteIds: ['al-1', 'al-2'] }],
          fase: 'espera',
          rodada: 0,
        },
      }),
    }));
    vi.stubGlobal('fetch', fetcher);

    const onSalaCriada = vi.fn();
    render(
      <PrepararSala
        turmas={TURMAS}
        questoes={QUESTOES}
        salas={[]}
        modalidadeInicial="equipes"
        obterToken={async () => 'tok-docente'}
        onSalaCriada={onSalaCriada}
      />
    );

    // Regra obrigatória para equipes
    expect(screen.getByText(/Uma resposta por aluno\/rodada/i)).toBeInTheDocument();
    expect(screen.getByText(/pontuação da equipe pela soma/i)).toBeInTheDocument();

    // Questões incompatíveis e rascunhos não podem ser selecionadas
    expect(screen.getByText(/Incompatível com esta modalidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Aguardando revisão docente/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Título da sala/i), { target: { value: 'Gincana de Funções' } });
    fireEvent.click(screen.getByLabelText(/2º Ano B/i));
    fireEvent.click(screen.getByLabelText(/Qual o vértice da parábola/i));

    // Adiciona duas equipes (mínimo exigido pelo servidor)
    fireEvent.change(screen.getByLabelText(/Nome da nova equipe/i), { target: { value: 'Equipe Alfa' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar equipe/i }));
    fireEvent.change(screen.getByLabelText(/Nome da nova equipe/i), { target: { value: 'Equipe Beta' } });
    fireEvent.click(screen.getByRole('button', { name: /Adicionar equipe/i }));

    fireEvent.click(screen.getByRole('button', { name: /Criar sala ao vivo/i }));

    await waitFor(() => expect(onSalaCriada).toHaveBeenCalledTimes(1));
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('/api/aula-gamificada/salas');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      titulo: 'Gincana de Funções',
      modalidade: 'equipes',
      turmaIds: ['turma-2b'],
      questaoIds: ['q-rev-mc'],
    });
    expect(body.requestId).toBeTruthy();
    expect(Array.isArray(body.equipes)).toBe(true);
    expect(body.equipes[0].nome).toBe('Equipe Alfa');
  });
});
