import { calcDesempenhoAnual, fmt, titleCase } from "@/utils/diario/calculos";

/**
 * Gera a Caderneta Escolar Oficial da Turma em PDF (formato Paisagem A4).
 */
export const generateCadernetaPDF = async (turma, professorNome = "Professor(a)") => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF("landscape", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const maxLineWidth = pageWidth - margin * 2;

  // ── CABEÇALHO OFICIAL NAVY ──
  doc.setFillColor(16, 25, 66); // #101942
  doc.rect(0, 0, pageWidth, 32, "F");

  // Faixa rosa decorativa
  doc.setFillColor(246, 12, 73); // #f60c49
  doc.rect(0, 30.5, pageWidth, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("Gestão Docente — Caderneta de Rendimento Escolar Anual", margin, 13);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 224, 240);
  doc.text(`TURMA: ${turma.nome.toUpperCase()}`, margin, 21);
  doc.text(`TOTAL DE ALUNOS: ${turma.alunos.length}`, margin + 65, 21);
  doc.text(`PROFESSOR(A): ${professorNome}`, margin + 125, 21);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}`, margin + 200, 21);

  let cursorY = 38;

  // ── TABELA DE RENDIMENTO ──
  const cols = [
    { label: "Nº / NOME DO ESTUDANTE", w: 75, align: "left" },
    { label: "1º BIM", w: 18, align: "center" },
    { label: "2º BIM", w: 18, align: "center" },
    { label: "1º SEM", w: 20, align: "center" },
    { label: "3º BIM", w: 18, align: "center" },
    { label: "4º BIM", w: 18, align: "center" },
    { label: "2º SEM", w: 20, align: "center" },
    { label: "REC. FIN.", w: 20, align: "center" },
    { label: "TOT. ANUAL", w: 24, align: "center" },
    { label: "SITUAÇÃO", w: 42, align: "center" },
  ];

  const renderTableHeader = (y) => {
    doc.setFillColor(238, 240, 248);
    doc.rect(margin, y, maxLineWidth, 7, "F");
    doc.setDrawColor(220, 224, 240);
    doc.rect(margin, y, maxLineWidth, 7, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(16, 25, 66);

    let curX = margin;
    cols.forEach(col => {
      if (col.align === "center") {
        doc.text(col.label, curX + col.w / 2, y + 4.8, { align: "center" });
      } else {
        doc.text(col.label, curX + 2, y + 4.8);
      }
      curX += col.w;
    });
  };

  renderTableHeader(cursorY);
  cursorY += 7;

  const dadosAlunos = turma.alunos.map((al, idx) => ({
    ordem: idx + 1,
    aluno: al,
    ...calcDesempenhoAnual(turma, al.id)
  }));

  dadosAlunos.forEach((d, idx) => {
    if (cursorY > pageHeight - 22) {
      doc.addPage();
      cursorY = 15;
      renderTableHeader(cursorY);
      cursorY += 7;
    }

    // Fundo zebrado
    if (idx % 2 === 1) {
      doc.setFillColor(247, 248, 252);
      doc.rect(margin, cursorY, maxLineWidth, 6.5, "F");
    }
    doc.setDrawColor(240, 242, 248);
    doc.line(margin, cursorY + 6.5, margin + maxLineWidth, cursorY + 6.5);

    let curX = margin;

    // Nome
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(16, 25, 66);
    const nomeCortado = d.aluno.nome.length > 34 ? d.aluno.nome.substring(0, 32) + "..." : d.aluno.nome;
    doc.text(`${String(d.ordem).padStart(2, '0')}. ${titleCase(nomeCortado)}`, curX + 2, cursorY + 4.5);
    curX += cols[0].w;

    // 1º Bim
    doc.setFont("helvetica", "bold");
    doc.text(d.bimTotais[0] !== null ? fmt(d.bimTotais[0]) : "—", curX + cols[1].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[1].w;

    // 2º Bim
    doc.text(d.bimTotais[1] !== null ? fmt(d.bimTotais[1]) : "—", curX + cols[2].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[2].w;

    // 1º Sem
    const s1Color = d.S1.total !== null && d.S1.total >= 25 ? [22, 101, 52] : [153, 27, 27];
    doc.setTextColor(s1Color[0], s1Color[1], s1Color[2]);
    doc.text(d.S1.total !== null ? fmt(d.S1.total) : "—", curX + cols[3].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[3].w;

    // 3º Bim
    doc.setTextColor(16, 25, 66);
    doc.text(d.bimTotais[2] !== null ? fmt(d.bimTotais[2]) : "—", curX + cols[4].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[4].w;

    // 4º Bim
    doc.text(d.bimTotais[3] !== null ? fmt(d.bimTotais[3]) : "—", curX + cols[5].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[5].w;

    // 2º Sem
    const s2Color = d.S2.total !== null && d.S2.total >= 25 ? [22, 101, 52] : [153, 27, 27];
    doc.setTextColor(s2Color[0], s2Color[1], s2Color[2]);
    doc.text(d.S2.total !== null ? fmt(d.S2.total) : "—", curX + cols[6].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[6].w;

    // Rec. Final
    doc.setTextColor(96, 112, 160);
    doc.text(d.recFinal !== null ? fmt(d.recFinal) : "—", curX + cols[7].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[7].w;

    // Total Anual
    doc.setTextColor(16, 25, 66);
    doc.text(d.totalAnual !== null ? fmt(d.totalAnual) : "—", curX + cols[8].w / 2, cursorY + 4.5, { align: "center" });
    curX += cols[8].w;

    // Situação
    const statusMap = {
      good: { label: "APROVADO", color: [22, 101, 52] },
      warn: { label: "EM ANDAMENTO", color: [96, 112, 160] },
      bad: { label: "RECUPERAÇÃO", color: [153, 27, 27] }
    };
    const st = statusMap[d.statusFinal] || statusMap.warn;
    doc.setTextColor(st.color[0], st.color[1], st.color[2]);
    doc.text(st.label, curX + cols[9].w / 2, cursorY + 4.5, { align: "center" });

    cursorY += 6.5;
  });

  // ── ASSINATURAS NO FINAL ──
  cursorY = Math.min(cursorY + 12, pageHeight - 16);
  doc.setDrawColor(180, 190, 210);
  doc.line(margin + 20, cursorY, margin + 90, cursorY);
  doc.line(pageWidth - margin - 90, cursorY, pageWidth - margin - 20, cursorY);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 140);
  doc.text("Assinatura do(a) Professor(a) Regente", margin + 55, cursorY + 4, { align: "center" });
  doc.text("Assinatura da Coordenação / Direção", pageWidth - margin - 55, cursorY + 4, { align: "center" });

  doc.save(`caderneta_${turma.nome.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

/**
 * Gera e dispara o download do arquivo CSV / Excel formatado com as notas da turma.
 */
export const exportCadernetaCSV = (turma) => {
  const dadosAlunos = turma.alunos.map((al, idx) => ({
    ordem: idx + 1,
    aluno: al,
    ...calcDesempenhoAnual(turma, al.id)
  }));

  const cabecalho = [
    "Ordem",
    "Nome do Aluno",
    "1º Bimestre",
    "2º Bimestre",
    "1º Semestre",
    "3º Bimestre",
    "4º Bimestre",
    "2º Semestre",
    "Recuperacao Final",
    "Total Anual",
    "Situacao Final"
  ];

  const linhas = dadosAlunos.map(d => [
    d.ordem,
    `"${titleCase(d.aluno.nome)}"`,
    d.bimTotais[0] !== null ? fmt(d.bimTotais[0]) : "",
    d.bimTotais[1] !== null ? fmt(d.bimTotais[1]) : "",
    d.S1.total !== null ? fmt(d.S1.total) : "",
    d.bimTotais[2] !== null ? fmt(d.bimTotais[2]) : "",
    d.bimTotais[3] !== null ? fmt(d.bimTotais[3]) : "",
    d.S2.total !== null ? fmt(d.S2.total) : "",
    d.recFinal !== null ? fmt(d.recFinal) : "",
    d.totalAnual !== null ? fmt(d.totalAnual) : "",
    d.statusFinal === 'good' ? "APROVADO" : (d.statusFinal === 'bad' ? "RECUPERACAO" : "EM ANDAMENTO")
  ]);

  const csvContent = "\uFEFF" + [cabecalho.join(";"), ...linhas.map(e => e.join(";"))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `notas_${turma.nome.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
