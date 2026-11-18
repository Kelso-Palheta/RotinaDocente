import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AcessoAlunoView } from '@/components/aula-gamificada/AcessoAlunoView';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';

describe('Aula Gamificada — participação discente nos cinco jogos (teclado/toque)', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('exige sessão válida do Portal do Aluno e entra na sala com requestId sem Bearer', async () => {
    const fetcher = vi.fn(async (url) => {
      if (url === '/api/aluno/sessao') {
        return { ok: true, status: 200, json: async () => ({ authenticated: true, aluno: { loginKey: 'ana1503', nome: 'Ana' } }) };
      }
      if (url === '/api/aula-gamificada/salas/BIO123/entrar') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            estado: {
              codigo: 'BIO123',
              revision: 1,
              titulo: 'Aula de Biologia',
              modalidade: 'quiz',
              fase: 'espera',
              rodada: 0,
              servidorAgora: Date.now(),
            },
          }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          estado: {
            codigo: 'BIO123',
            revision: 1,
            titulo: 'Aula de Biologia',
            modalidade: 'quiz',
            fase: 'espera',
            rodada: 0,
            servidorAgora: Date.now(),
          },
        }),
      };
    });
    vi.stubGlobal('fetch', fetcher);

    render(<AcessoAlunoView />);
    const campoCodigo = await screen.findByLabelText(/Código da sala/i);
    fireEvent.change(campoCodigo, { target: { value: 'bio123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar na aula gamificada/i }));

    expect(await screen.findByText(/Aguardando o professor iniciar/i)).toBeInTheDocument();
    const entrarCall = fetcher.mock.calls.find(([u]) => u === '/api/aula-gamificada/salas/BIO123/entrar');
    expect(entrarCall).toBeTruthy();
    expect(entrarCall[1].headers.Authorization).toBeUndefined();
    expect(JSON.parse(entrarCall[1].body).requestId).toBeTruthy();
  });

  it('Quiz e Equipes: envia {alternativaId}, exibe regra das equipes e recupera erro preservando seleção', async () => {
    const onResponder = vi.fn()
      .mockRejectedValueOnce(new Error('Conexão instável.'))
      .mockResolvedValueOnce({ rodada: 1, status: 'confirmado', resposta: { alternativaId: 'alt-b' } });

    const estadoEquipes = {
      codigo: 'EQP1',
      revision: 3,
      titulo: 'Gincana de Física',
      modalidade: 'equipes',
      fase: 'pergunta',
      rodada: 1,
      totalRodadas: 3,
      servidorAgora: Date.now(),
      prazo: Date.now() + 45000,
      equipeAluno: { id: 'eq-1', nome: 'Equipe Newton' },
      questao: {
        id: 'q1',
        tipo: 'multipla_escolha',
        dificuldade: 'medio',
        enunciado: 'Qual a unidade de força no SI?',
        alternativas: [
          { id: 'alt-a', texto: 'Joule' },
          { id: 'alt-b', texto: 'Newton' },
        ],
      },
    };

    render(
      <SalaAlunoView
        estado={estadoEquipes}
        conexao="conectado"
        ocupado={false}
        erro={null}
        onResponder={onResponder}
      />
    );

    expect(screen.getByText(/Equipe Newton/i)).toBeInTheDocument();
    expect(screen.getByText(/1000 pontos por resposta correta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Newton/i }));
    fireEvent.click(screen.getByRole('button', { name: /Enviar resposta/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Conexão instável/i);
    // Seleção preservada -> tentar novamente reutiliza mesmo requestId
    fireEvent.click(screen.getByRole('button', { name: /Tentar enviar novamente/i }));

    await waitFor(() => expect(onResponder).toHaveBeenCalledTimes(2));
    expect(onResponder.mock.calls[0][0]).toEqual({ alternativaId: 'alt-b' });
    expect(onResponder.mock.calls[0][1]).toBe(onResponder.mock.calls[1][1]);
  });

  it('Memória: cartas operáveis enviam {virarId} ao servidor', async () => {
    const onResponder = vi.fn(async () => ({ rodada: 1, status: 'em_andamento' }));
    const estadoMemoria = {
      codigo: 'MEM1',
      revision: 2,
      titulo: 'Memória de Arte',
      modalidade: 'memoria',
      fase: 'pergunta',
      rodada: 1,
      servidorAgora: Date.now(),
      prazo: Date.now() + 90000,
      questao: {
        id: 'qm1',
        tipo: 'pares',
        enunciado: 'Encontre os pares de movimentos artísticos e obras.',
        cartas: [
          { id: 'c1', virada: false, encontrada: false },
          { id: 'c2', virada: true, encontrada: false, texto: 'Cubismo' },
          { id: 'c3', virada: true, encontrada: true, texto: 'Guernica' },
          { id: 'c4', virada: true, encontrada: true, texto: 'Pablo Picasso' },
        ],
      },
    };

    render(<SalaAlunoView estado={estadoMemoria} conexao="conectado" ocupado={false} onResponder={onResponder} />);
    expect(screen.getByText(/Cubismo/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Carta 1/i }));

    await waitFor(() => expect(onResponder).toHaveBeenCalledWith({ virarId: 'c1' }, expect.any(String)));
  });

  it('Associação: conecta itens de duas colunas sem depender de arraste e envia {pares}', async () => {
    const onResponder = vi.fn(async () => ({ rodada: 1, status: 'confirmado' }));
    const estadoAssociacao = {
      codigo: 'ASS1',
      revision: 2,
      titulo: 'Associação Química',
      modalidade: 'associacao',
      fase: 'pergunta',
      rodada: 1,
      servidorAgora: Date.now(),
      prazo: Date.now() + 90000,
      questao: {
        id: 'qa1',
        tipo: 'pares',
        enunciado: 'Associe cada elemento ao seu símbolo.',
        esquerda: [
          { id: 'esq-1', texto: 'Sódio' },
          { id: 'esq-2', texto: 'Potássio' },
        ],
        direita: [
          { id: 'dir-2', texto: 'K' },
          { id: 'dir-1', texto: 'Na' },
        ],
      },
    };

    render(<SalaAlunoView estado={estadoAssociacao} conexao="conectado" ocupado={false} onResponder={onResponder} />);

    fireEvent.click(screen.getByRole('button', { name: /Sódio/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Na$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Potássio/i }));
    fireEvent.click(screen.getByRole('button', { name: /^K$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Enviar associação/i }));

    await waitFor(() =>
      expect(onResponder).toHaveBeenCalledWith(
        {
          pares: [
            { esquerdaId: 'esq-1', direitaId: 'dir-1' },
            { esquerdaId: 'esq-2', direitaId: 'dir-2' },
          ],
        },
        expect.any(String)
      )
    );
  });

  it('Ordenação: reordena por botões acessíveis Subir/Descer sem arraste e envia {ordem}', async () => {
    const onResponder = vi.fn(async () => ({ rodada: 1, status: 'confirmado' }));
    const estadoOrdenacao = {
      codigo: 'ORD1',
      revision: 2,
      titulo: 'Linha do Tempo',
      modalidade: 'ordenacao',
      fase: 'pergunta',
      rodada: 1,
      servidorAgora: Date.now(),
      prazo: Date.now() + 90000,
      questao: {
        id: 'qo1',
        tipo: 'ordenacao',
        enunciado: 'Ordene do mais antigo ao mais recente.',
        itens: [
          { id: 'it-b', texto: 'Independência (1822)' },
          { id: 'it-a', texto: 'Chegada da Corte (1808)' },
        ],
      },
    };

    render(<SalaAlunoView estado={estadoOrdenacao} conexao="conectado" ocupado={false} onResponder={onResponder} />);

    // Sobe o segundo item para primeira posição
    fireEvent.click(screen.getByRole('button', { name: /Subir Chegada da Corte/i }));
    fireEvent.click(screen.getByRole('button', { name: /Enviar ordenação/i }));

    await waitFor(() =>
      expect(onResponder).toHaveBeenCalledWith({ ordem: ['it-a', 'it-b'] }, expect.any(String))
    );
  });
});
