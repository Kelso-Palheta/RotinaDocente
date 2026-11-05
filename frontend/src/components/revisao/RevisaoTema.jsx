import styles from './revisaoTema.module.css';

/**
 * Tokens do Tema Vibrante: Festival de Arte + Game Show
 * Baseado na especificação specs/REVISAO_VISUAL_VIBRANTE_SPEC.md
 */
export const TOKENS_REVISAO_VIBRANTE = {
  palco: '#25104A',
  destaque: '#6334E3',
  leitura: '#FFFDF7',
  textoEscuro: '#25104A',
  acentos: {
    amarelo: '#FFE14D',
    ciano: '#00DDEB',
    coral: '#FF4F9B',
    lima: '#B7F247',
    laranja: '#FF8A3D',
  },
};

/**
 * Cores temáticas para as alternativas A, B, C, D e E.
 * O texto sobre os acentos claros (amarelo, ciano, lima, coral, laranja)
 * é sempre o texto escuro '#25104A' para garantir contraste >= 4.5:1 (WCAG AA).
 */
export const CORES_ALTERNATIVAS = {
  A: {
    bg: '#FF4F9B', // Coral
    text: '#25104A',
    border: '#FF80B6',
    label: 'Coral',
    classeTailwind: 'bg-[#FF4F9B] text-[#25104A] border-[#FF80B6]',
  },
  B: {
    bg: '#00DDEB', // Ciano
    text: '#25104A',
    border: '#54EEF8',
    label: 'Ciano',
    classeTailwind: 'bg-[#00DDEB] text-[#25104A] border-[#54EEF8]',
  },
  C: {
    bg: '#FFE14D', // Amarelo
    text: '#25104A',
    border: '#FFF085',
    label: 'Amarelo',
    classeTailwind: 'bg-[#FFE14D] text-[#25104A] border-[#FFF085]',
  },
  D: {
    bg: '#B7F247', // Lima
    text: '#25104A',
    border: '#D0F87E',
    label: 'Lima',
    classeTailwind: 'bg-[#B7F247] text-[#25104A] border-[#D0F87E]',
  },
  E: {
    bg: '#FF8A3D', // Laranja
    text: '#25104A',
    border: '#FFAA70',
    label: 'Laranja',
    classeTailwind: 'bg-[#FF8A3D] text-[#25104A] border-[#FFAA70]',
  },
};

/**
 * Pares semânticos para auditoria formal de contraste WCAG AA (>= 4.5:1)
 */
export const PARES_CONTRASTE_TEXTO = [
  { nome: 'Palco Escuro com Texto Claro', fundo: '#25104A', texto: '#FFFDF7' },
  { nome: 'Superfície de Leitura com Texto Escuro', fundo: '#FFFDF7', texto: '#25104A' },
  { nome: 'Destaque Violeta com Texto Claro', fundo: '#6334E3', texto: '#FFFDF7' },
  { nome: 'Badge A (Coral) com Texto Escuro', fundo: '#FF4F9B', texto: '#25104A' },
  { nome: 'Badge B (Ciano) com Texto Escuro', fundo: '#00DDEB', texto: '#25104A' },
  { nome: 'Badge C (Amarelo) com Texto Escuro', fundo: '#FFE14D', texto: '#25104A' },
  { nome: 'Badge D (Lima) com Texto Escuro', fundo: '#B7F247', texto: '#25104A' },
  { nome: 'Badge E (Laranja) com Texto Escuro', fundo: '#FF8A3D', texto: '#25104A' },
];

/**
 * Cálculo da luminância relativa conforme fórmula oficial WCAG 2.1
 */
export function calcularLuminancia(hex) {
  const normalizado = hex.replace('#', '').trim();
  const rgb = normalizado.match(/.{2}/g).map((c) => parseInt(c, 16) / 255);
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Cálculo da taxa de contraste entre duas cores hexadecimais
 */
export function calcularTaxaContraste(cor1, cor2) {
  const l1 = calcularLuminancia(cor1);
  const l2 = calcularLuminancia(cor2);
  const maisClaro = Math.max(l1, l2);
  const maisEscuro = Math.min(l1, l2);
  return (maisClaro + 0.05) / (maisEscuro + 0.05);
}

export { styles as temaStyles };
