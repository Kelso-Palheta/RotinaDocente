import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Gera o documento PDF do cronograma de aulas da turma.
 * 
 * @param {Array} aulas - Lista de aulas da turma
 * @param {String} nomeTurma - Nome da turma selecionada
 * @param {String} professorEmail - Email ou nome do professor
 */
export const generateCalendarioPDF = async (
  aulas = [],
  nomeTurma = "Turma",
  professorEmail = "Professor"
) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF("portrait", "mm", "a4");

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxLineWidth = pageWidth - margin * 2;

  // ── HEADER NAVY OFICIAL ──
  doc.setFillColor(16, 25, 66); // #101942
  doc.rect(0, 0, pageWidth, 45, "F");

  // Faixa decorativa rosa
  doc.setFillColor(246, 12, 73); // #f60c49
  doc.rect(0, 43, pageWidth, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Gestão Docente — Cronograma Pedagógico", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 224, 240);
  doc.text(`TURMA: ${nomeTurma.toUpperCase()}`, margin, 27);
  doc.text(`PROFESSOR: ${professorEmail}`, margin, 33);
  doc.text(`EMISSÃO: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}`, margin, 39);

  let cursorY = 55;

  // ── TABELA DE AULAS ──
  // Cabeçalho da Tabela
  doc.setFillColor(238, 240, 248); // #eef0f8
  doc.rect(margin, cursorY, maxLineWidth, 8, "F");
  doc.setDrawColor(220, 224, 240);
  doc.rect(margin, cursorY, maxLineWidth, 8, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(16, 25, 66);
  doc.text("DATA", margin + 3, cursorY + 5.5);
  doc.text("HORÁRIO", margin + 28, cursorY + 5.5);
  doc.text("CONTEÚDO / TÓPICOS PLANEJADOS", margin + 60, cursorY + 5.5);
  doc.text("STATUS", margin + maxLineWidth - 18, cursorY + 5.5);

  cursorY += 8;

  const aulasOrdenadas = [...aulas].sort(
    (a, b) => new Date(a.dataAgendada) - new Date(b.dataAgendada)
  );

  if (aulasOrdenadas.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(100, 110, 140);
    doc.text("Nenhuma aula agendada para esta turma.", margin + 5, cursorY + 10);
  } else {
    aulasOrdenadas.forEach((aula, idx) => {
      // Quebra de página automática se ultrapassar a margem inferior
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = 20;

        // Repete o cabeçalho da tabela na nova página
        doc.setFillColor(238, 240, 248);
        doc.rect(margin, cursorY, maxLineWidth, 8, "F");
        doc.setDrawColor(220, 224, 240);
        doc.rect(margin, cursorY, maxLineWidth, 8, "S");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(16, 25, 66);
        doc.text("DATA", margin + 3, cursorY + 5.5);
        doc.text("HORÁRIO", margin + 28, cursorY + 5.5);
        doc.text("CONTEÚDO / TÓPICOS PLANEJADOS", margin + 60, cursorY + 5.5);
        doc.text("STATUS", margin + maxLineWidth - 18, cursorY + 5.5);

        cursorY += 8;
      }

      // Fundo zebrado
      if (idx % 2 === 1) {
        doc.setFillColor(247, 248, 252);
        doc.rect(margin, cursorY, maxLineWidth, 10, "F");
      }
      doc.setDrawColor(240, 242, 248);
      doc.line(margin, cursorY + 10, margin + maxLineWidth, cursorY + 10);

      // Data formatada (ex: 02/03 (Seg))
      const dataObj = parseISO(aula.dataAgendada);
      const dataFormatada = `${format(dataObj, "dd/MM")} (${format(dataObj, "EEE", { locale: ptBR })})`;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(16, 25, 66);
      doc.text(dataFormatada, margin + 3, cursorY + 6.5);

      // Horário
      doc.setTextColor(96, 112, 160);
      doc.text(`${aula.horarioInicio || ""} - ${aula.horarioFim || ""}`, margin + 28, cursorY + 6.5);

      // Tópicos
      const topicos = aula.topicosAssociados?.length > 0 
        ? aula.topicosAssociados.map(t => t.topicoTitulo).join(" | ")
        : (aula.topicoTitulo || "A definir");
      
      doc.setFont("helvetica", aula.topicosAssociados?.length > 0 ? "bold" : "italic");
      doc.setTextColor(16, 25, 66);
      const topicoCortado = topicos.length > 55 ? topicos.substring(0, 52) + "..." : topicos;
      doc.text(topicoCortado, margin + 60, cursorY + 6.5);

      // Status Badge
      const statusMap = {
        'CONCLUIDA': { label: 'Concluída', color: [22, 101, 52] },
        'PARCIAL': { label: 'Parcial', color: [154, 52, 18] },
        'NAO_REALIZADA': { label: 'Cancelada', color: [153, 27, 27] },
        'AGENDADA': { label: 'Agendada', color: [96, 112, 160] }
      };

      const st = statusMap[aula.status] || statusMap['AGENDADA'];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(st.color[0], st.color[1], st.color[2]);
      doc.text(st.label.toUpperCase(), margin + maxLineWidth - 18, cursorY + 6.5);

      cursorY += 10;
    });
  }

  // ── RODAPÉ ──
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 160, 180);
  doc.text(
    `Gestão Docente — Toda a sua rotina letiva em 1 clique | Gerado em ${new Date().toLocaleDateString("pt-BR")}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  doc.save(`cronograma_${nomeTurma.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};
