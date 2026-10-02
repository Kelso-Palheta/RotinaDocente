import { describe, it, expect, vi } from 'vitest';
import { consolidarFichaAluno360 } from '../../frontend/src/dominio/diario/fichaAluno';

const { mockSave, mockDoc } = vi.hoisted(() => {
  const save = vi.fn();
  return {
    mockSave: save,
    mockDoc: {
      internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
      setFillColor: vi.fn(),
      rect: vi.fn(),
      roundedRect: vi.fn(),
      setDrawColor: vi.fn(),
      setFont: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      text: vi.fn(),
      line: vi.fn(),
      splitTextToSize: vi.fn((t) => [t]),
      save,
    },
  };
});

vi.mock('jspdf', () => ({
  jsPDF: vi.fn().mockImplementation(() => mockDoc),
}));

describe('UT-31: Ficha Individual do Aluno 360º (RN-57)', () => {
  const turmaMock = {
    id: 'turma-3a',
    nome: '3º Ano A - Ensino Médio',
    disciplina: 'Língua Portuguesa',
    alunos: [
      { id: 'aluno-1', nome: 'Ana Clara Souza', matricula: '2024-001' },
      { id: 'aluno-2', nome: 'Bernardo Lima', matricula: '2024-002', necessidades: ['tdah', 'baixa_visao'] },
      { id: 'aluno-3', nome: 'Carlos Eduardo', matricula: '2024-003' },
    ],
    avaliacoes: [
      { id: 'av-1', bimestre: 1, nome: 'Prova 1', tipo: 'numerica', valorMax: 10, notas: { 'aluno-1': 8.5, 'aluno-2': 6.0, 'aluno-3': 4.0 } },
      { id: 'av-2', bimestre: 2, nome: 'Simulado', tipo: 'numerica', valorMax: 10, notas: { 'aluno-1': 9.0, 'aluno-2': 7.5, 'aluno-3': 4.5 } },
    ],
  };

  const frequenciasTurmaMock = {
    '2026-03-01': {
      quantidadeAulas: 2,
      presencas: { 'aluno-1': 'P', 'aluno-2': 'P', 'aluno-3': 'F' }
    },
    '2026-03-02': {
      quantidadeAulas: 2,
      presencas: { 'aluno-1': 'P', 'aluno-2': 'FJ', 'aluno-3': 'F' }
    },
    '2026-03-03': {
      quantidadeAulas: 2,
      presencas: { 'aluno-1': 'P', 'aluno-2': 'P', 'aluno-3': 'F' }
    },
    '2026-03-04': {
      quantidadeAulas: 2,
      presencas: { 'aluno-1': 'P', 'aluno-2': 'P', 'aluno-3': 'F' }
    }
  };

  it('deve consolidar a ficha 360º de um aluno com rendimento acadêmico e frequência regular', () => {
    const aluno = turmaMock.alunos[0]; // Ana Clara
    const ficha = consolidarFichaAluno360({
      aluno,
      turma: turmaMock,
      frequenciasTurma: frequenciasTurmaMock,
    });

    expect(ficha.aluno.nome).toBe('Ana Clara Souza');
    expect(ficha.aluno.matricula).toBe('2024-001');
    expect(ficha.turma.nome).toBe('3º Ano A - Ensino Médio');

    // Desempenho acadêmico
    expect(ficha.academico.bimestres[0]).toBe(8.5);
    expect(ficha.academico.bimestres[1]).toBe(9.0);
    expect(ficha.academico.situacao).toBeDefined();

    // Assiduidade LDB (8 aulas no total, todas P = 100%)
    expect(ficha.frequencia.totalAulas).toBe(8);
    expect(ficha.frequencia.presencas).toBe(8);
    expect(ficha.frequencia.faltas).toBe(0);
    expect(ficha.frequencia.percentual).toBe(100);
    expect(ficha.frequencia.statusLdb).toBe('regular');

    // Perfil inclusivo
    expect(ficha.inclusao.temNecessidades).toBe(false);
  });

  it('deve identificar perfil inclusivo DUA com recomendações pedagógicas quando o aluno possuir necessidades', () => {
    const aluno = turmaMock.alunos[1]; // Bernardo (TDAH e Baixa Visão)
    const ficha = consolidarFichaAluno360({
      aluno,
      turma: turmaMock,
      frequenciasTurma: frequenciasTurmaMock,
    });

    expect(ficha.inclusao.temNecessidades).toBe(true);
    expect(ficha.inclusao.necessidades).toContain('tdah');
    expect(ficha.inclusao.necessidades).toContain('baixa_visao');
    expect(ficha.inclusao.recomendacoes.length).toBeGreaterThan(0);
  });

  it('deve alertar risco crítico de infrequência LDB quando o estudante acumular mais de 25% de faltas', () => {
    const aluno = turmaMock.alunos[2]; // Carlos Eduardo (8 faltas de 8 aulas = 0% presença)
    const ficha = consolidarFichaAluno360({
      aluno,
      turma: turmaMock,
      frequenciasTurma: frequenciasTurmaMock,
    });

    expect(ficha.frequencia.faltas).toBe(8);
    expect(ficha.frequencia.percentual).toBe(0);
    expect(ficha.frequencia.statusLdb).toBe('critico');
    expect(ficha.frequencia.alertaLegal).toContain('Art. 24');
  });

  it('deve incorporar histórico de redações ENEM com competência destaque e competência alvo prioritária', () => {
    const aluno = turmaMock.alunos[0];
    const historicoRedacoesMock = [
      {
        id: 'red-1',
        titulo: 'A democratização do acesso ao cinema',
        pontuacaoTotal: 840,
        competencias: { c1: 160, c2: 180, c3: 160, c4: 180, c5: 160 }
      },
      {
        id: 'red-2',
        titulo: 'Invisibilidade do trabalho de cuidado',
        pontuacaoTotal: 920,
        competencias: { c1: 180, c2: 200, c3: 180, c4: 200, c5: 160 }
      }
    ];

    const ficha = consolidarFichaAluno360({
      aluno,
      turma: turmaMock,
      frequenciasTurma: frequenciasTurmaMock,
      historicoRedacoes: historicoRedacoesMock,
    });

    expect(ficha.redacao).toBeDefined();
    expect(ficha.redacao.totalRedacoes).toBe(2);
    expect(ficha.redacao.mediaTotal).toBe(880);
    expect(ficha.redacao.competenciaAlvo).toBe('C5'); // menor média (160)
    expect(ficha.redacao.competenciaDestaque).toMatch(/C2|C4/); // maior média (190)
  });

  it('deve lidar com tolerância quando dados de frequência ou avaliações forem nulos ou vazios', () => {
    const aluno = { id: 'aluno-novo', nome: 'Daniel Dias' };
    const turmaVazia = { id: 'turma-vazia', nome: '1º Ano B', alunos: [aluno] };

    const ficha = consolidarFichaAluno360({
      aluno,
      turma: turmaVazia,
      frequenciasTurma: null,
      historicoRedacoes: null,
    });

    expect(ficha.aluno.nome).toBe('Daniel Dias');
    expect(ficha.frequencia.totalAulas).toBe(0);
    expect(ficha.frequencia.percentual).toBe(100);
    expect(ficha.frequencia.statusLdb).toBe('regular');
    expect(ficha.inclusao.temNecessidades).toBe(false);
    expect(ficha.redacao).toBeNull();
  });

  it('deve gerar o documento PDF da Ficha 360º sem falhas através de generateFichaAluno360PDF', async () => {
    const { generateFichaAluno360PDF } = await import('../../frontend/src/lib/diario/fichaAlunoExport');

    const doc = await generateFichaAluno360PDF({
      aluno: turmaMock.alunos[1], // Bernardo (com necessidades DUA)
      turma: turmaMock,
      frequenciasTurma: frequenciasTurmaMock,
      professorNome: 'Prof. Carlos',
      parecerManual: 'Excelente desempenho e evolução atitudinal.',
    });

    expect(doc).toBeDefined();
    expect(typeof doc.save).toBe('function');
    expect(typeof doc.output).toBe('function');
  });
});
