import { jsPDF } from 'jspdf';
import { normalizarNotasHistorico,dataRedacao } from '@/dominio/redacao/historico';
import { cleanFeedbackText } from './renderFeedback';

/** A sexta opção preserva a assinatura histórica e acrescenta versão/data/contexto. */
export const generatePDF=(content,studentName='Estudante',studentClass='N/A',essayTheme='Geral',scoreData=null,metadata={})=>{
  const doc=new jsPDF('portrait','mm','a4');
  const width=doc.internal.pageSize.getWidth();const height=doc.internal.pageSize.getHeight();const margin=20;const maxWidth=width-margin*2;
  let y=22;
  const escrever=(texto,{size=10,bold=false,color=[55,65,81],gap=5}={})=>{
    doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);
    const lines=doc.splitTextToSize(String(texto || ''),maxWidth);
    for(const line of lines){if(y>height-22){doc.addPage();y=22;}doc.text(line,margin,y);y+=gap;}
    y+=2;
  };
  escrever('Relatório de Correção ENEM',{size:20,bold:true,color:[16,25,66],gap:8});
  escrever(`Aluno(a): ${studentName}`,{bold:true});escrever(`Turma: ${studentClass}`);escrever(`Tema: ${essayTheme}`);
  const data=dataRedacao(metadata);
  escrever(`Correção: ${data.getTime()>0?data.toLocaleDateString('pt-BR'):'Data original não informada'}`);
  escrever(`Exportado em: ${new Date().toLocaleDateString('pt-BR')} · Versão ${metadata.revision ?? 'legada'} · ${metadata.status || 'Resultado para conferência'}`,{size:8});
  if(metadata.anoLetivo)escrever(`Ano letivo: ${metadata.anoLetivo} · ${metadata.bimestre || '?'}º bimestre`,{size:8});
  y+=4;
  const notas=normalizarNotasHistorico({...metadata,scoreData});
  if(metadata.modo==='parcial') escrever('Avaliação parcial — sem total ENEM comparável.',{bold:true,color:[16,25,66]});
  else if(notas) escrever(`NOTA FINAL: ${notas.total} / 1000`,{size:15,bold:true,color:[246,12,73],gap:7});
  else escrever('Conferir notas — avaliação completa válida indisponível.',{bold:true,color:[160,70,15]});
  if(Array.isArray(scoreData)) escrever(scoreData.map(item=>`${item.subject}: ${Number.isFinite(item.A)?item.A:'Não avaliada'}/200`).join('   '),{size:10});
  if(metadata.anulada) escrever(`Anulação: ${metadata.motivoAnulacao || 'Motivo não informado'}`,{bold:true});
  y+=4;escrever('ANÁLISE PEDAGÓGICA',{size:12,bold:true,color:[16,25,66],gap:6});
  const clean=cleanFeedbackText(String(content || '')).replace(/\*\*(.*?)\*\*/g,'$1').replace(/^#{1,6}\s*/gm,'').replace(/\|/g,' ').replace(/[^\x00-\x7FÀ-ɏḀ-ỿ\n]/g,'');
  for(const paragraph of clean.split('\n')) escrever(paragraph || ' ',{size:10,gap:5});
  const count=doc.internal.getNumberOfPages();
  for(let i=1;i<=count;i++){doc.setPage(i);doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(120,120,130);doc.text(`Rotina Docente · Redação Corrigida · Página ${i} de ${count}`,width/2,height-9,{align:'center'});}
  const filename=String(studentName).replace(/[^\p{L}\p{N}_-]/gu,'_').slice(0,100);
  doc.save(`Resultado_${filename}.pdf`);return doc;
};
