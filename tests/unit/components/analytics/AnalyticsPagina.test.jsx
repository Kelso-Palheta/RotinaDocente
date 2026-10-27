import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { test, expect, vi, afterEach } from 'vitest';
const m = vi.hoisted(() => ({
  uid: 'u',
  perfil: { nome: 'Professor', modulos_permitidos: ['analytics-pedagogico'] },
  ler: vi.fn(),
  turmas: [],
}));
vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({ user: { uid: m.uid }, perfil: m.perfil, loading: false }),
}));
vi.mock('@/hooks/analytics/useDadosAnalytics', () => ({
  useDadosAnalytics: () => {
    m.ler();
    return { turmas: m.turmas, carregando: false, erro: '', origem: 'nuvem', recarregar: vi.fn() };
  },
}));
vi.mock('@/components/analytics/ComparativoTurmasChart', () => ({ ComparativoTurmasChart: () => null }));
vi.mock('@/components/analytics/DistribuicaoChart', () => ({ DistribuicaoChart: () => null }));
vi.mock('@/components/analytics/EvolucaoChart', () => ({ EvolucaoChart: () => null }));
import Analytics from '@/app/analytics/page';
const turma = (id, extra = {}) => ({
  id,
  nome: `Turma ${id}`,
  anoLetivo: 2026,
  alunos: [{ id: 'a', nome: `Ana ${id}` }],
  bimestres: { 1: { config: {}, atividades: [], notas: { a: { simulado: 5 } } } },
  ...extra,
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
  m.perfil = { nome: 'Professor', modulos_permitidos: ['analytics-pedagogico'] };
});
test('ano, turma, arquivo e período restringem a prévia de relatório', () => {
  localStorage.setItem('diario_contexto_u', JSON.stringify({ bimestre: 1 }));
  m.turmas = [turma('a'), turma('b', { anoLetivo: 2025 }), turma('c', { arquivada: true })];
  render(<Analytics />);
  fireEvent.change(screen.getByLabelText('Ano letivo'), { target: { value: '2026' } });
  fireEvent.click(screen.getByRole('button', { name: 'Conferir e exportar PDF' }));
  expect(screen.getByText('Ana a')).toBeInTheDocument();
  expect(screen.queryByText('Ana b')).toBeNull();
  expect(screen.queryByText('Ana c')).toBeNull();
  fireEvent.click(screen.getByLabelText('Turmas arquivadas'));
  expect(screen.getByText('Ana c')).toBeInTheDocument();
  expect(screen.queryByText('Ana a')).toBeNull();
  fireEvent.change(screen.getByLabelText('Período'), { target: { value: 's1' } });
  expect(screen.getByText('Em andamento · parcial')).toBeInTheDocument();
});
test('seleção removida bloqueia ampliação silenciosa do escopo', () => {
  m.turmas = [turma('a'), turma('b')];
  const { rerender } = render(<Analytics />);
  fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 'a' } });
  m.turmas = [turma('b')];
  rerender(<Analytics />);
  expect(screen.getByRole('alert')).toHaveTextContent('o escopo não foi ampliado');
});
test('sem permissão a página não consulta dados', () => {
  m.perfil = { modulos_permitidos: [] };
  render(<Analytics />);
  expect(m.ler).not.toHaveBeenCalled();
  expect(screen.getByText(/Acesso ao Analytics indisponível/)).toBeInTheDocument();
});
