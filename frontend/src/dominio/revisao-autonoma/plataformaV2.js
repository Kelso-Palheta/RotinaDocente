/**
 * Aventura do Conhecimento V2 — percurso extenso e regras de configuração (domínio puro).
 * Posições físicas são apresentação: nada aqui altera acertos, pontos ou notas.
 */
export const PONTOS_ACERTO = 100;
export const MAX_QUESTOES_V2 = 24;
export const MAX_FASES_V2 = 6;
export const MAX_ESTRELAS_POR_FASE = 3;

/** Opções válidas para N questões liberadas. Nunca exige mais do que o disponível. */
export function opcoesConfiguracao(disponivel) {
  const n = Math.max(0, Math.floor(Number(disponivel) || 0));
  if (n === 0) return { disponivel: n, opcoes: [], sugerida: null };
  if (n === 1) {
    const unica = { fases: 1, estrelasPorFase: 0, necessarias: 1 };
    return { disponivel: n, opcoes: [unica], sugerida: unica };
  }
  const opcoes = [];
  for (let fases = 1; fases <= MAX_FASES_V2; fases++) {
    for (let estrelasPorFase = 1; estrelasPorFase <= MAX_ESTRELAS_POR_FASE; estrelasPorFase++) {
      const necessarias = fases * (estrelasPorFase + 1);
      if (necessarias <= Math.min(n, MAX_QUESTOES_V2)) opcoes.push({ fases, estrelasPorFase, necessarias });
    }
  }
  const sugerida = [...opcoes].sort((a, b) => b.necessarias - a.necessarias || b.estrelasPorFase - a.estrelasPorFase || b.fases - a.fases)[0] || null;
  return { disponivel: n, opcoes, sugerida };
}

export function configuracaoValida(disponivel, fases, estrelasPorFase) {
  if (!Number.isInteger(fases) || !Number.isInteger(estrelasPorFase)) return false;
  return opcoesConfiguracao(disponivel).opcoes.some((o) => o.fases === fases && o.estrelasPorFase === estrelasPorFase);
}

/** Questões por fase para reforço de `n` erros (cada fase tem portal + estrelas = questões-1). */
export function distribuirReforco(n) {
  const total = Math.max(1, Math.min(MAX_QUESTOES_V2, Math.floor(n)));
  const fases = Math.min(MAX_FASES_V2, Math.ceil(total / 4));
  const base = Math.floor(total / fases);
  const resto = total % fases;
  return Array.from({ length: fases }, (_, i) => base + (i < resto ? 1 : 0));
}

const LARGURA = 5700;
const CHAO = 420;
const AREA = 1100;

export const AREAS_V2 = [
  { nome: 'Clareira de Cristal', cores: ['#150D35', '#5330A4', '#00DDEB'], decor: 'cristais' },
  { nome: 'Cavernas Luminosas', cores: ['#052F37', '#086D77', '#B9EF00'], decor: 'cavernas' },
  { nome: 'Ponte dos Ventos', cores: ['#1B1B52', '#3B5BC9', '#FFE500'], decor: 'vento' },
  { nome: 'Cidadela das Ideias', cores: ['#31104B', '#8D2887', '#FFE500'], decor: 'cidadela' },
  { nome: 'Observatório Final', cores: ['#0A1230', '#1F3F88', '#FF2C9C'], decor: 'estrelas' },
];

// plataformas relativas ao início de cada área: [x, y, largura]; espinhos: x relativo
const PADROES = [
  { plat: [[380, 345, 190], [660, 290, 180], [920, 345, 160]], espinhos: [150, 520], estrelaEm: 0 },
  { plat: [[330, 345, 170], [580, 290, 170], [830, 240, 150], [1010, 300, 80]], espinhos: [140, 480], estrelaEm: 1 },
  { plat: [[300, 345, 200], [610, 300, 160], [870, 345, 170]], espinhos: [130, 470, 1040], estrelaEm: 2 },
  { plat: [[350, 345, 180], [620, 285, 170], [880, 335, 150]], espinhos: [140, 540], estrelaEm: 1 },
  { plat: [[330, 345, 190], [610, 290, 180]], espinhos: [150, 980], estrelaEm: 0 },
];
const SLOTS_ESTRELAS = { 1: [2], 2: [1, 3], 3: [0, 2, 4] };
const SLOTS_NOVOS = { 1: [0], 2: [0, 2], 3: [0, 2, 4] };

/** Percurso V2 (≈5.700 px) com `estrelas` estrelas-desafio distribuídas entre as áreas. */
export function criarMundoV2(fase = 1, estrelas = 3, layoutVersao = 3) {
  const desloc = (fase % 3) * 10;
  const plataformas = [];
  const obstaculos = [];
  const candidatas = [];
  PADROES.forEach((original, k) => {
    const padrao = layoutVersao === 3 && fase > 3 ? PADROES[(k + 1) % PADROES.length] : original;
    const b = k * AREA;
    padrao.plat.forEach(([x, y, w], i) => {
      const yy = y < 345 ? y - desloc : y;
      plataformas.push({ x: b + x, y: yy, w, h: 28, area: k });
      if (i === (layoutVersao === 3 ? 0 : padrao.estrelaEm)) candidatas[k] = { x: b + x + w / 2, y: yy - 45, area: k };
    });
    padrao.espinhos.forEach((x) => obstaculos.push({ x: b + x, y: CHAO - 26, w: x % 2 ? 46 : 44, h: 26 }));
  });
  const n = Math.max(0, Math.min(MAX_ESTRELAS_POR_FASE, Math.floor(estrelas)));
  const slots = (layoutVersao === 3 ? SLOTS_NOVOS : SLOTS_ESTRELAS)[n] || [];
  return {
    largura: LARGURA, altura: 480, chao: CHAO,
    areas: AREAS_V2.map((a, k) => ({ ...a, x: k * AREA, w: k === AREAS_V2.length - 1 ? LARGURA - k * AREA : AREA })),
    plataformas,
    obstaculos,
    checkpoints: [{ x: 60 }, ...AREAS_V2.slice(1).map((_, i) => ({ x: (i + 1) * AREA + 20 }))],
    estrelas: slots.map((s) => candidatas[s]),
    portal: { x: LARGURA - 140, y: 320, w: 66, h: 100 },
  };
}
