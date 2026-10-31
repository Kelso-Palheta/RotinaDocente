import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  router: { push: vi.fn(), replace: vi.fn() },
  enviadas: [],
  limpezas: 0,
}));

vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => m.router }));

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { uid: 'professor-teste', displayName: 'Professora Teste' },
    perfil: { modulos_permitidos: ['agente-linguagens'] },
    loading: false,
  }),
}));

vi.mock('@/hooks/agentes/useAgentChat', async () => {
  const React = await import('react');
  return {
    useAgentChat: (agentId) => {
      const [messages, setMessages] = React.useState([]);
      const [isLoading, setIsLoading] = React.useState(false);
      const [error, setError] = React.useState(null);

      const sendMessage = React.useCallback(async (text) => {
        m.enviadas.push({ agentId, text });
        setMessages((anteriores) => [
          ...anteriores,
          { role: 'user', content: text },
          { role: 'assistant', content: `Resposta de ${agentId}: ${text}` },
        ]);
      }, [agentId]);

      const clearHistory = React.useCallback(() => {
        m.limpezas += 1;
        setMessages([]);
      }, []);

      return { messages, isLoading, error, sendMessage, clearHistory };
    },
  };
});

import Page from '@/app/agentes/page';

const definirLargura = (largura) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: largura,
  });
  window.dispatchEvent(new Event('resize'));
};

const selecionarAgente = async (user, nome = 'Agente EM') => {
  await user.click(screen.getByRole('button', { name: `Selecionar ${nome}` }));
};

const campoMensagem = () => screen.getByRole('textbox', { name: /Mensagem para Agente/ });

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  m.router.push.mockReset();
  m.router.replace.mockReset();
  m.enviadas.length = 0;
  m.limpezas = 0;
  definirLargura(390);
});

afterEach(cleanup);

describe('AR-01/AR-05 — seleção de agentes em 390 px', () => {
  it('expõe os dois agentes como botões acessíveis e reflete a seleção', async () => {
    const user = userEvent.setup();
    render(<Page />);

    expect(screen.getByRole('heading', { level: 1, name: 'Agentes Pedagógicos' })).toBeInTheDocument();
    const em = screen.getByRole('button', { name: 'Selecionar Agente EM' });
    const ef2 = screen.getByRole('button', { name: 'Selecionar Agente EF2' });
    expect(em).toHaveAttribute('aria-pressed', 'false');
    expect(ef2).toHaveAttribute('aria-pressed', 'false');

    await user.click(em);

    expect(em).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('region', { name: 'Conversa com Agente EM' })).toBeInTheDocument();
    expect(screen.getByTestId('agentes-painel-selecao')).toBeInTheDocument();
    expect(screen.getByTestId('agentes-painel-chat')).toBeInTheDocument();
  });

  it('oferece botão acessível para voltar à seleção sem depender de gesto', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await selecionarAgente(user);

    const voltar = screen.getByRole('button', { name: 'Voltar para os agentes' });
    expect(voltar).toBeEnabled();
    await user.click(voltar);

    expect(screen.queryByTestId('agentes-painel-chat')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Agentes Pedagógicos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Selecionar Agente EF2' })).toBeEnabled();
  });
});

describe('AR-01 — sugestões e envio em 390 px', () => {
  it('mantém as sugestões como botões, preenche o campo e devolve o foco', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await selecionarAgente(user);

    const painelSugestoes = screen.getByTestId('agentes-chips');
    const sugestoes = within(painelSugestoes).getAllByRole('button');
    expect(sugestoes.length).toBeGreaterThan(0);
    const texto = sugestoes[0].textContent;

    await user.click(sugestoes[0]);

    expect(campoMensagem()).toHaveValue(texto);
    expect(campoMensagem()).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeEnabled();
  });

  it('envia com Enter e preserva Shift+Enter como quebra de linha', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await selecionarAgente(user);

    await user.type(campoMensagem(), 'Primeira mensagem');
    expect(m.enviadas).toHaveLength(0);

    await user.keyboard('{Enter}');

    await waitFor(() => expect(m.enviadas).toHaveLength(1));
    expect(m.enviadas[0]).toEqual({ agentId: 'ensino-medio', text: 'Primeira mensagem' });
    expect(await screen.findByText('Primeira mensagem')).toBeInTheDocument();
    expect(campoMensagem()).toHaveValue('');

    await user.type(campoMensagem(), 'Rascunho');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(m.enviadas).toHaveLength(1);
    expect(campoMensagem()).toHaveValue('Rascunho\n');
  });

  it('mantém nomes acessíveis de limpar histórico e enviar mensagem', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await selecionarAgente(user);

    await user.type(campoMensagem(), 'Mensagem para limpar');
    await user.click(screen.getByRole('button', { name: 'Enviar mensagem' }));
    await screen.findByText('Mensagem para limpar');

    expect(screen.getByRole('button', { name: 'Limpar histórico' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Enviar mensagem' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar histórico' }));
    expect(m.limpezas).toBe(1);
    expect(screen.getByText('Olá! Sou o Agente EM.')).toBeInTheDocument();
  });
});

describe('AR-03 — resize preserva mensagens e rascunho', () => {
  it('mantém a conversa e o texto digitado ao alternar 390 ↔ 1440', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await selecionarAgente(user);

    await user.type(campoMensagem(), 'Mensagem persistente');
    await user.keyboard('{Enter}');
    await screen.findByText('Mensagem persistente');

    await user.type(campoMensagem(), 'Rascunho ainda não enviado');
    expect(m.enviadas).toHaveLength(1);

    definirLargura(1440);
    expect(campoMensagem()).toHaveValue('Rascunho ainda não enviado');
    expect(screen.getByText('Mensagem persistente')).toBeInTheDocument();
    expect(screen.getByTestId('agentes-painel-chat')).toBeInTheDocument();

    definirLargura(390);
    expect(campoMensagem()).toHaveValue('Rascunho ainda não enviado');
    expect(screen.getByText('Mensagem persistente')).toBeInTheDocument();
    expect(screen.getByTestId('agentes-painel-selecao')).toBeInTheDocument();
    expect(m.enviadas).toHaveLength(1);
  });
});

describe('AR-02/AR-04 — composição lado a lado e ordem de foco', () => {
  it('mantém seleção e conversa montadas na ordem do desktop', async () => {
    const user = userEvent.setup();
    definirLargura(1440);
    render(<Page />);
    await selecionarAgente(user);

    const selecao = screen.getByTestId('agentes-painel-selecao');
    const chat = screen.getByTestId('agentes-painel-chat');
    expect(selecao.compareDocumentPosition(chat) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Conversa com Agente EM' })).toBeInTheDocument();
  });

  it('mantém os controles alcançáveis por Tab na ordem natural', async () => {
    const user = userEvent.setup();
    render(<Page />);
    await selecionarAgente(user);
    await user.type(campoMensagem(), 'Mensagem para o histórico');
    await user.keyboard('{Enter}');
    await screen.findByText('Mensagem para o histórico');
    await user.type(campoMensagem(), 'Rascunho');

    const focados = [];
    for (let passo = 0; passo < 7; passo += 1) {
      await user.tab();
      focados.push(document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '');
    }

    expect(focados.some((nome) => /Voltar para os agentes/i.test(nome))).toBe(true);
    expect(focados.some((nome) => /Limpar histórico/i.test(nome))).toBe(true);
    expect(focados.some((nome) => /Enviar mensagem/i.test(nome))).toBe(true);
  });
});
