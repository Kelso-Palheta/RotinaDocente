/**
 * Texto único da instrução de acesso (RN-75).
 * A regra real é primeiro nome + DDMM; o segundo nome só entra como exceção de colisão.
 */
export const INSTRUCAO_ACESSO = 'Insira seu primeiro nome + dia e mês de nascimento (DDMM).';

export const EXEMPLO_ACESSO = 'Maria nascida em 15/03 → maria1503';

export const NOTA_COLISAO =
  'Se outro aluno tiver o mesmo nome e a mesma data, o sistema pode pedir o segundo nome como exceção.';
