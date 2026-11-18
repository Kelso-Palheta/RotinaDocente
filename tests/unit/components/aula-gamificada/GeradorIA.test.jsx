import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  extractTextFromDocument: vi.fn(),
  getClientAIHeaders: vi.fn(),
  useAIConfig: vi.fn(),
}));

vi.mock('@/utils/atividades/documentExtractor', () => ({
  extractTextFromDocument: mocks.extractTextFromDocument,
}));
vi.mock('@/utils/aiHeaders', () => ({
  getClientAIHeaders: mocks.getClientAIHeaders,
}));
vi.mock('@/hooks/useAIConfig', () => ({
  useAIConfig: mocks.useAIConfig,
}));
vi.mock('@/components/ai/ModalConectarIA', () => ({
  ModalConectarIA: () => null,
}));

import { GeradorIAQuestoes } from '@/components/aula-gamificada/GeradorIAQuestoes';

describe('Aula Gamificada — gerador IA por tema/material, revisão de anexo e salvamento separado', () => {
  beforeEach(() => {
    mocks.useAIConfig.mockReturnValue({
      config: { provider: 'gemini', model: 'gemini-2.5-flash', getMaskedKey: () => 'AIza...1234' },
      temChave: true,
    });
    mocks.getClientAIHeaders.mockReturnValue({
      'x-user-ai-provider': 'gemini',
      'x-user-ai-key': 'chave-teste-byok',
      'x-user-ai-model': 'gemini-2.5-flash',
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('gera rascunhos por tema com dificuldades, renderiza texto sem HTML bruto e salva separadamente sem rechamar IA', async () => {
    const rascunhoIA = {
      disciplina: 'Química',
      anoEscolar: '2º ano EM',
      conteudo: 'Estequiometria',
      dificuldade: 'medio',
      tipo: 'multipla_escolha',
      enunciado: 'Considere $H_2O$ e <script>window.__xss=1</script> qual a massa molar?',
      alternativas: [
        { id: 'a1', texto: '18 g/mol' },
        { id: 'a2', texto: '36 g/mol' },
      ],
      respostaCorreta: 'a1',
      explicacao: 'Soma das massas atômicas: $2 \\times 1 + 16 = 18$.',
      justificativaDificuldade: 'Exige cálculo direto de massa molar.',
      status: 'rascunho',
      origem: { tipo: 'tema' },
    };

    const fetcher = vi.fn(async (url) => {
      if (url === '/api/aula-gamificada/gerar') {
        return { ok: true, status: 200, json: async () => ({ questoes: [rascunhoIA] }) };
      }
      if (url === '/api/aula-gamificada/questoes') {
        return { ok: true, status: 201, json: async () => ({ questao: { ...rascunhoIA, id: 'q-salva-1', revision: 1 } }) };
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    const onQuestaoSalva = vi.fn();
    render(<GeradorIAQuestoes obterToken={async () => 'tok'} onQuestaoSalva={onQuestaoSalva} />);

    fireEvent.change(screen.getByLabelText(/Disciplina/i), { target: { value: 'Química' } });
    fireEvent.change(screen.getByLabelText(/Série \/ Ano escolar/i), { target: { value: '2º ano EM' } });
    fireEvent.change(screen.getByLabelText(/Conteúdo \/ Tema/i), { target: { value: 'Estequiometria' } });
    fireEvent.change(screen.getByLabelText(/Fáceis/i), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText(/Médias/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Difíceis/i), { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: /Gerar rascunhos com IA/i }));

    expect(await screen.findByText(/18 g\/mol/)).toBeInTheDocument();
    // Nenhum script injetado no DOM
    expect(document.querySelector('script')).toBeNull();
    // Salvamento NÃO aconteceu automaticamente
    expect(fetcher.mock.calls.filter(([u]) => u === '/api/aula-gamificada/questoes')).toHaveLength(0);

    const btnSalvar = screen.getByRole('button', { name: /Salvar no banco/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(onQuestaoSalva).toHaveBeenCalledTimes(1);
    });
    expect(fetcher.mock.calls.filter(([u]) => u === '/api/aula-gamificada/gerar')).toHaveLength(1);
    expect(fetcher.mock.calls.filter(([u]) => u === '/api/aula-gamificada/questoes')).toHaveLength(1);
  });

  it('extrai anexo com utilitário existente, trata erro com repetição e exige confirmação do texto antes de gerar', async () => {
    mocks.extractTextFromDocument
      .mockRejectedValueOnce(new Error('Falha na leitura do PDF escaneado.'))
      .mockResolvedValueOnce({
        texto: 'A Revolução Industrial começou na Inglaterra no século XVIII.',
        nomeArquivo: 'texto-aula.pdf',
        tamanhoBytes: 1200,
        tipo: 'pdf',
        totalCaracteres: 61,
      });

    const fetcher = vi.fn(async (url) => {
      if (url === '/api/aula-gamificada/gerar') {
        return { ok: true, status: 200, json: async () => ({ questoes: [] }) };
      }
      throw new Error(`URL inesperada: ${url}`);
    });
    vi.stubGlobal('fetch', fetcher);

    render(<GeradorIAQuestoes obterToken={async () => 'tok'} onQuestaoSalva={vi.fn()} />);

    fireEvent.click(screen.getByLabelText(/A partir de material anexado/i));
    fireEvent.change(screen.getByLabelText(/Disciplina/i), { target: { value: 'História' } });
    fireEvent.change(screen.getByLabelText(/Série \/ Ano escolar/i), { target: { value: '8º ano EF' } });
    fireEvent.change(screen.getByLabelText(/Conteúdo \/ Tema/i), { target: { value: 'Revolução Industrial' } });

    const inputArquivo = screen.getByLabelText(/Anexar PDF, imagem, DOCX ou TXT/i);
    const arquivo = new File(['conteudo'], 'texto-aula.pdf', { type: 'application/pdf' });

    fireEvent.change(inputArquivo, { target: { files: [arquivo] } });
    expect(await screen.findByRole('alert')).toHaveTextContent(/Falha na leitura do PDF escaneado/i);

    // Repete extração com sucesso
    fireEvent.click(screen.getByRole('button', { name: /Tentar extrair novamente/i }));
    const campoRevisao = await screen.findByLabelText(/Texto extraído para revisão/i);
    expect(campoRevisao).toHaveValue('A Revolução Industrial começou na Inglaterra no século XVIII.');

    // Tenta gerar ANTES de confirmar revisão do texto
    fireEvent.click(screen.getByRole('button', { name: /Gerar rascunhos com IA/i }));
    expect(fetcher).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/Confirme a revisão do texto extraído/i);

    // Confirma e gera
    fireEvent.click(screen.getByLabelText(/Confirmo que revisei o texto extraído/i));
    fireEvent.click(screen.getByRole('button', { name: /Gerar rascunhos com IA/i }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.fonte).toBe('material');
    expect(body.textoMaterial).toContain('Revolução Industrial');
    expect(mocks.extractTextFromDocument).toHaveBeenCalledWith(arquivo, expect.objectContaining({ allowImages: true }));
  });
});
