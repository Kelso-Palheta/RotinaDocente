/**
 * Domínio: Diário Pedagógico
 * Gestão de Ocorrências Pedagógicas e Diário de Bordo da Turma
 * Referência: specs/RULES.md (RN-58) e specs/TESTS_SPEC.md (UT-32)
 */

export const TIPOS_OCORRENCIA = [
  'pedagogica',
  'comportamental',
  'elogio',
  'alinhamento_familia',
];

export const LABELS_TIPO = {
  pedagogica: {
    label: 'Pedagógica / Aprendizagem',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: '📘',
  },
  comportamental: {
    label: 'Comportamental / Convivência',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: '⚠️',
  },
  elogio: {
    label: 'Elogio & Destaque',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: '⭐',
  },
  alinhamento_familia: {
    label: 'Alinhamento com a Família',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: '👪',
  },
};

/**
 * Adiciona uma nova ocorrência pedagógica à coleção de forma imutável e ordenada.
 * 
 * @param {Array<Object>} ocorrencias - Lista atual de ocorrências da turma
 * @param {Object} novaOcorrencia - Dados da nova ocorrência
 * @returns {Array<Object>} Nova lista ordenada por data decrescente
 */
export function adicionarOcorrencia(ocorrencias = [], novaOcorrencia = {}) {
  if (!novaOcorrencia || typeof novaOcorrencia !== 'object') {
    throw new Error('Ocorrência inválida.');
  }

  const { tipo, titulo, descricao, data, alunoIds, visivelFamilia, id, criadoEm } = novaOcorrencia;

  if (!tipo || !TIPOS_OCORRENCIA.includes(tipo)) {
    throw new Error(`Tipo de ocorrência inválido: "${tipo}". Tipos permitidos: ${TIPOS_OCORRENCIA.join(', ')}.`);
  }

  if (typeof titulo !== 'string' || !titulo.trim()) {
    throw new Error('O título da ocorrência é obrigatório.');
  }

  if (typeof descricao !== 'string' || !descricao.trim()) {
    throw new Error('A descrição da ocorrência é obrigatória.');
  }

  const dataNormalizada = (typeof data === 'string' && data.trim())
    ? data.trim().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const nova = {
    id: id || `oc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    data: dataNormalizada,
    tipo,
    titulo: titulo.trim(),
    descricao: descricao.trim(),
    alunoIds: Array.isArray(alunoIds) ? alunoIds : [],
    visivelFamilia: Boolean(visivelFamilia),
    criadoEm: criadoEm || new Date().toISOString(),
  };

  const listaAtualizada = [...(Array.isArray(ocorrencias) ? ocorrencias : []), nova];

  // Ordenar decrescente: data mais recente primeiro, e timestamp criadoEm como critério de desempate
  return listaAtualizada.sort((a, b) => {
    if (a.data !== b.data) {
      return b.data.localeCompare(a.data);
    }
    return (b.criadoEm || '').localeCompare(a.criadoEm || '');
  });
}

/**
 * Filtra as ocorrências pedagógicas por múltiplos critérios.
 * 
 * @param {Array<Object>} ocorrencias - Lista de ocorrências
 * @param {Object} filtros
 * @param {string} [filtros.tipo] - Tipo específico ('pedagogica', 'elogio', etc.)
 * @param {string} [filtros.alunoId] - ID de um aluno envolvido
 * @param {string} [filtros.termo] - Busca textual no título e descrição
 * @param {boolean} [filtros.apenasFamilia] - Se filtra apenas as marcadas para a família
 * @returns {Array<Object>}
 */
export function filtrarOcorrencias(ocorrencias = [], filtros = {}) {
  if (!Array.isArray(ocorrencias)) return [];

  const { tipo, alunoId, termo, apenasFamilia } = filtros;
  const termoFormatado = termo ? termo.toLowerCase().trim() : '';

  return ocorrencias.filter((oc) => {
    if (tipo && oc.tipo !== tipo) {
      return false;
    }

    if (alunoId && (!Array.isArray(oc.alunoIds) || !oc.alunoIds.includes(alunoId))) {
      return false;
    }

    if (apenasFamilia && !oc.visivelFamilia) {
      return false;
    }

    if (termoFormatado) {
      const matchTitulo = oc.titulo?.toLowerCase().includes(termoFormatado);
      const matchDesc = oc.descricao?.toLowerCase().includes(termoFormatado);
      if (!matchTitulo && !matchDesc) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Remove uma ocorrência pelo ID de forma imutável.
 * 
 * @param {Array<Object>} ocorrencias 
 * @param {string} ocorrenciaId 
 * @returns {Array<Object>}
 */
export function removerOcorrencia(ocorrencias = [], ocorrenciaId) {
  if (!Array.isArray(ocorrencias)) return [];
  return ocorrencias.filter((oc) => oc.id !== ocorrenciaId);
}
