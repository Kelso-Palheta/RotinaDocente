import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { RevisarQuestao } from '@/components/revisao/RevisarQuestao';

afterEach(() => {
  cleanup();
});

const questaoValidaCompleta = {
  id: 'enem-2024-regular-arte-1',
  ano: 2024,
  aplicacoes: ['regular'],
  tema: 'Arte Urbana e Intervenção',
  habilidades: ['H12', 'H13'],
  enunciado: 'A instalação apresentada na imagem dialoga com a cidade ao transformar a experiência dos transeuntes em:',
  imagens: [
    {
      id: 'img-1',
      arquivo: '/imagens/arte-2024-urbana.jpg',
      url: '/imagens/arte-2024-urbana.jpg',
      alt: 'Painel urbano de grandes dimensões',
      legenda: 'Intervenção coletiva, 2023.',
      pagina: 12,
      revisada: true,
    },
  ],
  alternativas: [
    { id: 'A', texto: 'Privatização do espaço público metropolitano.' },
    { id: 'B', texto: 'Ressignificação do cotidiano por meio da fruição estética.' },
    { id: 'C', texto: 'Restrição da experiência a especialistas de arte.' },
    { id: 'D', texto: 'Despolitização da manifestação cultural.' },
    { id: 'E', texto: 'Reiteração do isolamento entre museu e rua.' },
  ],
  gabarito: 'B',
  explicacoes: {
    A: 'Incorreta: A intervenção promove a apropriação coletiva do espaço, não sua privatização.',
    B: 'Correta: A arte pública ressignifica a vivência dos passantes integrando arte à rotina.',
    C: 'Incorreta: Rompe as barreiras do meio acadêmico tornando o acesso universal.',
    D: 'Incorreta: Há forte teor sociopolítico presente na ocupação urbana.',
    E: 'Incorreta: Supera a cisão entre arte e espaço urbano.',
  },
  conteudoRevisao: [
    { tipo: 'texto', texto: 'A arte contemporânea desborda as fronteiras institucionais.' },
    { tipo: 'imagem', imagemId: 'img-1', legenda: 'Registro da intervenção.' },
  ],
  fontes: [
    {
      aplicacao: 'regular',
      caderno: 'Azul',
      numeroQuestao: 22,
      pagina: 12,
      provaUrl: 'https://download.inep.gov.br/enem/provas/2024_PV_regular_D1_CD1.pdf',
      gabaritoUrl: 'https://download.inep.gov.br/enem/gabaritos/2024_GB_impresso_D1_CD1.pdf',
      consultadoEm: '2026-11-04',
    },
  ],
  status: 'rascunho',
  revisao: {
    transcricao: true, // No registro pode estar true, mas o componente NÃO deve marcar automaticamente!
    gabarito: true,
    imagens: true,
    explicacoes: true,
  },
};

const confirmacoesZeradas = {
  transcricao: false,
  gabarito: false,
  imagens: false,
  explicacoes: false,
};

const confirmacoesAprovadas = {
  transcricao: true,
  gabarito: true,
  imagens: true,
  explicacoes: true,
};

describe('RevisarQuestao — Conferência Pedagógica e Aprovação Docente', () => {
  it('renderiza enunciado, alternativas A-E, gabarito, 5 explicações, conteúdo e fontes com links seguros', () => {
    render(
      <RevisarQuestao
        questao={questaoValidaCompleta}
        confirmacoes={confirmacoesZeradas}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    // Enunciado e tema
    expect(screen.getByText(/A instalação apresentada na imagem dialoga com a cidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Arte Urbana e Intervenção/i)).toBeInTheDocument();

    // 5 alternativas
    expect(screen.getByText(/Privatização do espaço público metropolitano/i)).toBeInTheDocument();
    expect(screen.getByText(/Ressignificação do cotidiano por meio da fruição estética/i)).toBeInTheDocument();
    expect(screen.getByText(/Restrição da experiência a especialistas de arte/i)).toBeInTheDocument();
    expect(screen.getByText(/Despolitização da manifestação cultural/i)).toBeInTheDocument();
    expect(screen.getByText(/Reiteração do isolamento entre museu e rua/i)).toBeInTheDocument();

    // Gabarito e explicações
    expect(screen.getByText(/Gabarito Oficial: Alternativa B/i)).toBeInTheDocument();
    expect(screen.getByText(/A intervenção promove a apropriação coletiva/i)).toBeInTheDocument();
    expect(screen.getByText(/A arte pública ressignifica a vivência dos passantes/i)).toBeInTheDocument();

    // Fontes oficiais com link seguro
    const linkProva = screen.getByRole('link', { name: /prova oficial caderno azul/i });
    expect(linkProva).toHaveAttribute('href', 'https://download.inep.gov.br/enem/provas/2024_PV_regular_D1_CD1.pdf');
    expect(linkProva).toHaveAttribute('target', '_blank');
    expect(linkProva).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('não interpreta tags HTML no texto como HTML executável (prevenção XSS)', () => {
    const questaoComTag = {
      ...questaoValidaCompleta,
      enunciado: 'Texto com <script>alert("xss")</script> e <b>negrito</b>',
    };
    render(
      <RevisarQuestao
        questao={questaoComTag}
        confirmacoes={confirmacoesZeradas}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    // Deve exibir o texto literal, sem renderizar tag script no DOM
    expect(screen.getByText(/<script>alert\("xss"\)<\/script>/i)).toBeInTheDocument();
    expect(document.querySelector('script[src]')).toBeNull();
  });

  it('não marca checkboxes automaticamente pelo status anterior do registro (controlado exclusivamente por confirmacoes)', () => {
    render(
      <RevisarQuestao
        questao={questaoValidaCompleta} // tem questao.revisao com tudo true!
        confirmacoes={confirmacoesZeradas} // confirmacoes recebidas são todas false!
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    const checkTranscricao = screen.getByLabelText(/confirmo a transcrição fiel/i);
    const checkGabarito = screen.getByLabelText(/confirmo a exatidão do gabarito/i);
    const checkImagens = screen.getByLabelText(/confirmo a legibilidade e fidelidade das imagens/i);
    const checkExplicacoes = screen.getByLabelText(/confirmo as explicações das 5 alternativas/i);

    expect(checkTranscricao).not.toBeChecked();
    expect(checkGabarito).not.toBeChecked();
    expect(checkImagens).not.toBeChecked();
    expect(checkExplicacoes).not.toBeChecked();
  });

  it('ao clicar em um checkbox, emite onConfirmacoesChange com o objeto completo atualizado', () => {
    const onConfirmacoesChange = vi.fn();
    render(
      <RevisarQuestao
        questao={questaoValidaCompleta}
        confirmacoes={confirmacoesZeradas}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={onConfirmacoesChange}
        onAprovar={vi.fn()}
      />
    );

    const checkTranscricao = screen.getByLabelText(/confirmo a transcrição fiel/i);
    fireEvent.click(checkTranscricao);

    expect(onConfirmacoesChange).toHaveBeenCalledWith({
      transcricao: true,
      gabarito: false,
      imagens: false,
      explicacoes: false,
    });
  });

  it('bloqueia botão de aprovação se alguma confirmação for falsa', () => {
    const confirmacoesParciais = {
      transcricao: true,
      gabarito: true,
      imagens: true,
      explicacoes: false, // pendente!
    };
    render(
      <RevisarQuestao
        questao={questaoValidaCompleta}
        confirmacoes={confirmacoesParciais}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    const btnAprovar = screen.getByRole('button', { name: /aprovar questão para uso em sala/i });
    expect(btnAprovar).toBeDisabled();
    expect(screen.getByText(/é necessário confirmar todos os 4 itens/i)).toBeInTheDocument();
  });

  it('bloqueia botão de aprovação se a estrutura estiver incompleta (ex: falta de explicação de alternativa)', () => {
    const questaoIncompleta = {
      ...questaoValidaCompleta,
      explicacoes: {
        A: 'Explicado',
        B: 'Explicado',
        C: 'Explicado',
        D: '', // Vazio!
        E: 'Explicado',
      },
    };
    render(
      <RevisarQuestao
        questao={questaoIncompleta}
        confirmacoes={confirmacoesAprovadas}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    const btnAprovar = screen.getByRole('button', { name: /aprovar questão para uso em sala/i });
    expect(btnAprovar).toBeDisabled();
    expect(screen.getByText(/estrutura incompleta.*explicações pendentes/i)).toBeInTheDocument();
  });

  it('bloqueia aprovação se houver referência de imagem ausente no conteúdo de revisão', () => {
    const questaoImagemAusente = {
      ...questaoValidaCompleta,
      conteudoRevisao: [
        { tipo: 'imagem', imagemId: 'img-fantasma', legenda: 'Figura não catalogada' },
      ],
    };
    render(
      <RevisarQuestao
        questao={questaoImagemAusente}
        confirmacoes={confirmacoesAprovadas}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    const btnAprovar = screen.getByRole('button', { name: /aprovar questão para uso em sala/i });
    expect(btnAprovar).toBeDisabled();
    expect(screen.getByText(/referência de imagem inexistente/i)).toBeInTheDocument();
  });

  it('quando 4 confirmações são válidas e estrutura completa, aciona onAprovar com o ID da questão', () => {
    const onAprovar = vi.fn();
    render(
      <RevisarQuestao
        questao={questaoValidaCompleta}
        confirmacoes={confirmacoesAprovadas}
        ocupado={false}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={onAprovar}
      />
    );

    const btnAprovar = screen.getByRole('button', { name: /aprovar questão para uso em sala/i });
    expect(btnAprovar).toBeEnabled();
    fireEvent.click(btnAprovar);

    expect(onAprovar).toHaveBeenCalledWith('enem-2024-regular-arte-1');
  });

  it('quando ocupado bloqueia controles e quando tem erro exibe role="alert"', () => {
    const { rerender } = render(
      <RevisarQuestao
        questao={questaoValidaCompleta}
        confirmacoes={confirmacoesAprovadas}
        ocupado={true}
        erro={null}
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/confirmo a transcrição fiel/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /aprovar questão para uso em sala/i })).toBeDisabled();

    rerender(
      <RevisarQuestao
        questao={questaoValidaCompleta}
        confirmacoes={confirmacoesAprovadas}
        ocupado={false}
        erro="Falha ao salvar conferência no servidor."
        onConfirmacoesChange={vi.fn()}
        onAprovar={vi.fn()}
      />
    );

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent(/Falha ao salvar conferência no servidor/i);
    expect(screen.getByText(/A instalação apresentada na imagem dialoga com a cidade/i)).toBeInTheDocument();
  });
});
