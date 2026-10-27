import { validarPontuacaoCompetencia } from './enemScoreValidator';

export function validarNotasRegistro(data) {
  if (!Array.isArray(data.scoreData) || !data.scoreData.length) throw new Error('Informe as competências avaliadas.');
  const seen=new Set();
  data.scoreData.forEach(item=> {
    if (!/^C[1-5]$/.test(item.subject) || seen.has(item.subject) || !validarPontuacaoCompetencia(item.A)) throw new Error('Competência inválida. Use 0, 40, 80, 120, 160 ou 200.');
    seen.add(item.subject);
  });
  const parcial=data.modo==='parcial';
  if (!parcial && seen.size!==5) throw new Error('A avaliação completa exige cinco competências.');
  const total=parcial ? null : data.scoreData.reduce((sum,item)=>sum+item.A,0);
  if (data.totalScore!==undefined && data.totalScore!==total) throw new Error('O total diverge das competências avaliadas.');
  if (data.anulada && (parcial || total!==0 || !String(data.motivoAnulacao || '').trim())) throw new Error('Anulação exige motivo e cinco competências zero.');
  return total;
}
