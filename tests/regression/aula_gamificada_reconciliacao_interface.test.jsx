// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import RelatorioAvaliacao from '@/components/aula-gamificada/RelatorioAvaliacao';

vi.mock('jspdf', () => ({ jsPDF: vi.fn() }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const relatorio = {
  revision: 7,
  sala: { codigo: 'PRES01', titulo: 'Avaliação', modalidade: 'quiz', finalidade: 'avaliativa' },
  configuracaoCongelada: { valorMaximo: 10 }, alunos: [], resumoTurma: {}, limitacoes: [],
};
const previa = {
  diarioRevision: 4, bimestre: '1', valorMaximo: 10, alteracoes: [], conflitos: [],
  pendencias: [{ tipo: 'divergencia_diario_sem_nota', alunoId: 'a2', turmaId: 't1' }],
  linhasDetalhadas: [{ turmaId: 't1', turmaNome: '101', alunoId: 'a2', alunoNome: 'Beto',
    atvId: 'atividade1', colunaNome: 'Jogo', valorMaximoColuna: 10,
    notaAtual: 10, notaNova: null, divergenciaSemNota: true }],
};

function montar() {
  const envios = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    let dados;
    if (url.endsWith('/relatorio')) dados = relatorio;
    else {
      const body = JSON.parse(init.body);
      if (body.dryRun) dados = { previa };
      else {
        envios.push(body);
        dados = body.reconciliarAusentes
          ? { sincronizadas: 1, pendencias: [], sincronizacao: { status: 'sincronizada' } }
          : { sincronizadas: 0, pendencias: previa.pendencias, sincronizacao: { status: 'pendente' } };
      }
    }
    return { ok: true, json: async () => dados };
  }));
  render(<RelatorioAvaliacao codigo="PRES01" relatorioInicial={relatorio} obterToken={async () => 'token-teste'} />);
  return envios;
}

async function abrirPrevia() {
  fireEvent.click(screen.getByRole('button', { name: /Prévia e sincronizar/i }));
  await screen.findByText('Beto');
}

describe('Reconciliação pelo fluxo real de interface e cliente HTTP', () => {
  it('oferece retirada explícita da nota obsoleta e envia autorização com revisão do Diário', async () => {
    const envios = montar();
    await abrirPrevia();
    const consentimento = screen.getByRole('checkbox', { name: /retirar.*notas.*anteriores/i });
    expect(consentimento.checked).toBe(false);
    fireEvent.click(consentimento);
    fireEvent.click(screen.getByRole('button', { name: /Confirmar retirada e sincronização/i }));
    await waitFor(() => expect(envios).toHaveLength(1));
    expect(envios[0]).toMatchObject({
      reconciliarAusentes: true, confirmarSobrescrita: true, diarioRevisionEsperada: 4, expectedRevision: 7,
    });
  });

  it('sem autorização não retira nota e informa pendências, sem alegar conclusão integral', async () => {
    const envios = montar();
    await abrirPrevia();
    fireEvent.click(screen.getByRole('button', { name: /Confirmar sincronização no Diário/i }));
    await waitFor(() => expect(envios).toHaveLength(1));
    expect(envios[0].reconciliarAusentes).not.toBe(true);
    expect(envios[0].confirmarSobrescrita).toBe(false);
    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/pendência/i));
  });

  it('nova prévia exige nova autorização para retirada', async () => {
    montar();
    await abrirPrevia();
    fireEvent.click(screen.getByRole('checkbox', { name: /retirar.*notas.*anteriores/i }));
    fireEvent.click(screen.getByRole('button', { name: /Fechar prévia/i }));
    await abrirPrevia();
    expect(screen.getByRole('checkbox', { name: /retirar.*notas.*anteriores/i }).checked).toBe(false);
  });
});
