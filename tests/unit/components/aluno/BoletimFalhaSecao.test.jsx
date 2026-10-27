import { render, screen, within, fireEvent } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ router: { push: vi.fn(), replace: vi.fn() } }));
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => mocks.router }));
vi.mock('@/lib/firebase-aluno', () => ({}));
vi.mock('@/lib/aluno/boletim-pdf', () => ({ generateBoletimPDF: vi.fn() }));

import AlunoNotasPage from '@/app/aluno/notas/page';

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

test('UT-47 falha de notas não é anunciada como ausência de notas', async () => {
  sessionStorage.setItem('aluno_login', JSON.stringify({ nome: 'Ana Exemplo', alunoId: 'a', turmaId: 't', professorUid: 'p' }));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ notas: {}, atividades: [], entregas: [], tokens: {}, falhas: { notas: true } }) }));

  render(<AlunoNotasPage />);
  await screen.findByText('Ana Exemplo');

  const alerta = screen.getByRole('alert');
  expect(within(alerta).getByText(/Não foi possível carregar suas notas/)).toBeInTheDocument();
  expect(screen.queryByText('Nenhuma nota publicada ainda.')).toBeNull();
});

test('UT-47 nova tentativa preserva o que já está na tela', async () => {
  sessionStorage.setItem('aluno_login', JSON.stringify({ nome: 'Ana Exemplo', alunoId: 'a', turmaId: 't', professorUid: 'p' }));
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ notas: {}, atividades: [], entregas: [], tokens: {}, falhas: { notas: true } }) });
  vi.stubGlobal('fetch', fetchMock);

  render(<AlunoNotasPage />);
  await screen.findByText('Ana Exemplo');

  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  expect(screen.getByText('Ana Exemplo')).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
