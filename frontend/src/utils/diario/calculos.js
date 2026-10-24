import { situacoesBoletim } from '@/dominio/diario/aprovacao';

// NOTA = Simulado proporcionalizado + Soma_atividades
export const calcTotal = (simulado, atividades, notas, config) => {
  const finito = (valor, padrao) => Number.isFinite(Number(valor)) ? Number(valor) : padrao;
  const escala = finito(config?.simuladoMaxLanca ?? 5, 5);
  const simMaxLanca = escala > 0 ? escala : 5;
  const simMaxFinal = Math.max(0, finito(config?.simuladoMaxFinal ?? 5, 5));
  const atvMaxFinal = Math.max(0, finito(config?.atividadesMaxFinal ?? 5, 5));
  const simVal = clamp(finito(simulado, 0), 0, simMaxLanca);
  const simContri = (simVal / simMaxLanca) * simMaxFinal;
  const somaAtv = (atividades || []).reduce((acc, atv) => {
    const maximo = Math.max(0, finito(atv.max, 0));
    return acc + clamp(finito(notas?.[atv.id], 0), 0, maximo);
  }, 0);
  return Math.min(round2(simContri + Math.min(somaAtv, atvMaxFinal)), simMaxFinal + atvMaxFinal);
};

export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export const round2 = (v) => Math.round(v * 100) / 100;

export const fmt = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  const n = Number(v);
  if (isNaN(n)) return '—';
  return n.toFixed(2).replace('.', ',');
};

export const statusColor = (total, config) => {
  const aprov = config?.mediaAprovacao !== undefined ? Number(config.mediaAprovacao) : 5;
  const recup = config?.mediaRecuperacao !== undefined ? Number(config.mediaRecuperacao) : 4.99;
  if (total >= aprov) return 'good';
  if (total >= recup) return 'warn';
  return 'bad';
};

export const titleCase = (str) =>
  str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const normalizeNome = (s) =>
  s
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export const somaMaxAtv = (atividades) =>
  round2(atividades.reduce((a, atv) => a + (Number(atv.max) || 0), 0));

export const genId = () =>
  `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const cleanNome = (s) =>
  s
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();

export const temNota = (nota, atividades) => {
  if (!nota) return false;
  if (nota.simulado != null && nota.simulado !== '') return true;
  return (atividades || []).some((a) => nota[a.id] != null && nota[a.id] !== '');
};

export const calcSemestre = (n1, n2, rec, w1 = 2, w2 = 3) => {
  const hasN1 = n1 !== null && n1 !== undefined;
  const hasN2 = n2 !== null && n2 !== undefined;

  if (!hasN1 && !hasN2) {
    return { total: null, substituted: null, finalN1: null, finalN2: null };
  }

  const v1 = hasN1 ? Number(n1) : 0;
  const v2 = hasN2 ? Number(n2) : 0;

  let finalN1 = hasN1 ? v1 : null;
  let finalN2 = hasN2 ? v2 : null;
  let substituted = null;

  const recVal = (rec !== undefined && rec !== null && rec !== '') ? Number(rec) : null;

  if (recVal !== null && !isNaN(recVal) && hasN1 && hasN2) {
    if (v1 < v2) {
      if (recVal > v1) {
        finalN1 = recVal;
        substituted = 'first';
      }
    } else if (v2 < v1) {
      if (recVal > v2) {
        finalN2 = recVal;
        substituted = 'second';
      }
    } else {
      if (recVal > v2) {
        finalN2 = recVal;
        substituted = 'second';
      }
    }
  }

  const term1 = finalN1 !== null ? finalN1 * w1 : 0;
  const term2 = finalN2 !== null ? finalN2 * w2 : 0;
  const total = round2(term1 + term2);

  return { total, substituted, finalN1, finalN2 };
};

export const calcDesempenhoAnual = (turma, alunoId) => {
  const bimTotais = [null, null, null, null];

  for (let b = 1; b <= 4; b++) {
    const bData = turma.bimestres[String(b)];
    if (!bData) continue;
    const { atividades = [], notas = {}, config } = bData;
    const nota = notas[alunoId];
    if (!temNota(nota, atividades)) continue;
    bimTotais[b - 1] = calcTotal(nota.simulado, atividades, nota, config);
  }

  const recObj = turma.recuperacao?.[alunoId] || {};
  const rec1 = typeof recObj === 'object' ? recObj.rec1 : null;
  const rec2 = typeof recObj === 'object' ? recObj.rec2 : null;

  const S1 = calcSemestre(bimTotais[0], bimTotais[1], rec1, 2, 3);
  const S2 = calcSemestre(bimTotais[2], bimTotais[3], rec2, 2, 3);

  const totalAnual = S1.total === null && S2.total === null
    ? null : round2((S1.total || 0) + (S2.total || 0));
  return { bimTotais, totalAnual, ...situacoesBoletim(bimTotais, S1, S2, totalAnual) };
};
