import { describe, expect, it } from 'vitest';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { normalizarQuestao } from '@/dominio/aula-gamificada/questoes';
import { montarConteudo, projetarEstado } from '@/dominio/aula-gamificada/sala';

const professor = { tipo: 'professor', uid: 'prof' };
const aluno = { tipo: 'aluno', loginKey: 'a'.repeat(64) };
const base = {
  disciplina: 'Ciências', anoEscolar: '6º ano', conteudo: 'Água', dificuldade: 'facil',
  enunciado: 'Identifique a etapa.', explicacao: 'Explicação revisada.',
};
let sequencia = 0;
const questao = (numero = 1, extra = {}) => normalizarQuestao({
  ...base, id: `q${numero}`, tipo: 'multipla_escolha',
  alternativas: [{ id: 'A', texto: 'Vapor' }, { id: 'B', texto: 'Gotas' }],
  respostaCorreta: 'B', ...extra,
}, { gerarId: () => `item-${++sequencia}` });
const sala = (extra = {}) => ({
  codigo: 'TEST42', professorId: 'prof', titulo: 'Teste', modalidade: 'quiz',
  turmaIds: ['t'], roster: ['t:a'], fase: 'pergunta', rodada: 1, totalRodadas: 2,
  tempoSegundos: 60, revision: 1, encerraEmMs: 61000, revelado: false, ...extra,
});
const participante = { id: 't:a', turmaId: 't', alunoId: 'a', nomeExibicao: 'Ana', pontos: 0, entrouEmMs: 1 };
function ambiente(config = sala()) {
  const docs = new Map([
    ['aulaGamificadaSalas/TEST42', config],
    ['aulaGamificadaSalas/TEST42/participantes/t:a', { ...participante }],
    ['aulaGamificadaSalas/TEST42/conteudos/0', montarConteudo(questao(1), 'quiz', { codigo: 'TEST42', indice: 0 })],
    ['aulaGamificadaSalas/TEST42/conteudos/1', montarConteudo(questao(2), 'quiz', { codigo: 'TEST42', indice: 1 })],
    ['professores/prof/turmas/data', { turmas: [{ id: 't', alunos: [{ id: 'a', nome: 'Ana' }] }] }],
    [`alunoLogin/${aluno.loginKey}/vinculos/prof`, { professorUid: 'prof', turmaId: 't', alunoId: 'a' }],
  ]);
  const store = {
    get: async path => structuredClone(docs.get(path) ?? null),
    list: async path => [...docs].filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/'))
      .map(([, value]) => structuredClone(value)),
    set: async (path, value) => { docs.set(path, structuredClone(value)); },
    transaction: async execute => execute(store),
  };
  const service = new AulaGamificadaService({ store, agora: () => 1000, idParticipante: () => 't:a' });
  return { docs, store, service };
}

describe('Revisão independente da entrega Aula Gamificada', () => {
  it('próxima rodada devolve imediatamente sua própria questão', async () => {
    const { service } = ambiente(sala({ fase: 'ranking', revelado: true }));
    const { estado } = await service.comandar(professor, 'TEST42', {
      acao: 'proxima', rodada: 1, expectedRevision: 1, requestId: 'next',
    });
    expect(estado.rodada.numero).toBe(2);
    expect(estado.rodada.questao.id).toBe('q2');
  });

  it('entrada concorrente preserva pontuação já gravada por uma resposta', async () => {
    const { docs, service } = ambiente();
    const caminho = 'aulaGamificadaSalas/TEST42/participantes/t:a';
    docs.set(caminho, { ...participante, entrouEmMs: null });
    const autorizar = service.autorizarAluno.bind(service);
    service.autorizarAluno = async (...args) => {
      const resultado = await autorizar(...args);
      // Uma transação fornece isolamento/retry em produção; a corrida é injetada apenas no fluxo sem transação.
      if (args[2]) return resultado;
      // Outra aba entrou e respondeu entre a leitura desta entrada e sua gravação.
      docs.set(caminho, { ...participante, entrouEmMs: 2, pontos: 1000 });
      return resultado;
    };
    await service.entrar(aluno, 'TEST42', { requestId: 'enter' });
    expect(docs.get(caminho).pontos).toBe(1000);
  });

  it('pontuação anterior à revelação não denuncia o acerto ao aluno', () => {
    const estado = projetarEstado({
      sala: sala(), conteudo: montarConteudo(questao(), 'quiz', { codigo: 'TEST42', indice: 0 }),
      ator: aluno, participante: { ...participante, pontos: 1000 }, participantes: [], agora: 1000,
      recibo: { pontos: 1000, resposta: { alternativaId: 'B' } },
    });
    expect(estado.eu.pontos ?? 0).toBe(0);
  });

  it('memória oculta faces das cartas ainda não viradas', () => {
    const q = questao(1, {
      tipo: 'pares', pares: [{ esquerda: 'Vapor secreto', direita: 'Gás secreto' }, { esquerda: 'Gelo secreto', direita: 'Sólido secreto' }],
      respostaCorreta: undefined,
    });
    const estado = projetarEstado({
      sala: sala({ modalidade: 'memoria' }),
      conteudo: montarConteudo(q, 'memoria', { codigo: 'TEST42', indice: 0 }),
      ator: aluno, participante, participantes: [], agora: 1000,
    });
    for (const texto of ['Vapor secreto', 'Gás secreto', 'Gelo secreto', 'Sólido secreto']) {
      expect(JSON.stringify(estado)).not.toContain(texto);
    }
  });
});
