import { calcTotal, clamp, fmt, round2, temNota } from '@/utils/diario/calculos';
import { faixaNotaBimestral } from '@/utils/diario/coresNota';

const CORES = { abaixo: [220, 38, 38], aprovado: [37, 99, 235], excelente: [22, 163, 74], sem_nota: [148, 163, 184] };

function dadosBimestre(turma, bimestre) {
  if (!['1', '2', '3', '4'].includes(String(bimestre))) throw new Error('Escolha um bimestre de 1 a 4.');
  if (!turma || !Array.isArray(turma.alunos)) throw new Error('Escolha uma turma válida.');
  const dados = turma.bimestres?.[String(bimestre)] || {};
  const atividades = dados.atividades || [];
  const config = dados.config || {};
  const alunos = turma.alunos.map((aluno, index) => {
    const notas = dados.notas?.[aluno.id] || {};
    const temAtividades = atividades.some(atividade => notas[atividade.id] !== '' && notas[atividade.id] != null);
    const soma = round2(Math.min(atividades.reduce((total, atividade) => total + clamp(Number(notas[atividade.id]) || 0, 0, Number(atividade.max)), 0), Number(config.atividadesMaxFinal ?? 5)));
    return { aluno, ordem: index + 1, notas, somaAtividades: temAtividades ? soma : null, total: temNota(notas, atividades) ? calcTotal(notas.simulado, atividades, notas, config) : null };
  });
  return { atividades, config, alunos, bimestre: Number(bimestre) };
}

function celulaCSV(valor) {
  let texto = String(valor ?? '');
  // Planilhas não devem interpretar nomes de pessoas/atividades como fórmulas.
  if (/^[\s]*[=+@-]/.test(texto)) texto = `'${texto}`;
  return /[;"\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

const notaCSV = value => value == null || value === '' ? '' : fmt(value);

/** CSV puro, limitado ao período escolhido; preserva nomes e notas ausentes. */
export function montarCSVNotasBimestre(turma, bimestre) {
  const dados = dadosBimestre(turma, bimestre);
  const cabecalho = ['Turma', 'Bimestre', 'Ordem', 'Nome do aluno', 'Simulado', ...dados.atividades.map(atividade => `${atividade.nome || 'Atividade'} (máx. ${fmt(atividade.max)})`), 'Soma atividades (limitada ao teto)', 'Total do bimestre'];
  const linhas = dados.alunos.map(({ aluno, ordem, notas, somaAtividades, total }) => [turma.nome, `${dados.bimestre}º bimestre`, ordem, aluno.nome, notaCSV(notas.simulado), ...dados.atividades.map(atividade => notaCSV(notas[atividade.id])), notaCSV(somaAtividades), notaCSV(total)]);
  return '\uFEFF' + [cabecalho, ...linhas].map(linha => linha.map(celulaCSV).join(';')).join('\r\n');
}

const nomeArquivo = (turma, bimestre) => `notas_${String(turma.nome).replace(/[^\p{L}\p{N}_-]+/gu, '_')}_${bimestre}bim_${new Date().toISOString().slice(0, 10)}`;

export function exportBimestreCSV(turma, bimestre) {
  const csv = montarCSVNotasBimestre(turma, bimestre);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${nomeArquivo(turma, bimestre)}.csv`);
  document.body.appendChild(link);
  try { link.click(); }
  finally { link.remove(); URL.revokeObjectURL(url); }
  return csv;
}

/** Tabelas por blocos de atividades e catálogo integral; nunca corta nomes. */
export async function generateRelatorioBimestrePDF(turma, bimestre, professorNome = 'Professor(a)') {
  const dados = dadosBimestre(turma, bimestre);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const margem = 12;
  const larguraUtil = largura - margem * 2;
  const limiteY = altura - 20;
  let y = 36;

  const cabecalhoPagina = () => {
    doc.setFillColor(16, 25, 66); doc.rect(0, 0, largura, 29, 'F');
    doc.setFillColor(246, 12, 73); doc.rect(0, 29, largura, 1, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
    doc.text('Rotina Docente - Relatório de notas', margem, 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.text(`${dados.bimestre}º bimestre - somente o período selecionado`, margem, 21);
  };
  const novaPagina = () => { doc.addPage(); cabecalhoPagina(); y = 36; };
  const paragrafo = (texto, tamanho = 9, negrito = false) => {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal'); doc.setFontSize(tamanho); doc.setTextColor(16, 25, 66);
    const linhas = doc.splitTextToSize(String(texto), larguraUtil);
    linhas.forEach(linha => {
      if (y + 5 > limiteY) novaPagina();
      doc.setFont('helvetica', negrito ? 'bold' : 'normal'); doc.setFontSize(tamanho); doc.setTextColor(16, 25, 66);
      doc.text(linha, margem, y); y += 4.5;
    });
    y += 2;
  };
  cabecalhoPagina();
  paragrafo(`Turma: ${turma.nome}${turma.anoLetivo ? ` | Ano letivo: ${turma.anoLetivo}` : ''}`, 11, true);
  paragrafo(`Professor(a): ${professorNome} | Alunos: ${dados.alunos.length} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`);
  paragrafo(`Simulado: lançamento até ${fmt(dados.config.simuladoMaxLanca ?? 5)}, contribuição até ${fmt(dados.config.simuladoMaxFinal ?? 5)}. Atividades: soma limitada a ${fmt(dados.config.atividadesMaxFinal ?? 5)}.`);
  paragrafo(`Total: vermelho abaixo de ${fmt(dados.config.mediaAprovacao ?? 5)}; azul a partir da média; verde a partir de 8,00 e da média. Traço indica ausência de nota.`);

  const blocos = [];
  for (let inicio = 0; inicio < dados.atividades.length; inicio += 4) blocos.push(dados.atividades.slice(inicio, inicio + 4));
  if (!blocos.length) blocos.push([]);
  blocos.forEach((atividades, indiceBloco) => {
    if (indiceBloco > 0) novaPagina();
    const colunas = [
      { nome: 'Nº / Nome do aluno', largura: atividades.length ? 85 : larguraUtil - 68, campo: 'nome' },
      { nome: 'Simulado', largura: 22, campo: 'simulado' },
      ...atividades.map((atividade, index) => ({ nome: `Ativ. ${indiceBloco * 4 + index + 1}`, largura: (larguraUtil - 153) / atividades.length, campo: atividade.id })),
      { nome: 'Soma atv.', largura: 23, campo: 'soma' },
      { nome: 'Total bim.', largura: 23, campo: 'total' },
    ];
    const cabecalhoTabela = () => {
      if (y + 18 > limiteY) novaPagina();
      doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(16, 25, 66);
      doc.text(`Notas do ${dados.bimestre}º bimestre${blocos.length > 1 ? ` - bloco ${indiceBloco + 1}/${blocos.length}` : ''}`, margem, y); y += 3;
      doc.setFillColor(238, 240, 248); doc.rect(margem, y, larguraUtil, 8, 'F');
      let x = margem;
      colunas.forEach((coluna, index) => {
        doc.setFontSize(8);
        doc.text(coluna.nome, index ? x + coluna.largura / 2 : x + 2, y + 5.3, index ? { align: 'center' } : {});
        x += coluna.largura;
      });
      y += 8;
    };
    const novaPaginaTabela = () => { novaPagina(); cabecalhoTabela(); };
    cabecalhoTabela();
    if (!dados.alunos.length) { y += 5; paragrafo('Nenhum aluno cadastrado nesta turma.'); }
    dados.alunos.forEach(({ aluno, ordem, notas, somaAtividades, total }) => {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      const linhasNome = doc.splitTextToSize(`${ordem}. ${aluno.nome}`, colunas[0].largura - 4);
      while (linhasNome.length) {
        if (y + 9 > limiteY) novaPaginaTabela();
        const capacidade = Math.max(1, Math.floor((limiteY - y - 4) / 3.8));
        const linhas = linhasNome.splice(0, capacidade);
        const alturaLinha = Math.max(8, linhas.length * 3.8 + 4);
        if (ordem % 2 === 0) { doc.setFillColor(247, 248, 252); doc.rect(margem, y, larguraUtil, alturaLinha, 'F'); }
        doc.setDrawColor(220, 224, 240); doc.line(margem, y + alturaLinha, largura - margem, y + alturaLinha);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(16, 25, 66);
        linhas.forEach((linha, index) => doc.text(linha, margem + 2, y + 4.5 + index * 3.8));
        let x = margem + colunas[0].largura;
        colunas.slice(1).forEach(coluna => {
          const valor = coluna.campo === 'simulado' ? notas.simulado : coluna.campo === 'soma' ? somaAtividades : coluna.campo === 'total' ? total : notas[coluna.campo];
          const cor = coluna.campo === 'total' ? CORES[faixaNotaBimestral(valor, dados.config)] : [16, 25, 66];
          doc.setTextColor(...cor); doc.setFont('helvetica', coluna.campo === 'total' ? 'bold' : 'normal');
          doc.text(valor == null || valor === '' ? '-' : fmt(valor), x + coluna.largura / 2, y + 4.5, { align: 'center' });
          x += coluna.largura;
        });
        y += alturaLinha;
        if (linhasNome.length) {
          novaPaginaTabela();
        }
      }
    });
    y += 6;
  });
  if (dados.atividades.length) {
    if (y + 20 > limiteY) novaPagina();
    paragrafo('Atividades deste bimestre - nomes completos', 11, true);
    dados.atividades.forEach((atividade, index) => paragrafo(`Ativ. ${index + 1}: ${atividade.nome || 'Atividade sem título'} | Nota máxima: ${fmt(atividade.max)}`));
  }
  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(96, 112, 160);
    doc.text(`${dados.bimestre}º bimestre | Página ${pagina} de ${paginas}`, margem, altura - 12);
  }
  doc.save(`${nomeArquivo(turma, bimestre)}.pdf`);
  return doc;
}
