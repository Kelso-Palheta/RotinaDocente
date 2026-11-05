import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { ConferirConteudoTematico } from '@/components/revisao/ConferirConteudoTematico';

afterEach(() => {
  cleanup();
});

const conteudoCompletoMock = {
  id: 'surrealismo',
  trilhaId: 'historia-arte',
  titulo: 'Surrealismo: Sonho, Inconsciente e Vanguarda',
  duracaoEstimadaMinutos: 15,
  resumo:
    'Apresenta as bases do movimento surrealista europeu e sua relação com a psicanálise e a contestação da lógica burguesa pós-Primeira Guerra Mundial.',
  status: 'rascunho',
  objetivos: [
    {
      id: 'obj-1',
      descricao: 'Identificar a influência das teorias psicanalíticas de Freud na arte surrealista.',
    },
    {
      id: 'obj-2',
      descricao: 'Analisar o método paranoico-crítico e as técnicas automáticas de criação.',
    },
  ],
  blocos: [
    {
      id: 'b1-contexto',
      titulo: '1. O Contexto do Pós-Guerra e o Manifesto de 1924',
      tipo: 'texto',
      texto:
        'Após a devastação da Primeira Guerra Mundial, artistas e intelectuais questionaram a racionalidade ocidental. Em 1924, André Breton publicou o Primeiro Manifesto Surrealista.',
      objetivoIds: ['obj-1'],
    },
    {
      id: 'b2-imagem',
      titulo: '2. A Persistência da Memória e a Dilatação Temporal',
      tipo: 'imagem',
      imagemId: 'img-relogios',
      texto:
        'Salvador Dalí materializa o conceito de tempo psicológico em contraposição ao tempo mecânico por meio de relógios fluidos.',
      objetivoIds: ['obj-2'],
    },
  ],
  imagens: [
    {
      id: 'img-relogios',
      arquivo: 'aulas/imagens/surrealismo-dali.png',
      url: 'https://cdn.exemplo.org/aulas/surrealismo-dali.png',
      alt: 'Relógios derretidos sobre uma paisagem árida em tons ocres e azul.',
      legenda: 'Salvador Dalí, A Persistência da Memória, 1931.',
      fonteUrl: 'https://www.moma.org/collection/works/79018',
      licenca: 'Domínio público / Uso pedagógico homologado.',
    },
  ],
  fontes: [
    {
      titulo: 'The Museum of Modern Art (MoMA) — Salvador Dalí Collection',
      url: 'https://www.moma.org/collection/works/79018',
      consultadoEm: '2026-11-05',
    },
  ],
};

describe('ConferirConteudoTematico — Homologação Docente de Aulas RT-11', () => {
  it('renderiza título, resumo, objetivos, blocos, imagens com fontes e bibliografia', () => {
    render(
      <ConferirConteudoTematico
        conteudo={conteudoCompletoMock}
        confirmacoes={{ conteudo: false, imagens: false, cobertura: false }}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
        onVoltar={vi.fn()}
      />
    );

    expect(screen.getByText(/Surrealismo: Sonho, Inconsciente e Vanguarda/i)).toBeInTheDocument();
    expect(screen.getByText(/15 min/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Identificar a influência das teorias psicanalíticas/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/1. O Contexto do Pós-Guerra/i)).toBeInTheDocument();
    expect(screen.getByText(/Salvador Dalí, A Persistência da Memória, 1931/i)).toBeInTheDocument();
    expect(
      screen.getByText(/The Museum of Modern Art \(MoMA\) — Salvador Dalí Collection/i)
    ).toBeInTheDocument();
  });

  it('checklist possui exatamente os 3 critérios: conteudo, imagens e cobertura', () => {
    const onConfirmacoesChange = vi.fn();
    render(
      <ConferirConteudoTematico
        conteudo={conteudoCompletoMock}
        confirmacoes={{ conteudo: false, imagens: false, cobertura: false }}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={onConfirmacoesChange}
        onAprovar={vi.fn()}
        onVoltar={vi.fn()}
      />
    );

    const checkConteudo = screen.getByTestId('checkbox-confirmacao-conteudo');
    const checkImagens = screen.getByTestId('checkbox-confirmacao-imagens');
    const checkCobertura = screen.getByTestId('checkbox-confirmacao-cobertura');

    expect(checkConteudo).not.toBeChecked();
    expect(checkImagens).not.toBeChecked();
    expect(checkCobertura).not.toBeChecked();

    fireEvent.click(checkConteudo);
    expect(onConfirmacoesChange).toHaveBeenCalledWith(
      expect.objectContaining({ conteudo: true, imagens: false, cobertura: false })
    );
  });

  it('o botão de aprovação só é habilitado quando todas as 3 confirmações forem verdadeiras', () => {
    const onAprovar = vi.fn();

    // Com 2 de 3 marcadas: deve estar desabilitado
    const { rerender } = render(
      <ConferirConteudoTematico
        conteudo={conteudoCompletoMock}
        confirmacoes={{ conteudo: true, imagens: true, cobertura: false }}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={onAprovar}
        onVoltar={vi.fn()}
      />
    );

    const btnAprovar = screen.getByRole('button', { name: /Aprovar Conteúdo da Aula/i });
    expect(btnAprovar).toBeDisabled();

    // Com 3 de 3 marcadas: habilitado e dispara onAprovar com o id do conteúdo
    rerender(
      <ConferirConteudoTematico
        conteudo={conteudoCompletoMock}
        confirmacoes={{ conteudo: true, imagens: true, cobertura: true }}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={onAprovar}
        onVoltar={vi.fn()}
      />
    );

    expect(btnAprovar).not.toBeDisabled();
    fireEvent.click(btnAprovar);
    expect(onAprovar).toHaveBeenCalledWith('surrealismo');
  });

  it('bloqueia ações e checkboxes quando ocupado: true', () => {
    render(
      <ConferirConteudoTematico
        conteudo={conteudoCompletoMock}
        confirmacoes={{ conteudo: true, imagens: true, cobertura: true }}
        ocupado={true}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
        onVoltar={vi.fn()}
      />
    );

    const btnAprovar = screen.getByRole('button', { name: /Aprovar Conteúdo da Aula/i });
    expect(btnAprovar).toBeDisabled();

    const checkConteudo = screen.getByTestId('checkbox-confirmacao-conteudo');
    expect(checkConteudo).toBeDisabled();
  });

  it('exibe alerta de erro quando presente', () => {
    render(
      <ConferirConteudoTematico
        conteudo={conteudoCompletoMock}
        confirmacoes={{ conteudo: false, imagens: false, cobertura: false }}
        ocupado={false}
        erro="Falha ao registrar aprovação do conteúdo no servidor."
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
        onVoltar={vi.fn()}
      />
    );

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(/Falha ao registrar aprovação/i);
  });

  it('botão Voltar aciona onVoltar', () => {
    const onVoltar = vi.fn();
    render(
      <ConferirConteudoTematico
        conteudo={conteudoCompletoMock}
        confirmacoes={{ conteudo: false, imagens: false, cobertura: false }}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
        onVoltar={onVoltar}
      />
    );

    const btnVoltar = screen.getByRole('button', { name: /Voltar para a Preparação/i });
    fireEvent.click(btnVoltar);
    expect(onVoltar).toHaveBeenCalled();
  });
});
