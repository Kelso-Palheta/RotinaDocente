import React, { StrictMode } from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PainelAluno } from '@/components/revisao/PainelAluno';
import { PainelProfessor } from '@/components/revisao/PainelProfessor';
import { TelaProjecao } from '@/components/revisao/TelaProjecao';

const imagem = { id: 'obra', arquivo: '/api/revisao/imagens/obra', alt: 'Obra original da questão' };
function estado(extra = {}) {
  return {
    sala: { id: 's1', titulo: 'Arte', codigo: 'ARTE42' },
    fase: 'pergunta', conexao: 'conectado', agoraServidorMs: 100000,
    rodada: {
      id: 'r1', numero: 1, total: 2, encerraEmMs: 103000,
      questao: { enunciado: 'Observe a obra.', imagens: [imagem], alternativas: [{id: 'A', texto: 'Resposta A'}] },
      conteudo: [{tipo:'imagem', imagemId:'obra', legenda:'Legenda da obra'}],
    },
    ...extra,
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('RV-REV-01 — revisão independente da interface', () => {
  for (const [nome, Componente] of [['aluno', PainelAluno], ['professor', PainelProfessor], ['projeção', TelaProjecao]]) {
    it(`${nome}: mostra imagem por arquivo, sem exigir tipo ou url fora do contrato`, () => {
      render(<Componente estado={estado()} onAcao={vi.fn()} />);
      expect(screen.getByRole('img', {name:imagem.alt})).toHaveAttribute('src', imagem.arquivo);
    });
    it(`${nome}: resolve imagemId do conteúdo pela imagem da questão`, () => {
      render(<Componente estado={estado({fase:'conteudo'})} onAcao={vi.fn()} />);
      expect(screen.getByRole('img', {name:imagem.alt})).toHaveAttribute('src', imagem.arquivo);
      expect(screen.getByText('Legenda da obra')).toBeInTheDocument();
    });
  }

  it('aluno: atraso do callback não prolonga prazo', () => {
    let monotono = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => monotono);
    render(<PainelAluno estado={estado()} onResponder={vi.fn()} />);
    monotono = 5000;
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', {name:/Resposta A/})).toBeDisabled();
    expect(screen.getByText(/Tempo encerrado/i)).toBeInTheDocument();
  });

  it('aluno: volta a contar após nova sincronização com mesmo prazo depois de zero', () => {
    const {rerender} = render(<PainelAluno estado={estado()} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('button', {name:/Resposta A/})).toBeDisabled();
    rerender(<PainelAluno estado={estado({agoraServidorMs:102000})} />);
    expect(screen.getByRole('button', {name:/Resposta A/})).toBeEnabled();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('button', {name:/Resposta A/})).toBeDisabled();
  });

  it('projeção: mede tempo decorrido mesmo com callback atrasado', () => {
    let monotono = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => monotono);
    render(<TelaProjecao estado={estado()} />);
    monotono = 10000;
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('conexão desconhecida não autoriza resposta ou comando docente', () => {
    const {unmount} = render(<PainelAluno estado={estado({conexao:undefined})} />);
    expect(screen.getByRole('button', {name:/Resposta A/})).toBeDisabled();
    unmount();
    render(<PainelProfessor estado={estado({fase:'espera', conexao:undefined})} onAcao={vi.fn()} />);
    expect(screen.getByRole('button', {name:/Mostrar Conteúdo/})).toBeDisabled();
  });

  it('feedback não inventa pontos só porque a alternativa coincide com gabarito', () => {
    render(<PainelAluno estado={estado({fase:'feedback', feedback:{gabarito:'A', explicacoes:{A:'Correta'}}})} envio={{status:'confirmado', alternativa:'A'}} />);
    expect(screen.getByText(/Você acertou/)).toBeInTheDocument();
    expect(screen.queryByText(/\+1000/)).not.toBeInTheDocument();
  });

  it('desmontagem em StrictMode limpa todos os temporizadores', () => {
    const {unmount} = render(<StrictMode><PainelAluno estado={estado()} /></StrictMode>);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('informa o encerramento a leitores de tela sem anunciar cada segundo', () => {
    render(<PainelAluno estado={estado()} />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.getByRole('status')).toHaveTextContent(/Tempo encerrado/);
  });
});
