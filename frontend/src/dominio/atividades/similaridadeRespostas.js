/**
 * Detecção de respostas parecidas (RN-78).
 *
 * Compara shingles de 3 palavras sobre texto normalizado. Diferente do Jaccard
 * de palavras únicas usado antes, esta medida é sensível à ordem: o mesmo
 * vocabulário embaralhado não vira suspeita de cópia. O resultado é apenas
 * alerta; nenhuma nota é calculada ou alterada aqui.
 */
const TAMANHO_SHINGLE = 3;
const LIMITE_SEMELHANCA = 0.7;
const MINIMO_CARACTERES = 20;

export function normalizarResposta(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function shinglesResposta(texto, tamanho = TAMANHO_SHINGLE) {
  const palavras = normalizarResposta(texto).split(' ').filter(palavra => palavra.length > 2);
  if (!palavras.length) return new Set();
  if (palavras.length < tamanho) return new Set([palavras.join(' ')]);
  const conjunto = new Set();
  for (let i = 0; i + tamanho <= palavras.length; i++) {
    conjunto.add(palavras.slice(i, i + tamanho).join(' '));
  }
  return conjunto;
}

export function semelhancaRespostas(a, b, { tamanho = TAMANHO_SHINGLE } = {}) {
  const shinglesA = shinglesResposta(a, tamanho);
  const shinglesB = shinglesResposta(b, tamanho);
  if (!shinglesA.size || !shinglesB.size) return 0;
  let intersecao = 0;
  for (const shingle of shinglesA) if (shinglesB.has(shingle)) intersecao++;
  const uniao = shinglesA.size + shinglesB.size - intersecao;
  return uniao > 0 ? intersecao / uniao : 0;
}

/** Texto do aluno usado na comparação, preservando a grafia original. */
export function textoComparavel(entrega) {
  const respostas = entrega?.respostas;
  if (respostas && typeof respostas === 'object') {
    const textos = Object.values(respostas)
      .map(valor => (typeof valor === 'string' ? valor : valor?.resposta))
      .filter(texto => typeof texto === 'string' && texto.trim())
      .map(texto => texto.trim());
    if (textos.length) return textos.join(' ');
  }
  return typeof entrega?.respostaTexto === 'string' ? entrega.respostaTexto.trim() : '';
}

function agrupar(comparaveis, limite, tamanho) {
  const pais = comparaveis.map((_, indice) => indice);
  const encontrar = indice => {
    let raiz = indice;
    while (pais[raiz] !== raiz) raiz = pais[raiz];
    while (pais[indice] !== raiz) { const proximo = pais[indice]; pais[indice] = raiz; indice = proximo; }
    return raiz;
  };
  const unir = (a, b) => {
    const raizA = encontrar(a);
    const raizB = encontrar(b);
    if (raizA !== raizB) pais[raizB] = raizA;
  };

  const pares = [];
  for (let i = 0; i < comparaveis.length; i++) {
    for (let j = i + 1; j < comparaveis.length; j++) {
      const similaridade = semelhancaRespostas(comparaveis[i].texto, comparaveis[j].texto, { tamanho });
      pares.push({ i, j, similaridade });
      if (similaridade > limite) unir(i, j);
    }
  }

  const membros = new Map();
  comparaveis.forEach((item, indice) => {
    const raiz = encontrar(indice);
    if (!membros.has(raiz)) membros.set(raiz, []);
    membros.get(raiz).push(indice);
  });

  return [...membros.values()].filter(indices => indices.length >= 2).map(indices => {
    const dentro = new Set(indices);
    return {
      alunos: indices.map(indice => {
        const { entrega, texto } = comparaveis[indice];
        return {
          alunoId: entrega.alunoId,
          turmaId: entrega.turmaId ?? null,
          entregaId: entrega.id ?? null,
          texto,
        };
      }),
      pares: pares
        .filter(par => dentro.has(par.i) && dentro.has(par.j))
        .map(par => ({
          a: comparaveis[par.i].entrega.alunoId,
          b: comparaveis[par.j].entrega.alunoId,
          similaridade: par.similaridade,
        }))
        .sort((x, y) => y.similaridade - x.similaridade),
      indices,
    };
  });
}

export function detectarRespostasSimilares(entregas = [], {
  limite = LIMITE_SEMELHANCA,
  tamanho = TAMANHO_SHINGLE,
} = {}) {
  const comparaveis = (entregas || [])
    .map(entrega => ({ entrega, texto: textoComparavel(entrega) }))
    .filter(item => item.texto.length > MINIMO_CARACTERES);

  if (comparaveis.length < 2) return { clusters: [], grupos: [], penalizados: new Set() };

  const gruposBrutos = agrupar(comparaveis, limite, tamanho);
  const grupos = gruposBrutos.map(grupo => {
    const valores = grupo.pares.map(par => par.similaridade);
    return {
      alunos: grupo.alunos,
      pares: grupo.pares,
      similaridadeMaxima: valores.length ? Math.max(...valores) : 0,
      similaridadeMinima: valores.length ? Math.min(...valores) : 0,
    };
  }).sort((a, b) => b.similaridadeMaxima - a.similaridadeMaxima);

  const clusters = gruposBrutos.map(grupo => grupo.indices.map(indice => comparaveis[indice].entrega));

  const penalizados = new Set();
  for (const grupo of grupos) for (const aluno of grupo.alunos) penalizados.add(aluno.alunoId);

  return { clusters, grupos, penalizados };
}
