import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'prof-1', getIdToken: vi.fn(async () => 'tok-prof') } },
  useAuth: vi.fn(),
}));

vi.mock('@/lib/auth-context', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/lib/firebase', () => ({ auth: mocks.auth }));

import { SalaDocenteView } from '@/components/aula-gamificada/SalaDocenteView';
import { AcessoAulaGamificada } from '@/components/aula-gamificada/AcessoAulaGamificada';
import { PLATFORM_MODULES, AULA_GAMIFICADA_MODULE } from '@/config/modules';

describe('Aula Gamificada — sala docente, projeção, polling seguro e entradas', () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ user: { uid: 'prof-1' }, loading: false });
    mocks.auth.currentUser = { uid: 'prof-1', getIdToken: vi.fn(async () => 'tok-prof') };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('controla transições de fase via /comandos sem chamar IA, mostra distribuição anônima e ranking com empate', async () => {
    let faseAtual = 'espera';
    let revisaoAtual = 1;

    const criarEstado = () => ({
      codigo: 'GAM42',
      revision: revisaoAtual,
      titulo: 'Aula Gamificada de Geografia',
      modalidade: 'quiz',
      fase: faseAtual,
      rodada: faseAtual === 'espera' ? 0 : 1,
      totalRodadas: 2,
      tempoSegundos: 45,
      servidorAgora: Date.now(),
      prazo: faseAtual === 'pergunta' ? Date.now() + 45000 : null,
      questao:
        faseAtual === 'espera'
          ? null
          : {
              id: 'q1',
              tipo: 'multipla_escolha',
              enunciado: 'Qual bioma predomina na região Norte?',
              alternativas: [
                { id: 'alt-a', texto: 'Amazônia' },
                { id: 'alt-b', texto: 'Cerrado' },
              ],
            },
      participacao: {
        totalParticipantes: 3,
        totalRespondentes: 2,
        respondentes: ['Ana', 'Bruno'],
        distribuicao: { 'alt-a': 2, 'alt-b': 0 },
      },
      ranking:
        faseAtual === 'ranking'
          ? [
              { posicao: 1, participanteId: 'p1', nome: 'Ana', pontos: 1000 },
              { posicao: 1, participanteId: 'p2', nome: 'Bruno', pontos: 1000 },
              { posicao: 3, participanteId: 'p3', nome: 'Carla', pontos: 0 },
            ]
          : [],
    });

    const fetcher = vi.fn(async (url, init) => {
      if (url === '/api/aula-gamificada/salas/GAM42/estado') {
        return { ok: true, status: 200, json: async () => ({ estado: criarEstado() }) };
      }
      if (url === '/api/aula-gamificada/salas/GAM42/comandos') {
        const body = JSON.parse(init.body);
        revisaoAtual += 1;
        if (body.acao === 'iniciar') faseAtual = 'pergunta';
        if (body.acao === 'ranking') faseAtual = 'ranking';
        return { ok: true, status: 200, json: async () => ({ estado: criarEstado() }) };
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    const { unmount } = render(<SalaDocenteView codigo="GAM42" />);

    expect(await screen.findByText(/Aula Gamificada de Geografia/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Iniciar partida/i }));

    await waitFor(() => {
      const cmd = fetcher.mock.calls.find(([u]) => u.endsWith('/comandos'));
      expect(cmd).toBeTruthy();
      expect(JSON.parse(cmd[1].body)).toMatchObject({
        acao: 'iniciar',
        expectedRevision: 1,
      });
    });

    expect(await screen.findByText(/Qual bioma predomina/i)).toBeInTheDocument();
    // Nenhuma chamada ao endpoint /gerar durante a partida
    expect(fetcher.mock.calls.some(([u]) => u.includes('/gerar'))).toBe(false);

    unmount();
  });

  it('projecao exibe ranking preservando empate e entradas apontam para /aula-gamificada e /aluno/aula-gamificada sem alterar PLATFORM_MODULES', async () => {
    const fetcher = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        estado: {
          codigo: 'GAM42',
          revision: 5,
          titulo: 'Telão História',
          modalidade: 'quiz',
          fase: 'ranking',
          rodada: 1,
          totalRodadas: 1,
          servidorAgora: Date.now(),
          ranking: [
            { posicao: 1, participanteId: 'p1', nome: 'Ana', pontos: 1000 },
            { posicao: 1, participanteId: 'p2', nome: 'Bruno', pontos: 1000 },
            { posicao: 3, participanteId: 'p3', nome: 'Carla', pontos: 0 },
          ],
        },
      }),
    }));
    vi.stubGlobal('fetch', fetcher);

    render(<SalaDocenteView codigo="GAM42" projecao />);
    expect(await screen.findByText(/Telão História/i)).toBeInTheDocument();
    expect(screen.getAllByText(/1º/)).toHaveLength(2);
    expect(screen.getByText(/3º/)).toBeInTheDocument();

    cleanup();

    const { rerender } = render(<AcessoAulaGamificada />);
    expect(screen.getByRole('link', { name: /Aula Gamificada/i })).toHaveAttribute('href', '/aula-gamificada');
    rerender(<AcessoAulaGamificada aluno />);
    expect(screen.getByRole('link', { name: /Aula Gamificada/i })).toHaveAttribute('href', '/aluno/aula-gamificada');

    expect(AULA_GAMIFICADA_MODULE.path).toBe('/aula-gamificada');
    expect(PLATFORM_MODULES).toHaveLength(9);
  });
});
