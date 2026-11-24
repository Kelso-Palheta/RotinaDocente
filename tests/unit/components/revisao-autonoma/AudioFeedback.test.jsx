// @vitest-environment jsdom
import React, { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotorAudioJogo, PERFIS_SONOROS_EXTRAS, PERFIS_SONOROS_JOGO } from '@/components/aula-gamificada/audiovisual/motorAudioJogo';
import { ProvedorAudiovisualSala, derivarContextoAudiovisual } from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';
import FeedbackEmocional, { escolherVariante } from '@/components/aula-gamificada/audiovisual/FeedbackEmocional';
import { AventuraV2 } from '@/components/revisao-autonoma/AventuraV2';

const MODALIDADES = ['natacao', 'acerte_perde', 'herois', 'tabuleiro', 'quiz', 'memoria', 'associacao', 'ordenacao', 'equipes'];

function ctxFalso(estado = 'running') {
  const ctx = {
    state: estado, currentTime: 0, destination: {},
    bloqueado: estado === 'suspended',
    resume: vi.fn(async () => { if (ctx.bloqueado) throw Object.assign(new Error('NotAllowed'), { name: 'NotAllowedError' }); ctx.state = 'running'; }),
    close: vi.fn(),
    createOscillator: vi.fn(() => ({ type: '', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} })),
    createGain: vi.fn(() => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} })),
  };
  return ctx;
}
const storageFalso = (inicial = null) => { let v = inicial; return { getItem: () => v, setItem: (_k, x) => { v = x; }, lido: () => (v ? JSON.parse(v) : null) }; };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); delete window.AudioContext; delete window.matchMedia; delete HTMLElement.prototype.requestFullscreen; window.localStorage.clear(); });

describe('nove modalidades + autônomo: catálogo e derivação de eventos', () => {
  it('o catálogo ao vivo continua com nove perfis; o autônomo é perfil extra separado', () => {
    expect(Object.keys(PERFIS_SONOROS_JOGO).sort()).toEqual([...MODALIDADES].sort());
    expect(Object.keys(PERFIS_SONOROS_JOGO)).toHaveLength(9);
    expect(PERFIS_SONOROS_EXTRAS.plataforma).toBeTruthy();
    expect(PERFIS_SONOROS_JOGO.plataforma).toBeUndefined();
  });

  it.each(MODALIDADES.flatMap((m) => ['aluno', 'docente', 'projecao'].map((p) => [m, p])))('%s/%s: evento estável com polling e rerender', (modalidade, papel) => {
    const estado = { modalidade, fase: 'feedback', rodada: 2, codigo: 'ABC', revelado: true, recibo: { correta: true, tentativas: 1 } };
    const a = derivarContextoAudiovisual(estado, 10, papel);
    const b = derivarContextoAudiovisual({ ...estado, recibo: { ...estado.recibo } }, 9, papel);
    expect(a.evento?.id).toBe(b.evento?.id);
    expect(a.eventoId).toBe(b.eventoId);
    if (papel === 'aluno') expect(a.situacao).toBe('acerto'); else expect(a.situacao).toBe('revelacao_neutra');
  });

  it('diferencia acerto, erro, parcial e sem resposta; não infere vitória de pontuação positiva nem antes de revelar', () => {
    const base = { modalidade: 'quiz', fase: 'feedback', rodada: 1, codigo: 'X', revelado: true };
    expect(derivarContextoAudiovisual({ ...base, recibo: { correta: false, pontuacao: 40 } }, 0).situacao).toBe('parcial');
    expect(derivarContextoAudiovisual({ ...base, recibo: { correta: false, pontuacao: 0 } }, 0).situacao).toBe('erro');
    expect(derivarContextoAudiovisual({ ...base, recibo: null }, 0).situacao).toBe('sem_resposta');
    expect(derivarContextoAudiovisual({ ...base, revelado: false, recibo: { correta: true } }, 0).situacao).toBe('resposta_recebida');
  });
});

describe('motor de áudio: autoplay, gesto, mute e um único contexto', () => {
  it('autoplay bloqueado é detectado e liberado só pelo gesto', async () => {
    const ctx = ctxFalso('suspended');
    const motor = new MotorAudioJogo({ storage: storageFalso(), criarAudioContext: () => ctx });
    await motor.sincronizarTrilha({ modalidade: 'plataforma', fase: 'desafio' });
    expect(motor.obterEstado().bloqueadoAutoplay).toBe(true);
    ctx.bloqueado = false; // o navegador libera após o gesto do usuário
    await motor.desbloquearPorGesto({ modalidade: 'plataforma', fase: 'desafio' });
    expect(ctx.resume).toHaveBeenCalled();
    expect(motor.obterEstado().bloqueadoAutoplay).toBe(false);
    expect(motor.loopTimer).toBeTruthy();
    motor.destroy();
    expect(motor.loopTimer).toBeNull();
    expect(ctx.close).toHaveBeenCalled();
  });

  it('mute salvo não é religado pelo gesto nem por efeitos', async () => {
    const storage = storageFalso(JSON.stringify({ somAtivo: false, musicaAtiva: true, efeitosAtivos: true, volume: 0.5 }));
    const ctx = ctxFalso();
    const motor = new MotorAudioJogo({ storage, criarAudioContext: () => ctx });
    await motor.desbloquearPorGesto({ modalidade: 'plataforma', fase: 'desafio' });
    motor.tocarEfeito('coleta'); motor.tocarEfeito('acerto');
    expect(motor.loopTimer).toBeNull();
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    expect(motor.obterEstado().somAtivo).toBe(false);
    motor.destroy();
  });

  it('um único AudioContext por motor, mesmo com muitos efeitos; aba oculta pausa a trilha; efeitos novos existem', async () => {
    const ctx = ctxFalso();
    const criar = vi.fn(() => ctx);
    const motor = new MotorAudioJogo({ storage: storageFalso(), criarAudioContext: criar });
    await motor.sincronizarTrilha({ modalidade: 'plataforma', fase: 'desafio' });
    for (const s of ['coleta', 'salto', 'queda', 'portal', 'fase_concluida', 'acerto', 'erro', 'vitoria']) motor.tocarEfeito(s);
    expect(criar).toHaveBeenCalledTimes(1);
    expect(ctx.createOscillator).toHaveBeenCalled();
    motor.definirOculto(true);
    expect(motor.loopTimer).toBeNull();
    motor.destroy();
  });
});

describe('feedback emocional compartilhado', () => {
  const tocar = () => vi.spyOn(MotorAudioJogo.prototype, 'tocarEfeito').mockImplementation(() => {});

  it('toca uma vez por evento estável, mesmo com rerender, StrictMode e remontagem', () => {
    const spy = tocar();
    const App = ({ n }) => <StrictMode><ProvedorAudiovisualSala modalidade="plataforma" fase="desafio"><FeedbackEmocional tipo="acerto" chave="s1:e1" mostrarCena={false} />{n}</ProvedorAudiovisualSala></StrictMode>;
    const { rerender } = render(<App n={1} />);
    rerender(<App n={2} />); rerender(<App n={3} />);
    expect(spy.mock.calls.filter(([s]) => s === 'acerto')).toHaveLength(1);
  });

  it('erro usa som de erro e acerto não é inferido; correção pendente e sem resposta não celebram', () => {
    const spy = tocar();
    render(<ProvedorAudiovisualSala modalidade="plataforma" fase="desafio"><FeedbackEmocional tipo="erro" chave="e1" mostrarCena={false} /><FeedbackEmocional tipo="correcao_pendente" chave="p1" /><FeedbackEmocional tipo="sem_resposta" chave="n1" mostrarCena={false} /></ProvedorAudiovisualSala>);
    const sons = spy.mock.calls.map(([s]) => s);
    expect(sons).toContain('erro');
    expect(sons).not.toContain('acerto');
    expect(sons).not.toContain('vitoria');
    const pend = screen.getAllByTestId('feedback-emocional').find((e) => e.dataset.tipo === 'correcao_pendente');
    expect(pend.textContent).toMatch(/Aguardando correção/);
    expect(pend.dataset.variante).toBe('');
  });

  it('semSom não toca; variantes alternam por chave sem aleatoriedade', () => {
    const spy = tocar();
    render(<ProvedorAudiovisualSala modalidade="quiz" fase="feedback"><FeedbackEmocional tipo="acerto" chave="z" semSom mostrarCena={false} /></ProvedorAudiovisualSala>);
    expect(spy).not.toHaveBeenCalled();
    expect(escolherVariante('acerto', 'k1')).toEqual(escolherVariante('acerto', 'k1'));
    const variantes = new Set(Array.from({ length: 20 }, (_, i) => escolherVariante('acerto', `chave${i}`)[0]));
    expect(variantes.size).toBeGreaterThan(1);
  });

  it('respeita movimento reduzido: alternativa estática, sem partículas animadas', () => {
    window.matchMedia = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    render(<FeedbackEmocional tipo="vitoria" chave="v" mostrarCena={false} />);
    expect(screen.getByTestId('feedback-estatico')).toBeTruthy();
    expect(document.querySelectorAll('.fbe-p')).toHaveLength(0);
  });

  it('animação padrão: partículas rodam uma única vez (sem loop infinito)', () => {
    render(<FeedbackEmocional tipo="vitoria" chave="v2" mostrarCena={false} />);
    expect(document.querySelectorAll('.fbe-p').length).toBeGreaterThan(10);
    expect(document.querySelector('style').textContent).not.toMatch(/infinite/);
  });
});

const sessao = {
  schema: 2, id: 's1', revision: 1, fase: 'jogando', faseAtual: 1, totalFases: 1, disciplina: 'Ciências', conteudo: 'Plantas', dificuldade: 'facil',
  eventos: [{ id: 'f1e1', tipo: 'estrela', estado: 'pendente', x: 800, y: 300 }, { id: 'f1portal', tipo: 'portal', estado: 'pendente', x: 5560, y: 320 }],
  estrelasTotal: 1, estrelasRespondidas: 0, portalLiberado: false, pontosJogo: 0, acertos: 0, erros: 0, desafiosRespondidos: 0, total: 2, aberto: null, feedback: null,
};
const noop = () => {};
const props = { sessao, ocupado: false, pendente: false, erro: '', onAbrir: noop, onResponder: noop, onConfirmar: noop, onAvancar: noop, onSair: noop, onVerResultado: noop, onRepetir: noop, onRecarregar: noop };

describe('áudio na aventura autônoma', () => {
  it('um único controlador/AudioContext por aparelho; gesto de Jogar desbloqueia; preferência de mute preservada', async () => {
    const ctx = ctxFalso('suspended');
    const Ctor = vi.fn(function Ctor() { return ctx; });
    window.AudioContext = Ctor;
    window.localStorage.setItem('ag_audio_prefs_v1', JSON.stringify({ somAtivo: false, musicaAtiva: true, efeitosAtivos: true, volume: 0.45 }));
    HTMLElement.prototype.requestFullscreen = vi.fn(() => Promise.resolve());
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<AventuraV2 {...props} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Jogar/ })); });
    expect(Ctor.mock.calls.length).toBeLessThanOrEqual(1);
    expect(JSON.parse(window.localStorage.getItem('ag_audio_prefs_v1')).somAtivo).toBe(false);
    expect(screen.getByRole('button', { name: 'Ligar ou desligar o som' }).textContent).toBe('🔇');
    expect(ctx.createOscillator).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Pausar' }));
    expect(document.querySelectorAll('[data-testid="barra-controle-audiovisual"]')).toHaveLength(1);
  });

  it('som ligado: o gesto retoma o contexto suspenso e a trilha do autônomo toca', async () => {
    const ctx = ctxFalso('suspended');
    window.AudioContext = vi.fn(function Ctor() { return ctx; });
    HTMLElement.prototype.requestFullscreen = vi.fn(() => Promise.resolve());
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    ctx.bloqueado = false;
    render(<AventuraV2 {...props} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Jogar/ })); });
    expect(ctx.resume).toHaveBeenCalled();
    await act(async () => { vi.advanceTimersByTime(1500); });
    expect(ctx.createOscillator).toHaveBeenCalled();
  });
});
