import { fmt } from '@/utils/diario/calculos';
import { montarAnalise } from '@/dominio/analytics/analise';

/** Exporta o mesmo dataset consultivo da tela, incluindo ausências e parciais. */
export async function generateAnalyticsPDF({
  turmas = [],
  analise,
  periodo,
  bimestre = '1',
  ano = 'Não informado',
  professorNome = 'Professor(a)',
  turmaSelecionadaNome = 'Todas as turmas',
  origem = 'Consulta do Diário',
  atualizadoEm = null,
} = {}) {
  const dados = analise || montarAnalise(turmas, periodo || String(bimestre));
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('portrait', 'mm', 'a4');
  let y = 16;
  const novaPagina = () => {
    doc.addPage();
    y = 16;
    doc.setFontSize(10);
    doc.text(`Analytics | ${dados.rotulo} | ${ano}`, 14, y);
    y += 9;
  };
  const escrever = (texto, { cor = [16, 25, 66], negrito = false } = {}) => {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...cor);
    const partes = doc.splitTextToSize(String(texto).replaceAll('≥', '>=').replaceAll('≤', '<='), 180);
    for (const linha of partes) {
      if (y > 278) novaPagina();
      doc.text(linha, 14, y);
      y += 5;
    }
    y += 2;
  };
  escrever('Dashboard Analytics — acompanhamento pedagógico', { negrito: true });
  escrever(`${professorNome} | Ano: ${ano} | ${dados.rotulo}`);
  escrever(`Escopo: ${turmaSelecionadaNome} | Origem: ${origem}`);
  escrever(
    `Consulta: ${atualizadoEm ? new Date(atualizadoEm).toLocaleString('pt-BR') : 'Horário indisponível'}`,
  );
  escrever('Documento para conferência. Exportação não homologa resultados escolares.');
  escrever(
    `Matrículas: ${dados.totalAlunos} | Avaliadas: ${dados.totalAvaliados} | Sem nota: ${dados.totalSemNota} | Parciais: ${dados.totalParciais}`,
  );
  escrever(
    `Média: ${dados.escalasDiferentes ? 'Escalas diferentes — consulte cada turma' : fmt(dados.mediaGeral)} | ${dados.bimestral ? 'No mínimo bimestral (provisório)' : 'Aprovados entre etapas concluídas'}: ${dados.taxaAprovacao === null ? 'Indisponível' : dados.taxaAprovacao + '%'} | Atenção: ${dados.taxaAtencao === null ? 'Indisponível' : dados.taxaAtencao + '%'}`,
  );
  escrever('Critérios por turma', { negrito: true });
  const criterios = new Set();
  for (const l of dados.linhas) {
    const criterio = `${l.turmaNome}${l.disciplina ? ' / ' + l.disciplina : ''}: ${l.criterio}`;
    if (!criterios.has(criterio)) {
      escrever(criterio);
      criterios.add(criterio);
    }
  }
  escrever(`Acompanhamento: ${dados.emAtencao.length} matrícula(s). Sugestões exigem revisão docente.`);
  escrever('Desempenho de todos os estudantes', { negrito: true });
  for (const l of dados.linhas) {
    escrever(`${l.nome} | Turma ${l.turmaNome}${l.disciplina ? ' / ' + l.disciplina : ''}`, {
      negrito: true,
    });
    const cor =
      l.faixa === 'abaixo'
        ? [185, 28, 28]
        : l.faixa === 'excelente'
          ? [21, 128, 61]
          : l.faixa === 'aprovado'
            ? [29, 78, 216]
            : [100, 116, 139];
    escrever(
      `Nota: ${l.nota === null ? 'Sem nota' : fmt(l.nota)} | ${l.situacao}${l.parcial ? ' | Resultado parcial' : ''} | Mínimo: ${l.minimo}`,
      { cor },
    );
  }
  const paginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Rotina Docente | ${i}/${paginas}`, 14, 290);
  }
  doc.save(`analytics-${dados.periodo}-${String(ano).replace(/[^a-z0-9]/gi, '-')}.pdf`);
  return doc;
}
