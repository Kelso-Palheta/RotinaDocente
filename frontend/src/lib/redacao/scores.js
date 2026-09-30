/**
 * RN-49: Extração das notas do bloco JSON devolvido pela IA na correção de redação.
 * Funciona com o JSON no início ou no fim da resposta e é robusto a corte de tokens
 * (regex individual por campo quando o fence não fecha).
 */
export function extractScore(fullText) {
  try {
    // Estrategia 1: tentar extrair do bloco ```json ... ```
    const fenceMatch = fullText.match(/```json([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        const obj = JSON.parse(fenceMatch[1].trim());
        if (obj.c1 !== undefined) {
          const c1 = Number(obj.c1) || 0;
          const c2 = Number(obj.c2) || 0;
          const c3 = Number(obj.c3) || 0;
          const c4 = Number(obj.c4) || 0;
          const c5 = Number(obj.c5) || 0;
          const total = Number(obj.total) || (c1 + c2 + c3 + c4 + c5);
          return { total, items: [
            { subject: 'C1', A: c1, fullMark: 200 },
            { subject: 'C2', A: c2, fullMark: 200 },
            { subject: 'C3', A: c3, fullMark: 200 },
            { subject: 'C4', A: c4, fullMark: 200 },
            { subject: 'C5', A: c5, fullMark: 200 },
          ]};
        }
      } catch (e) { /* continua */ }
    }

    // Estrategia 2: extrair campos c1-c5 diretamente com regex individuais
    // Robusto contra JSON com objetos aninhados ou resposta truncada
    const getField = (key) => {
      const m = fullText.match(new RegExp(`"${key}"\\s*:\\s*(\\d+)`));
      return m ? Number(m[1]) : 0;
    };
    const c1 = getField('c1');
    const c2 = getField('c2');
    const c3 = getField('c3');
    const c4 = getField('c4');
    const c5 = getField('c5');
    if (c1 > 0 || c2 > 0 || c3 > 0 || c4 > 0 || c5 > 0) {
      const totalM = fullText.match(/"total"\s*:\s*(\d+)/);
      const total = totalM ? Number(totalM[1]) : (c1 + c2 + c3 + c4 + c5);
      return { total, items: [
        { subject: 'C1', A: c1, fullMark: 200 },
        { subject: 'C2', A: c2, fullMark: 200 },
        { subject: 'C3', A: c3, fullMark: 200 },
        { subject: 'C4', A: c4, fullMark: 200 },
        { subject: 'C5', A: c5, fullMark: 200 },
      ]};
    }
  } catch (e) { /* ignora */ }
  return null;
}
