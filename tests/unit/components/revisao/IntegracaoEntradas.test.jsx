import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: { currentUser: null }, useAuth: vi.fn() }));
vi.mock('@/lib/auth-context', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/lib/firebase', () => ({ auth: mocks.auth }));
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => ({ push: vi.fn() }) }));
import { IntegracaoDocente } from '@/components/revisao/IntegracaoDocente';
import { IntegracaoAluno } from '@/components/revisao/IntegracaoAluno';
import { AcessoRevisao } from '@/components/revisao/AcessoRevisao';
afterEach(() => { cleanup(); vi.unstubAllGlobals(); mocks.auth.currentUser = null; });

describe('RV-INT-07 — entradas reais', () => {
  it('exibe atalhos distintos sem alterar módulos nem notas', () => {
    const { rerender } = render(<AcessoRevisao />);
    expect(screen.getByRole('link', { name: /Revisão ao Vivo/ })).toHaveAttribute('href', '/revisao');
    rerender(<AcessoRevisao aluno />);
    expect(screen.getByRole('link', { name: /Revisão ao Vivo/ })).toHaveAttribute('href', '/aluno/revisao');
  });
  it('conta Django sem Firebase não tenta abrir sala docente', () => {
    mocks.useAuth.mockReturnValue({ user: { uid: 'django-1', isDjango: true }, loading: false });
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    render(<IntegracaoDocente codigo="ARTE42" />);
    expect(screen.getByText(/login de professor com sua conta Firebase/i)).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('não admite aluno sem cookie válido e não envia identidade fornecida por input', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ authenticated: false }) }); vi.stubGlobal('fetch', fetcher);
    render(<IntegracaoAluno />);
    expect(await screen.findByRole('link', { name: /Fazer login no Portal/ })).toHaveAttribute('href', '/aluno');
    expect(screen.queryByLabelText('Código da sala')).not.toBeInTheDocument();
    expect(fetcher.mock.calls[0][0]).toBe('/api/aluno/sessao');
  });
  it('entra com código e sessão validada sem Bearer ou alunoId no corpo', async () => {
    const fetcher = vi.fn(async (url) => {
      if (url === '/api/aluno/sessao') return { ok: true, json: async () => ({ authenticated: true, aluno: { loginKey: 'a1', nome: 'Ana' } }) };
      if (url.endsWith('/entrar')) return { ok: true, json: async () => ({ sala: { codigo: 'ARTE42' } }) };
      if (url.endsWith('/eventos')) return { ok: true, body: { getReader: () => ({ read: async () => ({ done: true }), cancel: async () => {}, releaseLock: () => {} }) } };
      return { ok: true, json: async () => ({ estado: { sala: { codigo: 'ARTE42', titulo: 'Arte', revisao: 1 }, fase: 'espera', agoraServidorMs: Date.now() } }) };
    }); vi.stubGlobal('fetch', fetcher);
    render(<IntegracaoAluno />);
    fireEvent.change(await screen.findByLabelText('Código da sala'), { target: { value: 'arte42' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar na revisão' }));
    await waitFor(() => expect(fetcher.mock.calls.some(c => c[0].endsWith('/entrar'))).toBe(true));
    const chamada = fetcher.mock.calls.find(c => c[0].endsWith('/entrar'));
    expect(JSON.parse(chamada[1].body)).toEqual({}); expect(chamada[1].headers.Authorization).toBeUndefined();
  });
});
