/** Acrescenta devolutivas completas em páginas próprias, sem truncar comentários. */
export function adicionarHistoricoFeedbackPDF(doc, historico = []) {
  if (!historico.length) return;
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y;
  const novaPagina = () => {
    doc.addPage();
    doc.setFillColor(16, 25, 66);
    doc.rect(0, 0, width, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('Devolutivas das atividades', margin, 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(96, 112, 160);
    doc.text(`Rotina Docente • Página ${doc.getNumberOfPages()}`, margin, height - 10);
    y = 27;
  };
  const escrever = (valor, bold = false) => {
    const texto = String(valor ?? '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    const linhas = doc.splitTextToSize(texto, width - margin * 2);
    for (const linha of linhas) {
      if (y > height - 20) novaPagina();
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(9);
      doc.setTextColor(16, 25, 66);
      doc.text(linha, margin, y);
      y += 4.5;
    }
    y += 2;
  };
  novaPagina();
  const nota = (obtida, maxima) => `${obtida ?? '—'} / ${maxima ?? '—'}`;
  for (const atividade of historico) {
    if (y > height - 45) novaPagina();
    escrever(`${atividade.periodo || (atividade.finalidade === 'recuperacao_semestral' ? `${atividade.semestre}º semestre` : `${atividade.bimestre}º bimestre`)} • ${atividade.titulo}`, true);
    escrever(`Nota: ${nota(atividade.nota, atividade.notaMaxima)} • Correção: ${atividade.tipoCorrecao === 'manual' ? 'manual' : 'IA'}`);
    if (atividade.feedback) escrever(`Feedback da atividade: ${atividade.feedback}`);
    if (atividade.resposta) escrever(`Resposta: ${atividade.resposta}`);
    for (const questao of atividade.questoes || []) {
      escrever(`Questão ${questao.numero}: ${questao.enunciado}`, true);
      escrever(`Resposta: ${questao.resposta || 'Não informada'}`);
      escrever(`Nota: ${nota(questao.nota, questao.notaMaxima)}`);
      escrever(`Feedback: ${questao.feedback || 'Não informado'}`);
    }
    y += 5;
  }
}
