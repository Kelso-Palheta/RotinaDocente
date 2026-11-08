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

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      atividade: {
        id: 'atv1',
        titulo: 'Atividade sintética',
        bimestre: 1,
        notaMaxima: 10,
        questoes: [{ id: 'q1', tipo: 'discursiva', enunciado: 'Questão sintética', notaMaxima: 10 }],
      },
      alunoInfo: { alunoId: 'a1', turmaId: 't1', nome: 'Estudante Sintético' },
      entrega: { id: 'e1', status: 'entregue', submittedAt: '2026-10-27T12:30:00' },
    }),
  });
});

describe('AtividadeContent — confirmação com uma única saída', () => {
  it('mostra apenas o Voltar ao Boletim do cabeçalho', async () => {
    render(<AtividadeContent />);

    expect(await screen.findByText('Entrega recebida!')).toBeInTheDocument();

    const voltar = screen.getAllByRole('link', { name: /voltar/i });
    expect(voltar).toHaveLength(1);
    expect(voltar[0]).toHaveTextContent('Voltar ao Boletim');
  });
});
