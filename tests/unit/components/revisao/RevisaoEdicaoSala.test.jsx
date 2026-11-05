import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntegracaoPreparacao } from '../../../../frontend/src/components/revisao/IntegracaoPreparacao';

// Mock do router do Next.js
const pushMock = vi.fn();
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({
  useRouter: () => ({ push: pushMock }),
}));

// Mock do transporte
const requisitarRevisaoMock = vi.fn();
vi.mock('../../../../frontend/src/components/revisao/integracaoTransporte', () => ({
  requisitarRevisao: (...args) => requisitarRevisaoMock(...args),
}));

describe('UI — Edição de Sala no Aulão (IntegracaoPreparacao)', () => {
  const catalogoBase = {
    salas: [
      { id: 'ARTE42', codigo: 'ARTE42', titulo: 'Aulão Moderno', fase: 'espera', criadaEmMs: 1000 },
      { id: 'ARTE99', codigo: 'ARTE99', titulo: 'Aulão Finalizado', fase: 'finalizada', criadaEmMs: 500 },
    ],
    turmas: [
      { id: 't1', nome: '3º Ano A', totalAlunos: 25 },
      { id: 't2', nome: '3º Ano B', totalAlunos: 30 },
    ],
    questoes: [
      { id: 'q1', tema: 'Tarsila', apta: true, ano: 2024, aplicacoes: ['regular'] },
      { id: 'q2', tema: 'Di Cavalcanti', apta: true, ano: 2023, aplicacoes: ['regular'] },
    ],
  };

  it('exibe botão "Editar sala" apenas para salas na fase de espera', async () => {
    requisitarRevisaoMock.mockImplementation(async (endpoint) => {
      if (endpoint === '/catalogo') return catalogoBase;
      throw new Error(`Endpoint não mockado: ${endpoint}`);
    });

    render(<IntegracaoPreparacao obterToken={async () => 'token'} />);

    await waitFor(() => {
      expect(screen.getByText(/Retomar uma sala/i)).toBeInTheDocument();
    });

    // Sala em espera deve ter botão de editar
    expect(screen.getByTestId('btn-editar-sala-ARTE42')).toBeInTheDocument();
    // Sala finalizada NÃO deve ter botão de editar
    expect(screen.queryByTestId('btn-editar-sala-ARTE99')).not.toBeInTheDocument();
  });

  it('ao clicar em "Editar sala", carrega dados via GET edicao e pré-preenche o formulário', async () => {
    requisitarRevisaoMock.mockImplementation(async (endpoint) => {
      if (endpoint === '/catalogo') return catalogoBase;
      if (endpoint === '/salas/ARTE42/edicao') {
        return {
          codigo: 'ARTE42',
          revisao: 1,
          podeEditarTurmas: true,
          selecao: {
            titulo: 'Aulão Moderno Original',
            turmaIds: ['t1'],
            questaoIds: ['q1'],
            duracaoSegundos: 45,
          },
        };
      }
      throw new Error(`Endpoint não mockado: ${endpoint}`);
    });

    render(<IntegracaoPreparacao obterToken={async () => 'token'} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-editar-sala-ARTE42')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-editar-sala-ARTE42'));

    // Espera carregar a tela de edição
    await waitFor(() => {
      expect(screen.getByText(/Editar Sala: ARTE42/i)).toBeInTheDocument();
    });

    // O título original deve estar no formulário
    const inputTitulo = screen.getByDisplayValue('Aulão Moderno Original');
    expect(inputTitulo).toBeInTheDocument();
  });

  it('salva edição com POST /salas/{codigo}/edicao e redireciona para a sala', async () => {
    requisitarRevisaoMock.mockImplementation(async (endpoint, opts) => {
      if (endpoint === '/catalogo') return catalogoBase;
      if (endpoint === '/salas/ARTE42/edicao' && (!opts?.body)) {
        return {
          codigo: 'ARTE42',
          revisao: 1,
          podeEditarTurmas: true,
          selecao: {
            titulo: 'Aulão Moderno',
            turmaIds: ['t1'],
            questaoIds: ['q1'],
            duracaoSegundos: 45,
          },
        };
      }
      if (endpoint === '/salas/ARTE42/edicao' && opts?.body) {
        return {
          sala: { id: 'ARTE42', codigo: 'ARTE42', revisao: 2 },
        };
      }
      throw new Error(`Endpoint não mockado: ${endpoint}`);
    });

    render(<IntegracaoPreparacao obterToken={async () => 'token'} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-editar-sala-ARTE42')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-editar-sala-ARTE42'));

    await waitFor(() => {
      expect(screen.getByText(/Editar Sala: ARTE42/i)).toBeInTheDocument();
    });

    // Clica no botão de salvar alterações
    const btnSalvar = screen.getByRole('button', { name: /Salvar alterações/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(requisitarRevisaoMock).toHaveBeenCalledWith(
        '/salas/ARTE42/edicao',
        expect.objectContaining({
          body: expect.objectContaining({
            revisaoEsperada: 1,
            selecao: expect.objectContaining({ titulo: 'Aulão Moderno' }),
          }),
        })
      );
    });

    expect(pushMock).toHaveBeenCalledWith('/revisao/sala/ARTE42');
  });

  it('em caso de conflito 409, preserva rascunho e oferece recarregar dados', async () => {
    let chamadaSalvar = false;
    requisitarRevisaoMock.mockImplementation(async (endpoint, opts) => {
      if (endpoint === '/catalogo') return catalogoBase;
      if (endpoint === '/salas/ARTE42/edicao' && (!opts?.body)) {
        return {
          codigo: 'ARTE42',
          revisao: 1,
          podeEditarTurmas: true,
          selecao: {
            titulo: 'Aulão Rascunho',
            turmaIds: ['t1'],
            questaoIds: ['q1'],
            duracaoSegundos: 45,
          },
        };
      }
      if (endpoint === '/salas/ARTE42/edicao' && opts?.body) {
        chamadaSalvar = true;
        const err = new Error('A sala foi alterada concorrentemente.');
        err.status = 409;
        throw err;
      }
      throw new Error(`Endpoint não mockado: ${endpoint}`);
    });

    render(<IntegracaoPreparacao obterToken={async () => 'token'} />);

    await waitFor(() => {
      expect(screen.getByTestId('btn-editar-sala-ARTE42')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-editar-sala-ARTE42'));

    await waitFor(() => {
      expect(screen.getByText(/Editar Sala: ARTE42/i)).toBeInTheDocument();
    });

    const btnSalvar = screen.getByRole('button', { name: /Salvar alterações/i });
    fireEvent.click(btnSalvar);

    await waitFor(() => {
      expect(chamadaSalvar).toBe(true);
      expect(screen.getByText(/A sala foi alterada concorrentemente/i)).toBeInTheDocument();
    });

    // Rascunho preservado
    expect(screen.getByDisplayValue('Aulão Rascunho')).toBeInTheDocument();
    // Botão de recarregar dados presente
    expect(screen.getByRole('button', { name: /Recarregar dados da sala/i })).toBeInTheDocument();
  });
});
