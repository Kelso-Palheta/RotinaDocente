import { fmt, titleCase } from '@/utils/diario/calculos';

/**
 * Gera o Relatório Executivo de Rendimento Pedagógico em PDF para a Coordenação.
 * Carrega jsPDF dinamicamente para manter o bundle otimizado.
 * 
 * @param {Object} params
 * @param {Array} params.turmas - Lista de turmas analisadas
 * @param {Object} params.metricas - Métricas calculadas (media, aprovacao, recuperacao, totalAlunos)
 * @param {Array} params.alunosEmRisco - Lista de alunos abaixo da média
 * @param {String} params.turmaSelecionadaNome - Nome da turma ("Todas as Turmas" ou nome específico)
 * @param {String|Number} params.bimestre - Bimestre de referência (1 a 4)
 * @param {String} params.professorNome - Nome do professor logado
 */
export async function generateAnalyticsPDF({
  turmas = [],
  metricas = {},
  alunosEmRisco = [],
  turmaSelecionadaNome = 'Todas as Turmas',
  bimestre = '1',
  professorNome = 'Professor(a)',
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('portrait', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // ── CABEÇALHO EXECUTIVO NAVY & CORAL ──
  doc.setFillColor(16, 25, 66); // #101942
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Faixa rosa decorativa
  doc.setFillColor(246, 12, 73); // #f60c49
  doc.rect(0, 36.5, pageWidth, 1.5, 'F');

  // Título e Subtítulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('Gestão Docente — Relatório de Rendimento Escolar', margin, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 224, 240);
  doc.text('DOCUMENTO EXECUTIVO PEDAGÓGICO — PARA USO DA COORDENAÇÃO E DIREÇÃO', margin, 21);

  // Metadados do cabeçalho
  doc.setFontSize(8.5);
  doc.text(`PROFESSOR(A): ${professorNome.toUpperCase()}`, margin, 30);
  doc.text(`ESCOPO: ${turmaSelecionadaNome.toUpperCase()}`, margin + 85, 30);
  doc.text(`REFERÊNCIA: ${bimestre}º BIMESTRE`, margin + 140, 30);

  let cursorY = 46;

  // ── PAINEL DE INDICADORES MACRO ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 25, 66);
  doc.text('1. INDICADORES GERAIS DE RENDIMENTO', margin, cursorY);
  cursorY += 5;

  const cardWidth = (contentWidth - 9) / 4;
  const cardHeight = 18;

  const cards = [
    { label: 'TOTAL DE ESTUDANTES', val: `${metricas.totalAlunos || 0}`, color: [16, 25, 66] },
    { label: 'MÉDIA GLOBAL', val: fmt(metricas.mediaGeral || 0), color: [37, 99, 235] },
    { label: 'TAXA DE APROVAÇÃO', val: `${metricas.taxaAprovacao || 0}%`, color: [16, 185, 129] },
    { label: 'EM RECUPERAÇÃO / RISCO', val: `${metricas.taxaRecuperacao || 0}%`, color: [246, 12, 73] },
  ];

  cards.forEach((c, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cardX + 3, cursorY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...c.color);
    doc.text(c.val, cardX + 3, cursorY + 14);
  });

  cursorY += cardHeight + 8;

  // ── SEÇÃO 2: RADAR DE ALUNOS EM RISCO (Se houver) ──
  if (alunosEmRisco.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(225, 29, 72); // Rose
    doc.text(`2. RADAR PREVENTIVO — ${alunosEmRisco.length} ESTUDANTE(S) EM SITUAÇÃO CRÍTICA`, margin, cursorY);
    cursorY += 5;

    // Cabeçalho da tabela de risco
    doc.setFillColor(254, 242, 242);
    doc.rect(margin, cursorY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(159, 18, 57);
    doc.text('ESTUDANTE EM RISCO', margin + 3, cursorY + 4.2);
    doc.text('TURMA', margin + 85, cursorY + 4.2);
    doc.text('MÉDIA ATUAL', margin + 130, cursorY + 4.2);
    doc.text('STATUS', margin + 158, cursorY + 4.2);
    cursorY += 6;

    alunosEmRisco.slice(0, 12).forEach((aluno, i) => {
      doc.setFillColor(i % 2 === 0 ? 255 : 254, 255, 255);
      doc.rect(margin, cursorY, contentWidth, 5.5, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(titleCase(aluno.nome).slice(0, 40), margin + 3, cursorY + 4);
      doc.text(aluno.turmaNome || '—', margin + 85, cursorY + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(225, 29, 72);
      doc.text(fmt(aluno.nota), margin + 130, cursorY + 4);
      doc.text('Abaixo da Média', margin + 158, cursorY + 4);

      cursorY += 5.5;
    });

    if (alunosEmRisco.length > 12) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`... e mais ${alunosEmRisco.length - 12} estudante(s) com atenção recomendada.`, margin + 3, cursorY + 4);
      cursorY += 6;
    }

    cursorY += 5;
  }

  // ── SEÇÃO 3: TABELA GERAL CONSOLIDADA POR TURMA ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(16, 25, 66);
  doc.text('3. DESEMPENHO CONSOLIDADO POR ESTUDANTE', margin, cursorY);
  cursorY += 5;

  // Cabeçalho da tabela geral
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, cursorY, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Nº / NOME DO ESTUDANTE', margin + 3, cursorY + 4.2);
  doc.text('TURMA', margin + 95, cursorY + 4.2);
  doc.text(`NOTA ${bimestre}º BIM`, margin + 140, cursorY + 4.2);
  doc.text('SITUAÇÃO', margin + 162, cursorY + 4.2);
  cursorY += 6;

  // Itera sobre todos os alunos das turmas no escopo
  const turmasFiltradas = turmaSelecionadaNome === 'Todas as Turmas'
    ? turmas
    : turmas.filter((t) => t.nome === turmaSelecionadaNome || t.id === turmaSelecionadaNome);

  let totalLinhas = 0;
  for (const turma of turmasFiltradas) {
    const alunos = turma.alunos || [];
    for (let idx = 0; idx < alunos.length; idx++) {
      const aluno = alunos[idx];
      const bKey = `b${bimestre}`;
      const notaFinal = aluno[bKey]?.notaFinal ?? aluno[bKey]?.media;
      const mediaNum = typeof notaFinal === 'number' ? notaFinal : parseFloat(notaFinal) || 0;
      const aprovado = mediaNum >= 5.0;

      // Quebra de página se o cursor chegar no final
      if (cursorY > pageHeight - 38) {
        doc.addPage();
        cursorY = 20;

        // Repete cabeçalho da tabela na nova página
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, cursorY, contentWidth, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text('Nº / NOME DO ESTUDANTE', margin + 3, cursorY + 4.2);
        doc.text('TURMA', margin + 95, cursorY + 4.2);
        doc.text(`NOTA ${bimestre}º BIM`, margin + 140, cursorY + 4.2);
        doc.text('SITUAÇÃO', margin + 162, cursorY + 4.2);
        cursorY += 6;
      }

      doc.setFillColor(totalLinhas % 2 === 0 ? 255 : 248, 250, 252);
      doc.rect(margin, cursorY, contentWidth, 5.2, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(`${String(idx + 1).padStart(2, '0')}. ${titleCase(aluno.nome || 'Estudante')}`.slice(0, 45), margin + 3, cursorY + 3.8);
      doc.text(turma.nome || '—', margin + 95, cursorY + 3.8);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(aprovado ? 16 : 225, aprovado ? 185 : 29, aprovado ? 129 : 72);
      doc.text(fmt(mediaNum), margin + 140, cursorY + 3.8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(aprovado ? 'Aprovado' : 'Recuperação', margin + 162, cursorY + 3.8);

      cursorY += 5.2;
      totalLinhas++;
    }
  }

  // ── SEÇÃO DE PARECER E ASSINATURAS ──
  if (cursorY > pageHeight - 45) {
    doc.addPage();
    cursorY = 25;
  } else {
    cursorY += 8;
  }

  // Caixa de Observações da Coordenação
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 16, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PARECER / DESPACHO DA COORDENAÇÃO PEDAGÓGICA:', margin + 3, cursorY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('[   ] Acompanhamento Intensivo Individualizado    [   ] Convocação de Responsáveis    [   ] Adaptação Curricular', margin + 3, cursorY + 11);

  cursorY += 25;

  // Linhas de Assinatura
  const signWidth = (contentWidth - 20) / 2;

  // Assinatura do Professor
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, cursorY, margin + signWidth, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(professorNome, margin + signWidth / 2, cursorY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Professor(a) Responsável', margin + signWidth / 2, cursorY + 7.5, { align: 'center' });

  // Assinatura da Coordenação
  doc.line(margin + signWidth + 20, cursorY, margin + signWidth * 2 + 20, cursorY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Coordenação Pedagógica / Direção', margin + signWidth + 20 + signWidth / 2, cursorY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Visto e Homologação Oficial', margin + signWidth + 20 + signWidth / 2, cursorY + 7.5, { align: 'center' });

  // Rodapé em todas as páginas
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gestão Docente — Toda a sua rotina letiva em 1 clique | Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} | Página ${p} de ${totalPages}`,
      margin,
      pageHeight - 6
    );
  }

  // Salva o arquivo PDF
  const nomeArquivo = `Relatorio_Analytics_${turmaSelecionadaNome.replace(/\s+/g, '_')}_Bim${bimestre}.pdf`;
  doc.save(nomeArquivo);
}
