import { falha, inteiroFaixa, listaObrigatoria, segmento } from './comum';
import { normalizarPlano, ABRANGENCIA_DURACOES, abrangenciaDaEscala } from './planos';

/** Cria dados novos. Nenhuma identidade ou timestamp da fonte pertence à cópia. */
export function criarVersaoGamificada(origem, opcoes = {}) {
  if (origem?.tipo !== 'normal') throw falha(422, 'Escolha um planejamento regular salvo.');
  const fonte = normalizarPlano(origem);
  const planoId = segmento(origem.id, { campo: 'Plano de origem', max: 80 });
  const revision = inteiroFaixa(origem.revision, 'Versão do plano de origem', { min: 1, max: Number.MAX_SAFE_INTEGER });
  const pedidos = listaObrigatoria(opcoes.etapaIds, 'Etapas selecionadas', { min: 1, max: 24 }).map(id => segmento(id, { campo: 'Etapa selecionada', max: 60 }));
  if (new Set(pedidos).size !== pedidos.length) throw falha(422, 'Não repita etapas na adaptação.');
  if (pedidos.some(id => !fonte.etapas.some(e => e.id === id))) throw falha(422, 'Uma das etapas não pertence ao planejamento de origem.');
  const escala = opcoes.escalaDestino ?? fonte.escala ?? 'aula';
  const aula = escala === 'aula';
  if (aula && pedidos.length > 10) throw falha(422, 'Para uma aula, selecione no máximo dez etapas.');
  const selecionadas = fonte.etapas.filter(e => pedidos.includes(e.id));
  const etapaIds = selecionadas.map(e => e.id);
  let etapas = selecionadas.map(e => ({ ...structuredClone(e), tipo: e.tipo === 'desenvolvimento' ? 'jogo' : e.tipo }));
  if (!etapas.some(e => e.tipo === 'jogo')) etapas[0].tipo = 'jogo';
  const duracaoMinutos = aula ? inteiroFaixa(opcoes.duracaoMinutos ?? fonte.duracaoMinutos ?? 50, 'Duração da aula gamificada', { min: 10, max: 240 }) : null;
  if (aula && etapas.length < 3) {
    const idLivre = base => { let id = base; while (etapas.some(e => e.id === id)) id += '_'; return id; };
    etapas = [
      { id: idLivre('adaptacao_abertura'), titulo: 'Contextualizar o desafio', tipo: 'introducao', minutos: 5, orientacao: 'Retome os objetivos e conhecimentos prévios do planejamento de origem.' },
      ...etapas,
      { id: idLivre('adaptacao_sintese'), titulo: 'Síntese e devolutiva', tipo: 'fechamento', minutos: 5, orientacao: 'Compare as decisões com o feedback e retome os objetivos de aprendizagem.' },
    ];
  }
  const soma = etapas.reduce((n, e) => n + (Number(e.minutos) || 0), 0);
  const preservarMinutos = soma === duracaoMinutos && etapas.every(e => Number.isInteger(e.minutos) && e.minutos >= 1);
  etapas = etapas.map((e, i) => {
    if (!aula) return { ...e, minutos: null, prazo: e.prazo || `Etapa ${i + 1}` };
    const semPrazo = { ...e };
    delete semPrazo.prazo;
    const minutos = preservarMinutos ? e.minutos : Math.floor(duracaoMinutos / etapas.length) + (i < duracaoMinutos % etapas.length ? 1 : 0);
    return { ...semPrazo, minutos };
  });
  return normalizarPlano({
    titulo: `${fonte.titulo.slice(0, 140)} · gamificado`,
    tipo: 'gamificado', escala,
    ...(fonte.abrangencia ? { abrangencia: ABRANGENCIA_DURACOES[fonte.abrangencia].includes(escala) ? fonte.abrangencia : abrangenciaDaEscala(escala) } : {}),
    disciplina: fonte.disciplina, anoEscolar: fonte.anoEscolar, conteudo: fonte.conteudo, objetivo: fonte.objetivo,
    ...(fonte.anoLetivo != null ? { anoLetivo: fonte.anoLetivo } : {}),
    ...(fonte.contexto ? { contexto: structuredClone(fonte.contexto) } : {}),
    ...(fonte.modeloId ? { modeloId: fonte.modeloId } : {}),
    turmaIds: [...fonte.turmaIds], questaoIds: [], modalidade: 'quiz', experiencia: 'padrao',
    duracaoMinutos, etapas,
    origem: { planoId, revision, etapaIds },
  });
}
