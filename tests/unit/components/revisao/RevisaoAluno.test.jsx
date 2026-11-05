import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { PainelAluno } from '@/components/revisao/PainelAluno';

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
  fase: 'pergunta',
  conexao: 'conectado',
  agoraServidorMs: 100000,
  rodada: {
    id: 'r1',
    numero: 1,
    total: 5,
    encerraEmMs: 160000, // 60 segundos restantes
    questao: {
      id: 'q1',
      ano: 2024,
      aplicacoes: ['regular'],
      tema: 'Arte Contemporânea',
      enunciado: 'A instalação artística apresentada estabelece diálogo com o espaço urbano ao:',
      imagens: [{ id: 'img1', url: '/instalacao.jpg', alt: 'Instalação urbana', legenda: 'Intervenção urbana, 2023' }],
      alternativas: [
        { id: 'A', texto: 'Privatizar o acesso à obra de arte pública.' },
        { id: 'B', texto: 'Ressignificar a vivência cotidiana dos transeuntes.' },
        { id: 'C', texto: 'Restringir a contemplação ao público especializado.' },
        { id: 'D', texto: 'Eliminar a carga política das manifestações coletivas.' },
        { id: 'E', texto: 'Reiterar a separação rígida entre arte e vida.' },
      ],
    },
    conteudo: [
      { tipo: 'texto', texto: 'A arte contemporânea expande os suportes tradicionais para as ruas.' },
    ],
  },
  participacao: null, // No aluno, participacao detalhada pode ser null
  feedback: null,
  ranking: [],
};

const envioNaoEnviado = { status: 'nao_enviado', alternativa: null };

describe('RV-05 — PainelAluno: envio, confirmação, retry, prazo e acessibilidade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('permite escolher alternativa e aciona onResponder quando nao_enviado', () => {
    const onResponder = vi.fn();
    render(
      <PainelAluno
        estado={baseEstado}
        envio={envioNaoEnviado}
        ocupado={false}
        erro={null}
        onResponder={onResponder}
        onTentarNovamente={vi.fn()}
      />
    );

    expect(screen.getByText(/A instalação artística apresentada/i)).toBeInTheDocument();
    const btnB = screen.getByRole('button', { name: /B.*Ressignificar a vivência cotidiana/i });
    expect(btnB).toBeEnabled();

    fireEvent.click(btnB);
    expect(onResponder).toHaveBeenCalledWith('B');
  });

  it('estado enviando é distinto de confirmado: exibe spinner/indicador e desabilita botões', () => {
    const onResponder = vi.fn();
    const envio = { status: 'enviando', alternativa: 'B' };
    render(
      <PainelAluno
        estado={baseEstado}
        envio={envio}
        ocupado={false}
        erro={null}
        onResponder={onResponder}
        onTentarNovamente={vi.fn()}
      />
    );

    expect(screen.getByText(/Enviando resposta/i)).toBeInTheDocument();
    expect(screen.queryByText(/Resposta confirmada/i)).not.toBeInTheDocument();

    const btnB = screen.getByRole('button', { name: /B.*Ressignificar a vivência cotidiana/i });
    expect(btnB).toBeDisabled();

    // Clicar não deve disparar nova chamada
    fireEvent.click(btnB);
    expect(onResponder).not.toHaveBeenCalled();
  });

  it('estado confirmado: exibe role="status" com confirmação e bloqueia novas respostas', () => {
    const onResponder = vi.fn();
    const envio = { status: 'confirmado', alternativa: 'B' };
    render(
      <PainelAluno
        estado={baseEstado}
        envio={envio}
        ocupado={false}
        erro={null}
        onResponder={onResponder}
        onTentarNovamente={vi.fn()}
      />
    );

    const statusElem = screen.getByRole('status');
    expect(statusElem).toHaveTextContent(/Resposta confirmada/i);
    expect(statusElem).toHaveTextContent(/Alternativa B/i);

    // Todos os botões devem estar desabilitados
    const buttons = screen.getAllByRole('button', { name: /^[A-E]\)/i });
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  it('estado falha: exibe role="alert", preserva escolha e permite tentar novamente', () => {
    const onTentarNovamente = vi.fn();
    const envio = { status: 'falha', alternativa: 'B' };
    render(
      <PainelAluno
        estado={baseEstado}
        envio={envio}
        ocupado={false}
        erro="Instabilidade de conexão ao enviar"
        onResponder={vi.fn()}
        onTentarNovamente={onTentarNovamente}
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/Instabilidade de conexão ao enviar/i);

    // Mostra que a alternativa escolhida foi B
    expect(screen.getByText(/Sua escolha: Alternativa B/i)).toBeInTheDocument();

    const btnRetry = screen.getByRole('button', { name: /tentar novamente/i });
    expect(btnRetry).toBeInTheDocument();
    fireEvent.click(btnRetry);
    expect(onTentarNovamente).toHaveBeenCalled();
  });

  it('desabilita respostas quando desconectado ou quando ocupado', () => {
    const estadoDesconectado = { ...baseEstado, conexao: 'desconectado' };
    const { rerender } = render(
      <PainelAluno
        estado={estadoDesconectado}
        envio={envioNaoEnviado}
        ocupado={false}
        erro={null}
        onResponder={vi.fn()}
        onTentarNovamente={vi.fn()}
      />
    );

    expect(screen.getByText(/Desconectado/i)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: /^[A-E]\)/i });
    buttons.forEach((b) => expect(b).toBeDisabled());

    rerender(
      <PainelAluno
        estado={baseEstado}
        envio={envioNaoEnviado}
        ocupado={true}
        erro={null}
        onResponder={vi.fn()}
        onTentarNovamente={vi.fn()}
      />
    );
    const buttonsOcupado = screen.getAllByRole('button', { name: /^[A-E]\)/i });
    buttonsOcupado.forEach((b) => expect(b).toBeDisabled());
  });

  it('desabilita respostas quando o cronômetro visual expira', () => {
    const estadoExpirado = {
      ...baseEstado,
      agoraServidorMs: 165000,
      rodada: { ...baseEstado.rodada, encerraEmMs: 160000 },
    };
    render(
      <PainelAluno
        estado={estadoExpirado}
        envio={envioNaoEnviado}
        ocupado={false}
        erro={null}
        onResponder={vi.fn()}
        onTentarNovamente={vi.fn()}
      />
    );

    expect(screen.getByText(/Tempo encerrado/i)).toBeInTheDocument();
    const buttons = screen.getAllByRole('button', { name: /^[A-E]\)/i });
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  it('timer visual não anuncia a cada segundo para leitor de tela (aria-hidden)', () => {
    render(
      <PainelAluno
        estado={baseEstado}
        envio={envioNaoEnviado}
        ocupado={false}
        erro={null}
        onResponder={vi.fn()}
        onTentarNovamente={vi.fn()}
      />
    );

    const timerNum = screen.getByTestId('timer-visual-segundos');
    expect(timerNum).toHaveAttribute('aria-hidden', 'true');
  });

  it('fase conteudo: exibe conteúdo de revisão', () => {
    const estadoConteudo = { ...baseEstado, fase: 'conteudo' };
    render(
      <PainelAluno
        estado={estadoConteudo}
        envio={envioNaoEnviado}
        ocupado={false}
        erro={null}
        onResponder={vi.fn()}
        onTentarNovamente={vi.fn()}
      />
    );

    expect(screen.getByText(/A arte contemporânea expande os suportes tradicionais/i)).toBeInTheDocument();
  });

  it('fase feedback: exibe gabarito e explicações para as 5 alternativas', () => {
    const estadoFeedback = {
      ...baseEstado,
      fase: 'feedback',
      feedback: {
        gabarito: 'B',
        explicacoes: {
          A: 'Incorreta: A obra é pública e aberta.',
          B: 'Correta: A intervenção ressignifica o cotidiano da cidade.',
          C: 'Incorreta: Não restringe ao público especializado.',
          D: 'Incorreta: Mantém forte diálogo sociopolítico.',
          E: 'Incorreta: Promove fusão entre arte e espaço urbano.',
        },
      },
    };
    const envioConfirmado = { status: 'confirmado', alternativa: 'B' };

    render(
      <PainelAluno
        estado={estadoFeedback}
        envio={envioConfirmado}
        ocupado={false}
        erro={null}
        onResponder={vi.fn()}
        onTentarNovamente={vi.fn()}
      />
    );

    expect(screen.getByText(/Gabarito Oficial: Alternativa B/i)).toBeInTheDocument();
    expect(screen.getByText(/Você acertou!/i)).toBeInTheDocument();
    expect(screen.getByText(/A intervenção ressignifica o cotidiano/i)).toBeInTheDocument();
    expect(screen.getByText(/A obra é pública e aberta/i)).toBeInTheDocument();
  });

  it('fase ranking: exibe pontuação e lista de classificação', () => {
    const estadoRanking = {
      ...baseEstado,
      fase: 'ranking',
      ranking: [
        { participanteId: 'p1', nomeExibicao: 'Ana Clara', pontos: 1000, posicao: 1 },
        { participanteId: 'aluno-atual', nomeExibicao: 'Eu Mesmo', pontos: 1000, posicao: 1 },
      ],
    };

    render(
      <PainelAluno
        estado={estadoRanking}
        envio={envioNaoEnviado}
        ocupado={false}
        erro={null}
        onResponder={vi.fn()}
        onTentarNovamente={vi.fn()}
      />
    );

    expect(screen.getByText(/Classificação/i)).toBeInTheDocument();
    expect(screen.getByText(/Ana Clara/i)).toBeInTheDocument();
    expect(screen.getByText(/Eu Mesmo/i)).toBeInTheDocument();
  });
});
