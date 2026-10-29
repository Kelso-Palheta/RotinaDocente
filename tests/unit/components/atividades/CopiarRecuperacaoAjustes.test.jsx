import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ listar: vi.fn(), obter: vi.fn(), salvar: vi.fn(), form: null }));
vi.mock('@/lib/firebase-recuperacao', () => ({
  listConjuntosRecuperacao: (...args) => m.listar(...args),
  getConjuntoRecuperacao: (...args) => m.obter(...args),
  criarConjuntoRecuperacao: vi.fn(),
}));
vi.mock('@/components/atividades/AtividadeForm', () => ({
  AtividadeForm: props => { m.form = props; return <div>Revisão aberta</div>; },
}));
import { CopiarRecuperacaoModal } from '@/components/atividades/CopiarRecuperacaoModal';
const origem = { id: 'a1', professorId: 'p', conjuntoRecuperacaoId: 'c1', finalidade: 'recuperacao_semestral', turmaIds: ['t1'], notaMaxima: 4, titulo: 'Explique', questoes: [{ id: 'q', tipo: 'discursiva', enunciado: 'Explique', notaMaxima: 4 }] };
const destino = { id: 'c2', professorId: 'p', turmaId: 't2', anoLetivo: '2026', semestre: '1', versao: 1, destinatariosIds: ['b'], escalas: {}, atividadeIds: [], estado: 'rascunho' };
const turmas = [{ id: 't2', nome: 'Turma B', anoLetivo: 2026, alunos: [{ id: 'b', nome: 'Bia' }] }];
const montar = () => render(<CopiarRecuperacaoModal user={{ uid: 'p' }} origem={origem} turmas={turmas} ano="2026" onClose={vi.fn()} onSalvar={m.salvar} />);
beforeEach(() => {
  m.form = null;
  m.listar.mockReset().mockResolvedValue([destino]);
  m.obter.mockReset().mockResolvedValue(destino);
  m.salvar.mockReset().mockResolvedValue('copia');
});
it.each(['amanhã', '31/02/2027 23:59', '2027-02-31T23:59'])('prazo inválido %s não abre revisão nem escolhe data automática', async prazo => {
  montar();
  fireEvent.change(await screen.findByLabelText(/Novo prazo/i), { target: { value: prazo } });
  fireEvent.click(screen.getByRole('button', { name: /Revisar conteúdo e prazo/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/data.*hora.*válid/i);
  expect(m.form).toBeNull();
  expect(m.salvar).not.toHaveBeenCalled();
});
it('prazo brasileiro é normalizado mantendo dia e hora escolhidos', async () => {
  montar();
  fireEvent.change(await screen.findByLabelText(/Novo prazo/i), { target: { value: '04/11/2027 23:59' } });
  fireEvent.click(screen.getByRole('button', { name: /Revisar conteúdo e prazo/i }));
  await waitFor(() => expect(m.form).not.toBeNull());
  expect(m.form.contextoInicial.prazoInicial).toBe('2027-11-04T23:59');
});
it('saldo 3 permite revisar 4, mas só salva após reduzir as questões para 3', async () => {
  const comSaldo = { ...destino, escalas: { antiga: 7 }, atividadeIds: ['antiga'] };
  m.listar.mockResolvedValue([comSaldo]); m.obter.mockResolvedValue(comSaldo);
  montar();
  fireEvent.click(await screen.findByRole('button', { name: /Revisar conteúdo e prazo/i }));
  await waitFor(() => expect(m.form).not.toBeNull());
  expect(m.form.contextoInicial.pontosRestantes).toBe(3);
  const dados = { id: 'copia', notaMaxima: 4, destinatariosIds: ['b'] };
  await act(async () => { await expect(m.form.onCreate(dados)).rejects.toMatchObject({ code: 'RECUPERACAO_COPIA_SALDO_INSUFICIENTE' }); });
  expect(m.salvar).not.toHaveBeenCalled();
  await act(async () => { await m.form.onCreate({ ...dados, notaMaxima: 3 }); });
  expect(m.salvar).toHaveBeenCalledTimes(1);
  expect(m.salvar.mock.calls[0][1].versaoEsperada).toBe(1);
});
