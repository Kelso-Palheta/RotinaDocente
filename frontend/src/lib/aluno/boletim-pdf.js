import { jsPDF } from "jspdf";
import { fmt } from "@/utils/diario/calculos";

/**
 * Gera o Boletim Escolar Individual do Aluno em PDF formatado.
 */
export const generateBoletimPDF = ({
  nomeAluno = "Estudante",
  turmaNome = "Turma",
  professorNome = "Professor(a)",
  bimTotais = [],
  S1 = {},
  S2 = {},
  totalAnual = null,
  redacao = null
}) => {
  const doc = new jsPDF("portrait", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;

  // ── HEADER NAVY OFICIAL ──
  doc.setFillColor(16, 25, 66); // #101942
  doc.rect(0, 0, pageWidth, 45, "F");

  // Faixa rosa SimuladoApp
  doc.setFillColor(246, 12, 73); // #f60c49
  doc.rect(0, 43, pageWidth, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Gestão Docente — Boletim de Rendimento Escolar", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 224, 240);
  doc.text(`ALUNO(A): ${nomeAluno.toUpperCase()}`, margin, 27);
  doc.text(`TURMA: ${turmaNome.toUpperCase()}`, margin, 33);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}`, margin, 39);

  let cursorY = 55;

  // ── TABELA DE NOTAS BIMESTRAIS ──
  doc.setFillColor(238, 240, 248);
  doc.rect(margin, cursorY, maxLineWidth, 8, "F");
  doc.setDrawColor(220, 224, 240);
  doc.rect(margin, cursorY, maxLineWidth, 8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(16, 25, 66);
  doc.text("PERÍODO / ETAPA", margin + 4, cursorY + 5.5);
  doc.text("NOTA OBTIDA", margin + 80, cursorY + 5.5);
  doc.text("SITUAÇÃO", margin + maxLineWidth - 25, cursorY + 5.5);

  cursorY += 8;

  const bimestresConfig = [
    { label: '1º Bimestre', nota: bimTotais[0] },
    { label: '2º Bimestre', nota: bimTotais[1] },
    { label: '3º Bimestre', nota: bimTotais[2] },
    { label: '4º Bimestre', nota: bimTotais[3] },
  ];

  bimestresConfig.forEach((b, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(247, 248, 252);
      doc.rect(margin, cursorY, maxLineWidth, 9, "F");
    }
    doc.setDrawColor(240, 242, 248);
    doc.line(margin, cursorY + 9, margin + maxLineWidth, cursorY + 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(16, 25, 66);
    doc.text(b.label, margin + 4, cursorY + 6);

    // Nota
    const notaFormatada = b.nota !== null ? fmt(b.nota) : "—";
    doc.setFont("helvetica", "bold");
    doc.text(notaFormatada, margin + 80, cursorY + 6);

    // Status
    if (b.nota !== null) {
      const aprovado = b.nota >= 6.0;
      doc.setTextColor(aprovado ? 22 : 220, aprovado ? 101 : 38, aprovado ? 52 : 38);
      doc.text(aprovado ? "Satisfatório" : "Atenção", margin + maxLineWidth - 25, cursorY + 6);
    } else {
      doc.setTextColor(150, 160, 180);
      doc.text("Em aberto", margin + maxLineWidth - 25, cursorY + 6);
    }

    cursorY += 9;
  });

  // ── RESUMO SEMESTRAL E ANUAL ──
  cursorY += 6;
  doc.setFillColor(247, 248, 252);
  doc.roundedRect(margin, cursorY, maxLineWidth, 22, 2, 2, "F");
  doc.setDrawColor(220, 224, 240);
  doc.roundedRect(margin, cursorY, maxLineWidth, 22, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(96, 112, 160);
  doc.text("1º SEMESTRE", margin + 10, cursorY + 7);
  doc.text("2º SEMESTRE", margin + 65, cursorY + 7);
  doc.text("TOTAL ANUAL", margin + 120, cursorY + 7);

  doc.setFontSize(13);
  doc.setTextColor(16, 25, 66);
  doc.text(S1?.total !== null ? fmt(S1.total) : "—", margin + 10, cursorY + 16);
  doc.text(S2?.total !== null ? fmt(S2.total) : "—", margin + 65, cursorY + 16);

  const statusAnual = totalAnual !== null ? (totalAnual >= 50 ? "APROVADO" : "EM RECUPERAÇÃO") : "EM ANDAMENTO";
  const corStatus = totalAnual !== null && totalAnual >= 50 ? [22, 101, 52] : [246, 12, 73];

  doc.setTextColor(corStatus[0], corStatus[1], corStatus[2]);
  doc.text(`${totalAnual !== null ? fmt(totalAnual) : "—"} (${statusAnual})`, margin + 120, cursorY + 16);

  cursorY += 30;

  // ── SEÇÃO DE REDAÇÃO ENEM SE HOUVER ──
  if (redacao) {
    doc.setFillColor(255, 242, 246);
    doc.roundedRect(margin, cursorY, maxLineWidth, 24, 2, 2, "F");
    doc.setDrawColor(253, 228, 236);
    doc.roundedRect(margin, cursorY, maxLineWidth, 24, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(212, 8, 64);
    doc.text("Última Redação ENEM Corrigida por IA", margin + 5, cursorY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(16, 25, 66);
    const temaCortado = redacao.essayTheme?.length > 70 ? redacao.essayTheme.substring(0, 67) + "..." : redacao.essayTheme;
    doc.text(`Tema: ${temaCortado}`, margin + 5, cursorY + 13);
    doc.text(`Nota Final: ${redacao.totalScore} / 1000 pontos`, margin + 5, cursorY + 19);

    cursorY += 30;
  }

  // ── ASSINATURAS E VALIDAÇÃO ──
  cursorY = pageHeight - 35;
  doc.setDrawColor(180, 190, 210);
  doc.line(margin + 10, cursorY, margin + 70, cursorY);
  doc.line(pageWidth - margin - 70, cursorY, pageWidth - margin - 10, cursorY);

  doc.setFontSize(8);
  doc.setTextColor(100, 110, 140);
  doc.text("Assinatura da Coordenação Pedagógica", margin + 40, cursorY + 5, { align: "center" });
  doc.text("Assinatura do Responsável", pageWidth - margin - 40, cursorY + 5, { align: "center" });

  doc.save(`boletim_${nomeAluno.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
