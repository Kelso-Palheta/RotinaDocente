import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'prof-1', getIdToken: vi.fn(async () => 'tok-prof-1') } },
  useAuth: vi.fn(),
  useAIConfig: vi.fn(),
}));

vi.mock('@/lib/auth-context', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/lib/firebase', () => ({ auth: mocks.auth }));
vi.mock('@/hooks/useAIConfig', () => ({ useAIConfig: mocks.useAIConfig }));
vi.mock('@/components/ai/ModalConectarIA', () => ({
  ModalConectarIA: () => null,
}));
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { HubDocente } from '@/components/aula-gamificada/HubDocente';

const CATALOGO_BASE = {
  modalidades: [
    { id: 'quiz', nome: 'Quiz ao Vivo', tiposQuestoes: ['multipla_escolha'] },
    { id: 'memoria', nome: 'Memória de Pares', tiposQuestoes: ['pares'] },
    { id: 'associacao', nome: 'Associação de Colunas', tiposQuestoes: ['pares'] },
    { id: 'ordenacao', nome: 'Ordenação', tiposQuestoes: ['ordenacao'] },
    { id: 'equipes', nome: 'Desafio em Equipes', tiposQuestoes: ['multipla_escolha'] },
  ],
  turmas: [
    { id: 'turma-1a', nome: '1º Ano A', alunos: [{ id: 'a1', nome: 'Ana' }, { id: 'a2', nome: 'Bruno' }] },
  ],
  questoes: [
    {
      id: 'q-bio-1',
      revision: 1,
      disciplina: 'Biologia',
      anoEscolar: '1º ano EM',
      conteudo: 'Citologia',
      dificuldade: 'facil',
      tipo: 'multipla_escolha',
      enunciado: 'Qual organela realiza a respiração celular?',
      alternativas: [
        { id: 'alt-1', texto: 'Mitocôndria' },
        { id: 'alt-2', texto: 'Ribossomo' },
      ],
      respostaCorreta: 'alt-1',
      explicacao: 'A mitocôndria produz ATP por respiração celular.',
      justificativaDificuldade: 'Conceito introdutório do 1º ano.',
      status: 'rascunho',
      origem: { tipo: 'manual' },
    },
    {
      id: 'q-hist-1',
      revision: 2,
      disciplina: 'História',
      anoEscolar: '9º ano EF',
      conteudo: 'República Velha',
      dificuldade: 'dificil',
      tipo: 'ordenacao',
      enunciado: 'Ordene cronologicamente os eventos da Primeira República.',
      itens: [
        { id: 'i1', texto: 'Proclamação da República (1889)' },
        { id: 'i2', texto: 'Semana de Arte Moderna (1922)' },
      ],
      respostaCorreta: ['i1', 'i2'],
      explicacao: 'Ordem histórica do período.',
      justificativaDificuldade: 'Exige articulação cronológica.',
      status: 'revisada',
      origem: { tipo: 'tema' },
    },
  ],
  salas: [],
};

describe('Aula Gamificada — catálogo, banco, filtros, edição e revisão docente', () => {
  beforeEach(() => {
    mocks.useAuth.mockReturnValue({ user: { uid: 'prof-1' }, loading: false });
    mocks.useAIConfig.mockReturnValue({ config: null, temChave: false });
    mocks.auth.currentUser = { uid: 'prof-1', getIdToken: vi.fn(async () => 'tok-prof-1') };
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('exibe as cinco modalidades no catálogo e distingue falha de carregamento de banco vazio', async () => {
    let falhar = true;
    const fetcher = vi.fn(async () => {
      if (falhar) {
        return {
          ok: false,
          status: 503,
          json: async () => ({ error: 'UNAVAILABLE', message: 'Serviço temporariamente indisponível.' }),
        };
      }
      return { ok: true, status: 200, json: async () => ({ ...CATALOGO_BASE, questoes: [] }) };
    });
    vi.stubGlobal('fetch', fetcher);

    render(<HubDocente />);

    expect(await screen.findByRole('alert')).toHaveTextContent(/Serviço temporariamente indisponível/i);
    falhar = false;
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    expect(await screen.findByText('Quiz ao Vivo')).toBeInTheDocument();
    expect(screen.getByText('Memória de Pares')).toBeInTheDocument();
    expect(screen.getByText('Associação de Colunas')).toBeInTheDocument();
    expect(screen.getByText('Ordenação')).toBeInTheDocument();
    expect(screen.getByText('Desafio em Equipes')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Banco de Questões/i }));
    expect(await screen.findByText(/Nenhuma questão cadastrada ainda/i)).toBeInTheDocument();
  });

  it('filtra questões por disciplina/dificuldade/status e permite aprovar revisão docente', async () => {
    const fetcher = vi.fn(async (url) => {
      if (url === '/api/aula-gamificada/catalogo') {
        return { ok: true, status: 200, json: async () => CATALOGO_BASE };
      }
      if (url === '/api/aula-gamificada/questoes/q-bio-1/revisar') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            questao: { ...CATALOGO_BASE.questoes[0], revision: 2, status: 'revisada' },
          }),
        };
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    render(<HubDocente />);
    await screen.findByText('Quiz ao Vivo');

    fireEvent.click(screen.getByRole('tab', { name: /Banco de Questões/i }));
    expect(screen.getByText(/Qual organela realiza a respiração celular/i)).toBeInTheDocument();
    expect(screen.getByText(/Ordene cronologicamente/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Filtrar por dificuldade/i), { target: { value: 'facil' } });
    expect(screen.getByText(/Qual organela realiza a respiração celular/i)).toBeInTheDocument();
    expect(screen.queryByText(/Ordene cronologicamente/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Aprovar revisão/i }));

    await waitFor(() => {
      const chamada = fetcher.mock.calls.find(([u]) => u === '/api/aula-gamificada/questoes/q-bio-1/revisar');
      expect(chamada).toBeTruthy();
      const body = JSON.parse(chamada[1].body);
      expect(body.expectedRevision).toBe(1);
      expect(body.requestId).toBeTruthy();
    });

    expect(await screen.findByText(/Revisada/i)).toBeInTheDocument();
  });

  it('preserva o rascunho em edição quando ocorre conflito de versão (409)', async () => {
    const fetcher = vi.fn(async (url) => {
      if (url === '/api/aula-gamificada/catalogo') {
        return { ok: true, status: 200, json: async () => CATALOGO_BASE };
      }
      if (url === '/api/aula-gamificada/questoes') {
        return {
          ok: false,
          status: 409,
          json: async () => ({ error: 'CONFLICT', message: 'Conflito de versão: questão atualizada recentemente.' }),
        };
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    render(<HubDocente />);
    await screen.findByText('Quiz ao Vivo');

    fireEvent.click(screen.getByRole('tab', { name: /Banco de Questões/i }));
    const botoesEditar = screen.getAllByRole('button', { name: /Editar/i });
    fireEvent.click(botoesEditar[0]);

    const campoEnunciado = screen.getByLabelText(/Enunciado/i);
    fireEvent.change(campoEnunciado, { target: { value: 'Enunciado editado localmente sem perder' } });
    fireEvent.click(screen.getByRole('button', { name: /Salvar questão/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Conflito de versão/i);
    expect(screen.getByLabelText(/Enunciado/i)).toHaveValue('Enunciado editado localmente sem perder');
  });

  it('bloqueia acesso docente sem conta Firebase válida (ex: conta Django)', () => {
    mocks.useAuth.mockReturnValue({ user: { uid: 'django-1', isDjango: true }, loading: false });
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);

    render(<HubDocente />);
    expect(screen.getByText(/login de professor com sua conta Firebase/i)).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
