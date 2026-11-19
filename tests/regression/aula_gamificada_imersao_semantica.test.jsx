// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { derivarContextoAudiovisual } from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';

const revelado = {
  codigo: 'SALA01', modalidade: 'associacao', rodada: 1, fase: 'feedback', revelado: true,
  feedback: { paresCorretos: [], explicacao: 'Confira as associações.' },
};

describe('Semântica audiovisual ainda exigida pela revisão anterior', () => {
  it('REV-IM-12: pontuação parcial tem reação distinta de erro total e acerto integral', () => {
    const av = derivarContextoAudiovisual({ ...revelado,
      recibo: { status: 'confirmado', correta: false, pontuacao: 500 },
    }, 0, 'aluno');
    expect(['erro', 'acerto']).not.toContain(av.situacao);
  });

  it('REV-IM-13: aluno sem resposta não é rotulado como tendo errado', () => {
    const av = derivarContextoAudiovisual({ ...revelado, recibo: null }, 0, 'aluno');
    expect(['erro', 'acerto']).not.toContain(av.situacao);
  });

  it('REV-IM-14: revelação coletiva no telão não afirma acerto individual de toda a turma', () => {
    const av = derivarContextoAudiovisual({ ...revelado, recibo: null }, 0, 'projecao');
    expect(['erro', 'acerto']).not.toContain(av.situacao);
  });
});
