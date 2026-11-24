import { falha, segmento } from '@/dominio/aula-gamificada/comum';
import { validarParaRevisao, validarResposta, facesDasCartas } from '@/dominio/aula-gamificada/questoes';
import { validarTipoModalidade } from '@/dominio/aula-gamificada/modalidades';
import { pontuarResposta, pontuarMemoria } from '@/dominio/aula-gamificada/pontuacao';
import { montarConteudo, projetarEstado, avaliarTentativaHerois, avaliarRodadaTabuleiro, inicializarTabuleiroEstado } from '@/dominio/aula-gamificada/sala';

const equipe = { id: 'treino', nome: 'Seu treino individual', participanteIds: ['eu'] };
const memoriaInicial = () => ({ viradas: [], encontrados: [], cartasVisiveis: [], tentativas: 0 });
export function criarSessaoJogos(dados) {
  const { questoes, modalidade, id } = dados;
  for (const q of questoes) { validarParaRevisao(q); validarTipoModalidade(modalidade, q.tipo); }
  return { ...dados, schema: 3, indice: 0, respostas: [], fase: 'jogando', revision: 1, memoria: memoriaInicial(), recibo: null,
    conteudos: questoes.map((q, indice) => montarConteudo(q, modalidade, { codigo: id, indice })),
    tabuleiroEstado: inicializarTabuleiroEstado([equipe]) };
}
export function resumoJogos(s) {
  return { id: s.id, schema: 3, modalidade: s.modalidade, professorId: s.professorId, turmaId: s.turmaId,
    disciplina: s.disciplina, conteudo: s.conteudo, dificuldade: s.dificuldade, fase: s.fase,
    progresso: s.respostas.length, total: s.questoes.length, acertos: s.respostas.filter(r => r.correta).length,
    erros: s.respostas.filter(r => !r.correta).length, pontosJogo: s.respostas.reduce((n,r) => n + r.pontos, 0),
    tentativas: s.respostas.reduce((n,r) => n + (r.tentativas || 1), 0), atualizadoEmMs: s.atualizadoEmMs };
}
export function projetarJogos(s) {
  const resumo = resumoJogos(s);
  const encerrada = s.fase === 'concluida';
  const fase = encerrada ? 'encerrada' : s.fase === 'feedback' ? 'feedback' : 'pergunta';
  const participante = { id: 'eu', nomeExibicao: 'Você', equipeId: 'treino', pontos: resumo.pontosJogo };
  const sala = { codigo: s.id, titulo: `${s.conteudo} · treino individual`, modalidade: s.modalidade, fase,
    rodada: s.indice + 1, totalRodadas: s.questoes.length, revision: s.revision, revelado: fase !== 'pergunta',
    finalidade: 'revisao', formatoParticipacao: 'individual', equipes: [equipe], semCronometro: true,
    tempoSegundos: 0, encerraEmMs: Number.MAX_SAFE_INTEGER, tabuleiroEstado: s.tabuleiroEstado };
  const conteudo = s.conteudos[s.indice];
  const estado = projetarEstado({ sala, conteudo, ator: { tipo: 'aluno' }, participante, participantes: [participante],
    respostas: s.recibo ? [{ ...s.recibo, participanteId: 'eu', rodada: s.indice + 1 }] : [], recibo: s.recibo,
    agora: s.atualizadoEmMs });
  // O treino é sem cronômetro, sem presença de colegas fictícios e sem comando docente.
  estado.prazo = null;
  estado.semCronometro = true;
  if (s.modalidade === 'natacao') estado.natacaoEstado = { raias: [{ id: 'treino', nome: 'Você', progresso: resumo.acertos }], totalTrechos: s.questoes.length, vencedoresIds: encerrada && resumo.acertos === s.questoes.length ? ['treino'] : [] };
  const resposta = s.fase === 'feedback' ? s.respostas[s.respostas.length - 1] : null;
  return { ...resumo, revision: s.revision, indice: s.indice, estadoJogo: estado,
    questao: encerrada ? null : estado.rodada.questao,
    feedback: resposta ? { correta: resposta.correta, pontos: resposta.pontos, respostaCorreta: conteudo.segredo.respostaCorreta, explicacao: conteudo.segredo.explicacao } : null };
}
function virarMemoria(s, resposta, agora) {
  const q = s.questoes[s.indice];
  const virarId = segmento(resposta?.virarId, { max: 100 });
  const cartas = q.pares.flatMap(p => [p.esquerda.id, p.direita.id]);
  if (!cartas.includes(virarId)) throw falha(422, 'Esta carta não pertence ao desafio.');
  const m = structuredClone(s.memoria);
  const encontradas = q.pares.filter(p => m.encontrados.includes(p.id)).flatMap(p => [p.esquerda.id,p.direita.id]);
  if (encontradas.includes(virarId)) throw falha(409, 'Este par já foi encontrado.');
  const anterior = m.viradas[0];
  m.cartasVisiveis = anterior && anterior !== virarId ? [anterior,virarId] : [virarId];
  if (anterior && anterior !== virarId) {
    m.tentativas++;
    const par = q.pares.find(p => [p.esquerda.id,p.direita.id].includes(anterior) && [p.esquerda.id,p.direita.id].includes(virarId));
    if (par) m.encontrados.push(par.id);
    m.viradas = [];
  } else m.viradas = [virarId];
  const cartasEncontradas = q.pares.filter(p => m.encontrados.includes(p.id)).flatMap(p => [p.esquerda.id,p.direita.id]);
  const completo = m.encontrados.length === q.pares.length;
  const pontos = pontuarMemoria(q, m.encontrados);
  const recibo = { virarId, viradas: m.viradas, encontrados: m.encontrados, cartasVisiveis: m.cartasVisiveis, cartasReveladas: m.cartasVisiveis,
    cartasEncontradas, facesVisiveis: facesDasCartas(q,m.cartasVisiveis), facesEncontradas: facesDasCartas(q,cartasEncontradas), completo, pontos, recebidoEmMs: agora };
  return { m, recibo, completo, pontos };
}
export function aplicarAcaoJogos(s, body, acao, agora) {
  if (!['responder','avancar'].includes(acao)) throw falha(409, 'Ação indisponível neste treino.');
  const nova = { ...s, revision: s.revision + 1, atualizadoEmMs: agora };
  if (acao === 'avancar') {
    if (s.fase !== 'feedback') throw falha(409, 'Conclua o desafio e leia o feedback antes de avançar.');
    if (s.indice + 1 >= s.questoes.length) nova.fase = 'concluida';
    else { nova.indice++; nova.fase = 'jogando'; nova.recibo = null; nova.memoria = memoriaInicial(); }
    return nova;
  }
  const q = s.questoes[s.indice];
  if (s.fase !== 'jogando' || body.questaoId !== q.id) throw falha(409, 'Este desafio não está aberto.');
  let resposta, pontos, tentativas = 1;
  if (s.modalidade === 'memoria') {
    const r = virarMemoria(s,body.resposta,agora);
    nova.memoria = r.m; nova.recibo = r.recibo;
    if (!r.completo) return nova;
    pontos = r.pontos; tentativas = r.m.tentativas; resposta = { pares: structuredClone(q.respostaCorreta) };
  } else {
    resposta = validarResposta(q,body.resposta);
    pontos = pontuarResposta(q,resposta);
    nova.recibo = { resposta, pontos, recebidoEmMs: agora };
    if (s.modalidade === 'herois') {
      const resultado = avaliarTentativaHerois({ sala: { fase:'pergunta', encerraEmMs:Number.MAX_SAFE_INTEGER }, registro:s.recibo, acertou:pontos===1000, agora });
      nova.recibo = { ...nova.recibo, ...resultado }; tentativas = resultado.tentativas;
      if (resultado.podeTentarNovamente) return nova;
    }
  }
  nova.recibo = { ...nova.recibo, rodadaId: String(s.indice+1), reciboId: `treino_${s.indice}_${nova.revision}` };
  nova.respostas = [...s.respostas,{ questaoId:q.id, resposta, pontos, correta:pontos===1000, tentativas, respondidoEmMs:agora }];
  nova.fase = 'feedback';
  if (s.modalidade === 'tabuleiro') nova.tabuleiroEstado = avaliarRodadaTabuleiro({ tabuleiroEstado:s.tabuleiroEstado, equipes:[equipe], rodada:s.indice+1, questao:q, respostasRodada:[{ equipeId:'treino', participanteId:'eu', pontos }] });
  return nova;
}
