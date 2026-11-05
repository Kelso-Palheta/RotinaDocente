import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntegracaoPreparacao } from '@/components/revisao/IntegracaoPreparacao';

const push = vi.hoisted(() => vi.fn());
vi.mock('../../../../frontend/node_modules/next/navigation.js', () => ({ useRouter: () => ({ push }) }));
const q = { id: 'q-1', ano: 2024, tema: 'Arte e cidade', aplicacoes: ['regular'], status: 'rascunho', enunciado: 'Enunciado original da questão para conferência.', imagens: [], gabarito: 'B', alternativas: ['A','B','C','D','E'].map(id => ({ id, texto: `Texto diferente de cada alternativa ${id}.` })), explicacoes: Object.fromEntries(['A','B','C','D','E'].map(id => [id, `Explicação pedagógica específica da alternativa ${id}, com contexto e justificativa detalhada.`])), conteudoRevisao: [{ tipo: 'texto', texto: 'Contexto preparatório da obra para compreender a questão.' }], fontes: [{ aplicacao: 'regular', caderno: '1', numeroQuestao: 20, pagina: 5, provaUrl: 'https://download.inep.gov.br/prova.pdf', gabaritoUrl: 'https://download.inep.gov.br/gabarito.pdf' }] };
const token = async () => 'docente';
const resposta = data => ({ ok: true, json: async () => data });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); push.mockReset(); });

describe('RV-INT-06/07 — preparação conectada', () => {
  it('rascunho exige quatro confirmações, edição reinicia checklist e aprovação usa hash', async () => {
    const fetcher = vi.fn(async url => url.endsWith('/catalogo') ? resposta({ turmas: [{ id: 't1', nome: '101' }], questoes: [{ id: q.id, tema: q.tema, ano: 2024, aplicacoes: ['regular'], apta: false, hashFonte: 'hash' }], salas: [] }) : resposta({ questao: q, hashFonte: 'hash' }));
    vi.stubGlobal('fetch', fetcher);
    render(<IntegracaoPreparacao obterToken={token} />);
    fireEvent.click(await screen.findByRole('button', { name: 'inspecionar questão q-1' }));
    const aprovar = await screen.findByRole('button', { name: 'aprovar questão para uso em sala' });
    expect(aprovar).toBeDisabled();
    screen.getAllByRole('checkbox').forEach(c => fireEvent.click(c));
    expect(aprovar).toBeEnabled();
    fireEvent.change(screen.getByLabelText('Editar enunciado'), { target: { value: 'Enunciado corrigido com fidelidade à fonte oficial.' } });
    expect(aprovar).toBeDisabled();
    expect(screen.getAllByRole('checkbox').every(c => !c.checked)).toBe(true);
    screen.getAllByRole('checkbox').forEach(c => fireEvent.click(c));
    await act(async () => { fireEvent.click(aprovar); });
    const chamada = fetcher.mock.calls.find(c => c[0].endsWith('/aprovar'));
    expect(JSON.parse(chamada[1].body)).toMatchObject({ hashFonte: 'hash', confirmacoes: { transcricao: true, gabarito: true, imagens: true, explicacoes: true }, ajustes: { enunciado: 'Enunciado corrigido com fidelidade à fonte oficial.' } });
    expect(JSON.parse(chamada[1].body).ajustes).not.toHaveProperty('gabarito');
  });
  it('mostra salas persistidas e orientação sem turma, sem aprovar automaticamente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(resposta({ turmas: [], questoes: [], salas: [{ id: 's1', codigo: 'ARTE42', titulo: 'Aulão salvo', fase: 'espera' }] })));
    render(<IntegracaoPreparacao obterToken={token} />);
    expect(await screen.findByRole('link', { name: /Aulão salvo/ })).toHaveAttribute('href', '/revisao/sala/ARTE42');
    expect(screen.getByText(/Cadastre uma turma no Diário/)).toBeInTheDocument();
  });
  it('ignora catálogo recebido após desmontagem', async () => {
    let resolver; const pendente = new Promise(r => { resolver = r; });
    const fetcher = vi.fn(() => pendente); vi.stubGlobal('fetch', fetcher);
    const { unmount } = render(<IntegracaoPreparacao obterToken={token} />);
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    unmount(); expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => { resolver(resposta({ turmas: [], questoes: [], salas: [] })); });
    expect(push).not.toHaveBeenCalled();
  });
});

it('cria uma nova sala pelo formulário conectado com sequência por assunto', async () => {
  const fetcher = vi.fn(async (url) => url.endsWith('/catalogo')
    ? resposta({
      turmas: [{ id: 't1', nome: '101' }],
      trilhas: [{ id: 'arte', titulo: 'Arte' }],
      conteudos: [{ id: 'aula-a', trilhaId: 'arte', titulo: 'Modernismo', apta: true }],
      questoes: [{ id: q.id, tema: q.tema, apta: true, conteudoIds: ['aula-a'] }],
      salas: [],
    })
    : resposta({ sala: { codigo: 'ARTE42' } }));
  vi.stubGlobal('fetch', fetcher);
  render(<IntegracaoPreparacao obterToken={token} />);
  fireEvent.click(await screen.findByRole('button', { name: /101/ }));
  fireEvent.click(screen.getByTestId('checkbox-conteudo-aula-a'));
  fireEvent.change(screen.getByLabelText(/Meta Exata de Questões/i), { target: { value: '1' } });
  fireEvent.click(screen.getByTestId('btn-adicionar-q-1'));
  fireEvent.click(screen.getByRole('button', { name: 'Criar Aulão' }));
  await waitFor(() => expect(push).toHaveBeenCalledWith('/revisao/sala/ARTE42'));
  const [, opcoes] = fetcher.mock.calls.find(([url]) => url.endsWith('/salas'));
  expect(JSON.parse(opcoes.body).selecao).toMatchObject({
    modoFluxo: 'sequencia_assunto',
    atribuicoes: { 'q-1': 'aula-a' },
  });
});
