// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CatalogoModalidades } from '@/components/aula-gamificada/CatalogoModalidades';
import { PrepararSala } from '@/components/aula-gamificada/PrepararSala';
import JogoHerois from '@/components/aula-gamificada/jogos/JogoHerois';
import JogoTabuleiro from '@/components/aula-gamificada/jogos/JogoTabuleiro';
import { MODALIDADES_PADRAO } from '@/components/aula-gamificada/constantes';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('UI e Acessibilidade — Heróis, Tabuleiro e 7 jogos no catálogo', () => {
  it('exibe dinamicamente 7 jogos no CatalogoModalidades', () => {
    expect(MODALIDADES_PADRAO).toHaveLength(7);
    render(
      <CatalogoModalidades
        modalidadesServidor={MODALIDADES_PADRAO}
        onSelecionarModalidade={() => {}}
      />,
    );
    expect(screen.getByText(/7 jogos prontos/i)).toBeTruthy();
    expect(screen.getByText(/7 modalidades para qualquer disciplina/i)).toBeTruthy();
    expect(screen.getByText('Heróis')).toBeTruthy();
    expect(screen.getAllByText('Tabuleiro').length).toBeGreaterThan(0);
  });

  it('PrepararSala exibe prévia editável das equipes padrão com alunos distribuídos no modo Tabuleiro', () => {
    const turmas = [
      {
        id: 't1',
        nome: '8º A',
        anoEscolar: '8º ano',
        alunos: [
          { id: 'a1', nome: 'Ana' },
          { id: 'a2', nome: 'Beto' },
          { id: 'a3', nome: 'Caio' },
          { id: 'a4', nome: 'Duda' },
        ],
      },
    ];
    const questoes = [
      {
        id: 'q1',
        disciplina: 'Arte',
        anoEscolar: '8º ano',
        conteudo: 'Arte Conceitual',
        dificuldade: 'medio',
        tipo: 'multipla_escolha',
        status: 'revisada',
        enunciado: 'Questão teste?',
        alternativas: [
          { id: 'A', texto: 'A' },
          { id: 'B', texto: 'B' },
          { id: 'C', texto: 'C' },
        ],
      },
    ];

    render(
      <PrepararSala
        modalidadeInicial="tabuleiro"
        turmas={turmas}
        questoes={questoes}
        salas={[]}
        onCriarSala={async () => {}}
        onAbrirSala={() => {}}
      />,
    );

    const inputAzul = screen.getByDisplayValue('Equipe Azul');
    const inputVerde = screen.getByDisplayValue('Equipe Verde');
    expect(inputAzul).toBeTruthy();
    expect(inputVerde).toBeTruthy();

    // Edita o nome da equipe na prévia
    fireEvent.change(inputAzul, { target: { value: 'Time Diamante' } });
    expect(screen.getByDisplayValue('Time Diamante')).toBeTruthy();
  });

  it('JogoHerois preserva mídias originais, áudio acessível e feedback individual Tente novamente', () => {
    const onResponder = vi.fn();
    const questao = {
      id: 'q1',
      enunciado: 'Qual é a ideia central?',
      alternativas: [
        { id: 'A', texto: 'Conceito' },
        { id: 'B', texto: 'Forma' },
        { id: 'C', texto: 'Cor' },
      ],
    };

    const { container } = render(
      <JogoHerois
        modo="aluno"
        questao={questao}
        fase="pergunta"
        rodada={1}
        totalRodadas={5}
        recibo={{
          status: 'confirmado',
          resposta: { alternativaId: 'B' },
          tentativas: 1,
          maxTentativas: 2,
          podeTentarNovamente: true,
          estadoHeroi: 'golpe_tente_novamente',
        }}
        prazoEncerrado={false}
        ocupado={false}
        onResponder={onResponder}
      />,
    );

    expect(screen.getByText(/Que golpe! Você errou! Tente novamente/i)).toBeTruthy();
    const audioBtn = screen.getByRole('button', { name: /som/i });
    expect(audioBtn.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(audioBtn);
    expect(audioBtn.getAttribute('aria-pressed')).toBe('true');

    const img = container.querySelector('img[src*="/aula-gamificada/herois/"]');
    expect(img).toBeTruthy();
    const audio = container.querySelector('audio[src="/aula-gamificada/herois/trilha-herois.mp3"]');
    expect(audio).toBeTruthy();

    // Botão de alternativa acessível (>= 48px via min-h-12)
    const btnA = screen.getByRole('button', { name: /A.*Conceito/i });
    expect(btnA.className).toContain('min-h-12');
    fireEvent.click(btnA);
    expect(onResponder).toHaveBeenCalledWith({ alternativaId: 'A' }, expect.any(String));
  });

  it('JogoTabuleiro preserva mídias originais, trilha Início..Chegada, turno e cartas', () => {
    const estado = {
      sala: {
        modalidade: 'tabuleiro',
        fase: 'feedback',
        rodada: 1,
        totalRodadas: 6,
        equipes: [
          { id: 'eq_azul', nome: 'Equipe Azul', cor: 'azul' },
          { id: 'eq_verde', nome: 'Equipe Verde', cor: 'verde' },
        ],
      },
      tabuleiroEstado: {
        totalCasas: 12,
        posicoesPorEquipe: { eq_azul: 2, eq_verde: 0 },
        equipeDaVezId: 'eq_azul',
        ultimaCarta: {
          tipo: 'avance_2',
          titulo: 'Parabéns, avance 2 casas.',
          avanco: 2,
          equipeId: 'eq_azul',
          equipeNome: 'Equipe Azul',
        },
        vencedorChegadaId: null,
      },
      equipeAluno: { id: 'eq_verde', nome: 'Equipe Verde' },
    };

    const { container } = render(
      <JogoTabuleiro
        modo="aluno"
        estado={estado}
        questao={{
          id: 'q1',
          enunciado: 'Pergunta do tabuleiro?',
          alternativas: [
            { id: 'A', texto: 'Alt A' },
            { id: 'B', texto: 'Alt B' },
          ],
        }}
        fase="pergunta"
        prazoEncerrado={false}
        ocupado={false}
        onResponder={() => {}}
      />,
    );

    expect(screen.getByText('Início')).toBeTruthy();
    expect(screen.getByText('Chegada')).toBeTruthy();
    expect(screen.getAllByText('Equipe Azul').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Equipe Verde').length).toBeGreaterThan(0);
    expect(screen.getByText(/Aguarde a vez da equipe/i)).toBeTruthy();
    expect(container.querySelector('img[src*="/aula-gamificada/tabuleiro/"]')).toBeTruthy();
    expect(
      container.querySelector('audio[src="/aula-gamificada/tabuleiro/trilha-tabuleiro.mp3"]'),
    ).toBeTruthy();
  });

  it('JogoHerois exibe erro em rejeição, gera novo requestId na 2ª tentativa e destaca gabarito no feedback', async () => {
    const onResponder = vi.fn().mockRejectedValueOnce(new Error('Falha temporária'));
    const questao = {
      id: 'q1',
      enunciado: 'Qual é a ideia central?',
      alternativas: [
        { id: 'A', texto: 'Conceito' },
        { id: 'B', texto: 'Forma' },
      ],
    };

    const { rerender } = render(
      <JogoHerois
        modo="aluno"
        questao={questao}
        fase="pergunta"
        rodada={1}
        totalRodadas={3}
        recibo={null}
        onResponder={onResponder}
      />,
    );

    const btnB = screen.getByRole('button', { name: /B.*Forma/i });
    fireEvent.click(btnB);
    expect(await screen.findByRole('alert')).toHaveTextContent('Falha temporária');

    // Retry da mesma tentativa mantém o mesmo requestId
    onResponder.mockResolvedValueOnce({ status: 'confirmado' });
    fireEvent.click(btnB);
    await vi.waitFor(() => expect(onResponder).toHaveBeenCalledTimes(2));
    const req1 = onResponder.mock.calls[0][1];
    const reqRetry = onResponder.mock.calls[1][1];
    expect(reqRetry).toBe(req1);

    // Após 1ª tentativa errada confirmada, 2ª tentativa gera novo requestId mesmo repetindo B
    rerender(
      <JogoHerois
        modo="aluno"
        questao={questao}
        fase="pergunta"
        rodada={1}
        totalRodadas={3}
        recibo={{
          status: 'confirmado',
          resposta: { alternativaId: 'B' },
          tentativas: 1,
          maxTentativas: 2,
          podeTentarNovamente: true,
          estadoHeroi: 'golpe_tente_novamente',
        }}
        onResponder={onResponder}
      />,
    );
    onResponder.mockResolvedValueOnce({ status: 'confirmado' });
    fireEvent.click(screen.getByRole('button', { name: /B.*Forma/i }));
    await vi.waitFor(() => expect(onResponder).toHaveBeenCalledTimes(3));
    expect(onResponder.mock.calls[2][1]).not.toBe(req1);

    // Feedback destaca alternativa correta
    rerender(
      <JogoHerois
        modo="docente"
        questao={questao}
        fase="feedback"
        rodada={1}
        totalRodadas={3}
        estado={{ feedback: { respostaCorreta: 'A', explicacao: 'Explicação.' } }}
      />,
    );
    expect(screen.getByText('Correta')).toBeTruthy();
  });

  it('PrepararSala limita Tabuleiro a 4 equipes e distribui alunos de nova turma adicionada', () => {
    const turmas = [
      { id: 't1', nome: '8º A', anoEscolar: '8º ano', alunos: [{ id: 'a1', nome: 'Ana' }, { id: 'a2', nome: 'Beto' }] },
      { id: 't2', nome: '8º B', anoEscolar: '8º ano', alunos: [{ id: 'a3', nome: 'Caio' }, { id: 'a4', nome: 'Duda' }] },
    ];
    render(
      <PrepararSala
        modalidadeInicial="tabuleiro"
        turmas={turmas}
        questoes={[]}
        salas={[]}
        onCriarSala={async () => {}}
        onAbrirSala={() => {}}
      />,
    );
    // Marca a 1ª e a 2ª turma (t1 e t2)
    fireEvent.click(screen.getByLabelText(/8º A/i));
    fireEvent.click(screen.getByLabelText(/8º B/i));
    expect(screen.getAllByText(/2 integrantes/i)).toHaveLength(2);

    // Adiciona 3ª e 4ª equipe e confirma bloqueio da 5ª
    const inputNova = screen.getByLabelText(/Nome da nova equipe/i);
    const btnAdd = screen.getByRole('button', { name: /\+ Adicionar equipe/i });
    fireEvent.change(inputNova, { target: { value: 'Equipe Amarela' } });
    fireEvent.click(btnAdd);
    fireEvent.change(inputNova, { target: { value: 'Equipe Roxa' } });
    fireEvent.click(btnAdd);
    expect(btnAdd).toBeDisabled();
  });
});
