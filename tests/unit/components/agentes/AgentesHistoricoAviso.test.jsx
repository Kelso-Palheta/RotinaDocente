import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  dismiss: vi.fn(),
  notice: {
    type: 'recovery',
    message: 'O histórico salvo estava inválido. Uma cópia foi preservada em backup.',
  },
}));

vi.mock('@/hooks/agentes/useAgentChat', () => ({
  useAgentChat: () => ({
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: vi.fn(),
    clearHistory: vi.fn(),
    storageNotice: m.notice,
    dismissStorageNotice: m.dismiss,
  }),
}));

import ChatWindow from '@/components/agentes/ChatWindow';

const agente = {
  id: 'ensino-medio',
  name: 'Agente EM',
  segmento: 'Ensino Médio',
  descricao: 'Apoio pedagógico para o Ensino Médio.',
  cor: '#1a73e8',
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

it('AG-03g: ChatWindow mostra o aviso de recuperação e permite fechá-lo', () => {
  m.dismiss.mockReset();
  render(<ChatWindow agente={agente} onBack={() => {}} />);

  const aviso = screen.getByRole('status');
  expect(aviso).toHaveTextContent(/backup/i);

  fireEvent.click(screen.getByRole('button', { name: /fechar aviso/i }));
  expect(m.dismiss).toHaveBeenCalledTimes(1);
});
