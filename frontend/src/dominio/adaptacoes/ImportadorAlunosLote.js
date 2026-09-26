import * as xlsx from 'xlsx';
import { AlunoInclusivo } from './AlunoInclusivo';
import { CATEGORIAS_MAP } from './CategoriasDeficiencia';

/**
 * Dicionário de Sinônimos e Termos Escolares para Mapeamento DUA
 */
const MAPEAMENTO_SINONIMOS = [
  {
    id: 'tea',
    termos: [
      'tea',
      'autismo',
      'autista',
      'asperger',
      'f84',
      'espectro autista',
      'transtorno do espectro autista',
    ],
  },
  {
    id: 'di',
    termos: [
      'di',
      'deficiência intelectual',
      'deficiencia intelectual',
      'intelectual',
      'atraso cognitivo',
      'cognitivo',
      'f70',
      'retardo mental',
    ],
  },
  {
    id: 'tdah',
    termos: [
      'tdah',
      'hiperatividade',
      'déficit de atenção',
      'deficit de atencao',
      'desatenção',
      'desatencao',
      'tda',
      'f90',
    ],
  },
  {
    id: 'baixa_visao',
    termos: [
      'baixa visão',
      'baixa visao',
      'visão subnormal',
      'visao subnormal',
      'deficiência visual',
      'deficiencia visual',
      'visual parcial',
      'baixa acuidade visual',
    ],
  },
  {
    id: 'cegueira',
    termos: [
      'cegueira',
      'cego',
      'cega',
      'amaurose',
      'perda visual total',
      'deficiência visual total',
      'deficiencia visual total',
    ],
  },
  {
    id: 'surdez',
    termos: [
      'surdez',
      'surdo',
      'surda',
      'deficiência auditiva',
      'deficiencia auditiva',
      'deficiente auditivo',
      'deficiente auditiva',
      'auditivo',
      'auditiva',
      'perda auditiva',
      'da',
      'hipoacusia',
    ],
  },
  {
    id: 'motora',
    termos: [
      'motora',
      'física',
      'fisica',
      'física / motora',
      'fisica / motora',
      'cadeirante',
      'paralisia cerebral',
      'deficiência física',
      'deficiencia fisica',
      'mobilidade reduzida',
      'hemiparesia',
    ],
  },
  {
    id: 'dislexia',
    termos: [
      'dislexia',
      'disléxico',
      'dislexico',
      'transtorno de leitura',
    ],
  },
  {
    id: 'discalculia',
    termos: [
      'discalculia',
      'transtorno da matemática',
      'transtorno da matematica',
    ],
  },
  {
    id: 'ah_sd',
    termos: [
      'ah_sd',
      'ah/sd',
      'ahsd',
      'altas habilidades',
      'superdotação',
      'superdotacao',
      'superdotado',
      'superdotada',
    ],
  },
];

/**
 * Remove acentos e normaliza string para comparação
 */
function normalizarTextoBusca(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normaliza um texto livre de deficiências (ex: "Autismo e TDAH")
 * para os IDs oficiais de categorias do sistema DUA.
 *
 * @param {string} texto
 * @returns {Array<string>} Lista de IDs oficiais únicos
 */
export function normalizarNecessidadesTexto(texto) {
  if (!texto) return [];
  const raw = String(texto).trim();
  if (!raw) return [];

  const normalizado = normalizarTextoBusca(raw);
  const encontradas = new Set();

  for (const { id, termos } of MAPEAMENTO_SINONIMOS) {
    for (const termo of termos) {
      const termoNorm = normalizarTextoBusca(termo);

      // Casos com siglas curtas: busca palavra exata com word boundary
      if (termoNorm.length <= 4) {
        const regex = new RegExp(`(^|[^a-z0-9])${termoNorm}([^a-z0-9]|$)`, 'i');
        if (regex.test(normalizado)) {
          encontradas.add(id);
          break;
        }
      } else {
        // Expressões mais longas: substring
        if (normalizado.includes(termoNorm)) {
          encontradas.add(id);
          break;
        }
      }
    }
  }

  return Array.from(encontradas);
}

/**
 * Identifica chave de coluna em um objeto tolerando variações de nomes
 */
function encontrarValorColuna(linha, sinonimos) {
  const chaves = Object.keys(linha);
  for (const sin of sinonimos) {
    const sinNorm = normalizarTextoBusca(sin);
    for (const ch of chaves) {
      const chNorm = normalizarTextoBusca(ch);
      if (chNorm === sinNorm || chNorm.includes(sinNorm)) {
        const val = linha[ch];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          return String(val).trim();
        }
      }
    }
  }
  return '';
}

/**
 * Processa uma planilha Excel (.xlsx, .xls) ou arquivo CSV / texto
 * e converte em instâncias de AlunoInclusivo.
 *
 * @param {File|Blob|Buffer|ArrayBuffer|string} input
 * @returns {Promise<{ sucesso: boolean, alunos: Array<AlunoInclusivo>, avisos: Array<string>, totalLinhas: number }>}
 */
export async function parsePlanilhaAlunos(input) {
  let workbook;
  const avisos = [];

  try {
    if (typeof input === 'string') {
      workbook = xlsx.read(input, { type: 'string' });
    } else if (input && typeof input.arrayBuffer === 'function') {
      const ab = await input.arrayBuffer();
      workbook = xlsx.read(new Uint8Array(ab), { type: 'array' });
    } else if (input instanceof ArrayBuffer) {
      workbook = xlsx.read(new Uint8Array(input), { type: 'array' });
    } else if (input instanceof Uint8Array) {
      workbook = xlsx.read(input, { type: 'array' });
    } else if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) {
      workbook = xlsx.read(input, { type: 'buffer' });
    } else {
      throw new Error('Formato de entrada inválido para importação de alunos.');
    }
  } catch (err) {
    throw new Error(`Falha ao ler planilha ou arquivo: ${err.message}`);
  }

  const primeiraAba = workbook.SheetNames[0];
  if (!primeiraAba) {
    throw new Error('A planilha está vazia ou não contém abas válidas.');
  }

  const sheet = workbook.Sheets[primeiraAba];
  const linhasJson = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  if (!linhasJson || linhasJson.length === 0) {
    throw new Error('Nenhuma linha com dados encontrada na planilha.');
  }

  const alunosInstanciados = [];

  linhasJson.forEach((linha, index) => {
    const numLinha = index + 2; // +1 cabeçalho, +1 base zero

    // 1. Nome do Aluno
    const nome = encontrarValorColuna(linha, [
      'nome do aluno',
      'nome',
      'estudante',
      'aluno',
      'nome completo',
    ]);

    // 2. Turma
    const turma = encontrarValorColuna(linha, [
      'turma',
      'ano',
      'serie',
      'classe',
      'sala',
      'ano escolar',
    ]);

    // 3. Deficiência
    const deficienciaTexto = encontrarValorColuna(linha, [
      'deficiência',
      'deficiencia',
      'necessidades',
      'necessidade',
      'diagnóstico',
      'diagnostico',
      'condição',
      'condicao',
      'cid',
      'laudo',
      'pdi',
      'pei',
    ]);

    // 4. Nível de Suporte (opcional)
    const nivelTexto = encontrarValorColuna(linha, [
      'nível de suporte',
      'nivel de suporte',
      'nível',
      'nivel',
      'suporte',
      'grau',
    ]);

    // 5. Hiperfoco (opcional)
    const hiperfoco = encontrarValorColuna(linha, [
      'hiperfoco',
      'interesse',
      'interesses',
      'tema',
    ]);

    // 6. Observações (opcional)
    const observacoes = encontrarValorColuna(linha, [
      'observações',
      'observacoes',
      'obs',
      'anotações',
      'anotacoes',
      'detalhes',
    ]);

    if (!nome || nome.length < 2) {
      avisos.push(`Linha ${numLinha}: ignorada porque o nome do aluno está vazio ou incompleto.`);
      return;
    }

    const necessidades = normalizarNecessidadesTexto(deficienciaTexto);
    if (necessidades.length === 0) {
      avisos.push(
        `Linha ${numLinha} (${nome}): ignorada porque a deficiência "${deficienciaTexto || 'vazia'}" não foi reconhecida.`
      );
      return;
    }

    let nivelSuporte = 1;
    const numNivel = parseInt(nivelTexto, 10);
    if ([1, 2, 3].includes(numNivel)) {
      nivelSuporte = numNivel;
    }

    try {
      const aluno = new AlunoInclusivo({
        nome,
        turmaNome: turma,
        necessidades,
        nivelSuporte,
        hiperfoco,
        observacoes,
      });
      alunosInstanciados.push(aluno);
    } catch (err) {
      avisos.push(`Linha ${numLinha} (${nome}): erro ao validar estudante (${err.message}).`);
    }
  });

  return {
    sucesso: true,
    totalLinhas: linhasJson.length,
    alunos: alunosInstanciados,
    avisos,
  };
}

/**
 * Gera estrutura do modelo de planilha de exemplo recomendada para download
 */
export function gerarModeloPlanilhaExemplo() {
  const colunas = [
    'Nome',
    'Turma',
    'Deficiência',
    'Nível de Suporte',
    'Hiperfoco',
    'Observações',
  ];

  const linhasExemplo = [
    {
      Nome: 'Ana Beatriz Mastop',
      Turma: '101',
      Deficiência: 'Autismo (TEA)',
      'Nível de Suporte': '1',
      Hiperfoco: 'Desenho e Artes',
      Observações: 'Prefere instruções visuais curtas e objetivas',
    },
    {
      Nome: 'Lucas Gabriel Souza',
      Turma: '102',
      Deficiência: 'TDAH e Dislexia',
      'Nível de Suporte': '2',
      Hiperfoco: 'Robótica e Games',
      Observações: 'Pausas estratégicas e enunciados em negrito',
    },
    {
      Nome: 'Carlos Eduardo Lima',
      Turma: '103',
      Deficiência: 'Deficiência Intelectual',
      'Nível de Suporte': '2',
      Hiperfoco: 'Música e Animais',
      Observações: 'Leitura Fácil e conceitos concretos',
    },
    {
      Nome: 'Mariana Silva',
      Turma: '201',
      Deficiência: 'Baixa Visão',
      'Nível de Suporte': '1',
      Hiperfoco: '',
      Observações: 'Fonte ampliada 20pt e alto contraste',
    },
    {
      Nome: 'Pedro Oliveira',
      Turma: '202',
      Deficiência: 'Surdez',
      'Nível de Suporte': '1',
      Hiperfoco: '',
      Observações: 'Português L2, apoio imagético e orações diretas',
    },
  ];

  return {
    colunas,
    linhasExemplo,
  };
}

/**
 * Exporta o arquivo Excel binário de modelo para download direto no browser
 */
export function gerarArquivoModeloExcel() {
  const { linhasExemplo } = gerarModeloPlanilhaExemplo();
  const ws = xlsx.utils.json_to_sheet(linhasExemplo);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Modelo_Estudantes_PEI');
  return xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
}
