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
test('média bimestral usa a mesma cor das notas do Diário', () => {
  m.turmas = [turma('a')];
  localStorage.setItem('diario_contexto_u', JSON.stringify({ bimestre: 1 }));
  render(<Analytics />);
  expect(screen.getByText('Média').nextElementSibling).toHaveStyle({ color: '#2563eb' });
});
