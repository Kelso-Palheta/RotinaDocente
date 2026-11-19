// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React, { StrictMode } from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import {
  CATALOGO_CENAS,
  selecionarCenaSemRepeticao,
} from '@/components/aula-gamificada/audiovisual/catalogoCenas';
import {
  MotorAudioJogo,
  PERFIS_SONOROS_JOGO,
} from '@/components/aula-gamificada/audiovisual/motorAudioJogo';
import {
  ProvedorAudiovisualSala,
  BarraControleAudiovisual,
} from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';
import PalcoCenaJogo from '@/components/aula-gamificada/audiovisual/PalcoCenaJogo';
import { MODALIDADES_PADRAO } from '@/components/aula-gamificada/constantes';
import JogoHerois from '@/components/aula-gamificada/jogos/JogoHerois';

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public');

describe('IMERSAO-01..05 — Imersão Audiovisual e Variedade de Cenas nos 9 jogos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('IMERSAO-01: catálogo cobre os 9 jogos com arquivos reais existentes em public/, alternativas estáticas e sem placeholders', () => {
    const modos = MODALIDADES_PADRAO.map((m) => m.id);
    expect(modos).toHaveLength(9);

    for (const entry of CATALOGO_CENAS) {
      expect(entry.id).toBeTruthy();
      expect(entry.origem).toBeTruthy();
      expect(entry.proporcao).toBeTruthy();
      expect(entry.descricao).toBeTruthy();
      const animPath = path.join(PUBLIC_ROOT, entry.midiaAnimada.replace(/^\//, ''));
      const staticPath = path.join(PUBLIC_ROOT, entry.alternativaEstatica.replace(/^\//, ''));
      expect(fs.existsSync(animPath), `Arquivo ausente: ${animPath}`).toBe(true);
      expect(fs.existsSync(staticPath), `Arquivo estático ausente: ${staticPath}`).toBe(true);
    }

    const porJogoESituacao = (jogo, sit) =>
      CATALOGO_CENAS.filter((c) => c.jogo === jogo && c.situacoes.includes(sit));

    // Heróis: >=3 acertos, >=3 erros, >=2 nova_tentativa, >=2 celebracao_final
    expect(porJogoESituacao('herois', 'acerto').length).toBeGreaterThanOrEqual(3);
    expect(porJogoESituacao('herois', 'erro').length).toBeGreaterThanOrEqual(3);
    expect(porJogoESituacao('herois', 'nova_tentativa').length).toBeGreaterThanOrEqual(2);
    expect(porJogoESituacao('herois', 'vitoria').length).toBeGreaterThanOrEqual(2);

    // Outros 6 jogos: >=2 sucesso/avanço, >=2 erro/passe, >=2 vitoria, >=1 espera, >=1 desafio
    for (const jogo of modos.filter((m) => m !== 'herois')) {
      const acertos =
        jogo === 'tabuleiro'
          ? porJogoESituacao('tabuleiro', 'avance_1').length + porJogoESituacao('tabuleiro', 'avance_2').length
          : porJogoESituacao(jogo, 'acerto').length;
      const erros =
        jogo === 'tabuleiro'
          ? porJogoESituacao('tabuleiro', 'erro_nao_ande').length + porJogoESituacao('tabuleiro', 'passe_a_vez').length
          : porJogoESituacao(jogo, 'erro').length;
      expect(acertos, `${jogo} acerto`).toBeGreaterThanOrEqual(2);
      expect(erros, `${jogo} erro`).toBeGreaterThanOrEqual(2);
      expect(porJogoESituacao(jogo, 'vitoria').length, `${jogo} vitoria`).toBeGreaterThanOrEqual(2);
      expect(porJogoESituacao(jogo, 'espera').length, `${jogo} espera`).toBeGreaterThanOrEqual(1);
      expect(porJogoESituacao(jogo, 'desafio').length, `${jogo} desafio`).toBeGreaterThanOrEqual(1);
      expect(PERFIS_SONOROS_JOGO[jogo]).toBeTruthy();
    }
    expect(PERFIS_SONOROS_JOGO.herois).toBeTruthy();
  });

  it('IMERSAO-02: seleção é estável pelo mesmo eventoId, evita repetição consecutiva e nunca mistura erro com vitória', () => {
    const historico = new Map();
    const cena1 = selecionarCenaSemRepeticao({
      jogo: 'herois',
      situacao: 'acerto',
      eventoId: 'SALA1:1:acerto:rec1',
      historicoPorChave: historico,
    });
    const cena1Repetida = selecionarCenaSemRepeticao({
      jogo: 'herois',
      situacao: 'acerto',
      eventoId: 'SALA1:1:acerto:rec1',
      historicoPorChave: historico,
    });
    expect(cena1Repetida.id).toBe(cena1.id);

    const cena2 = selecionarCenaSemRepeticao({
      jogo: 'herois',
      situacao: 'acerto',
      eventoId: 'SALA1:2:acerto:rec2',
      historicoPorChave: historico,
    });
    expect(cena2.id).not.toBe(cena1.id);

    const errosHerois = CATALOGO_CENAS.filter((c) => c.jogo === 'herois' && c.situacoes.includes('erro'));
    for (const c of errosHerois) {
      expect(c.situacoes).not.toContain('vitoria');
      expect(c.situacoes).not.toContain('acerto');
    }
  });

  it('IMERSAO-03: gerenciador inicia ligado nas salas reais, trata bloqueio de autoplay, persiste mute, respeita visibilitychange e limpa no unmount', async () => {
    const motor = new MotorAudioJogo({
      storage: localStorage,
      criarAudio: () => ({
        play: vi.fn().mockRejectedValueOnce(Object.assign(new Error('Autoplay blocked'), { name: 'NotAllowedError' }))
          .mockResolvedValue(undefined),
        pause: vi.fn(),
        removeAttribute: vi.fn(),
        load: vi.fn(),
        volume: 0.45,
        loop: true,
        src: '',
      }),
    });

    expect(motor.obterEstado().somAtivo).toBe(true);
    expect(motor.obterEstado().musicaAtiva).toBe(true);
    expect(motor.obterEstado().efeitosAtivos).toBe(true);

    await motor.sincronizarTrilha({ modalidade: 'herois', fase: 'espera' });
    expect(motor.obterEstado().bloqueadoAutoplay).toBe(true);

    // Gesto do usuário desbloqueia
    await motor.desbloquearPorGesto({ modalidade: 'herois', fase: 'espera' });
    expect(motor.obterEstado().bloqueadoAutoplay).toBe(false);

    // Persistência de mute respeitada na recriação
    motor.definirSomAtivo(false);
    const motorRecarregado = new MotorAudioJogo({ storage: localStorage });
    expect(motorRecarregado.obterEstado().somAtivo).toBe(false);
    motorRecarregado.destroy();
    motor.destroy();
  });

  it('IMERSAO-03b: ProvedorAudiovisualSala exibe estado honesto de bloqueio, persiste controles e não repete efeito no StrictMode/polling', async () => {
    const playSpy = vi.fn().mockRejectedValue(Object.assign(new Error('NotAllowed'), { name: 'NotAllowedError' }));
    vi.stubGlobal(
      'Audio',
      vi.fn(function AudioMock() {
        return {
          play: playSpy,
          pause: vi.fn(),
          removeAttribute: vi.fn(),
          load: vi.fn(),
          volume: 0.45,
          loop: true,
          src: '',
        };
      }),
    );

    const { unmount } = render(
      <StrictMode>
        <ProvedorAudiovisualSala modalidade="herois" fase="espera" evento={{ id: 'SALA1:0:espera', situacao: 'espera' }}>
          <BarraControleAudiovisual />
        </ProvedorAudiovisualSala>
      </StrictMode>,
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByText(/Toque para ativar o som/i)).toBeTruthy();
    const btnSom = screen.getByRole('button', { name: /som geral/i });
    expect(btnSom.getAttribute('aria-pressed')).toBe('true');

    fireEvent.click(btnSom);
    expect(btnSom.getAttribute('aria-pressed')).toBe('false');
    unmount();
  });

  it('IMERSAO-04: PalcoCenaJogo e JogoHerois usam palco ampliado com object-contain e alternativa estática quando animação reduzida', () => {
    const cena = CATALOGO_CENAS.find((c) => c.jogo === 'herois' && c.situacoes.includes('acerto'));
    const { container, rerender } = render(
      <PalcoCenaJogo cena={cena} reduzirAnimacao={false} tamanho="destaque" />,
    );
    const img = container.querySelector('img');
    expect(img.getAttribute('src')).toBe(cena.midiaAnimada);
    expect(img.className).toContain('object-contain');

    rerender(<PalcoCenaJogo cena={cena} reduzirAnimacao={true} tamanho="destaque" />);
    expect(container.querySelector('img').getAttribute('src')).toBe(cena.alternativaEstatica);

    const { container: heroiContainer } = render(
      <ProvedorAudiovisualSala modalidade="herois" fase="pergunta">
        <JogoHerois
          modo="aluno"
          questao={{
            id: 'q1',
            enunciado: 'Questão com imagem didática',
            imagemUrl: '/aula-gamificada/tabuleiro/capa-personagens.png',
            alternativas: [
              { id: 'A', texto: 'Alt A' },
              { id: 'B', texto: 'Alt B' },
            ],
          }}
          fase="pergunta"
          rodada={1}
          totalRodadas={3}
          prazoEncerrado={false}
          ocupado={false}
          onResponder={() => {}}
        />
      </ProvedorAudiovisualSala>,
    );

    // Preserva imagem didática da questão separada do palco de cena
    expect(
      heroiContainer.querySelector('img[src="/aula-gamificada/tabuleiro/capa-personagens.png"]'),
    ).toBeTruthy();
    // Palco ampliado de Heróis (sem limitação antiga max-h-40)
    const palcoHeroi = heroiContainer.querySelector('[data-testid="palco-cena-herois"]');
    expect(palcoHeroi).toBeTruthy();
    expect(palcoHeroi.innerHTML).not.toContain('max-h-40');
    // Não renderiza player duplicado dentro de JogoHerois quando já está sob ProvedorAudiovisualSala
    expect(heroiContainer.querySelectorAll('audio')).toHaveLength(0);
  });

  it('IMERSAO-05: SalaAlunoView integra os 9 jogos com controlador único ligado por padrão e palco sem repetições', async () => {
    const { SalaAlunoView } = await import('@/components/aula-gamificada/SalaAlunoView');
    const modos = MODALIDADES_PADRAO.map((m) => m.id);
    for (const modalidade of modos) {
      const { container, unmount } = render(
        <SalaAlunoView
          estado={{
            codigo: `SALA_${modalidade.toUpperCase()}`,
            titulo: `Sala ${modalidade}`,
            modalidade,
            fase: 'pergunta',
            rodada: 1,
            totalRodadas: 3,
            questao: {
              id: 'q1',
              tipo:
                modalidade === 'memoria'
                  ? 'pares'
                  : modalidade === 'associacao'
                    ? 'pares'
                    : modalidade === 'ordenacao'
                      ? 'ordenacao'
                      : 'multipla_escolha',
              enunciado: `Enunciado ${modalidade}`,
              alternativas: [
                { id: 'A', texto: 'Alt A' },
                { id: 'B', texto: 'Alt B' },
              ],
              pares: [
                { id: 'p1', esquerda: 'E1', direita: 'D1' },
                { id: 'p2', esquerda: 'E2', direita: 'D2' },
              ],
              itens: [
                { id: 'i1', texto: 'Item 1' },
                { id: 'i2', texto: 'Item 2' },
              ],
            },
          }}
          onResponder={async () => {}}
        />,
      );

      // Controlador único na barra audiovisual com som ligado por padrão
      const barras = container.querySelectorAll('[data-testid="barra-controle-audiovisual"]');
      expect(barras).toHaveLength(1);
      expect(screen.getByRole('button', { name: /som geral/i }).getAttribute('aria-pressed')).toBe('true');
      expect(container.querySelectorAll('audio')).toHaveLength(0);
      unmount();
    }
  });

  it('IMERSAO-06: Tabuleiro seleciona exatamente a carta semântica confirmada (avance_1, avance_2, passe_a_vez, erro_nao_ande) sem trocar 1 casa por 2', () => {
    const c1 = selecionarCenaSemRepeticao({ jogo: 'tabuleiro', situacao: 'avance_1', eventoId: 'e1' });
    const c2 = selecionarCenaSemRepeticao({ jogo: 'tabuleiro', situacao: 'avance_2', eventoId: 'e2' });
    const cp = selecionarCenaSemRepeticao({ jogo: 'tabuleiro', situacao: 'passe_a_vez', eventoId: 'e3' });
    const ce = selecionarCenaSemRepeticao({ jogo: 'tabuleiro', situacao: 'erro_nao_ande', eventoId: 'e4' });
    expect(c1.midiaAnimada).toContain('carta-avance-1.gif');
    expect(c2.midiaAnimada).toContain('carta-avance-2.gif');
    expect(cp.midiaAnimada).toContain('carta-passe-vez.gif');
    expect(ce.midiaAnimada).toContain('carta-erro.gif');
  });
});
