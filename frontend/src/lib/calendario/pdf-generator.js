const STATUS = {
  CONCLUIDA: 'Concluída', PARCIAL: 'Parcial',
  NAO_REALIZADA: 'Não realizada', AGENDADA: 'Agendada',
};
const dataLegivel = value => {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || 'Não informado');
};
const textoSimples = value => String(value ?? '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/[–—]/g, '-');

/** Exporta dados completos. Aceita o objeto da página e a assinatura posicional legada. */
export const generateCalendarioPDF = async (dados = [], nomeTurma = 'Turma', professorEmail = 'Professor') => {
  const opcoes = Array.isArray(dados) ? { aulas: dados, nomeTurma, professorNome: professorEmail } : (dados || {});
  const aulas = Array.isArray(opcoes.aulas) ? opcoes.aulas : [];
  const nome = opcoes.turma?.nome || (typeof opcoes.turma === 'string' ? opcoes.turma : null) || opcoes.nomeTurma || nomeTurma;
  const professor = opcoes.professorNome || opcoes.professorEmail || professorEmail;
  const grade = opcoes.grade || {};
  const inicio = opcoes.dataInicio || opcoes.periodo?.dataInicio || grade.dataInicio;
  const fim = opcoes.dataFim || opcoes.periodo?.dataFim || grade.dataFim;
  const ano = opcoes.anoLetivo || opcoes.ano || grade.anoLetivo || inicio?.slice(0, 4) || aulas[0]?.dataAgendada?.slice(0, 4);
  const plano = opcoes.planejamento?.topicos || opcoes.plano?.topicos || opcoes.topicos || [];
  const topicosPorId = new Map(plano.map(t => [String(t.id ?? t.topicoId), t]));
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('portrait', 'mm', 'a4');
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 15;
  let y;
  const novaPagina = () => {
    if (y !== undefined) doc.addPage();
    doc.setFillColor(16, 25, 66);
    doc.rect(0, 0, largura, 25, 'F');
    doc.setFillColor(246, 12, 73);
    doc.rect(0, 25, largura, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('Calendário Pedagógico', margem, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Rotina Docente', margem, 20);
    y = 36;
  };
  const escrever = (texto, { negrito = false, cor = [16, 25, 66], tamanho = 10 } = {}) => {
    if (!texto) return;
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setFontSize(tamanho);
    const linhas = doc.splitTextToSize(textoSimples(texto), largura - margem * 2);
    for (const linha of linhas) {
      if (y > altura - 21) novaPagina();
      // A criação da página redefine fonte/cor; reaplicá-las mantém a continuação legível.
      doc.setFont('helvetica', negrito ? 'bold' : 'normal');
      doc.setFontSize(tamanho);
      doc.setTextColor(...cor);
      doc.text(linha, margem, y);
      y += tamanho * 0.45 + 0.5;
    }
  };
  const separar = () => {
    y += 3;
    if (y > altura - 25) novaPagina();
    doc.setDrawColor(220, 224, 240);
    doc.line(margem, y, largura - margem, y);
    y += 7;
  };
  novaPagina();
  escrever(`Turma: ${nome}`, { negrito: true, tamanho: 12 });
  escrever(`Professor: ${professor}`);
  if (ano) escrever(`Ano letivo: ${ano}`);
  if (inicio || fim) escrever(`Período: ${dataLegivel(inicio)} a ${dataLegivel(fim)}`);
  escrever(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, { tamanho: 9 });
  separar();
  escrever('Aulas e registros pedagógicos', { negrito: true, tamanho: 12 });
  const ordenadas = [...aulas].sort((a, b) => `${a.dataAgendada || ''} ${a.horarioInicio || ''}`.localeCompare(`${b.dataAgendada || ''} ${b.horarioInicio || ''}`));
  if (!ordenadas.length) escrever('Nenhuma aula agendada para esta turma.');
  for (const aula of ordenadas) {
    separar();
    escrever(`${dataLegivel(aula.dataAgendada)} | ${aula.horarioInicio || '--:--'} - ${aula.horarioFim || '--:--'}`, { negrito: true });
    escrever(`Status: ${STATUS[aula.status] || aula.status || STATUS.AGENDADA}`, { negrito: true });
    const associados = aula.topicosAssociados?.length ? aula.topicosAssociados : aula.historicoConteudos?.length ? aula.historicoConteudos : aula.topicoTitulo || aula.topicoId ? [{ topicoId: aula.topicoId, topicoTitulo: aula.topicoTitulo, descricao: aula.descricao }] : [];
    if (associados.length && (aula.conteudoEncaminhado || aula.status === 'NAO_REALIZADA')) escrever('Histórico de conteúdo - não representa agendamento ativo', { tamanho: 9, cor: [96, 112, 160] });
    if (!associados.length) escrever('Conteúdo: A definir', { cor: [96, 112, 160] });
    for (const vinculo of associados) {
      const topico = topicosPorId.get(String(vinculo.id ?? vinculo.topicoId)) || {};
      escrever(`Conteúdo: ${vinculo.titulo || vinculo.topicoTitulo || topico.titulo || topico.topicoTitulo || 'Sem título'}`, { negrito: true });
      escrever(vinculo.descricao || vinculo.topicoDescricao || topico.descricao || topico.topicoDescricao);
    }
    const campos = [
      ['Observações', aula.execucao?.observacoes || aula.execucao?.observacao || aula.observacoes || aula.observacao],
      ['Justificativa', aula.execucao?.justificativa || aula.justificativa],
      ['Conteúdo restante', aula.execucao?.restante || aula.restante || aula.conteudoRestante || aula.descricaoRestante],
      ['Motivo do bloqueio', aula.motivoCancelamento || aula.motivo],
    ];
    for (const [rotulo, valor] of campos) if (valor) escrever(`${rotulo}: ${valor}`);
  }
  const feriados = opcoes.feriados || [];
  if (feriados.length) {
    separar();
    escrever('Feriados e recessos do período', { negrito: true, tamanho: 12 });
    for (const feriado of [...feriados].sort((a, b) => String(a.data || a.dataInicio || '').localeCompare(String(b.data || b.dataInicio || '')))) {
      escrever(`${dataLegivel(feriado.data || feriado.dataInicio)}${feriado.dataFim ? ` a ${dataLegivel(feriado.dataFim)}` : ''}: ${feriado.nome || feriado.titulo || feriado.descricao || 'Dia sem aula'}`);
    }
  }
  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(96, 112, 160);
    doc.text(`Página ${p} de ${paginas}`, largura - margem, altura - 10, { align: 'right' });
    doc.text('Rotina Docente', margem, altura - 10);
  }
  doc.save(`cronograma_${String(nome).replace(/[^\p{L}\p{N}_-]+/gu, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  return doc;
};
