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
const origem = {
  id: 'origem', professorId: 'p', conjuntoRecuperacaoId: 'c1',
  finalidade: 'recuperacao_semestral', turmaIds: ['t1'], semestre: '1',
  titulo: 'Questão para reaproveitar', notaMaxima: 4,
  questoes: [{ id: 'q1', tipo: 'discursiva', enunciado: 'Explique.', notaMaxima: 4 }],
};
const destino = (extra = {}) => ({
  id: 'c2', professorId: 'p', turmaId: 't2', semestre: '1', anoLetivo: '2026',
  destinatariosIds: ['b'], versao: 1, atividadeIds: [], escalas: {}, estado: 'rascunho', ...extra,
});
const turmas = [
  { id: 't1', anoLetivo: 2026, nome: 'A', alunos: [{ id: 'a', nome: 'Ana' }] },
  { id: 't2', anoLetivo: 2026, nome: 'B', alunos: [{ id: 'b', nome: 'Bia' }] },
];
const dados = {
  id: 'copia', titulo: origem.titulo, questoes: origem.questoes, notaMaxima: 4,
  destinatariosIds: ['b'], conjuntoRecuperacaoId: 'c2', conjuntoVersao: 1,
  turmaIds: ['t2'], semestre: '1', anoLetivo: '2026', dataEntrega: new Date('2099-01-01'),
};
async function abrir() {
  render(<CopiarRecuperacaoModal user={{ uid: 'p' }} origem={origem} turmas={turmas} ano="2026" onClose={vi.fn()} onSalvar={m.salvar} />);
  fireEvent.click(await screen.findByRole('button', { name: /Revisar conteúdo e prazo/i }));
  await waitFor(() => expect(m.form).not.toBeNull());
}
beforeEach(() => {
  m.form = null;
  m.listar.mockReset().mockResolvedValue([destino()]);
  m.obter.mockReset().mockResolvedValue(destino());
  m.salvar.mockReset().mockResolvedValue('copia');
});
it('REV-R82-01: alteração de semestre/versão após abrir revisão exige nova conferência, sem salvar', async () => {
  await abrir();
  m.obter.mockResolvedValue(destino({ semestre: '2', versao: 2 }));
  let falha;
  await act(async () => { try { await m.form.onCreate(dados); } catch (erro) { falha = erro; } });
  expect(m.salvar).not.toHaveBeenCalled();
  expect(falha?.code).toBe('RECUPERACAO_COPIA_DESTINO_OBSOLETO');
});
it('REV-R82-02: retry após commit que fechou 10 chega à checagem idempotente, mesmo sem saldo', async () => {
  m.listar.mockResolvedValue([destino({ atividadeIds: ['anterior'], escalas: { anterior: 6 } })]);
  m.obter.mockResolvedValue(destino({ atividadeIds: ['anterior'], escalas: { anterior: 6 } }));
  await abrir();
  m.salvar.mockImplementationOnce(async () => {
    m.obter.mockResolvedValue(destino({ versao: 2, atividadeIds: ['anterior', 'copia'], escalas: { anterior: 6, copia: 4 }, estado: 'pronto' }));
    throw new Error('Resposta perdida após commit');
  }).mockResolvedValueOnce('copia');
  await act(async () => { await expect(m.form.onCreate(dados)).rejects.toThrow('Resposta perdida'); });
  let falha;
  await act(async () => { try { await m.form.onCreate(dados); } catch (erro) { falha = erro; } });
  expect(falha).toBeUndefined();
  expect(m.salvar).toHaveBeenCalledTimes(2);
});
it('REV-R82-03: destino com saldo menor continua revisável para reduzir pontuação da cópia', async () => {
  m.listar.mockResolvedValue([destino({ escalas: { anterior: 7 }, atividadeIds: ['anterior'] })]);
  render(<CopiarRecuperacaoModal user={{ uid: 'p' }} origem={origem} turmas={turmas} ano="2026" onClose={vi.fn()} onSalvar={m.salvar} />);
  expect(await screen.findByRole('button', { name: /Revisar conteúdo e prazo/i })).toBeEnabled();
});
