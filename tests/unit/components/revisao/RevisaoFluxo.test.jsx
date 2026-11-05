import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { PainelProfessor } from '@/components/revisao/PainelProfessor';

afterEach(() => {
  cleanup();
});

const baseEstado = {
  sala: {
    id: 'sala-1',
    titulo: 'Revisão ENEM Arte 2026',
    codigo: 'ARTE42',
    revisao: 1,
  },
  fase: 'espera',
  conexao: 'conectado',
  agoraServidorMs: 100000,
  rodada: {
    id: 'r1',
    numero: 1,
    total: 5,
    encerraEmMs: 160000,
    questao: {
      id: 'q1',
      ano: 2024,
      aplicacoes: ['regular'],
      tema: 'Modernismo Brasileiro',
      enunciado: 'Sobre a Semana de Arte Moderna de 1922, assinale a correta:',
      imagens: [{ id: 'img1', url: '/abaporu.jpg', alt: 'Obra Abaporu', legenda: 'Tarsila do Amaral' }],
      alternativas: [
        { id: 'A', texto: 'Rompimento com a tradição acadêmica' },
        { id: 'B', texto: 'Exaltação exclusiva do parnasianismo' },
        { id: 'C', texto: 'Rejeição de qualquer influência estrangeira' },
        { id: 'D', texto: 'Manutenção rigorosa da métrica clássica' },
        { id: 'E', texto: 'Negação da identidade cultural brasileira' },
      ],
    },
    conteudo: [
      { tipo: 'texto', texto: 'Contexto histórico da Semana de Arte Moderna em São Paulo.' },
      { tipo: 'imagem', url: '/teatro.jpg', alt: 'Teatro Municipal', legenda: 'Teatro Municipal de SP' },
    ],
  },
  participacao: {
    total: 30,
    respondidos: 2,
    respondentes: [
      { id: 'p1', nomeExibicao: 'Ana Clara de Albuquerque Nascimento' },
      { id: 'p2', nomeExibicao: 'Bruno Souza' },
    ],
    distribuicao: { A: 1, B: 0, C: 1, D: 0, E: 0 },
  },
  feedback: null,
  ranking: [],
};

describe('RV-03 & RV-04 — PainelProfessor: controle de fluxo e fases', () => {
  it('fase espera: exibe sala, código e botão para mostrar conteúdo', () => {
    const onAcao = vi.fn();
    render(<PainelProfessor estado={baseEstado} ocupado={false} erro={null} onAcao={onAcao} />);

    expect(screen.getByText(/ARTE42/)).toBeInTheDocument();
    expect(screen.getByText(/Revisão ENEM Arte 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Conectado/i)).toBeInTheDocument();

    const btnConteudo = screen.getByRole('button', { name: /mostrar conteúdo/i });
    expect(btnConteudo).toBeInTheDocument();
    fireEvent.click(btnConteudo);
    expect(onAcao).toHaveBeenCalledWith('mostrar_conteudo');
  });

  it('fase conteudo: exibe conteúdo da rodada e botão para abrir pergunta', () => {
    const onAcao = vi.fn();
    const estado = { ...baseEstado, fase: 'conteudo' };
    render(<PainelProfessor estado={estado} ocupado={false} erro={null} onAcao={onAcao} />);

    expect(screen.getByText(/Contexto histórico da Semana de Arte Moderna/i)).toBeInTheDocument();
    const btnPergunta = screen.getByRole('button', { name: /abrir pergunta/i });
    fireEvent.click(btnPergunta);
    expect(onAcao).toHaveBeenCalledWith('abrir_pergunta');
  });

  it('fase pergunta: exibe estatísticas, distribuição A–E, respondentes e botão encerrar pergunta', () => {
    const onAcao = vi.fn();
    const estado = { ...baseEstado, fase: 'pergunta' };
    render(<PainelProfessor estado={estado} ocupado={false} erro={null} onAcao={onAcao} />);

    expect(screen.getByText(/Sobre a Semana de Arte Moderna/i)).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 30/i)).toBeInTheDocument();

    // Distribuição A-E visível numericamente
    expect(screen.getByText(/A: 1/i)).toBeInTheDocument();
    expect(screen.getByText(/C: 1/i)).toBeInTheDocument();

    // Respondentes visíveis pelo nome
    expect(screen.getByText(/Ana Clara de Albuquerque Nascimento/i)).toBeInTheDocument();
    expect(screen.getByText(/Bruno Souza/i)).toBeInTheDocument();

    // RV-04: NÃO vincula nome à alternativa na lista de respondentes
    const listaRespondentes = screen.getByTestId('lista-respondentes');
    expect(listaRespondentes.textContent).not.toMatch(/Ana Clara.*Alternativa A/i);
    expect(listaRespondentes.textContent).not.toMatch(/Bruno.*Alternativa C/i);

    const btnEncerrar = screen.getByRole('button', { name: /encerrar pergunta/i });
    fireEvent.click(btnEncerrar);
    expect(onAcao).toHaveBeenCalledWith('encerrar_pergunta');
  });

  it('fase encerrada: permite mostrar feedback', () => {
    const onAcao = vi.fn();
    const estado = { ...baseEstado, fase: 'encerrada' };
    render(<PainelProfessor estado={estado} ocupado={false} erro={null} onAcao={onAcao} />);

    const btnFeedback = screen.getByRole('button', { name: /mostrar feedback/i });
    fireEvent.click(btnFeedback);
    expect(onAcao).toHaveBeenCalledWith('mostrar_feedback');
  });

  it('fase feedback: exibe gabarito, explicações e botão para mostrar ranking', () => {
    const onAcao = vi.fn();
    const estado = {
      ...baseEstado,
      fase: 'feedback',
      feedback: {
        gabarito: 'A',
        explicacoes: {
          A: 'Correta: Os modernistas propunham ruptura com o academicismo.',
          B: 'Incorreta: O parnasianismo era combatido pelo movimento.',
          C: 'Incorreta: Havia assimilação crítica de vanguardas europeias.',
          D: 'Incorreta: O verso livre foi amplamente adotado.',
          E: 'Incorreta: A busca de brasilidade era o objetivo central.',
        },
      },
    };
    render(<PainelProfessor estado={estado} ocupado={false} erro={null} onAcao={onAcao} />);

    expect(screen.getByText(/Gabarito Oficial: Alternativa A/i)).toBeInTheDocument();
    expect(screen.getByText(/Ruptura com o academicismo/i)).toBeInTheDocument();
    expect(screen.getByText(/O parnasianismo era combatido/i)).toBeInTheDocument();

    const btnRanking = screen.getByRole('button', { name: /mostrar ranking/i });
    fireEvent.click(btnRanking);
    expect(onAcao).toHaveBeenCalledWith('mostrar_ranking');
  });

  it('fase ranking: permite próxima rodada quando não é a última', () => {
    const onAcao = vi.fn();
    const estado = {
      ...baseEstado,
      fase: 'ranking',
      ranking: [
        { participanteId: 'p1', nomeExibicao: 'Ana Clara', pontos: 1000, posicao: 1 },
        { participanteId: 'p2', nomeExibicao: 'Bruno Souza', pontos: 0, posicao: 2 },
      ],
    };
    render(<PainelProfessor estado={estado} ocupado={false} erro={null} onAcao={onAcao} />);

    expect(screen.getByText(/Ana Clara/i)).toBeInTheDocument();
    expect(screen.getByText(/1000 pts/i)).toBeInTheDocument();

    const btnProx = screen.getByRole('button', { name: /próxima rodada/i });
    fireEvent.click(btnProx);
    expect(onAcao).toHaveBeenCalledWith('proxima_rodada');
  });

  it('fase ranking na última rodada: permite finalizar aulão', () => {
    const onAcao = vi.fn();
    const estado = {
      ...baseEstado,
      fase: 'ranking',
      rodada: { ...baseEstado.rodada, numero: 5, total: 5 },
      ranking: [{ participanteId: 'p1', nomeExibicao: 'Ana Clara', pontos: 5000, posicao: 1 }],
    };
    render(<PainelProfessor estado={estado} ocupado={false} erro={null} onAcao={onAcao} />);

    const btnFinalizar = screen.getByRole('button', { name: /finalizar aulão/i });
    fireEvent.click(btnFinalizar);
    expect(onAcao).toHaveBeenCalledWith('finalizar');
  });

  it('desabilita ações quando ocupado ou desconectado, e exibe erro com role="alert"', () => {
    const onAcao = vi.fn();
    const { rerender } = render(
      <PainelProfessor estado={baseEstado} ocupado={true} erro="Falha ao sincronizar sala" onAcao={onAcao} />
    );

    const btn = screen.getByRole('button', { name: /mostrar conteúdo/i });
    expect(btn).toBeDisabled();
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Falha ao sincronizar sala/i);

    // Desconectado também desabilita ações
    rerender(
      <PainelProfessor
        estado={{ ...baseEstado, conexao: 'desconectado' }}
        ocupado={false}
        erro={null}
        onAcao={onAcao}
      />
    );
    expect(screen.getByRole('button', { name: /mostrar conteúdo/i })).toBeDisabled();
    expect(screen.getByText(/Desconectado/i)).toBeInTheDocument();
  });

  it('RV-10: suporta mais de 500 respondentes e nomes longos com lista delimitada sem quebrar layout', () => {
    const muitosRespondentes = Array.from({ length: 550 }, (_, i) => ({
      id: `p-${i}`,
      nomeExibicao: `Estudante com Nome Extremamente Longo Número ${i} da Turma Integral 2026`,
    }));

    const estadoMuitos = {
      ...baseEstado,
      fase: 'pergunta',
      participacao: {
        total: 600,
        respondidos: 550,
        respondentes: muitosRespondentes,
        distribuicao: { A: 150, B: 100, C: 200, D: 50, E: 50 },
      },
    };

    render(<PainelProfessor estado={estadoMuitos} ocupado={false} erro={null} onAcao={vi.fn()} />);

    expect(screen.getByText(/550 \/ 600/i)).toBeInTheDocument();
    expect(screen.getByText(/A: 150/i)).toBeInTheDocument();
    expect(screen.getByText(/C: 200/i)).toBeInTheDocument();

    const lista = screen.getByTestId('lista-respondentes');
    expect(lista).toHaveClass('overflow-y-auto');
  });
});
