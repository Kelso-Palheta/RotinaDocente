import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import Historico from '@/app/redacao/desempenho/page';
import Correcao from '@/app/redacao/page';

const { turmas, correcoes } = vi.hoisted(() => ({
  turmas: [
    { id: 't25', nome: '101', anoLetivo: 2025, alunos: [{ id: 'a', nome: 'Ana Silva', dataNascimento: '1503' }] },
    { id: 't26', nome: '102', ano: 2026, alunos: [{ id: 'a', nome: 'Ana Silva', dataNascimento: '1503' }] },
    { id: 't27', nome: '103', anoLetivo: 2027, alunos: [{ id: 'b', nome: 'Bruno' }] },
  ],
  correcoes: [
    { id: 'v2', turmaId: 't26', alunoId: 'a', bimestre: 2, studentName: 'Ana Silva', essayTheme: 'Redação vinculada' },
    { id: 'antiga', loginAluno: 'ana1503', studentClass: '102', bimestre: 2, studentName: 'ANA SILVA', essayTheme: 'Redação antiga identificada' },
    { id: 'ambigua', loginAluno: 'ana1503', bimestre: 2, studentName: 'Ana Silva', essayTheme: 'Redação sem turma confirmada' },
    { id: 'avulsa', studentClass: '102', bimestre: 2, studentName: 'Ana Silva', essayTheme: 'Redação sem login' },
    { id: 'homonimo', loginAluno: 'ana1503', studentClass: '102', bimestre: 2, studentName: 'Ana Santos', essayTheme: 'Redação de outro aluno' },
    { id: 'anterior', turmaId: 't25', alunoId: 'a', bimestre: 2, studentName: 'Ana Silva', essayTheme: 'Redação de 2025' },
    { id: 'b1', turmaId: 't26', alunoId: 'a', bimestre: 1, studentName: 'Ana Silva', essayTheme: 'Redação do primeiro bimestre' },
  ],
}));

vi.mock('@/lib/auth-context', () => ({ useAuth: () => ({ user: { uid: 'prof' }, perfil: { modulos_permitidos: ['redacao-corretor'] }, loading: false }) }));
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/lib/firebase', () => ({ db: {} }));
vi.mock('@/lib/redacao/pdf-generator', () => ({ generatePDF: vi.fn() }));
vi.mock('@/infraestrutura/diario/DiarioRepository', () => ({
  DiarioRepository: class { async carregar() { return { turmas }; } },
}));
vi.mock('@/hooks/diario/usePersistenciaDiario', () => ({ usePersistenciaDiario: () => ({ turmas }) }));
vi.mock('../../../../frontend/node_modules/firebase/firestore/dist/index.mjs', () => ({
  collection: vi.fn(),
  getDocs: async () => ({ docs: correcoes.map(r => ({ id: r.id, data: () => r })) }),
}));

const selecionar = (rotulo, value) => fireEvent.change(screen.getByLabelText(rotulo), { target: { value } });
const selecionarAna = () => {
  const opcao = screen.getByRole('option', { name: /Ana Silva/ });
  selecionar('Aluno', opcao.value);
};

describe('Seleção de contexto da Redação', () => {
  it('combina ano do Diário, turma, bimestre e aluno sem misturar registros antigos ambíguos', async () => {
    render(<Historico />);
    await screen.findByText('7 redações neste recorte');
    expect(screen.getByRole('option', { name: '2027' })).toBeInTheDocument();

    selecionar('Ano letivo', '2026');
    expect(screen.queryByRole('option', { name: /^101/ })).not.toBeInTheDocument();
    selecionar('Turma', 't26');
    selecionar('Bimestre', '2');
    selecionarAna();

    expect(screen.getByText('Redação vinculada')).toBeInTheDocument();
    expect(screen.getByText('Redação antiga identificada')).toBeInTheDocument();
    for (const redacao of correcoes.slice(2)) {
      expect(screen.queryByText(redacao.essayTheme)).not.toBeInTheDocument();
    }

    selecionar('Ano letivo', '2027');
    expect(screen.getByLabelText('Turma')).toHaveValue('all');
    expect(screen.getByLabelText('Aluno')).toHaveValue('all');
  });

  it('usa as turmas do ano selecionado ao iniciar uma correção', () => {
    render(<Correcao />);
    expect(screen.getByRole('combobox', { name: 'Ano letivo' })).toBeInTheDocument();
    selecionar('Ano letivo', '2026');
    expect(screen.queryByRole('option', { name: /^101/ })).not.toBeInTheDocument();
    selecionar('Turma', 't26');
    selecionar('Bimestre', '2');
    selecionarAna();
    expect(screen.getByLabelText('Aluno')).toHaveValue('a');
    selecionar('Ano letivo', '2027');
    expect(screen.getByLabelText('Turma')).toHaveValue('');
    expect(screen.queryByRole('combobox', { name: 'Aluno' })).not.toBeInTheDocument();
  });
});
