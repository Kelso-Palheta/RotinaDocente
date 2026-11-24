// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';
const item = (conteudo, dificuldade, quantidade = 4, professorId = 'p1') => ({ professorId, turma: 'Teste', disciplina: 'Arte / ENEM', conteudo, dificuldade, quantidade });
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
async function preparar(dados) {
  let catalogo = dados;
  const fetcher = vi.fn(async (url, init) => init?.method === 'POST' ? json({ error: 'Pedido conferido' }, 422) : url.endsWith('/catalogo') ? json({ conteudos: catalogo }) : json({ sessoes: [] }));
  vi.stubGlobal('fetch', fetcher);
  render(<RevisaoAutonoma />);
  await screen.findByText('Prepare sua aventura');
  return { fetcher, atualizar: (c) => { catalogo = c; fireEvent(window, new Event('focus')); } };
}
const escolher = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
it('mostra Arte, deduplica assuntos e separa os níveis disponíveis; envia identidade original', async () => {
  const { fetcher } = await preparar([item('Representatividade Negra', 'facil', 4), item('Representatividade Negra', 'dificil', 12), item('arte urbana', 'medio')]);
  expect(within(screen.getByLabelText('Disciplina')).getByRole('option', { name: 'Arte' })).toBeTruthy();
  escolher('Disciplina', 'Arte');
  const nomes = [...screen.getByLabelText('Conteúdo').options].map(o => o.text);
  expect(nomes.filter(n => n === 'Representatividade Negra')).toHaveLength(1);
  expect(nomes.some(n => /Teste|Fácil|Difícil/.test(n))).toBe(false);
  escolher('Conteúdo', 'Representatividade Negra');
  expect([...screen.getByLabelText('Dificuldade').options].map(o => o.text)).toEqual(['Escolha', 'Fácil', 'Difícil']);
  expect(screen.getByRole('button', { name: /Começar a jogar/ }).disabled).toBe(true);
  escolher('Dificuldade', 'dificil');
  expect(screen.getByTestId('resumo-configuracao').textContent).toContain('12 liberadas');
  fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/ }));
  await screen.findByText('Pedido conferido');
  const chamada = fetcher.mock.calls.find(([, init]) => init?.method === 'POST');
  expect(JSON.parse(chamada[1].body)).toMatchObject({ disciplina: 'Arte / ENEM', conteudo: 'Representatividade Negra', dificuldade: 'dificil', professorId: 'p1' });
});
it('trocar assunto invalida nível anterior e recalcula disponibilidade', async () => {
  await preparar([item('Retrato', 'facil', 12), item('Retrato', 'dificil', 12), item('arte urbana', 'medio', 1)]);
  escolher('Disciplina', 'Arte'); escolher('Conteúdo', 'Retrato'); escolher('Dificuldade', 'dificil');
  escolher('Conteúdo', 'arte urbana');
  expect(screen.getByLabelText('Dificuldade').value).toBe('medio');
  expect(screen.getByTestId('resumo-configuracao').textContent).toContain('1 liberadas');
  escolher('Disciplina', '');
  expect(screen.getByLabelText('Conteúdo').value).toBe('');
  expect(screen.getByLabelText('Dificuldade').value).toBe('');
  expect(screen.getByRole('button', { name: /Começar a jogar/ }).disabled).toBe(true);
});
it('não mistura professores: exige origem quando assunto e nível coincidem', async () => {
  const { fetcher } = await preparar([item('Retrato', 'facil', 4, 'p1'), item('Retrato', 'facil', 12, 'p2')]);
  escolher('Disciplina', 'Arte'); escolher('Conteúdo', 'Retrato');
  expect(screen.getByRole('button', { name: /Começar a jogar/ }).disabled).toBe(true);
  const origem = screen.getByLabelText('Turma e professor');
  fireEvent.change(origem, { target: { value: origem.options[2].value } });
  expect(screen.getByTestId('resumo-configuracao').textContent).toContain('12 liberadas');
  fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/ }));
  await screen.findByText('Pedido conferido');
  expect(JSON.parse(fetcher.mock.calls.find(([, init]) => init?.method === 'POST')[1].body).professorId).toBe('p2');
});
it('retirada do nível no catálogo invalida a escolha ao retornar à página', async () => {
  const { atualizar } = await preparar([item('Retrato', 'facil'), item('Retrato', 'dificil')]);
  escolher('Disciplina', 'Arte'); escolher('Conteúdo', 'Retrato'); escolher('Dificuldade', 'dificil');
  atualizar([item('Retrato', 'facil')]);
  await waitFor(() => expect(screen.getByLabelText('Dificuldade').value).toBe(''));
  expect(screen.getByRole('button', { name: /Começar a jogar/ }).disabled).toBe(true);
});
it('não troca silenciosamente a origem quando o vínculo escolhido desaparece', async () => {
  const { atualizar } = await preparar([item('Retrato', 'facil', 4, 'p1'), item('Retrato', 'facil', 12, 'p2')]);
  escolher('Disciplina', 'Arte'); escolher('Conteúdo', 'Retrato');
  const origem = screen.getByLabelText('Turma e professor');
  fireEvent.change(origem, { target: { value: origem.options[1].value } });
  atualizar([item('Retrato', 'facil', 12, 'p2')]);
  await waitFor(() => expect(screen.queryByText(/4 liberadas/)).toBeNull());
  expect(screen.getByRole('button', { name: /Começar a jogar/ }).disabled).toBe(true);
});
