// @vitest-environment jsdom
import React, { useRef } from 'react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ControlesPlataforma } from '@/components/revisao-autonoma/ControlesPlataforma';
import { acaoDaTecla, alvoIgnoraJogo, useEntradaTeclado } from '@/components/revisao-autonoma/entrada';

beforeAll(() => {
  if (!window.PointerEvent) {
    window.PointerEvent = class extends MouseEvent {
      constructor(tipo, init = {}) { super(tipo, init); this.pointerId = init.pointerId; }
    };
  }
});
afterEach(cleanup);

function Palco({ ativo = true, desabilitado = false, expor }) {
  const entrada = useRef({ esquerda: false, direita: false, pular: false });
  expor.entrada = entrada.current;
  useEntradaTeclado(entrada, ativo);
  return (
    <div>
      <ControlesPlataforma entradaRef={entrada} desabilitado={desabilitado} />
      <input aria-label="campo" />
      <button type="button">resposta</button>
    </div>
  );
}

describe('controles separados e multitoque', () => {
  it('direcional à esquerda, pulo à direita, alvos de pelo menos 64 px (h-16/w-16)', () => {
    render(<Palco expor={{}} />);
    const esq = screen.getByTestId('controles-esquerda');
    const dir = screen.getByTestId('controles-direita');
    expect(esq.querySelector('[data-controle="esquerda"]')).toBeTruthy();
    expect(esq.querySelector('[data-controle="direita"]')).toBeTruthy();
    expect(dir.querySelector('[data-controle="pular"]')).toBeTruthy();
    expect(esq.className).toContain('left-');
    expect(dir.className).toContain('right-');
    for (const b of document.querySelectorAll('[data-controle]')) {
      expect(b.className).toMatch(/\bh-16\b/);
      expect(b.className).toMatch(/\bw-16\b/);
      expect(b.style.touchAction).toBe('none');
    }
  });

  it('anda e pula ao mesmo tempo com dois ponteiros; soltar um não solta o outro', () => {
    const e = {};
    render(<Palco expor={e} />);
    const dir = screen.getByLabelText('Mover para a direita');
    const pulo = screen.getByLabelText('Pular');
    fireEvent.pointerDown(dir, { pointerId: 1 });
    fireEvent.pointerDown(pulo, { pointerId: 2 });
    expect(e.entrada).toMatchObject({ direita: true, pular: true, esquerda: false });
    fireEvent.pointerUp(pulo, { pointerId: 2 });
    expect(e.entrada).toMatchObject({ direita: true, pular: false });
    fireEvent.pointerCancel(dir, { pointerId: 1 });
    expect(e.entrada.direita).toBe(false);
  });

  it('lostpointercapture e blur limpam o botão; desabilitar limpa todas as entradas', () => {
    const e = {};
    const { rerender } = render(<Palco expor={e} />);
    const esq = screen.getByLabelText('Mover para a esquerda');
    fireEvent.pointerDown(esq, { pointerId: 3 });
    expect(e.entrada.esquerda).toBe(true);
    fireEvent.lostPointerCapture(esq, { pointerId: 3 });
    expect(e.entrada.esquerda).toBe(false);
    fireEvent.pointerDown(esq, { pointerId: 4 });
    fireEvent.blur(esq);
    expect(e.entrada.esquerda).toBe(false);
    fireEvent.pointerDown(esq, { pointerId: 5 });
    rerender(<Palco expor={e} desabilitado />);
    expect(e.entrada.esquerda).toBe(false);
    expect(screen.getByLabelText('Pular').disabled).toBe(true);
  });

  it('desmontar limpa entradas presas', () => {
    const e = {};
    const { unmount } = render(<Palco expor={e} />);
    fireEvent.pointerDown(screen.getByLabelText('Pular'), { pointerId: 1 });
    expect(e.entrada.pular).toBe(true);
    unmount();
    expect(e.entrada.pular).toBe(false);
  });
});

describe('teclado', () => {
  it('aceita setas, A/D, espaço e W em minúsculas e maiúsculas', () => {
    for (const [tecla, acao] of [['ArrowLeft', 'esquerda'], ['a', 'esquerda'], ['A', 'esquerda'], ['ArrowRight', 'direita'], ['d', 'direita'], ['D', 'direita'], [' ', 'pular'], ['w', 'pular'], ['W', 'pular'], ['ArrowUp', 'pular']]) {
      expect(acaoDaTecla(tecla)).toBe(acao);
    }
    expect(acaoDaTecla('x')).toBeNull();
  });

  it('teclas simultâneas funcionam e keyup solta', () => {
    const e = {};
    render(<Palco expor={e} />);
    fireEvent.keyDown(window, { key: 'D' });
    fireEvent.keyDown(window, { key: ' ' });
    expect(e.entrada).toMatchObject({ direita: true, pular: true });
    fireEvent.keyUp(window, { key: 'd' });
    expect(e.entrada).toMatchObject({ direita: false, pular: true });
  });

  it('não captura teclas em campos nem em botões de resposta', () => {
    const e = {};
    render(<Palco expor={e} />);
    const campo = screen.getByLabelText('campo');
    const botao = screen.getByText('resposta');
    expect(alvoIgnoraJogo(campo)).toBe(true);
    expect(alvoIgnoraJogo(botao)).toBe(true);
    const evCampo = fireEvent.keyDown(campo, { key: 'a' });
    const evBotao = fireEvent.keyDown(botao, { key: ' ' });
    expect(e.entrada.esquerda).toBe(false);
    expect(e.entrada.pular).toBe(false);
    expect(evCampo).toBe(true); expect(evBotao).toBe(true); // não houve preventDefault
  });

  it('inativo (pausado/overlay) ignora teclado e blur/aba oculta limpam', () => {
    const e = {};
    const { rerender } = render(<Palco expor={e} ativo={false} />);
    fireEvent.keyDown(window, { key: 'd' });
    expect(e.entrada.direita).toBe(false);
    rerender(<Palco expor={e} ativo />);
    fireEvent.keyDown(window, { key: 'd' });
    expect(e.entrada.direita).toBe(true);
    fireEvent.blur(window);
    expect(e.entrada.direita).toBe(false);
    fireEvent.keyDown(window, { key: 'a' });
    rerender(<Palco expor={e} ativo={false} />);
    expect(e.entrada.esquerda).toBe(false);
  });
});
