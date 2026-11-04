import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  mensagensIniciais: [],
  enviadas: [],
  writeText: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
  blobExportado: null,
}));

vi.mock('@/hooks/agentes/useAgentChat', async () => {
  const React = await import('react');
  return {
    useAgentChat: () => {
      const [messages, setMessages] = React.useState(m.mensagensIniciais);
      const [isLoading] = React.useState(false);
      const [error] = React.useState(null);

      const sendMessage = React.useCallback(async (text) => {
        m.enviadas.push(text);
        setMessages((anteriores) => [
          ...anteriores,
          { role: 'user', content: text },
          { role: 'assistant', content: 'Resposta sintética' },
        ]);
      }, []);

      const clearHistory = React.useCallback(() => setMessages([]), []);

      return { messages, isLoading, error, sendMessage, clearHistory };
    },
  };
});

import ChatWindow from '@/components/agentes/ChatWindow';

const AGENTE_EM = {
  id: 'ensino-medio',
  name: 'Agente EM',
  segmento: 'Ensino Médio — 1º ao 3º EM',
  descricao: 'Especialista em ENEM, vestibulares, habilidades BNCC-EM e competências de Redação (C1–C5).',
  cor: '#f60c49',
};

const AGENTE_EF2 = {
  id: 'fundamental-2',
  name: 'Agente EF2',
  segmento: 'Ensino Fundamental II — 6º ao 9º ano',
  descricao: 'Especialista em descritores SAEB, habilidades BNCC-EF2 e avaliações diagnósticas estaduais.',
  cor: '#101942',
};

const MENSAGENS = [
  { role: 'user', content: 'Pergunta um' },
  { role: 'assistant', content: 'Resposta pretendida um' },
  { role: 'user', content: 'Pergunta dois' },
  { role: 'assistant', content: 'Resposta pretendida dois' },
];

const TEXTO_LONGO = 'RespostaSemEspacos'.repeat(40);

const campoMensagem = () => screen.getByRole('textbox', { name: /Mensagem para Agente/ });

const definirLargura = (largura) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: largura,
  });
  window.dispatchEvent(new Event('resize'));
};

const descritorClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const descritoresUrl = {
  createObjectURL: Object.getOwnPropertyDescriptor(URL, 'createObjectURL'),
  revokeObjectURL: Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL'),
};

const definirClipboard = (valor) => {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    writable: true,
    value: valor,
  });
};

const restaurarClipboard = () => {
  if (descritorClipboard) {
    Object.defineProperty(navigator, 'clipboard', descritorClipboard);
  } else {
    delete navigator.clipboard;
  }
};

const definirUrl = (nome, valor) => {
  Object.defineProperty(URL, nome, {
    configurable: true,
    writable: true,
    value: valor,
  });
};

const restaurarUrl = (nome) => {
  const descritor = descritoresUrl[nome];
  if (descritor) {
    Object.defineProperty(URL, nome, descritor);
  } else {
    delete URL[nome];
  }
};

const lerBlob = (blob) =>
  new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(String(leitor.result));
    leitor.onerror = () => reject(leitor.error);
    leitor.readAsText(blob);
  });

let clickSpy;

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

beforeEach(() => {
  m.mensagensIniciais = [];
  m.enviadas.length = 0;
  m.blobExportado = null;
  m.writeText.mockReset();
  m.writeText.mockResolvedValue(undefined);
  m.createObjectURL.mockReset();
  m.createObjectURL.mockImplementation((blob) => {
    m.blobExportado = blob;
    return 'blob:conversa-teste';
  });
  m.revokeObjectURL.mockReset();

  definirClipboard({ writeText: m.writeText });
  definirUrl('createObjectURL', m.createObjectURL);
  definirUrl('revokeObjectURL', m.revokeObjectURL);
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

  definirLargura(390);
});

afterEach(() => {
  cleanup();
  clickSpy.mockRestore();
  restaurarUrl('createObjectURL');
  restaurarUrl('revokeObjectURL');
  restaurarClipboard();
});

describe('REU-01/REU-02 — copiar resposta', () => {
  it('exibe Copiar resposta somente nas respostas e copia o conteúdo acionado', async () => {
    m.mensagensIniciais = MENSAGENS;
    const user = userEvent.setup();
    definirClipboard({ writeText: m.writeText });
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    const botoes = screen.getAllByRole('button', { name: 'Copiar resposta' });
    expect(botoes).toHaveLength(2);
    expect(
      within(screen.getByTestId('agentes-mensagem-0')).queryByRole('button', {
        name: 'Copiar resposta',
      })
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId('agentes-mensagem-1')).getByRole('button', {
        name: 'Copiar resposta',
      })
    ).toBeInTheDocument();

    await user.click(botoes[0]);

    await waitFor(() => {
      expect(m.writeText).toHaveBeenCalledWith('Resposta pretendida um');
    });
    expect(m.writeText).toHaveBeenCalledTimes(1);
    expect(within(screen.getByTestId('agentes-mensagem-1')).getByRole('status')).toHaveTextContent(
      'Resposta copiada'
    );
    expect(
      within(screen.getByTestId('agentes-mensagem-3')).queryByRole('status')
    ).not.toBeInTheDocument();
  });

  it('mantém erro visível quando o clipboard rejeita a cópia', async () => {
    m.mensagensIniciais = MENSAGENS;
    m.writeText.mockRejectedValueOnce(new Error('permissão negada'));
    const user = userEvent.setup();
    definirClipboard({ writeText: m.writeText });
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    await user.click(screen.getAllByRole('button', { name: 'Copiar resposta' })[0]);

    expect(
      await within(screen.getByTestId('agentes-mensagem-1')).findByRole('alert')
    ).toHaveTextContent('Não foi possível copiar. Selecione o texto manualmente.');
    expect(screen.getByText('Resposta pretendida um')).toBeInTheDocument();
  });

  it('mantém erro visível quando o clipboard não existe no navegador', async () => {
    m.mensagensIniciais = MENSAGENS;
    const user = userEvent.setup();
    definirClipboard(undefined);
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    await user.click(screen.getAllByRole('button', { name: 'Copiar resposta' })[0]);

    expect(
      await within(screen.getByTestId('agentes-mensagem-1')).findByRole('alert')
    ).toHaveTextContent('Não foi possível copiar. Selecione o texto manualmente.');
    expect(m.writeText).not.toHaveBeenCalled();
  });
});

describe('REU-03 — exportar conversa em TXT', () => {
  it('confirma antes de exportar e baixa somente o histórico atual', async () => {
    m.mensagensIniciais = MENSAGENS;
    const user = userEvent.setup();
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Exportar conversa em TXT' }));

    const dialogo = screen.getByRole('dialog', { name: 'Exportar conversa' });
    expect(dialogo).toHaveTextContent(/arquivo TXT conterá toda a conversa com Agente EM/i);
    expect(dialogo).toHaveTextContent(/incluindo suas perguntas e as respostas do agente/i);
    expect(dialogo).toHaveTextContent('conversa-agente-em.txt');

    await user.click(within(dialogo).getByRole('button', { name: 'Baixar arquivo TXT' }));

    await waitFor(() => expect(m.createObjectURL).toHaveBeenCalledTimes(1));
    const texto = await lerBlob(m.blobExportado);

    expect(texto).toBe(
      'Conversa com Agente EM\n\n' +
        'Você:\nPergunta um\n\n' +
        'Agente EM:\nResposta pretendida um\n\n' +
        'Você:\nPergunta dois\n\n' +
        'Agente EM:\nResposta pretendida dois\n'
    );
    expect(m.blobExportado.type).toBe('text/plain;charset=utf-8');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exporta o agente selecionado sem incluir o outro agente', async () => {
    m.mensagensIniciais = [
      { role: 'user', content: 'Pergunta do EF2' },
      { role: 'assistant', content: 'Resposta do EF2' },
    ];
    const user = userEvent.setup();
    render(<ChatWindow agente={AGENTE_EF2} onBack={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Exportar conversa em TXT' }));
    const dialogo = screen.getByRole('dialog', { name: 'Exportar conversa' });
    expect(dialogo).toHaveTextContent(/conversa com Agente EF2/i);

    await user.click(within(dialogo).getByRole('button', { name: 'Baixar arquivo TXT' }));
    await waitFor(() => expect(m.createObjectURL).toHaveBeenCalledTimes(1));
    const texto = await lerBlob(m.blobExportado);

    expect(texto).toContain('Conversa com Agente EF2');
    expect(texto).toContain('Agente EF2:\nResposta do EF2');
    expect(texto).not.toContain('Agente EM');
  });

  it('desabilita a exportação de conversa vazia e mantém a ajuda disponível', async () => {
    const user = userEvent.setup();
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    const exportar = screen.getByRole('button', { name: 'Exportar conversa em TXT' });
    expect(exportar).toBeDisabled();
    expect(exportar.getAttribute('title')).toMatch(/Ainda não há mensagens para exportar/i);
    expect(screen.getByRole('button', { name: 'Ajuda sobre o histórico local' })).toBeEnabled();

    await user.click(exportar);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(m.createObjectURL).not.toHaveBeenCalled();
  });
});

describe('REU-04 — ajuda sobre o histórico local', () => {
  it('explica armazenamento no navegador, separação por agente, falta de sincronização e logout', async () => {
    const user = userEvent.setup();
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Ajuda sobre o histórico local' }));

    const dialogo = screen.getByRole('dialog', { name: 'Histórico local' });
    expect(dialogo).toHaveTextContent(/apenas neste navegador e neste dispositivo/i);
    expect(dialogo).toHaveTextContent(/separada por agente/i);
    expect(dialogo).toHaveTextContent(/não é sincronizada entre dispositivos ou contas/i);
    expect(dialogo).toHaveTextContent(/apagado ao sair da conta/i);
    expect(dialogo).toHaveTextContent(/Limpar histórico/i);
    expect(dialogo).toHaveTextContent(/Exportar conversa em TXT/i);
  });

  it('abre por teclado, mantém o foco no diálogo e fecha com Escape devolvendo o foco', async () => {
    const user = userEvent.setup();
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    const ajuda = screen.getByRole('button', { name: 'Ajuda sobre o histórico local' });
    ajuda.focus();
    await user.keyboard('{Enter}');

    const dialogo = await screen.findByRole('dialog', { name: 'Histórico local' });
    expect(within(dialogo).getByRole('button', { name: 'Entendi' })).toHaveFocus();

    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(ajuda).toHaveFocus();
  });
});

describe('REU-05 — conteúdo longo e resize', () => {
  it('quebra texto longo e preserva mensagem e rascunho entre 390 e 1440', async () => {
    m.mensagensIniciais = [{ role: 'assistant', content: TEXTO_LONGO }];
    const user = userEvent.setup();
    render(<ChatWindow agente={AGENTE_EM} onBack={() => {}} />);

    const bolha = screen.getByText(TEXTO_LONGO);
    expect(bolha).toHaveStyle({
      overflowWrap: 'anywhere',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
    });

    await user.type(campoMensagem(), 'Rascunho preservado');

    definirLargura(1440);
    expect(campoMensagem()).toHaveValue('Rascunho preservado');
    expect(screen.getByText(TEXTO_LONGO)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Copiar resposta' })).toHaveLength(1);

    definirLargura(390);
    expect(campoMensagem()).toHaveValue('Rascunho preservado');
    expect(screen.getByText(TEXTO_LONGO)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar conversa em TXT' })).toBeEnabled();
  });
});
