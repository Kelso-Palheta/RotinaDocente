import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ControlesSala } from '@/components/revisao/ControlesSala';

const estado = {
  conexao: 'conectado', fase: 'conteudo', sala: { duracaoSegundos: 30 },
  rodada: { numero: 1, total: 2 }, aula: { indiceBloco: 1, ultimoBloco: false },
};

it('envia navegação, atalho para as questões e alteração de tempo pelo telão', () => {
  const onAcao = vi.fn();
  render(<ControlesSala estado={estado} onAcao={onAcao} projecao />);
  fireEvent.click(screen.getByRole('button', { name: 'Voltar bloco' }));
  fireEvent.click(screen.getByRole('button', { name: 'Avançar bloco' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pular para as questões' }));
  fireEvent.change(screen.getByRole('spinbutton', { name: 'Tempo padrão (s)' }), { target: { value: '120' } });
  fireEvent.click(screen.getByRole('button', { name: 'Aplicar tempo' }));
  expect(onAcao.mock.calls).toEqual([
    ['voltar_conteudo'], ['avancar_conteudo'], ['iniciar_so_questoes'],
    [{ acao: 'alterar_tempo', duracaoSegundos: 120 }],
  ]);
});

it('só envia reinício depois da confirmação', () => {
  const onAcao = vi.fn();
  const confirmar = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  try {
    render(<ControlesSala estado={estado} onAcao={onAcao} projecao />);
    const botao = screen.getByRole('button', { name: 'Reiniciar sala' });
    fireEvent.click(botao);
    expect(onAcao).not.toHaveBeenCalled();
    fireEvent.click(botao);
    expect(onAcao).toHaveBeenCalledWith({ acao: 'reiniciar', confirmarReinicio: true });
  } finally {
    confirmar.mockRestore();
  }
});
