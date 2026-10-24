export const CRITERIOS_PADRAO = Object.freeze({ simuladoMaxLanca: 5, simuladoMaxFinal: 5, atividadesMaxFinal: 5, mediaAprovacao: 5, mediaRecuperacao: 4.99 });

/** Não aceita coerção de texto parcial, exponenciais ou valores fora da escala. */
export function lerNumeroNota(valor, min = 0, max = 10) {
  if (valor === '') return '';
  if ((typeof valor !== 'number' && typeof valor !== 'string') || (typeof valor === 'string' && !/^\d+(?:[.,]\d+)?$/.test(valor.trim()))) throw new Error('Informe um número completo, usando ponto ou vírgula.');
  const numero = typeof valor === 'number' ? valor : Number(valor.trim().replace(',', '.'));
  if (!Number.isFinite(numero)) throw new Error('Informe um número finito.');
  if (numero < min || numero > max) throw new Error(`A nota deve estar entre ${min} e ${max}.`);
  return numero;
}

export function validarCriterios(config = {}) {
  const resultado = { ...CRITERIOS_PADRAO, ...config };
  for (const campo of Object.keys(CRITERIOS_PADRAO)) {
    resultado[campo] = lerNumeroNota(resultado[campo], 0, campo === 'simuladoMaxLanca' ? 1000 : 100);
    if (resultado[campo] === '') throw new Error('Preencha todos os critérios.');
  }
  if (resultado.simuladoMaxLanca <= 0) throw new Error('A escala de lançamento deve ser maior que zero.');
  const teto = resultado.simuladoMaxFinal + resultado.atividadesMaxFinal;
  if (teto <= 0) throw new Error('A soma dos pesos deve ser maior que zero.');
  if (resultado.mediaAprovacao > teto || resultado.mediaRecuperacao >= resultado.mediaAprovacao) throw new Error('A média deve respeitar o total máximo; a recuperação deve ser menor que a aprovação.');
  return { ...resultado, versaoCriterios: 1 };
}

/** Migração não interpreta diferenças como erro: personalizações são dados do professor. */
export function migrarCriteriosTurmas(turmas) {
  return turmas.map(turma => ({ ...turma, bimestres: Object.fromEntries(Object.entries(turma.bimestres || {}).map(([bimestre, dados]) => {
    const config = { ...(dados.config || {}) };
    for (const [campo, padrao] of Object.entries(CRITERIOS_PADRAO)) if (config[campo] === undefined || config[campo] === null) config[campo] = padrao;
    config.versaoCriterios = config.versaoCriterios ?? 1;
    return [bimestre, { ...dados, config }];
  })) }));
}

/** Colagem exige identificação por nome, nunca associação pela posição das linhas. */
export function prepararColagemSimulado(texto) {
  const linhas = String(texto || '').split(/\r?\n/).filter(linha => linha.trim());
  if (!linhas.length) throw new Error('Cole nome completo e nota, separados por tabulação ou ponto e vírgula.');
  return linhas.map((linha, index) => {
    const campos = linha.split(/\t|;/);
    if (campos.length !== 2 || !campos[0].trim() || !/[A-Za-zÀ-ÿ]/.test(campos[0])) throw new Error(`Linha ${index + 1}: informe nome completo e nota, separados por tabulação ou ponto e vírgula.`);
    return { nome: campos[0].trim(), nota: campos[1].trim() };
  });
}
