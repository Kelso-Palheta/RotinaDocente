// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeradorIAQuestoes } from '@/components/aula-gamificada/GeradorIAQuestoes';
import { PrepararSala } from '@/components/aula-gamificada/PrepararSala';
import { MODALIDADES_PADRAO } from '@/components/aula-gamificada/constantes';
import RelatorioAvaliacao from '@/components/aula-gamificada/RelatorioAvaliacao';
import HistoricoAvaliacoes from '@/components/aula-gamificada/HistoricoAvaliacoes';

vi.mock('@/hooks/useAIConfig', () => ({
  useAIConfig: () => ({ temChave: true, config: { provider: 'openai', apiKey: 'sk-test' } }),
}));

vi.mock('@/components/ai/ModalConectarIA', () => ({
  ModalConectarIA: () => null,
}));

describe('Avaliação, Histórico Paginado e Fluxo Guiado por Jogo — UI', () => {
  it('GeradorIAQuestoes exibe seletor dos 7 jogos, restringe tipos compatíveis e mantém modalidadeInicial', () => {
    render(
      <GeradorIAQuestoes
        uid="prof-1"
        modalidadeInicial="herois"
        modalidadesServidor={MODALIDADES_PADRAO}
        onQuestaoSalva={() => {}}
        onContinuarParaSala={() => {}}
      />,
    );

    const selectJogo = screen.getByLabelText(/Jogo \/ Modalidade/i);
    expect(selectJogo.value).toBe('herois');
    expect(selectJogo.querySelectorAll('option')).toHaveLength(7);

    // Heróis aceita apenas Múltipla escolha
    const selectTipo = screen.getByLabelText(/Formato da questão/i);
    expect(selectTipo.value).toBe('multipla_escolha');
    expect(selectTipo.querySelectorAll('option')).toHaveLength(1);

    // Trocar para Memória ajusta para Pares
    fireEvent.change(selectJogo, { target: { value: 'memoria' } });
    expect(selectTipo.value).toBe('pares');
  });

  it('PrepararSala exibe finalidade avaliativa, ano do Diário, critério de Heróis e pré-seleciona questões aprovadas', () => {
    render(
      <PrepararSala
        modalidadeInicial="herois"
        questaoIdsIniciais={['q1']}
        turmas={[
          { id: 't1', nome: '9º A', ano: 2026, alunos: [{ id: 'a1', nome: 'Ana' }] },
        ]}
        questoes={[
          {
            id: 'q1',
            disciplina: 'Arte',
            anoEscolar: '9º ano',
            conteudo: 'Arte Conceitual',
            dificuldade: 'medio',
            tipo: 'multipla_escolha',
            status: 'revisada',
            enunciado: 'Questão aprovada?',
            alternativas: [
              { id: 'A', texto: 'A' },
              { id: 'B', texto: 'B' },
            ],
          },
        ]}
        salas={[]}
        onCriarSala={async () => {}}
        onAbrirSala={() => {}}
      />,
    );

    // Questão pré-selecionada do fluxo guiado
    const chkQ1 = screen.getByLabelText(/Questão aprovada/i);
    expect(chkQ1.checked).toBe(true);

    // Alterna para finalidade avaliativa
    fireEvent.click(screen.getByLabelText(/Avaliativa/i));
    expect(screen.getByLabelText(/Título da atividade avaliativa/i)).toBeTruthy();
    expect(screen.getByLabelText(/Critério de Heróis/i).value).toBe('primeira_tentativa');
    expect(screen.getByLabelText(/Valor máximo/i)).toBeTruthy();
    expect(screen.getByLabelText(/Bimestre/i)).toBeTruthy();
  });

  it('RelatorioAvaliacao renderiza notas, revisão auditada, prévia de sincronização e botões CSV/PDF', () => {
    const relatorio = {
      sala: {
        codigo: 'AV0001',
        titulo: 'Prova Arte',
        modalidade: 'herois',
        finalidade: 'avaliativa',
        fase: 'encerrada',
      },
      revision: 3,
      configuracaoCongelada: {
        tituloAtividade: 'Atividade Conceitual',
        disciplina: 'Arte',
        bimestre: '1',
        anoLetivo: '2026',
        valorMaximo: 10,
        criterioHerois: 'primeira_tentativa',
      },
      resumoTurma: { totalElegiveis: 2, presentes: 1, ausentes: 1, semOportunidade: 0, mediaNota: 5 },
      alunos: [
        {
          participanteId: 'p1',
          alunoId: 'a1',
          turmaId: 't1',
          nome: 'Ana Clara',
          situacao: 'avaliado',
          elegiveis: 2,
          respondidas: 2,
          acertos: 1,
          parciais: 0,
          erros: 1,
          aproveitamento: 0.5,
          notaCalculada: 5,
          notaRevisada: null,
          notaFinal: 5,
        },
        {
          participanteId: 'p2',
          alunoId: 'a2',
          turmaId: 't1',
          nome: 'Beto Silva',
          situacao: 'nao_participou',
          elegiveis: 2,
          respondidas: 0,
          acertos: 0,
          parciais: 0,
          erros: 0,
          aproveitamento: null,
          notaCalculada: null,
          notaRevisada: null,
          notaFinal: null,
        },
      ],
      auditoria: [],
      sincronizacao: { status: 'pendente', pendencias: [] },
      limitacoes: [],
    };

    render(
      <RelatorioAvaliacao
        codigo="AV0001"
        relatorioInicial={relatorio}
        obterToken={async () => 'tok'}
      />,
    );

    expect(screen.getByText('Ana Clara')).toBeTruthy();
    expect(screen.getByText('Beto Silva')).toBeTruthy();
    expect(screen.getByText('nao_participou')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Exportar CSV/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Exportar PDF/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Prévia e sincronizar com Diário/i })).toBeTruthy();
  });

  it('HistoricoAvaliacoes exibe filtros e paginação', () => {
    render(
      <HistoricoAvaliacoes
        turmas={[{ id: 't1', nome: '9º A', ano: 2026 }]}
        dadosIniciais={{
          itens: [
            {
              codigo: 'AV0001',
              titulo: 'Sala Histórica 1',
              modalidade: 'herois',
              finalidade: 'avaliativa',
              fase: 'encerrada',
              avaliacao: { bimestre: '1', anoLetivo: '2026', disciplina: 'Arte', valorMaximo: 10 },
            },
          ],
          totalFiltrado: 35,
          proximoCursor: '20',
        }}
        onAbrirRelatorio={() => {}}
        obterToken={async () => 'tok'}
      />,
    );

    expect(screen.getByText('Sala Histórica 1')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Carregar mais/i })).toBeTruthy();
  });
});
