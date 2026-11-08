import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({
  useParams: () => ({ id: 'atv1' }),
  useSearchParams: () => new URLSearchParams('token=token-sintetico'),
}));

vi.mock('@/utils/diario/tokenUtils', () => ({
  decodeToken: () => ({ activityId: 'atv1', alunoId: 'a1' }),
}));

import AtividadeContent from '@/app/aluno/atividade/[id]/AtividadeContent';

afterEach(cleanup);

const questoes = [{ id: 'q1', tipo: 'discursiva', enunciado: 'Questão sintética', notaMaxima: 2, alternativas: [] }];

const baseAtividade = (dataEntrega) => ({
  id: 'atv1',
  titulo: 'Atividade sintética',
  bimestre: 1,
  notaMaxima: 10,
  questoes,
  dataEntrega,
});

const responderApi = (atividade, entrega = null) => ({
  ok: true,
  json: async () => ({
    atividade,
    alunoInfo: { alunoId: 'a1', turmaId: 't1', nome: 'Estudante Sintético' },
    entrega,
  }),
});

const aguardarFormulario = () => screen.findByRole('button', { name: /Enviar Respostas/ });

beforeEach(() => {
  global.fetch = vi.fn();
});

describe('AtividadeContent — prazo de entrega serializado', () => {
  it('exibe e aceita prazo em texto ISO', async () => {
    global.fetch.mockResolvedValue(responderApi(baseAtividade('2099-01-01T10:00:00')));

    render(<AtividadeContent />);
    await aguardarFormulario();

    expect(screen.getByText(/01\/01\/2099/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/i)).toBeNull();
  });

  it('exibe e aceita Timestamp serializado em segundos', async () => {
    const segundos = Math.floor(new Date('2099-01-01T10:00:00').getTime() / 1000);
    global.fetch.mockResolvedValue(responderApi(baseAtividade({ seconds: segundos })));

    render(<AtividadeContent />);
    await aguardarFormulario();

    expect(screen.getByText(/01\/01\/2099/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/i)).toBeNull();
  });

  it('encerra a atividade com ISO no passado', async () => {
    global.fetch.mockResolvedValue(responderApi(baseAtividade('2020-01-01T10:00:00')));

    render(<AtividadeContent />);

    expect(await screen.findByText(/Prazo encerrado/)).toBeInTheDocument();
    expect(screen.getByText(/01\/01\/2020/)).toBeInTheDocument();
  });

  it('encerra a atividade com Timestamp serializado no passado', async () => {
    const segundos = Math.floor(new Date('2020-01-01T10:00:00').getTime() / 1000);
    global.fetch.mockResolvedValue(responderApi(baseAtividade({ _seconds: segundos })));

    render(<AtividadeContent />);

    expect(await screen.findByText(/Prazo encerrado/)).toBeInTheDocument();
  });

  it('sem prazo válido não inventa data nem encerra a atividade', async () => {
    global.fetch.mockResolvedValue(responderApi(baseAtividade(undefined)));

    render(<AtividadeContent />);
    await aguardarFormulario();

    expect(screen.getByText(/Data não informada/)).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date/i)).toBeNull();
  });
});
