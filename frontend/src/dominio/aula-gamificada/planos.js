import { falha, inteiroFaixa, listaObrigatoria, segmento, textoObrigatorio, textoOpcional } from './comum';
import { obterModalidade } from './modalidades';

const ids = (valor, campo, max) => {
  const lista = listaObrigatoria(valor ?? [], campo, { min: 0, max }).map(id => segmento(id, { campo, max: 60 }));
  if (new Set(lista).size !== lista.length) throw falha(422, `${campo} contém identificadores repetidos.`);
  return lista;
};

/** Contrato puro: campos não reconhecidos, snapshots e autoria enviados pelo cliente são descartados. */
export function normalizarPlano(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw falha(422, 'Informe o plano de aula.');
  const modalidade = obterModalidade(entrada.modalidade).id;
  const experiencia = entrada.experiencia ?? 'padrao';
  if (!['padrao', 'plataforma', 'resgate'].includes(experiencia) || (experiencia !== 'padrao' && modalidade !== 'quiz')) throw falha(422, 'Experiência de jogo incompatível com a modalidade do plano.');
  const duracaoMinutos = inteiroFaixa(entrada.duracaoMinutos, 'Duração da aula', { min: 10, max: 240 });
  const etapas = listaObrigatoria(entrada.etapas, 'Etapas', { min: 3, max: 10 }).map(etapa => {
    if (!etapa || typeof etapa !== 'object' || !['introducao', 'jogo', 'fechamento'].includes(etapa.tipo)) throw falha(422, 'Tipo de etapa inválido.');
    return {
      id: segmento(etapa.id, { campo: 'ID da etapa', max: 60 }),
      titulo: textoObrigatorio(etapa.titulo, 'título da etapa', { max: 120 }),
      minutos: inteiroFaixa(etapa.minutos, 'Tempo da etapa', { min: 1, max: 240 }),
      tipo: etapa.tipo,
      orientacao: textoOpcional(etapa.orientacao, 'Orientação da etapa', { max: 1000 }),
    };
  });
  if (new Set(etapas.map(e => e.id)).size !== etapas.length) throw falha(422, 'Etapas precisam de identificadores distintos.');
  if (!etapas.some(e => e.tipo === 'jogo')) throw falha(422, 'Inclua pelo menos uma etapa de jogo.');
  if (etapas.reduce((n, e) => n + e.minutos, 0) !== duracaoMinutos) throw falha(422, 'A soma dos tempos das etapas precisa ser igual à duração da aula.');
  const questaoIds = ids(entrada.questaoIds, 'Questões', 50);
  const jogos = etapas.filter(e => e.tipo === 'jogo');
  for (const etapa of etapas) etapa.questaoIds = [];
  questaoIds.forEach((id, i) => jogos[Math.min(jogos.length - 1, Math.floor(i * jogos.length / questaoIds.length))].questaoIds.push(id));
  return {
    ...(entrada.id != null ? { id: segmento(entrada.id, { campo: 'ID do plano', max: 80 }) } : {}),
    titulo: textoObrigatorio(entrada.titulo, 'título do plano', { max: 160 }),
    disciplina: textoObrigatorio(entrada.disciplina, 'disciplina', { max: 100 }),
    anoEscolar: textoObrigatorio(entrada.anoEscolar, 'série/ano escolar', { max: 80 }),
    conteudo: textoObrigatorio(entrada.conteudo, 'conteúdo', { max: 160 }),
    objetivo: textoObrigatorio(entrada.objetivo, 'objetivo de aprendizagem', { max: 1500 }),
    duracaoMinutos, modalidade, experiencia, turmaIds: ids(entrada.turmaIds, 'Turmas', 30), questaoIds, etapas,
  };
}

export function resumoPlano(plano) {
  const { id, revision, titulo, disciplina, anoEscolar, conteudo, duracaoMinutos, modalidade, experiencia, atualizadoEmMs } = plano;
  return { id, revision, titulo, disciplina, anoEscolar, conteudo, duracaoMinutos, modalidade, experiencia, atualizadoEmMs, quantidadeQuestoes: plano.questaoIds.length };
}

export function snapshotPlano(plano) {
  const { id, revision, titulo, objetivo, etapas } = plano;
  return structuredClone({ id, revision, titulo, objetivo, etapas });
}

export function validarVinculoPlano(plano, config) {
  if (Number(config.planoRevision) !== plano.revision) throw falha(409, 'O plano mudou. Reabra o planejamento antes de preparar a partida.');
  if (plano.modalidade !== config.modalidade || plano.experiencia !== (config.experiencia || 'padrao') || JSON.stringify(plano.questaoIds) !== JSON.stringify(config.questaoIds)) {
    throw falha(409, 'Jogo ou questões diferem do plano salvo. Atualize o planejamento antes de preparar a partida.');
  }
  return snapshotPlano(plano);
}
