import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  salvar: vi.fn(), catalogo: vi.fn(), user: { uid: 'prof-a' },
  auth: { currentUser: { uid: 'prof-a', getIdToken: async () => 'token-a' } },
}));
vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: mocks.user, loading: false }) }));
vi.mock('@/lib/firebase', () => ({ auth: mocks.auth }));
vi.mock('@/hooks/useAIConfig', () => ({ useAIConfig: () => ({ temChave: false }) }));
vi.mock('@/components/ai/ModalConectarIA', () => ({ ModalConectarIA: () => null }));
vi.mock('@/components/aula-gamificada/api', () => ({
  buscarCatalogo: (...args) => mocks.catalogo(...args),
  salvarQuestao: (...args) => mocks.salvar(...args),
  revisarQuestao: vi.fn(),
  gerarRequestId: () => crypto.randomUUID(),
}));
import { FormularioQuestao } from '@/components/aula-gamificada/FormularioQuestao';
import { HubDocente } from '@/components/aula-gamificada/HubDocente';
import { BancoQuestoes } from '@/components/aula-gamificada/BancoQuestoes';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';

const q = {
  id: 'q1', revision: 2, status: 'rascunho', disciplina: 'História', anoEscolar: '9º ano',
  conteudo: 'Linha do tempo', dificuldade: 'medio', tipo: 'ordenacao',
  enunciado: 'Ordene os acontecimentos.', explicacao: 'O segundo item antecede o primeiro.',
  justificativaDificuldade: 'Exige reconhecer a cronologia.',
  itens: [{ id: 'i1', texto: 'Ano 2000' }, { id: 'i2', texto: 'Ano 1900' }],
  respostaCorreta: ['i2', 'i1'],
};
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('abrir e salvar uma ordenação preserva o gabarito já cadastrado', async () => {
  const salvar = vi.fn();
  render(<FormularioQuestao questaoInicial={q} onSalvar={salvar} />);
  fireEvent.click(screen.getByRole('button', { name: 'Salvar questão' }));
  await waitFor(() => expect(salvar).toHaveBeenCalled());
  expect(salvar.mock.calls[0][0].respostaCorreta).toEqual(['i2', 'i1']);
});

it('repetir salvamento após falha conserva a identidade da operação', async () => {
  mocks.salvar.mockRejectedValueOnce(new Error('Conexão interrompida')).mockResolvedValueOnce({ questao: q });
  render(<BancoQuestoes questoes={[q]} obterToken={async () => 'token'} />);
  fireEvent.click(screen.getByRole('button', { name: /Editar/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Salvar questão' }));
  await screen.findByText('Conexão interrompida');
  const requestId = mocks.salvar.mock.calls[0][0].requestId;
  fireEvent.click(screen.getByRole('button', { name: 'Salvar questão' }));
  await waitFor(() => expect(mocks.salvar).toHaveBeenCalledTimes(2));
  expect(mocks.salvar.mock.calls[1][0].requestId).toBe(requestId);
});

it('participante que ainda não respondeu não aparece entre os respondentes', () => {
  const estado = normalizarEstadoSala({
    sala: { codigo: 'TEST42', modalidade: 'quiz', fase: 'pergunta', rodada: 1, revision: 1 },
    rodada: { numero: 1, questao: { tipo: 'multipla_escolha', alternativas: [] } },
    participantes: [{ id: 'p1', nomeExibicao: 'Ana', entrouEmMs: null }], distribuicao: [],
  });
  expect(estado.participacao.totalRespondentes).toBe(0);
  expect(estado.participacao.respondentes).toEqual([]);
});

it('troca de professor oculta imediatamente o banco da conta anterior', async () => {
  mocks.catalogo.mockResolvedValueOnce({ modalidades: [], turmas: [], salas: [], questoes: [q] })
    .mockImplementationOnce(() => new Promise(() => {}));
  const view = render(<HubDocente />);
  fireEvent.click(await screen.findByRole('tab', { name: /Banco de Questões/ }));
  await screen.findByText(q.enunciado);
  mocks.user = { uid: 'prof-b' };
  mocks.auth.currentUser = { uid: 'prof-b', getIdToken: async () => 'token-b' };
  view.rerender(<HubDocente />);
  expect(screen.queryByText(q.enunciado)).not.toBeInTheDocument();
});
