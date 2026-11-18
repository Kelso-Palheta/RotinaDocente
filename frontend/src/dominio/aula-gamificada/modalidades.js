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
]);

const POR_ID = new Map(MODALIDADES.map((m) => [m.id, m]));

export function obterModalidade(id) {
  const modalidade = POR_ID.get(String(id ?? '').trim());
  if (!modalidade)
    throw falha(422, 'Escolha uma modalidade válida: quiz, memória, associação, ordenação ou equipes.');
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
  return 'Até 1000 pontos por desafio, proporcional às posições corretas na ordem.';
}

export const TIPOS_QUESTAO = Object.freeze(['multipla_escolha', 'pares', 'ordenacao']);
