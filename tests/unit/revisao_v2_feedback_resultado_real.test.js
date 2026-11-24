import { expect, it } from 'vitest';
import { projetarEstado } from '@/dominio/aula-gamificada/sala';
import { normalizarEstadoSala } from '@/components/aula-gamificada/constantes';
import { derivarContextoAudiovisual } from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';
function contexto(modalidade, correta, aberta=false) {
 const q={id:'q1',tipo:aberta?'resposta_aberta':'multipla_escolha',enunciado:'Qual alternativa?',alternativas:[{id:'A',texto:'Primeira'},{id:'B',texto:'Segunda'}],respostaCorreta:aberta?'Modelo para correção docente':'A',explicacao:'Explicação pedagógica.'};
 const p={id:'aluno1',nomeExibicao:'Aluno sintético',pontos:correta?1000:0,entrouEmMs:1};
 const resposta=aberta?{texto:'Minha explicação.'}:{alternativaId:correta?'A':'B'};
 const estado=projetarEstado({sala:{codigo:'TEST01',modalidade,fase:'feedback',revelado:true,rodada:1,totalRodadas:1,revision:3,tempoSegundos:60,equipes:[]},conteudo:{questaoPublica:{id:q.id,tipo:q.tipo,enunciado:q.enunciado,...(!aberta?{alternativas:q.alternativas}:{})},segredo:{questao:q,respostaCorreta:q.respostaCorreta,explicacao:q.explicacao}},ator:{tipo:'aluno'},participante:p,participantes:[p],respostas:[{participanteId:p.id,pontos:p.pontos,resposta,rodada:1}],recibo:{rodadaId:'1',reciboId:'rec1',resposta,pontos:p.pontos},agora:1000});
 return derivarContextoAudiovisual(normalizarEstadoSala(estado),0,'aluno');
}
it.each(['quiz','equipes','tabuleiro'])('%s: acerto integral confirmado pelo servidor gera celebração de acerto',modalidade=>{
 expect(contexto(modalidade,true).situacao).toBe('acerto');
});
it.each(['quiz','equipes','tabuleiro'])('%s: erro respondido não é confundido com ausência de resposta',modalidade=>{
 expect(contexto(modalidade,false).situacao).toBe('erro');
});
it('Acerte aberto: resposta enviada aguardando professor mostra correção pendente',()=>{
 expect(contexto('acerte_perde',false,true).situacao).toBe('correcao_pendente');
});
