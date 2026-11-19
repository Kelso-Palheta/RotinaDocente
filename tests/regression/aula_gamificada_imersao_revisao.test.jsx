// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { derivarContextoAudiovisual } from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';
import { MotorAudioJogo } from '@/components/aula-gamificada/audiovisual/motorAudioJogo';
import { CATALOGO_CENAS } from '@/components/aula-gamificada/audiovisual/catalogoCenas';
import PalcoCenaJogo from '@/components/aula-gamificada/audiovisual/PalcoCenaJogo';
import { SalaAlunoView } from '@/components/aula-gamificada/SalaAlunoView';

vi.mock('@/components/aula-gamificada/useSalaGamificada', () => ({ useCronometroServidor: () => 60 }));
vi.mock('next/link', () => ({ default: ({ href, children }) => <a href={href}>{children}</a> }));

const questao = { id: 'q1', enunciado: 'Qual alternativa?', tipo: 'multipla_escolha',
  alternativas: [{ id: 'A', texto: 'Opção A' }, { id: 'B', texto: 'Opção B' }] };
const estado = (extra = {}) => ({
  codigo: 'SALA01', modalidade: 'quiz', fase: 'pergunta', rodada: 1, totalRodadas: 2,
  questao, revelado: false, recibo: null, feedback: null, ...extra,
});
const recebidoErrado = { status: 'confirmado', correta: false, pontuacao: 0,
  resposta: { alternativaId: 'B' } };
const feedback = { respostaCorreta: 'A', explicacao: 'A é correta.' };

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('Revisão independente da imersão audiovisual', () => {
  it('REV-IM-01: encerramento sem revelação não comemora acerto', () => {
    const av = derivarContextoAudiovisual(estado({ fase: 'feedback' }), 0, 'aluno');
    expect(['acerto', 'erro', 'vitoria']).not.toContain(av.situacao);
  });

  it('REV-IM-02: erro revelado usa recibo real; feedback não contém campo correta', () => {
    const av = derivarContextoAudiovisual(estado({
      fase: 'feedback', revelado: true, feedback, recibo: recebidoErrado,
    }), 0, 'aluno');
    expect(av.situacao).toBe('erro');
  });

  it('REV-IM-03: pontuação parcial não vira cena de acerto integral', () => {
    const av = derivarContextoAudiovisual(estado({
      modalidade: 'associacao', fase: 'feedback', revelado: true,
      feedback: { paresCorretos: [] }, recibo: { correta: false, pontuacao: 500, status: 'confirmado' },
    }), 0, 'aluno');
    expect(av.situacao).not.toBe('acerto');
  });

  it('REV-IM-04: ranking dispara vinheta de ranking, não de abertura', () => {
    const av = derivarContextoAudiovisual(estado({ fase: 'ranking', revelado: true }), 0, 'projecao');
    expect(av.evento.situacao).toBe('ranking');
  });

  it('REV-IM-05: a tela real do aluno que errou exibe cena de erro na revelação', () => {
    const { container } = render(<SalaAlunoView estado={estado({
      fase: 'feedback', revelado: true, feedback, recibo: recebidoErrado,
    })} onResponder={vi.fn()} />);
    const imagens = [...container.querySelectorAll('img')].map((el) => el.getAttribute('src'));
    expect(imagens.some((src) => src?.includes('/quiz-erro-'))).toBe(true);
  });

  it('REV-IM-06: primeiro gesto na alternativa do Quiz destrava o áudio na sala real', () => {
    const resume = vi.fn(() => new Promise(() => {}));
    vi.stubGlobal('AudioContext', vi.fn(function () {
      return { state: 'suspended', resume, close: vi.fn(), currentTime: 0 };
    }));
    render(<SalaAlunoView estado={estado()} onResponder={vi.fn()} />);
    resume.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Opção A/i }));
    expect(resume).toHaveBeenCalled();
  });

  it('REV-IM-07: contexto Web Audio suspenso informa necessidade de ativação', async () => {
    const motor = new MotorAudioJogo({ storage: localStorage,
      criarAudioContext: () => ({ state: 'suspended', resume: () => new Promise(() => {}), close: vi.fn() }),
    });
    try {
      await motor.sincronizarTrilha({ modalidade: 'quiz', fase: 'espera' });
      expect(motor.obterEstado().bloqueadoAutoplay).toBe(true);
    } finally { motor.destroy(); }
  });

  it('REV-IM-08: volume zero não é elevado para 5% ao tocar efeito', async () => {
    const audio = { play: vi.fn().mockResolvedValue(), pause: vi.fn(), volume: 0,
      removeAttribute: vi.fn(), load: vi.fn() };
    const motor = new MotorAudioJogo({ storage: localStorage, criarAudio: () => audio,
      criarAudioContext: () => ({ state: 'running', close: vi.fn() }),
    });
    try {
      motor.definirVolume(0);
      await motor.sincronizarTrilha({ modalidade: 'herois', fase: 'pergunta' });
      motor.tocarEfeito('acerto');
      expect(audio.volume).toBe(0);
    } finally { motor.destroy(); }
  });

  it('REV-IM-09: modo reduzido manual possui alternativa diferente do SVG animado', () => {
    const cena = CATALOGO_CENAS.find((c) => c.id === 'quiz-acerto-1');
    expect(cena.alternativaEstatica).not.toBe(cena.midiaAnimada);
  });

  it('REV-IM-10: erro de uma mídia não impede exibir a próxima cena válida', () => {
    const primeira = CATALOGO_CENAS.find((c) => c.id === 'quiz-acerto-1');
    const segunda = CATALOGO_CENAS.find((c) => c.id === 'quiz-acerto-2');
    const { container, rerender } = render(<PalcoCenaJogo cena={primeira} />);
    fireEvent.error(container.querySelector('img'));
    rerender(<PalcoCenaJogo cena={segunda} />);
    expect(container.querySelector(`img[src="${segunda.midiaAnimada}"]`)).not.toBeNull();
  });

  it('REV-IM-11: Heróis mantém o palco na tela real do aluno durante a revelação', () => {
    const { container } = render(<SalaAlunoView estado={estado({
      modalidade: 'herois', fase: 'feedback', revelado: true, feedback,
      recibo: { ...recebidoErrado, estadoHeroi: 'golpe_encerrado', tentativas: 2 },
    })} onResponder={vi.fn()} />);
    expect(container.querySelector('[data-testid="palco-cena-herois"]')).not.toBeNull();
  });
});
