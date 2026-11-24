// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';

const conteudo = { professorId: 'p1', turma: 'Turma 1', disciplina: 'Ciências', conteudo: 'Plantas', dificuldade: 'facil', quantidade: 1 };
const resumo = { id: 'antiga', disciplina: 'Ciências', conteudo: 'Histórico Ana', dificuldade: 'facil', fase: 'jogando', progresso: 0, total: 1, acertos: 0, erros: 0, atualizadoEmMs: 1000 };
const json = (v, status = 200) => new Response(JSON.stringify(v), { status, headers: { 'Content-Type': 'application/json' } });

beforeEach(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('REV-LIVRE-01: logout em outra aba sem sessão ativa limpa catálogo e histórico ao retornar o foco', async () => {
  let autenticado = true;
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (!autenticado) return json({ error: 'Sessão expirada.' }, 401);
    return url.endsWith('/catalogo') ? json({ conteudos: [conteudo] }) : json({ sessoes: [resumo] });
  }));
  render(<RevisaoAutonoma />);
  await screen.findByText('Ciências · Histórico Ana');

  autenticado = false;
  fireEvent(window, new Event('focus'));

  await waitFor(() => expect(screen.queryByText('Ciências · Histórico Ana')).toBeNull());
  expect(screen.getByRole('alert').textContent).toMatch(/acesso mudou/i);
});

it('REV-LIVRE-02: rejeição 429/422 não trava os controles nem cria retry infinito', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    if (init?.method === 'POST') return json({ error: 'Limite de novas revisões por hora atingido.' }, 429);
    return url.endsWith('/catalogo') ? json({ conteudos: [conteudo] }) : json({ sessoes: [resumo] });
  }));
  render(<RevisaoAutonoma />);
  await screen.findByText('Prepare sua aventura');

  fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: 'Ciências' } });
  const select = screen.getByLabelText('Conteúdo');
  fireEvent.change(select, { target: { value: select.options[1].value } });
  fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/i }));

  await screen.findByText(/Limite de novas revisões/i);
  expect(screen.queryByRole('button', { name: /Tentar o mesmo envio novamente/i })).toBeNull();
  expect(screen.getByRole('button', { name: 'Retomar fase' }).disabled).toBe(false);
});
