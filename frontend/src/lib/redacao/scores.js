import { validarPontuacaoCompetencia } from '@/dominio/redacao/enemScoreValidator';

/** Competências selecionadas; ausência representa avaliação completa. */
export function normalizarCompetencias(value) {
  if (!value || /^(todas|completa)$/i.test(String(value))) return ['C1','C2','C3','C4','C5'];
  const values = Array.isArray(value) ? value : String(value).split(/[,;\s]+/);
  return [...new Set(values.map(v => String(v).toUpperCase().replace(/^([1-5])$/, 'C$1')).filter(v => /^C[1-5]$/.test(v)))].sort();
}

/** Extrai notas completas sem inventar ausências; mantém compatibilidade com campos completos sem fence. */
export function extractScore(fullText, options = {}) {
  if (typeof fullText !== 'string') return null;
  const selected = normalizarCompetencias(options.competencies);
  if (!selected.length) return null;
  let obj;
  const fence = fullText.match(/```json\s*([\s\S]*?)```/i);
  const raw = fence?.[1] || fullText.trim();
  try { obj = JSON.parse(raw); } catch {
    // Campos completos também podem preceder um feedback cortado. Não aceitar números parciais.
    obj = {};
    for (const key of ['c1','c2','c3','c4','c5','total','anulada','motivoAnulacao','motivo_anulacao']) {
      const match = fullText.match(new RegExp(`"${key}"\\s*:\\s*("(?:[^"\\\\]|\\\\.)*"|-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|true|false|null)(?=\\s*[,}\\n]|\\s*$)`));
      if (match) { try { obj[key] = JSON.parse(match[1]); } catch { return null; } }
    }
  }
  if (!obj || typeof obj !== 'object') return null;
  const items = selected.map(subject => ({subject,A:obj[subject.toLowerCase()],fullMark:200}));
  if (items.some(item => !validarPontuacaoCompetencia(item.A))) return null;
  const anulada = obj.anulada === true;
  const motivoAnulacao = String(obj.motivoAnulacao || obj.motivo_anulacao || obj.motivo || '').trim();
  const completa = selected.length === 5;
  const sum = items.reduce((total,item)=>total+item.A,0);
  if (completa && obj.total !== undefined && obj.total !== sum) return null;
  if (anulada && (!motivoAnulacao || !completa || sum !== 0)) return null;
  return {total:completa ? sum : null,items,modo:completa?'completa':'parcial',anulada,...(anulada?{motivoAnulacao}:{})};
}
