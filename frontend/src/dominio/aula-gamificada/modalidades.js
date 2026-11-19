import { falha } from './comum';

/**
 * Modalidades funcionais da Aula Gamificada e os tipos de questão aceitos.
 * A compatibilidade é validada no servidor e repetida na interface.
 */
export const MODALIDADES = Object.freeze([
  { id: 'quiz', nome: 'Quiz', tiposQuestoes: ['multipla_escolha'] },
  { id: 'memoria', nome: 'Memória', tiposQuestoes: ['pares'] },
  { id: 'associacao', nome: 'Associação', tiposQuestoes: ['pares'] },
  { id: 'ordenacao', nome: 'Ordenação', tiposQuestoes: ['ordenacao'] },
  { id: 'equipes', nome: 'Equipes', tiposQuestoes: ['multipla_escolha'] },
  { id: 'herois', nome: 'Heróis', tiposQuestoes: ['multipla_escolha'] },
  { id: 'tabuleiro', nome: 'Tabuleiro', tiposQuestoes: ['multipla_escolha'] },
]);

const POR_ID = new Map(MODALIDADES.map((m) => [m.id, m]));

export function obterModalidade(id) {
  const modalidade = POR_ID.get(String(id ?? '').trim());
  if (!modalidade)
    throw falha(
      422,
      'Escolha uma modalidade válida: quiz, memória, associação, ordenação, equipes, heróis ou tabuleiro.',
    );
  return modalidade;
}

export function tiposDaModalidade(id) {
  return [...obterModalidade(id).tiposQuestoes];
}

export function validarTipoModalidade(modalidade, tipo) {
  const alvo = obterModalidade(modalidade);
  if (!alvo.tiposQuestoes.includes(tipo))
    throw falha(
      422,
      `A modalidade ${alvo.nome} não aceita questões do tipo ${tipo}. Use ${alvo.tiposQuestoes.join(' ou ')}.`,
    );
  return alvo;
}

export function regraPontuacao(modalidade) {
  const alvo = obterModalidade(modalidade);
  if (alvo.id === 'quiz')
    return 'Cada resposta correta vale 1000 pontos, sem bônus por tempo.';
  if (alvo.id === 'equipes')
    return 'Cada resposta correta vale 1000 pontos. A pontuação da equipe é a soma dos pontos dos participantes, sem bônus por tempo.';
  if (alvo.id === 'memoria')
    return 'Até 1000 pontos por desafio, proporcional aos pares encontrados antes do prazo. A pontuação é consolidada uma única vez.';
  if (alvo.id === 'associacao')
    return 'Até 1000 pontos por desafio, proporcional aos pares corretos.';
  if (alvo.id === 'herois')
    return 'Cada resposta correta vale 1000 pontos (até 2 tentativas dentro do prazo com Tente novamente), sem bônus por tempo.';
  if (alvo.id === 'tabuleiro')
    return 'Cada equipe avança casas até a Chegada (12 casas) conforme acertos na sua vez e soma 1000 pontos por resposta correta.';
  return 'Até 1000 pontos por desafio, proporcional às posições corretas na ordem.';
}

export const TIPOS_QUESTAO = Object.freeze(['multipla_escolha', 'pares', 'ordenacao']);

export const FORMATOS_PARTICIPACAO = Object.freeze(['individual', 'duelo', 'grupos']);
export const MODOS_RESPOSTA_GRUPO = Object.freeze(['individual', 'compartilhada']);

export const COMPATIBILIDADE_DISPUTA = Object.freeze({
  quiz: {
    formatos: ['individual', 'duelo', 'grupos'],
    modosGrupo: ['individual', 'compartilhada'],
    formatoPadrao: 'individual',
    capa: '/aula-gamificada/catalogo/quiz.svg',
    capaAlt: 'Ilustração de quiz ao vivo com alternativas e cronômetro',
  },
  memoria: {
    formatos: ['individual', 'duelo', 'grupos'],
    modosGrupo: ['individual', 'compartilhada'],
    formatoPadrao: 'individual',
    capa: '/aula-gamificada/catalogo/memoria.svg',
    capaAlt: 'Ilustração de cartas e estrelas do jogo de memória',
  },
  associacao: {
    formatos: ['individual', 'duelo', 'grupos'],
    modosGrupo: ['individual', 'compartilhada'],
    formatoPadrao: 'individual',
    capa: '/aula-gamificada/catalogo/associacao.svg',
    capaAlt: 'Ilustração de colunas conectadas por arcos luminosos',
  },
  ordenacao: {
    formatos: ['individual', 'duelo', 'grupos'],
    modosGrupo: ['individual', 'compartilhada'],
    formatoPadrao: 'individual',
    capa: '/aula-gamificada/catalogo/ordenacao.svg',
    capaAlt: 'Ilustração de blocos em sequência crescente',
  },
  equipes: {
    formatos: ['grupos'],
    modosGrupo: ['individual', 'compartilhada'],
    formatoPadrao: 'grupos',
    capa: '/aula-gamificada/catalogo/equipes.svg',
    capaAlt: 'Ilustração de arena cooperativa com grupos e troféu',
  },
  herois: {
    formatos: ['individual', 'duelo', 'grupos'],
    modosGrupo: ['individual', 'compartilhada'],
    formatoPadrao: 'individual',
    capa: '/aula-gamificada/catalogo/herois.svg',
    capaAlt: 'Ilustração em quadrinhos com escudo e raio dos Heróis',
  },
  tabuleiro: {
    formatos: ['duelo', 'grupos'],
    modosGrupo: ['individual', 'compartilhada'],
    formatoPadrao: 'grupos',
    minGrupos: 2,
    maxGrupos: 4,
    capa: '/aula-gamificada/catalogo/tabuleiro.svg',
    capaAlt: 'Ilustração de trilha de blocos com peões e bandeira de chegada',
  },
});

export function compatibilidadeModalidade(id) {
  const alvo = obterModalidade(id);
  return COMPATIBILIDADE_DISPUTA[alvo.id];
}

export function formatosDaModalidade(id) {
  return [...compatibilidadeModalidade(id).formatos];
}

export function validarFormatoParticipacao({
  modalidade,
  formatoParticipacao,
  modoRespostaGrupo,
} = {}) {
  const alvo = obterModalidade(modalidade);
  const comp = COMPATIBILIDADE_DISPUTA[alvo.id];
  const formato = formatoParticipacao
    ? String(formatoParticipacao).trim()
    : comp.formatoPadrao;
  if (!comp.formatos.includes(formato)) {
    throw falha(
      422,
      `A modalidade ${alvo.nome} não é compatível com o formato ${formato}. Permitido: ${comp.formatos.join(', ')}.`,
    );
  }
  let modoGrupo = null;
  if (formato === 'grupos') {
    modoGrupo = modoRespostaGrupo ? String(modoRespostaGrupo).trim() : 'individual';
    if (!comp.modosGrupo.includes(modoGrupo)) {
      throw falha(
        422,
        `Modo de resposta de grupo inválido (${modoGrupo}). Use individual ou compartilhada.`,
      );
    }
  }
  return { formatoParticipacao: formato, modoRespostaGrupo: modoGrupo, compatibilidade: comp };
}
