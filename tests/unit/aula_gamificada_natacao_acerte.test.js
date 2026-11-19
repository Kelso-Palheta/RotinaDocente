import { describe, expect, it } from 'vitest';
import { obterModalidade } from '@/dominio/aula-gamificada/modalidades';
import { normalizarQuestao, questaoPublica, validarResposta } from '@/dominio/aula-gamificada/questoes';
import { consolidarNatacao, pontosAcerte, rankingNatacao } from '@/dominio/aula-gamificada/corrida';
import { aceitaRespostas } from '@/dominio/aula-gamificada/sala';
import { montarPromptGeracao } from '@/dominio/aula-gamificada/geracao';

const aberta = { id: 'aberta1', revision: 1, status: 'revisada', disciplina: 'Ciências', anoEscolar: '8º ano', conteudo: 'Fotossíntese', dificuldade: 'medio', tipo: 'resposta_aberta', enunciado: 'Explique como a planta produz alimento.', respostaCorreta: 'Usa luz, água e gás carbônico para produzir glicose.', explicacao: 'A energia luminosa é transformada em energia química.', justificativaDificuldade: 'Exige relacionar reagentes e energia.' };

describe('Natação e Acerte — regras puras', () => {
  it('registra compatibilidade das novas modalidades', () => {
    expect(obterModalidade('natacao').tiposQuestoes).toEqual(['multipla_escolha']);
    expect(obterModalidade('acerte_perde').tiposQuestoes).toEqual(['multipla_escolha', 'resposta_aberta']);
  });
  it('protege modelo e ignora julgamento enviado pelo aluno', () => {
    const q = normalizarQuestao(aberta);
    expect(q.respostaCorreta).toBe(aberta.respostaCorreta);
    expect(questaoPublica(q, 'acerte_perde')).not.toHaveProperty('respostaCorreta');
    expect(validarResposta(q, { texto: '  Usa luz solar.  ', correta: true, pontos: 99999 })).toEqual({ texto: 'Usa luz solar.' });
    expect(() => validarResposta(q, { texto: 'x'.repeat(2001) })).toThrow();
    expect(() => validarResposta(q, { texto: '   ' })).toThrow();
  });
  it('gera abertas com resposta modelo explicitada', () => {
    const prompt = montarPromptGeracao({ ...aberta, fonte: 'tema', quantidades: { facil: 1, medio: 0, dificil: 0 } });
    expect(prompt.prompt).toMatch(/resposta.modelo|resposta.model|resposta de referência/i);
    expect(prompt.prompt).not.toContain('undefined');
  });
  it('consolida progresso uma vez, preserva empate e não avança erro', () => {
    const participantes = [{ id: 'a', nomeExibicao: 'Ana' }, { id: 'b', nomeExibicao: 'Beto' }, { id: 'c', nomeExibicao: 'Caio' }];
    const params = { participantes, respostas: [{ participanteId: 'a', pontos: 1000 }, { participanteId: 'b', pontos: 1000 }, { participanteId: 'c', pontos: 0 }], rodada: 1, trechos: 1 };
    const estado = consolidarNatacao(params);
    expect(estado.raias.map(r => r.progresso)).toEqual([1, 1, 0]);
    expect(estado.vencedoresIds).toEqual(['a', 'b']);
    expect(consolidarNatacao({ ...params, estado })).toEqual(estado);
  });
  it('grupos normalizam acertos, sem vantagem por tamanho', () => {
    const participantes = [{ id:'a', equipeId:'x', entrouEmMs:1 }, { id:'b', equipeId:'y', entrouEmMs:1 }, { id:'c', equipeId:'y', entrouEmMs:1 }];
    const estado = consolidarNatacao({ participantes, equipes:[{id:'x',nome:'X'},{id:'y',nome:'Y'}], formatoParticipacao:'grupos', modoRespostaGrupo:'individual', respostas:[{participanteId:'a',pontos:1000},{participanteId:'b',pontos:1000},{participanteId:'c',pontos:0}], rodada:1 });
    expect(estado.raias.map(r => r.progresso)).toEqual([1, 0.5]);
  });
  it('bônus só altera jogo; cronômetro manual é exclusivo de Acerte', () => {
    expect(pontosAcerte({ desafioFinal: true, rodada: 2, totalRodadas: 2 }, true)).toBe(10000);
    expect(pontosAcerte({ desafioFinal: false, rodada: 2, totalRodadas: 2 }, true)).toBe(1000);
    expect(pontosAcerte({ desafioFinal: true, rodada: 2, totalRodadas: 2 }, false)).toBe(0);
    expect(aceitaRespostas({ modalidade:'acerte_perde', semCronometro:true, fase:'pergunta', encerraEmMs:null }, 999999)).toBe(true);
    expect(aceitaRespostas({ modalidade:'quiz', semCronometro:true, fase:'pergunta', encerraEmMs:null }, 999999)).toBe(false);
  });
});

import { normalizarRankingComEmpates } from '@/components/aula-gamificada/constantes';

describe('Regressões da revisão independente dos novos jogos', () => {
  it('mantém classificação por progresso mesmo quando equipe maior soma mais pontos', () => {
    const ranking = normalizarRankingComEmpates([{ id:'x',nome:'X',pontos:1000,progresso:1,posicao:1 },{ id:'y',nome:'Y',pontos:2000,progresso:2/3,posicao:2 }]);
    expect(ranking.map(r=>r.id)).toEqual(['x','y']);
  });
  it('três avanços de um terço atingem um trecho sem erro acumulado',()=>{
    const participantes=[{id:'a',equipeId:'x',entrouEmMs:1},{id:'b',equipeId:'x',entrouEmMs:1},{id:'c',equipeId:'x',entrouEmMs:1}];
    let estado=null;
    for(let rodada=1;rodada<=3;rodada++) estado=consolidarNatacao({estado,participantes,equipes:[{id:'x',nome:'X'}],formatoParticipacao:'grupos',modoRespostaGrupo:'individual',respostas:[{participanteId:'a',pontos:1000}],trechos:1,rodada});
    expect(estado.vencedoresIds).toEqual(['x']);
  });
});

it('empates proporcionais toleram 0.1 + 0.2 versus 0.3',()=>{
 const ranking=rankingNatacao({raias:[{id:'x',nome:'X',progresso:0.1+0.2},{id:'y',nome:'Y',progresso:0.3}]});
 expect(ranking.map(r=>r.posicao)).toEqual([1,1]);expect(ranking.every(r=>r.empate)).toBe(true);
});
