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

/**
 * Texto da alternativa marcada na devolutiva (RN-75).
 * Aceita `{ id, texto }`, o formato antigo `{ letra, texto }` e strings `"B) texto"`/`"B - texto"`.
 * Devolve `null` quando a alternativa não está disponível — a letra marcada continua sendo exibida.
 */
export function textoAlternativa(questao, resposta) {
  const alvo = String(resposta ?? '').trim().toUpperCase();
  if (!alvo) return null;
  const alternativas = Array.isArray(questao?.alternativas) ? questao.alternativas : [];

  for (let i = 0; i < alternativas.length; i += 1) {
    const alt = alternativas[i];
    if (!alt) continue;

    if (typeof alt === 'object') {
      const id = String(alt.id ?? alt.letra ?? '').trim().toUpperCase();
      const texto = String(alt.texto ?? '').trim();
      if (id === alvo && texto) return texto;
      continue;
    }

    if (typeof alt === 'string') {
      const texto = alt.trim();
      if (!texto) continue;
      const comLetra = texto.match(/^([A-Za-z])\s*[).\-:]\s*(.+)$/s);
      if (comLetra) {
        if (comLetra[1].toUpperCase() === alvo && comLetra[2].trim()) return comLetra[2].trim();
        continue;
      }
      if (String.fromCharCode(65 + i) === alvo) return texto;
    }
  }

  return null;
}
