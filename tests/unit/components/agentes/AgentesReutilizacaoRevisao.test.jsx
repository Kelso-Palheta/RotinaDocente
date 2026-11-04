import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '../../../../frontend/node_modules/@testing-library/user-event/dist/esm/index.js';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AcoesConversa from '@/components/agentes/AcoesConversa';

const agente = { id: 'ensino-medio', name: 'Agente EM' };
const mensagens = [{ role: 'user', content: 'Pergunta' }, { role: 'assistant', content: 'Resposta' }];
let criarUrl;
let revogarUrl;
let clicarLink;

beforeEach(() => {
  criarUrl = vi.fn(() => 'blob:revisao-conversa');
  revogarUrl = vi.fn();
  const UrlNativa = URL;
  vi.stubGlobal('URL', class extends UrlNativa {
    static createObjectURL(blob) { return criarUrl(blob); }
    static revokeObjectURL(url) { return revogarUrl(url); }
  });
  clicarLink = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('REV-REU-01: cancelar não inicia download nem aloca URL', async () => {
  const user = userEvent.setup();
  render(<AcoesConversa agente={agente} messages={mensagens} />);
  await user.click(screen.getByRole('button', { name: 'Exportar conversa em TXT' }));
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(criarUrl).not.toHaveBeenCalled();
  expect(clicarLink).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Exportar conversa em TXT' })).toHaveFocus();
});

it('REV-REU-02: falha de download mantém erro/diálogo e retry libera recurso temporário', async () => {
  const user = userEvent.setup();
  criarUrl.mockImplementationOnce(() => { throw new Error('Download indisponível'); });
  render(<AcoesConversa agente={agente} messages={mensagens} />);
  await user.click(screen.getByRole('button', { name: 'Exportar conversa em TXT' }));
  await user.click(screen.getByRole('button', { name: 'Baixar arquivo TXT' }));
  const dialogo = screen.getByRole('dialog', { name: 'Exportar conversa' });
  expect(within(dialogo).getByRole('alert')).toHaveTextContent('Não foi possível gerar o arquivo');
  expect(clicarLink).not.toHaveBeenCalled();
  await user.click(within(dialogo).getByRole('button', { name: 'Baixar arquivo TXT' }));
  expect(clicarLink).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  await waitFor(() => expect(revogarUrl).toHaveBeenCalledWith('blob:revisao-conversa'));
  expect(document.querySelector('a[download]')).toBeNull();
});

it('REV-REU-03: foco circula nos controles do diálogo e Escape retorna ao gatilho', async () => {
  const user = userEvent.setup();
  render(<AcoesConversa agente={agente} messages={mensagens} />);
  const gatilho = screen.getByRole('button', { name: 'Exportar conversa em TXT' });
  await user.click(gatilho);
  const cancelar = screen.getByRole('button', { name: 'Cancelar' });
  const baixar = screen.getByRole('button', { name: 'Baixar arquivo TXT' });
  expect(cancelar).toHaveFocus();
  await user.tab({ shift: true });
  expect(baixar).toHaveFocus();
  await user.tab();
  expect(cancelar).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(gatilho).toHaveFocus();
});
