import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({
  useParams: () => ({ id: 'atv1' }),
  useSearchParams: () => new URLSearchParams('token=token-sintetico'),
}));

vi.mock('@/utils/diario/tokenUtils', () => ({
  decodeToken: () => ({ activityId: 'atv1', alunoId: 'a1' }),
}));

import AtividadeContent from '@/app/aluno/atividade/[id]/AtividadeContent';

const atividade = {
  id: 'atv1',
  titulo: 'Atividade sintética',
  bimestre: 1,
  dataEntrega: '2099-01-01T10:00:00',
  questoes: [{ id: 'q1', tipo: 'discursiva', enunciado: 'Em que ano?', notaMaxima: 2 }],
};
const alunoInfo = { alunoId: 'a1', turmaId: 't1', nome: 'Estudante sintético' };
const entrega = { id: 'e1', status: 'entregue', submittedAt: '2026-11-06T12:30:00' };
const urlAtividade = '/api/aluno/atividade/atv1?token=token-sintetico';

const json = (body) => ({ ok: true, status: 200, json: async () => body });
const leitura = (entrega = null) => json({ atividade, alunoInfo, entrega });
const sucessoPost = () => json({ success: true, entregaId: 'e1' });
const falhaDeRede = () => new TypeError('Failed to fetch');

const botaoEnviar = () => screen.getByRole('button', { name: /Enviar Respostas/i });
const campoResposta = () => screen.getByPlaceholderText('Escreva sua resposta aqui...');
const chamadasPost = () => fetch.mock.calls.filter(([url, init]) =>
  url === '/api/aluno/entregar' && init?.method === 'POST'
);
const chamadasGetAtividade = () => fetch.mock.calls.filter(([url, init]) =>
  url === urlAtividade && (!init?.method || init.method === 'GET')
);

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(leitura()));
  vi.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function preencherEEnviar() {
  render(<AtividadeContent />);
  await screen.findByPlaceholderText('Escreva sua resposta aqui...');
  fireEvent.change(campoResposta(), { target: { value: '1922' } });
  fireEvent.click(botaoEnviar());
}

async function conferirComprovante() {
  expect(await screen.findByText('Entrega recebida!')).toBeInTheDocument();
  expect(screen.getByText(/Sua resposta foi enviada em 06\/11\/2026.*12:30/)).toBeInTheDocument();
  expect(chamadasGetAtividade()).toHaveLength(2);
  expect(chamadasPost()).toHaveLength(1);
  expect(window.alert).not.toHaveBeenCalled();
}

it('exibe a data oficial recuperada após um POST confirmado', async () => {
  fetch.mockResolvedValueOnce(sucessoPost()).mockResolvedValueOnce(leitura(entrega));
  await preencherEEnviar();
  await conferirComprovante();
});

it('recupera o comprovante após a conexão cair no POST, sem reenviar', async () => {
  fetch.mockRejectedValueOnce(falhaDeRede()).mockResolvedValueOnce(leitura(entrega));
  await preencherEEnviar();
  await conferirComprovante();
});

it('preserva a resposta e só libera novo envio após consultar que não existe entrega', async () => {
  fetch.mockRejectedValueOnce(falhaDeRede()).mockRejectedValueOnce(falhaDeRede());
  await preencherEEnviar();

  const verificar = await screen.findByRole('button', { name: /Verificar entrega/i });
  expect(campoResposta()).toHaveValue('1922');
  expect(botaoEnviar()).toBeDisabled();
  expect(chamadasPost()).toHaveLength(1);
  expect(window.alert).not.toHaveBeenCalled();

  fetch.mockResolvedValueOnce(leitura());
  fireEvent.click(verificar);
  await waitFor(() => expect(botaoEnviar()).toBeEnabled());
  expect(campoResposta()).toHaveValue('1922');
  expect(chamadasGetAtividade()).toHaveLength(3);
  expect(chamadasPost()).toHaveLength(1);

  fetch.mockResolvedValueOnce(sucessoPost()).mockResolvedValueOnce(leitura(entrega));
  fireEvent.click(botaoEnviar());
  expect(await screen.findByText('Entrega recebida!')).toBeInTheDocument();
  expect(chamadasPost()).toHaveLength(2);
  expect(JSON.parse(chamadasPost()[1][1].body).respostas.q1.resposta).toBe('1922');
});
