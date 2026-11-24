import { describe, expect, it } from 'vitest';
import { projetarEstado } from '@/dominio/aula-gamificada/sala';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';
import { derivarContextoAudiovisual } from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';

function rodar({ modalidade, questao, segredoExtra = {}, resposta = null, pontos = 0, reciboExtra = {}, papel = 'aluno', revelado = true }) {
  const p = { id: 'al1', nomeExibicao: 'Ana', pontos, entrouEmMs: 1 };
  const recibo = resposta || Object.keys(reciboExtra).length
    ? { rodadaId: '1', reciboId: 'rec1', ...(resposta ? { resposta } : {}), pontos, ...reciboExtra }
    : null;
  const estado = projetarEstado({
    sala: { codigo: 'SALA01', modalidade, fase: 'feedback', revelado, rodada: 1, totalRodadas: 1, revision: 2, tempoSegundos: 60, equipes: [] },
    conteudo: {
      questaoPublica: questao,
      segredo: { questao, respostaCorreta: questao.respostaCorreta, explicacao: 'Explicação.', ...segredoExtra },
    },
    ator: { tipo: papel === 'aluno' ? 'aluno' : 'professor' },
    participante: papel === 'aluno' ? p : null,
    participantes: [p],
    respostas: recibo ? [{ participanteId: p.id, pontos, resposta, rodada: 1 }] : [],
    recibo,
    agora: 1000,
  });
  return derivarContextoAudiovisual(normalizarEstadoSala(estado), 0, papel);
}

describe('Feedback real das nove modalidades (projetarEstado -> normalizarEstadoSala -> derivarContextoAudiovisual)', () => {
  it('associacao diferencia integral (acerto), parcial, erro e sem resposta', () => {
    const pares = [{ esquerdaId: 'e1', direitaId: 'd1' }, { esquerdaId: 'e2', direitaId: 'd2' }];
    const q = { id: 'qA', tipo: 'pares', enunciado: 'Associe', pares: [{ id: 'p1', esquerda: { id: 'e1', texto: 'A' }, direita: { id: 'd1', texto: '1' } }, { id: 'p2', esquerda: { id: 'e2', texto: 'B' }, direita: { id: 'd2', texto: '2' } }], respostaCorreta: pares };
    expect(rodar({ modalidade: 'associacao', questao: q, segredoExtra: { pares }, resposta: { pares }, pontos: 1000 }).situacao).toBe('acerto');
    expect(rodar({ modalidade: 'associacao', questao: q, segredoExtra: { pares }, resposta: { pares: [pares[0], { esquerdaId: 'e2', direitaId: 'd1' }] }, pontos: 500 }).situacao).toBe('parcial');
    expect(rodar({ modalidade: 'associacao', questao: q, segredoExtra: { pares }, resposta: { pares: [{ esquerdaId: 'e1', direitaId: 'd2' }] }, pontos: 0 }).situacao).toBe('erro');
    expect(rodar({ modalidade: 'associacao', questao: q, segredoExtra: { pares }, resposta: null }).situacao).toBe('sem_resposta');
  });

  it('ordenacao diferencia integral (acerto), parcial e erro', () => {
    const q = { id: 'qO', tipo: 'ordenacao', enunciado: 'Ordene', itens: [{ id: 'i1', texto: '1' }, { id: 'i2', texto: '2' }, { id: 'i3', texto: '3' }], respostaCorreta: ['i1', 'i2', 'i3'] };
    expect(rodar({ modalidade: 'ordenacao', questao: q, resposta: { ordem: ['i1', 'i2', 'i3'] }, pontos: 1000 }).situacao).toBe('acerto');
    expect(rodar({ modalidade: 'ordenacao', questao: q, resposta: { ordem: ['i1', 'i3', 'i2'] }, pontos: 333 }).situacao).toBe('parcial');
    expect(rodar({ modalidade: 'ordenacao', questao: q, resposta: { ordem: ['i3', 'i1', 'i2'] }, pontos: 0 }).situacao).toBe('erro');
  });

  it('memoria diferencia completo (acerto), parcial, erro e sem resposta', () => {
    const q = { id: 'qM', tipo: 'pares', enunciado: 'Memória', cartas: [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }, { id: 'c4' }], pares: [{ id: 'p1', esquerda: { id: 'c1', texto: 'A' }, direita: { id: 'c2', texto: 'A' } }, { id: 'p2', esquerda: { id: 'c3', texto: 'B' }, direita: { id: 'c4', texto: 'B' } }], respostaCorreta: [] };
    expect(rodar({ modalidade: 'memoria', questao: q, pontos: 1000, reciboExtra: { virarId: 'c4', completo: true, cartasEncontradas: ['c1', 'c2', 'c3', 'c4'] } }).situacao).toBe('acerto');
    expect(rodar({ modalidade: 'memoria', questao: q, pontos: 500, reciboExtra: { virarId: 'c2', completo: false, cartasEncontradas: ['c1', 'c2'] } }).situacao).toBe('parcial');
    expect(rodar({ modalidade: 'memoria', questao: q, pontos: 0, reciboExtra: { virarId: 'c1', completo: false, cartasEncontradas: [] } }).situacao).toBe('erro');
    expect(rodar({ modalidade: 'memoria', questao: q, resposta: null }).situacao).toBe('sem_resposta');
  });

  it('natacao, herois e acerte_perde classificam acerto, erro e correcao_pendente sem som indevido', () => {
    const q = { id: 'qMC', tipo: 'multipla_escolha', enunciado: 'Q?', alternativas: [{ id: 'A', texto: '1' }, { id: 'B', texto: '2' }], respostaCorreta: 'A' };
    expect(rodar({ modalidade: 'natacao', questao: q, resposta: { alternativaId: 'A' }, pontos: 1000 }).situacao).toBe('acerto');
    expect(rodar({ modalidade: 'natacao', questao: q, resposta: { alternativaId: 'B' }, pontos: 0 }).situacao).toBe('erro');
    expect(rodar({ modalidade: 'herois', questao: q, resposta: { alternativaId: 'A' }, pontos: 1000, reciboExtra: { estadoHeroi: 'vitoria_fase' } }).situacao).toBe('acerto');
    expect(rodar({ modalidade: 'herois', questao: q, resposta: { alternativaId: 'B' }, pontos: 0, reciboExtra: { estadoHeroi: 'golpe_encerrado' } }).situacao).toBe('erro');

    const qAb = { id: 'qAb', tipo: 'resposta_aberta', enunciado: 'Explique', respostaCorreta: 'Modelo' };
    const pend = rodar({ modalidade: 'acerte_perde', questao: qAb, resposta: { texto: 'Minha resposta' }, pontos: 0 });
    expect(pend.situacao).toBe('correcao_pendente');
    expect(pend.evento).toBeNull(); // pendente não dispara som de erro ou ausência

    const corr = rodar({ modalidade: 'acerte_perde', questao: qAb, resposta: { texto: 'Minha resposta' }, pontos: 1000, reciboExtra: { correcaoManual: { correta: true, justificativa: 'Ótimo' } } });
    expect(corr.situacao).toBe('acerto');
  });

  it('telao/projecao e docente mantêm revelacao_neutra coletiva sem atribuir resultado individual', () => {
    const q = { id: 'qT', tipo: 'multipla_escolha', enunciado: 'Q?', alternativas: [{ id: 'A', texto: '1' }, { id: 'B', texto: '2' }], respostaCorreta: 'A' };
    expect(rodar({ modalidade: 'quiz', questao: q, papel: 'projecao' }).situacao).toBe('revelacao_neutra');
    expect(rodar({ modalidade: 'equipes', questao: q, papel: 'docente' }).situacao).toBe('revelacao_neutra');
  });

  it('antes de revelar não antecipa acerto/erro nem dispara celebração', () => {
    const q = { id: 'qNR', tipo: 'multipla_escolha', enunciado: 'Q?', alternativas: [{ id: 'A', texto: '1' }, { id: 'B', texto: '2' }], respostaCorreta: 'A' };
    const res = rodar({ modalidade: 'quiz', questao: q, resposta: { alternativaId: 'A' }, pontos: 1000, revelado: false });
    expect(res.situacao).toBe('resposta_recebida');
  });
});
