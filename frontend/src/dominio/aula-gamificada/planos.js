import { falha, inteiroFaixa, listaObrigatoria, segmento, textoObrigatorio, textoOpcional } from './comum';
import { obterModalidade } from './modalidades';

const ids = (valor, campo, max) => {
  const lista = listaObrigatoria(valor ?? [], campo, { min: 0, max }).map(id => segmento(id, { campo, max: 60 }));
  if (new Set(lista).size !== lista.length) throw falha(422, `${campo} contém identificadores repetidos.`);
  return lista;
};
const ESCALAS = ['aula', 'semanal', 'bimestral', 'semestral', 'anual', 'sequencia', 'projeto'];
const CAMPOS_CONTEXTO = ['conhecimentosPrevios', 'recursos', 'apoios', 'avaliacao', 'habilidadesBNCC', 'publico', 'cargaHoraria'];
function contextoPedagogico(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw falha(422, 'Contexto pedagógico inválido.');
  return Object.fromEntries(CAMPOS_CONTEXTO.map(campo => [campo, textoOpcional(entrada[campo], campo, { max: 1500 })]));
}

/** Contrato puro: campos não reconhecidos, snapshots e autoria enviados pelo cliente são descartados. */
export function normalizarPlano(entrada) {
  if (!entrada || typeof entrada !== 'object' || Array.isArray(entrada)) throw falha(422, 'Informe o plano de aula.');
  const tipo = entrada.tipo ?? 'gamificado';
  const escala = entrada.escala ?? 'aula';
  if (!['normal', 'gamificado'].includes(tipo)) throw falha(422, 'Tipo de planejamento inválido.');
  if (!ESCALAS.includes(escala)) throw falha(422, 'Período do planejamento inválido.');
  const regular = tipo === 'normal';
  const aula = escala === 'aula';
  const modalidade = regular ? null : obterModalidade(entrada.modalidade).id;
  const experiencia = regular ? 'padrao' : entrada.experiencia ?? 'padrao';
  if (!['padrao', 'plataforma', 'resgate'].includes(experiencia) || (experiencia !== 'padrao' && modalidade !== 'quiz')) throw falha(422, 'Experiência de jogo incompatível com a modalidade do plano.');
  const duracaoMinutos = aula ? inteiroFaixa(entrada.duracaoMinutos, 'Duração da aula', { min: 10, max: 240 }) : null;
  const etapas = listaObrigatoria(entrada.etapas, 'Etapas', { min: !regular && aula ? 3 : 1, max: !regular && aula ? 10 : 24 }).map(etapa => {
    if (!etapa || typeof etapa !== 'object' || !['introducao', 'desenvolvimento', 'jogo', 'fechamento'].includes(etapa.tipo)) throw falha(422, 'Tipo de etapa inválido.');
    if (regular && etapa.tipo === 'jogo') throw falha(422, 'Planejamento regular usa etapas de desenvolvimento, sem exigir jogo.');
    return {
      id: segmento(etapa.id, { campo: 'ID da etapa', max: 60 }),
      titulo: textoObrigatorio(etapa.titulo, 'título da etapa', { max: 120 }),
      minutos: aula ? inteiroFaixa(etapa.minutos, 'Tempo da etapa', { min: 1, max: 240 }) : null,
      ...(!aula ? { prazo: textoObrigatorio(etapa.prazo, 'período da etapa', { max: 120 }) } : {}),
      tipo: etapa.tipo,
      orientacao: textoOpcional(etapa.orientacao, 'Orientação da etapa', { max: 1000 }),
    };
  });
  if (new Set(etapas.map(e => e.id)).size !== etapas.length) throw falha(422, 'Etapas precisam de identificadores distintos.');
  if (!regular && !etapas.some(e => e.tipo === 'jogo')) throw falha(422, 'Inclua pelo menos uma etapa de jogo.');
  if (aula && etapas.reduce((n, e) => n + e.minutos, 0) !== duracaoMinutos) throw falha(422, 'A soma dos tempos das etapas precisa ser igual à duração da aula.');
  const questaoIds = regular ? [] : ids(entrada.questaoIds, 'Questões', 50);
  const jogos = etapas.filter(e => e.tipo === 'jogo');
  for (const etapa of etapas) etapa.questaoIds = [];
  questaoIds.forEach((id, i) => jogos[Math.min(jogos.length - 1, Math.floor(i * jogos.length / questaoIds.length))].questaoIds.push(id));
  return {
    ...(entrada.id != null ? { id: segmento(entrada.id, { campo: 'ID do plano', max: 80 }) } : {}),
    ...(entrada.tipo != null ? { tipo } : {}),
    ...(entrada.escala != null ? { escala } : {}),
    ...(entrada.anoLetivo != null ? { anoLetivo: inteiroFaixa(entrada.anoLetivo, 'Ano letivo', { min: 2000, max: 2100 }) } : {}),
    ...(entrada.modeloId != null ? { modeloId: segmento(entrada.modeloId, { campo: 'Modelo de planejamento', max: 80 }) } : {}),
    ...(entrada.contexto != null ? { contexto: contextoPedagogico(entrada.contexto) } : {}),
    titulo: textoObrigatorio(entrada.titulo, 'título do plano', { max: 160 }),
    disciplina: textoObrigatorio(entrada.disciplina, 'disciplina', { max: 100 }),
    anoEscolar: textoObrigatorio(entrada.anoEscolar, 'série/ano escolar', { max: 80 }),
    conteudo: textoObrigatorio(entrada.conteudo, 'conteúdo', { max: regular && !aula ? 3000 : 160 }),
    objetivo: textoObrigatorio(entrada.objetivo, 'objetivo de aprendizagem', { max: regular && !aula ? 3000 : 1500 }),
    duracaoMinutos, modalidade, experiencia, turmaIds: ids(entrada.turmaIds, 'Turmas', 30), questaoIds, etapas,
  };
}

export function resumoPlano(plano) {
  const { id, revision, titulo, disciplina, anoEscolar, conteudo, duracaoMinutos, modalidade, experiencia, atualizadoEmMs } = plano;
  return { id, revision, titulo, disciplina, anoEscolar, conteudo, duracaoMinutos, modalidade, experiencia, atualizadoEmMs,
    ...(plano.tipo != null ? { tipo: plano.tipo } : {}),
    ...(plano.escala != null ? { escala: plano.escala } : {}),
    ...(plano.anoLetivo != null ? { anoLetivo: plano.anoLetivo } : {}),
    quantidadeQuestoes: plano.questaoIds.length };
}

export function snapshotPlano(plano) {
  const { id, revision, titulo, objetivo, etapas } = plano;
  return structuredClone({ id, revision, titulo, objetivo, etapas });
}

export function validarVinculoPlano(plano, config) {
  if (plano.tipo === 'normal') throw falha(422, 'Planejamento regular não cria jogo. Use um planejamento gamificado ou crie uma atividade avulsa.');
  if (Number(config.planoRevision) !== plano.revision) throw falha(409, 'O plano mudou. Reabra o planejamento antes de preparar a partida.');
  if (plano.modalidade !== config.modalidade || plano.experiencia !== (config.experiencia || 'padrao') || JSON.stringify(plano.questaoIds) !== JSON.stringify(config.questaoIds)) {
    throw falha(409, 'Jogo ou questões diferem do plano salvo. Atualize o planejamento antes de preparar a partida.');
  }
  return snapshotPlano(plano);
}
