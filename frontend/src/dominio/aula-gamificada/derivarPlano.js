import { falha, inteiroFaixa, listaObrigatoria, segmento } from './comum';
import { ABRANGENCIA_DURACOES, abrangenciaDoPlano, normalizarPlano } from './planos';

const ROTULOS = { aula: 'aula', semanal: 'semana', quinzenal: 'quinzena', mensal: 'mês', bimestral: 'bimestre', sequencia: 'sequência', projeto: 'projeto' };

/**
 * Cria um plano de conteúdo a partir de um recorte do planejamento da disciplina.
 * Retorna dados novos; a fonte não é alterada e a identidade do derivado é do salvamento.
 */
export function criarPlanoDeConteudo(origem, opcoes = {}) {
  const fonte = normalizarPlano(origem);
  if (abrangenciaDoPlano(fonte) !== 'planejamento') throw falha(422, 'Escolha um planejamento da disciplina como origem.');
  const tipo = opcoes.tipoDestino ?? 'normal';
  if (!['normal', 'gamificado'].includes(tipo)) throw falha(422, 'Tipo do novo plano inválido.');
  const escala = opcoes.escalaDestino ?? 'aula';
  if (!ABRANGENCIA_DURACOES.conteudo.includes(escala)) throw falha(422, 'Duração incompatível com plano de conteúdo.');
  const pedidos = listaObrigatoria(opcoes.etapaIds, 'Etapas selecionadas', { min: 1, max: 24 }).map(id => segmento(id, { campo: 'Etapa selecionada', max: 60 }));
  if (new Set(pedidos).size !== pedidos.length) throw falha(422, 'Não repita etapas na derivação.');
  if (pedidos.some(id => !fonte.etapas.some(e => e.id === id))) throw falha(422, 'Uma das etapas não pertence ao planejamento de origem.');
  const aula = escala === 'aula';
  if (aula && pedidos.length > 10) throw falha(422, 'Para uma aula, selecione no máximo dez etapas.');
  const duracaoMinutos = aula ? inteiroFaixa(opcoes.duracaoMinutos ?? 50, 'Duração da aula', { min: 10, max: 240 }) : null;
  const selecionadas = fonte.etapas.filter(e => pedidos.includes(e.id));
  let etapas = selecionadas.map((e, i) => ({
    id: e.id,
    titulo: e.titulo,
    tipo: 'desenvolvimento',
    orientacao: e.orientacao,
    ...(e.curriculo ? { curriculo: structuredClone(e.curriculo) } : {}),
    ...(aula ? { minutos: 1 } : { prazo: e.prazo || `Etapa ${i + 1}` }),
  }));
  if (tipo === 'gamificado') etapas[0].tipo = 'jogo';
  if (aula) {
    const idLivre = base => { let id = base; while (etapas.some(e => e.id === id)) id += '_'; return id; };
    if (etapas.length < 3) etapas = [
      { id: idLivre('derivacao_abertura'), titulo: 'Abertura e contexto', tipo: 'introducao', minutos: 1, orientacao: 'Retome os objetivos e os conhecimentos prévios do planejamento de origem.' },
      ...etapas,
      { id: idLivre('derivacao_sintese'), titulo: 'Síntese e avaliação', tipo: 'fechamento', minutos: 1, orientacao: 'Recolha evidências de aprendizagem e retome o recorte trabalhado.' },
    ];
    const base = Math.floor(duracaoMinutos / etapas.length), resto = duracaoMinutos % etapas.length;
    etapas = etapas.map((e, i) => ({ ...e, minutos: base + (i < resto ? 1 : 0) }));
  }
  return normalizarPlano({
    titulo: `${fonte.titulo.slice(0, 140)} · ${ROTULOS[escala]}`,
    tipo, escala, abrangencia: 'conteudo',
    disciplina: fonte.disciplina, anoEscolar: fonte.anoEscolar,
    conteudo: selecionadas.map(e => e.curriculo?.conteudos).filter(Boolean).join('\n').trim() || fonte.conteudo,
    objetivo: selecionadas.map(e => e.curriculo?.objetivos).filter(Boolean).join('\n').trim() || fonte.objetivo,
    ...(fonte.anoLetivo != null ? { anoLetivo: fonte.anoLetivo } : {}),
    ...(fonte.contexto ? { contexto: structuredClone(fonte.contexto) } : {}),
    ...(fonte.modeloId ? { modeloId: fonte.modeloId } : {}),
    turmaIds: [...fonte.turmaIds], questaoIds: [], modalidade: tipo === 'gamificado' ? 'quiz' : null, experiencia: 'padrao',
    duracaoMinutos, etapas,
    origem: { planoId: origem.id, revision: origem.revision, etapaIds: selecionadas.map(e => e.id), finalidade: 'conteudo' },
  });
}
