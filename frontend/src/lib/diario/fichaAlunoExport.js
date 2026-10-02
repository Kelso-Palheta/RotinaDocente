import { jsPDF } from 'jspdf';
import { consolidarFichaAluno360 } from '@/dominio/diario/fichaAluno';
import { fmt } from '@/utils/diario/calculos';

/**
 * Gera a Ficha Individual do Aluno 360º em formato PDF oficial (A4 Retrato)
 * para Reuniões de Pais, Conselho de Classe e Dossiê Pedagógico.
 * 
 * @param {Object} params
 * @param {Object} params.aluno - Estudante selecionado
 * @param {Object} params.turma - Dados da turma
 * @param {Object} [params.frequenciasTurma] - Histórico de chamadas
 * @param {Array<Object>} [params.historicoRedacoes] - Histórico de redações
 * @param {string} [params.professorNome] - Nome do docente
 * @param {string} [params.parecerManual] - Parecer digitado
 */
export async function generateFichaAluno360PDF({
  aluno,
  turma,
  frequenciasTurma = null,
  historicoRedacoes = null,
  professorNome = 'Professor(a)',
  parecerManual = '',
  incluirDiagnosticoClinico = false,
}) {
  const ficha = consolidarFichaAluno360({
    aluno,
    turma,
    frequenciasTurma,
    historicoRedacoes,
    parecerManual,
    incluirDiagnosticoClinico,
  });

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // ── CABEÇALHO OFICIAL NAVY + BRAND ACCENT ──
  doc.setFillColor(16, 25, 66); // #101942
  doc.rect(0, 0, pageWidth, 36, 'F');

  // Linha rosa de destaque
  doc.setFillColor(246, 12, 73); // #f60c49
  doc.rect(0, 34.5, pageWidth, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('Rotina Docente — Ficha Pedagógica 360º do Estudante', margin, 14);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 224, 240);
  doc.text(`DOCUMENTO INDIVIDUAL PARA CONSELHO DE CLASSE E REUNIÃO DE PAIS`, margin, 21);
  doc.text(`PROFESSOR(A): ${professorNome.toUpperCase()}`, margin, 27);
  doc.text(
    `EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth - margin - 50,
    27
  );

  let cursorY = 43;

  // ── 1. IDENTIFICAÇÃO DO ESTUDANTE ──
  doc.setFillColor(245, 247, 252);
  doc.roundedRect(margin, cursorY, contentWidth, 18, 2, 2, 'F');
  doc.setDrawColor(220, 226, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 18, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(16, 25, 66);
  doc.text(`ESTUDANTE: ${ficha.aluno.nome.toUpperCase()}`, margin + 4, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(70, 80, 100);
  doc.text(`TURMA: ${ficha.turma.nome}`, margin + 4, cursorY + 13);
  doc.text(`DISCIPLINA: ${ficha.turma.disciplina}`, margin + 70, cursorY + 13);
  doc.text(`MATRÍCULA: ${ficha.aluno.matricula}`, margin + 135, cursorY + 13);

  cursorY += 23;

  // ── 2. RENDIMENTO ACADÊMICO BIMESTRAL ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 25, 66);
  doc.text('1. RENDIMENTO ACADÊMICO & AVALIAÇÕES', margin, cursorY);
  cursorY += 3;

  // Cabeçalho da tabela de notas
  const colW = contentWidth / 6;
  doc.setFillColor(238, 241, 250);
  doc.rect(margin, cursorY, contentWidth, 6, 'F');
  doc.setDrawColor(215, 222, 238);
  doc.rect(margin, cursorY, contentWidth, 6, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 30, 70);
  const labelsNotas = ['1º BIMESTRE', '2º BIMESTRE', '3º BIMESTRE', '4º BIMESTRE', 'TOTAL / MÉDIA', 'SITUAÇÃO'];
  labelsNotas.forEach((lbl, i) => {
    doc.text(lbl, margin + i * colW + colW / 2, cursorY + 4.2, { align: 'center' });
  });

  cursorY += 6;

  // Linha de dados de notas
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, cursorY, contentWidth, 7, 'F');
  doc.setDrawColor(215, 222, 238);
  doc.rect(margin, cursorY, contentWidth, 7, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 25, 66);

  const notasValores = [
    fmt(ficha.academico.bimestres[0]),
    fmt(ficha.academico.bimestres[1]),
    fmt(ficha.academico.bimestres[2]),
    fmt(ficha.academico.bimestres[3]),
    fmt(ficha.academico.totalAnual),
    ficha.academico.situacao,
  ];

  notasValores.forEach((val, i) => {
    if (i === 5) {
      doc.setFont('helvetica', 'bold');
      if (val === 'Aprovado') doc.setTextColor(16, 140, 60);
      else if (val === 'Recuperação') doc.setTextColor(210, 130, 10);
      else doc.setTextColor(200, 30, 30);
    }
    doc.text(val, margin + i * colW + colW / 2, cursorY + 4.8, { align: 'center' });
  });

  cursorY += 13;

  // ── 3. ASSIDUIDADE & CUMPRIMENTO LDB (ART. 24) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 25, 66);
  doc.text('2. FREQUÊNCIA ESCOLAR & MONITORAMENTO LEGAL (LDB ART. 24)', margin, cursorY);
  cursorY += 3;

  // Card de Frequência
  const isCritico = ficha.frequencia.statusLdb === 'critico';
  const isAlerta = ficha.frequencia.statusLdb === 'alerta';

  doc.setFillColor(isCritico ? 254 : isAlerta ? 255 : 246, isCritico ? 242 : isAlerta ? 251 : 252, isCritico ? 242 : isAlerta ? 235 : 248);
  doc.roundedRect(margin, cursorY, contentWidth, 20, 2, 2, 'F');
  doc.setDrawColor(isCritico ? 248 : isAlerta ? 245 : 220, isCritico ? 180 : isAlerta ? 200 : 230, isCritico ? 180 : isAlerta ? 120 : 220);
  doc.roundedRect(margin, cursorY, contentWidth, 20, 2, 2, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 25, 66);
  doc.text(`Total de Aulas Registradas: ${ficha.frequencia.totalAulas}`, margin + 5, cursorY + 6);
  doc.text(`Presenças: ${ficha.frequencia.presencas}`, margin + 65, cursorY + 6);
  doc.text(`Faltas: ${ficha.frequencia.faltas} (${ficha.frequencia.faltasJustificadas} Justif.)`, margin + 115, cursorY + 6);
  
  // Percentual
  doc.setFontSize(9.5);
  doc.setTextColor(isCritico ? 200 : isAlerta ? 190 : 16, isCritico ? 20 : isAlerta ? 110 : 130, isCritico ? 40 : 10);
  doc.text(`${ficha.frequencia.percentual}% Presença`, margin + contentWidth - 35, cursorY + 6);

  // Alerta Legal LDB
  doc.setFontSize(8);
  doc.setFont('helvetica', isCritico ? 'bold' : 'normal');
  doc.setTextColor(isCritico ? 180 : isAlerta ? 160 : 70, isCritico ? 20 : isAlerta ? 90 : 80, isCritico ? 30 : 90);
  doc.text(ficha.frequencia.alertaLegal, margin + 5, cursorY + 14);

  cursorY += 26;

  // ── 4. PERFIL INCLUSIVO & ADAPTAÇÕES DUA ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 25, 66);
  doc.text('3. PERFIL INCLUSIVO & DIRETRIZES DE ACESSIBILIDADE DUA', margin, cursorY);
  cursorY += 3;

  doc.setFillColor(250, 251, 255);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(220, 226, 245);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'S');

  doc.setFontSize(8.5);
  if (ficha.inclusao.temNecessidades) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(246, 12, 73); // tom de destaque
    const rotuloTexto = ficha.inclusao.exibirDiagnosticoClinico && Array.isArray(ficha.inclusao.labels)
      ? `Necessidades Atendidas: ${ficha.inclusao.labels.join(', ')}`
      : `Diretrizes Pedagógicas: ${ficha.inclusao.rotuloSigiloso || 'Apoio Metodológico DUA'}`;
    doc.text(rotuloTexto, margin + 5, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 50, 75);
    doc.setFontSize(7.5);
    let recY = cursorY + 11;
    ficha.inclusao.recomendacoes.slice(0, 3).forEach((rec) => {
      doc.text(`• ${rec}`, margin + 5, recY);
      recY += 4.2;
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 100, 120);
    doc.text('• Perfil de Desenvolvimento Regular — sem adaptações curriculares específicas registradas.', margin + 5, cursorY + 8);
    doc.text('• O estudante acompanha as estratégias metodológicas padronizadas da turma.', margin + 5, cursorY + 14);
  }

  cursorY += 30;

  // ── 5. HISTÓRICO DE PRODUÇÃO TEXTUAL / REDAÇÃO (SE HOUVER) ──
  if (ficha.redacao) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(16, 25, 66);
    doc.text('4. DIAGNÓSTICO DE REDAÇÃO & COMPETÊNCIAS ENEM', margin, cursorY);
    cursorY += 3;

    doc.setFillColor(252, 253, 255);
    doc.roundedRect(margin, cursorY, contentWidth, 16, 2, 2, 'F');
    doc.setDrawColor(225, 230, 245);
    doc.roundedRect(margin, cursorY, contentWidth, 16, 2, 2, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 40, 60);
    doc.text(`Total de Redações: ${ficha.redacao.totalRedacoes}`, margin + 5, cursorY + 6);
    doc.text(`Média Pontuação ENEM: ${ficha.redacao.mediaTotal} pts`, margin + 55, cursorY + 6);
    doc.text(`Destaque: ${ficha.redacao.competenciaDestaque}`, margin + 115, cursorY + 6);
    doc.text(`Foco Prioritário: ${ficha.redacao.competenciaAlvo}`, margin + 145, cursorY + 6);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 110, 130);
    doc.text(
      'Análise automática baseada nos critérios e competências da Matriz de Referência do ENEM.',
      margin + 5,
      cursorY + 12
    );

    cursorY += 22;
  }

  // ── 6. PARECER QUALITATIVO & OBSERVAÇÕES PEDAGÓGICAS ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(16, 25, 66);
  doc.text('5. PARECER DESCRITIVO & ENCAMINHAMENTOS DO CONSELHO', margin, cursorY);
  cursorY += 3;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cursorY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(215, 222, 238);
  doc.roundedRect(margin, cursorY, contentWidth, 34, 2, 2, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 80);

  const parecerTexto =
    ficha.parecerPedagogico ||
    'Estudante com participação e engajamento registrados nas atividades pedagógicas. O presente documento foi analisado pelo conselho docente para alinhamento pedagógico e ciência da família.';

  const splitParecer = doc.splitTextToSize(parecerTexto, contentWidth - 10);
  doc.text(splitParecer, margin + 5, cursorY + 7);

  cursorY += 40;

  // ── 7. ASSINATURAS FORMAIS ──
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 110, 130);

  const signW = (contentWidth - 16) / 3;

  // Linha 1: Professor
  const x1 = margin;
  doc.line(x1, cursorY + 12, x1 + signW, cursorY + 12);
  doc.text('Assinatura do(a) Professor(a)', x1 + signW / 2, cursorY + 16, { align: 'center' });

  // Linha 2: Coordenação
  const x2 = margin + signW + 8;
  doc.line(x2, cursorY + 12, x2 + signW, cursorY + 12);
  doc.text('Coordenação Pedagógica / Direção', x2 + signW / 2, cursorY + 16, { align: 'center' });

  // Linha 3: Família / Responsável
  const x3 = margin + (signW + 8) * 2;
  doc.line(x3, cursorY + 12, x3 + signW, cursorY + 12);
  doc.text('Ciência do(a) Responsável Legal', x3 + signW / 2, cursorY + 16, { align: 'center' });

  // Rodapé Oficial
  doc.setFontSize(7);
  doc.setTextColor(150, 160, 180);
  doc.text(
    'Rotina Docente • Sistema de Apoio e Gestão Pedagógica • Documento emitido conforme LDB 9.394/96',
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  const nomeSanitizado = (ficha.aluno.nome || 'aluno').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Ficha_360_${nomeSanitizado}.pdf`);
  return doc;
}
