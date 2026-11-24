// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { RevisaoAutonoma } from '@/components/revisao-autonoma/RevisaoAutonoma';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';
import { criarHandlerRevisaoAutonoma } from '@/infraestrutura/revisao-autonoma/httpServidor';

const ana = { tipo: 'aluno', loginKey: 'a'.repeat(64) };
const prof = { tipo: 'professor', uid: 'p1' };

async function criarServidor(total = 12) {
  const base = { revision: 1, status: 'revisada', tipo: 'multipla_escolha', disciplina: 'Ciências', anoEscolar: '8º ano', conteudo: 'Plantas', dificuldade: 'facil', alternativas: [{ id: 'A', texto: 'Certa' }, { id: 'B', texto: 'Errada' }], respostaCorreta: 'A' };
  const docs = new Map(Object.entries({
    'professores/p1/turmas/data': { turmas: [{ id: 't1', nome: 'Turma 1', alunos: [{ id: 'a1', nome: 'Ana' }] }] },
    [`alunoLogin/${ana.loginKey}/vinculos/p1`]: { professorUid: 'p1', turmaId: 't1', alunoId: 'a1' },
  }));
  for (let i = 1; i <= total; i++) docs.set(`aulaGamificadaDocentes/p1/questoes/q${i}`, { ...base, id: `q${i}`, enunciado: `Pergunta ${i}?`, explicacao: `Explicação ${i}` });
  const copy = (x) => (x == null ? null : structuredClone(x));
  const store = {
    async get(p) { return copy(docs.get(p)); },
    async list(p, f = []) { return [...docs].filter(([k, d]) => k.startsWith(`${p}/`) && !k.slice(p.length + 1).includes('/') && f.every(([c, , v]) => d[c] === v)).map(([, v]) => copy(v)); },
    async transaction(fn) {
      const w = new Map(); let escreveu = false;
      const r = await fn({ get: async (p) => { if (escreveu) throw Error('Leitura após escrita'); return store.get(p); }, list: async (p, f) => { if (escreveu) throw Error('Leitura após escrita'); return store.list(p, f); }, set: (p, v) => { escreveu = true; w.set(p, copy(v)); } });
      for (const [p, v] of w) docs.set(p, v);
      return r;
    },
  };
  let n = 0;
  const service = new RevisaoAutonomaService({ store, agora: () => 1000 + n, gerarId: () => `sessao_${++n}` });
  for (let i = 1; i <= total; i++) await service.publicar(prof, { questaoId: `q${i}`, expectedRevision: 1, turmaIds: ['t1'] });
  const handler = criarHandlerRevisaoAutonoma({ service, autenticar: async () => ana });
  return { docs, fetch: vi.fn(async (url, init) => handler(new Request(`http://localhost${url}`, init))) };
}

let fullscreen;
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  fullscreen = vi.fn(() => Promise.resolve());
  HTMLElement.prototype.requestFullscreen = fullscreen;
  document.exitFullscreen = vi.fn(() => Promise.resolve());
  window.localStorage.clear();
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals();
  delete HTMLElement.prototype.requestFullscreen; delete document.exitFullscreen;
});

async function preparar(total = 12) {
  const srv = await criarServidor(total);
  vi.stubGlobal('fetch', srv.fetch);
  const ui = render(<RevisaoAutonoma />);
  await screen.findByText('Prepare sua aventura');
  fireEvent.change(screen.getByLabelText('Disciplina'), { target: { value: 'Ciências' } });
  const sel = screen.getByLabelText('Conteúdo e dificuldade');
  fireEvent.change(sel, { target: { value: sel.options[1].value } });
  return { srv, ui };
}
const menu = () => fireEvent.click(screen.getByRole('button', { name: /Abrir menu e desafios/ }));
async function resolverEvento(rotulo, alternativa = 'Certa') {
  menu();
  fireEvent.click(await screen.findByRole('button', { name: rotulo }));
  const dialogo = await screen.findByRole('dialog', { name: 'Desafio pedagógico' });
  fireEvent.click(within(dialogo).getByLabelText(alternativa));
  fireEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar resposta' }));
  fireEvent.click(await screen.findByRole('button', { name: /Li a explicação/ }));
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Desafio pedagógico' })).toBeNull());
}

describe('Jornada V2 — preparação, gesto e estrelas', () => {
  it('sugere 3×3 com 12 questões, mostra necessário/disponível e permite configuração menor', async () => {
    await preparar(12);
    expect(screen.getByTestId('resumo-configuracao').textContent).toContain('12 questões necessárias · 12 liberadas');
    fireEvent.change(screen.getByLabelText('Estrelas por fase'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Fases'), { target: { value: '2' } });
    expect(screen.getByTestId('resumo-configuracao').textContent).toContain('4 questões necessárias');
  });

  it('só oferece o que existe: 5 liberadas não permitem 3 fases × 3 estrelas', async () => {
    await preparar(5);
    const estrelas = [...screen.getByLabelText('Estrelas por fase').options].map((o) => o.value);
    const fases = [...screen.getByLabelText('Fases').options].map((o) => o.value);
    expect(fases).toEqual(['1', '2']);
    expect(estrelas.length).toBeGreaterThan(0);
    expect(screen.getByTestId('resumo-configuracao').textContent).toMatch(/liberadas/);
    expect(screen.getByText(/peça ao professor para liberar mais/i)).toBeTruthy();
  });

  it('prepara sem tela cheia; Jogar pede fullscreen SINCRONAMENTE no gesto e entra no palco', async () => {
    await preparar(12);
    fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/ }));
    await screen.findByText('Sua aventura está pronta!');
    expect(fullscreen).not.toHaveBeenCalled();
    expect(screen.getByTestId('palco-imersivo').dataset.emJogo).toBe('nao');
    fireEvent.click(screen.getByRole('button', { name: /Jogar/ }));
    expect(fullscreen).toHaveBeenCalledTimes(1); // sem nenhum await entre o clique e o pedido
    expect(fullscreen.mock.contexts[0]).toBe(screen.getByTestId('palco-imersivo'));
    expect(screen.getByTestId('palco-imersivo').dataset.emJogo).toBe('sim');
    expect(screen.getByTestId('hud-progresso').textContent).toContain('Fase 1/3 · ★ 0/3');
    // canvas, controles, menu e HUD vivem dentro do elemento em tela cheia
    const palco = screen.getByTestId('palco-imersivo');
    expect(palco.contains(screen.getByTestId('canvas-percurso'))).toBe(true);
    expect(palco.contains(screen.getByTestId('controles-esquerda'))).toBe(true);
    expect(palco.contains(screen.getByTestId('controles-direita'))).toBe(true);
  });

  it('fullscreen negado: jogo continua em área imersiva e avisa para girar em retrato', async () => {
    fullscreen.mockImplementation(() => Promise.reject(new Error('negado')));
    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
    await preparar(12);
    fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/ }));
    await screen.findByText('Sua aventura está pronta!');
    fireEvent.click(screen.getByRole('button', { name: /Jogar/ }));
    expect(await screen.findByText(/Gire o aparelho/)).toBeTruthy();
    expect(screen.getByTestId('palco-imersivo').dataset.emJogo).toBe('sim');
    fireEvent.click(screen.getByRole('button', { name: 'Dispensar' }));
    expect(screen.queryByText(/Gire o aparelho/)).toBeNull();
    delete window.matchMedia;
  });

  it('estrela abre só aquela pergunta; erro e acerto pontuam corretamente; canvas persiste na fase e muda na próxima', async () => {
    await preparar(12);
    fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/ }));
    await screen.findByText('Sua aventura está pronta!');
    fireEvent.click(screen.getByRole('button', { name: /Jogar/ }));
    const canvas1 = screen.getByTestId('canvas-percurso');
    await resolverEvento('Estrela 2: pendente', 'Errada');
    expect(screen.getByTestId('hud-progresso').textContent).toContain('★ 1/3 · ✓ 0 · 0 pts');
    await resolverEvento('Estrela 1: pendente', 'Certa');
    expect(screen.getByTestId('hud-progresso').textContent).toContain('★ 2/3 · ✓ 1 · 100 pts');
    expect(screen.getByTestId('canvas-percurso')).toBe(canvas1); // não remonta por pergunta
    // portal trancado até concluir a última estrela
    menu();
    const portal = screen.getByRole('button', { name: /Portal:/ });
    expect(portal.disabled).toBe(true);
    expect(portal.textContent).toContain('🔒 2/3 estrelas');
    fireEvent.click(screen.getByRole('button', { name: '▶ Continuar' }));
    await resolverEvento('Estrela 3: pendente', 'Certa');
    await resolverEvento('Portal: pendente', 'Certa');
    const fim = await screen.findByRole('dialog', { name: 'Fase concluída' });
    expect(within(fim).getByTestId('feedback-emocional').dataset.tipo).toBe('fase');
    fireEvent.click(within(fim).getByRole('button', { name: /Próxima fase/ }));
    await waitFor(() => expect(screen.getByTestId('hud-progresso').textContent).toContain('Fase 2/3 · ★ 0/3 · ✓ 3 · 300 pts'));
    expect(screen.getByTestId('canvas-percurso')).not.toBe(canvas1); // chave por fase física
  });

  it('retoma depois de recarregar: fase, estrelas resolvidas e pontos', async () => {
    const { srv, ui } = await preparar(12);
    fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/ }));
    await screen.findByText('Sua aventura está pronta!');
    fireEvent.click(screen.getByRole('button', { name: /Jogar/ }));
    await resolverEvento('Estrela 1: pendente', 'Certa');
    ui.unmount();
    render(<RevisaoAutonoma />);
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar aventura' }));
    await screen.findByText('Sua aventura está pronta!');
    fireEvent.click(screen.getByRole('button', { name: /Continuar ▶/ }));
    expect(screen.getByTestId('hud-progresso').textContent).toContain('★ 1/3 · ✓ 1 · 100 pts');
    menu();
    expect(screen.getByRole('button', { name: 'Estrela 1: revisado' }).disabled).toBe(true);
    expect(srv.fetch).toHaveBeenCalled();
  });

  it('pausa ao perder foco: controles ficam desabilitados e nada fica preso', async () => {
    await preparar(12);
    fireEvent.click(screen.getByRole('button', { name: /Começar a jogar/ }));
    await screen.findByText('Sua aventura está pronta!');
    fireEvent.click(screen.getByRole('button', { name: /Jogar/ }));
    expect(screen.getByLabelText('Pular').disabled).toBe(false);
    act(() => { window.dispatchEvent(new Event('blur')); });
    expect(screen.getByLabelText('Pular').disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: '▶ Continuar' }));
    expect(screen.getByLabelText('Pular').disabled).toBe(false);
  });
});
