/**
 * Devolutiva do aluno (RN-75): objetiva e múltipla escolha compartilham a mesma apresentação.
 * A normalização ignora acentos, caixa e separadores para não depender da grafia gravada.
 */
const normalizar = (tipo) =>
  String(tipo ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');

const TIPOS_OBJETIVOS = new Set(['objetiva', 'multiplaescolha']);

export const ehQuestaoObjetiva = (tipo) => TIPOS_OBJETIVOS.has(normalizar(tipo));

export const rotuloAcerto = (correto) => (correto ? 'Correta' : 'Incorreta');
