// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ControlesGrupoDocente from '@/components/aula-gamificada/ControlesGrupoDocente';
import RelatorioAvaliacao from '@/components/aula-gamificada/RelatorioAvaliacao';
import { gerarCsvRelatorio } from '@/dominio/aula-gamificada/avaliacao';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';
import { PalcoCenaConectado } from '@/components/aula-gamificada/audiovisual/PalcoCenaJogo';
import { derivarContextoAudiovisual } from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';

vi.mock('jspdf', () => ({
  jsPDF: function MockJsPDF() {
    return {
      setFontSize: vi.fn(),
      splitTextToSize: (t) => [t],
      text: vi.fn(),
      addPage: vi.fn(),
      save: vi.fn(),
    };
  },
}));

describe('Controles docentes, relatórios coletivos e semântica audiovisual (REV-DIS-04/07 & REV-IM-12/13/14)', () => {
  it('ControlesGrupoDocente: troca representante por participanteId estável e confirma presença com feedback', async () => {
    const onComando = vi.fn().mockResolvedValue({});
    const estado = {
      formatoParticipacao: 'grupos',
      modoRespostaGrupo: 'compartilhada',
      equipes: [
        {
          id: 'g1',
          nome: 'Grupo Sol',
          representanteParticipanteId: 'p1',
          representanteAlunoId: 'a1',
        },
      ],
      participantes: [
        { id: 'p1', alunoId: 'a1', turmaId: 't1', nomeExibicao: 'Ana (T1)', equipeId: 'g1', entrouEmMs: 1000, presenteConfirmado: true },
        { id: 'p2', alunoId: 'a1', turmaId: 't2', nomeExibicao: 'Ana (T2)', equipeId: 'g1', entrouEmMs: 1000, presenteConfirmado: null },
      ],
    };

    render(<ControlesGrupoDocente estado={estado} onComando={onComando} />);

    const select = screen.getByLabelText(/Representante atual de Grupo Sol/i);
    fireEvent.change(select, { target: { value: 'p2' } });
    fireEvent.click(screen.getByRole('button', { name: /Alterar representante/i }));

    await waitFor(() => {
      expect(onComando).toHaveBeenCalledWith('alterar_representante', {
        equipeId: 'g1',
        representanteParticipanteId: 'p2',
      });
    });
    expect(screen.getByRole('status').textContent).toMatch(/Ana \(T2\)/i);

    fireEvent.click(screen.getByRole('button', { name: /Confirmar presença/i }));
    await waitFor(() => {
      expect(onComando).toHaveBeenCalledWith('confirmar_presenca', {
        presentesIds: ['p1', 'p2'],
        substituir: true,
      });
    });
  });

  it('normalizarEstadoSala: Quiz em grupos popula rankingEquipes em vez de ranking individual', () => {
    const norm = normalizarEstadoSala({
      sala: {
        codigo: 'QGRP1',
        modalidade: 'quiz',
        formatoParticipacao: 'grupos',
        modoRespostaGrupo: 'compartilhada',
        fase: 'ranking',
        revelado: true,
      },
      ranking: [
        { id: 'g1', nome: 'Grupo Sol', pontos: 1000, posicao: 1, empate: false },
        { id: 'g2', nome: 'Grupo Lua', pontos: 0, posicao: 2, empate: false },
      ],
    });
    expect(norm.rankingEquipes).toHaveLength(2);
    expect(norm.ranking).toHaveLength(0);
  });

  it('RelatorioAvaliacao e gerarCsvRelatorio identificam origem coletiva, grupo, presença e autoria', async () => {
    const relatorio = {
      sala: {
        codigo: 'RELG1',
        titulo: 'Quiz Coletivo',
        modalidade: 'quiz',
        formatoParticipacao: 'grupos',
        modoRespostaGrupo: 'compartilhada',
        finalidade: 'avaliativa',
        fase: 'encerrada',
      },
      configuracaoCongelada: {
        tituloAtividade: 'Av Coletiva',
        disciplina: 'Arte',
        anoLetivo: '2026',
        bimestre: '1',
        valorMaximo: 10,
        criterioColetivo: 'atribuir_presentes',
      },
      resumoTurma: {
        totalElegiveis: 2,
        presentes: 1,
        ausentes: 1,
        respostasUnicasGrupos: 1,
        mediaNota: 10,
      },
      alunos: [
        {
          participanteId: 'p1',
          nome: 'Ana',
          equipeId: 'g1',
          equipeNome: 'Grupo Sol',
          presencaStatus: 'presente_confirmado',
          origemColetiva: true,
          criterioColetivo: 'atribuir_presentes',
          representanteNome: 'Ana',
          autoresGrupo: ['Ana'],
          situacao: 'participou',
          respondidas: 1,
          elegiveis: 1,
          aproveitamento: 1,
          notaCalculada: 10,
          notaFinal: 10,
        },
      ],
      auditoria: [],
      sincronizacao: { status: 'pendente', pendencias: [] },
    };

    const csv = gerarCsvRelatorio(relatorio);
    expect(csv).toContain('Respostas Únicas Grupos');
    expect(csv).toContain('Coletiva (atribuir_presentes)');
    expect(csv).toContain('Grupo Sol');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => relatorio,
    });
    render(<RelatorioAvaliacao codigo="RELG1" />);
    fireEvent.click(screen.getByRole('button', { name: /Carregar relatório/i }));
    await waitFor(() => {
      expect(screen.getByText(/Respostas únicas de grupos: 1/i)).toBeTruthy();
      expect(screen.getByText(/Nota coletiva · Rep\.: Ana/i)).toBeTruthy();
    });
  });

  it('PalcoCenaConectado integra cenas dedicadas para parcial, sem_resposta e revelacao_neutra', () => {
    const ctxParcial = derivarContextoAudiovisual(
      { codigo: 'S1', modalidade: 'associacao', rodada: 1, fase: 'feedback', revelado: true, recibo: { status: 'confirmado', correta: false, pontuacao: 500 } },
      0,
      'aluno',
    );
    expect(ctxParcial.situacao).toBe('parcial');
    const ctxSemResp = derivarContextoAudiovisual(
      { codigo: 'S1', modalidade: 'associacao', rodada: 1, fase: 'feedback', revelado: true, recibo: null },
      0,
      'aluno',
    );
    expect(ctxSemResp.situacao).toBe('sem_resposta');
    const ctxProj = derivarContextoAudiovisual(
      { codigo: 'S1', modalidade: 'associacao', rodada: 1, fase: 'feedback', revelado: true, recibo: null },
      0,
      'projecao',
    );
    expect(ctxProj.situacao).toBe('revelacao_neutra');

    const { container } = render(
      <div>
        <PalcoCenaConectado jogo="associacao" situacao={ctxParcial.situacao} eventoId="e1" />
        <PalcoCenaConectado jogo="associacao" situacao={ctxSemResp.situacao} eventoId="e2" />
        <PalcoCenaConectado jogo="associacao" situacao={ctxProj.situacao} eventoId="e3" />
      </div>,
    );
    const srcs = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
    expect(srcs.every((s) => s && !s.includes('erro') && !s.includes('acerto'))).toBe(true);
  });
});
