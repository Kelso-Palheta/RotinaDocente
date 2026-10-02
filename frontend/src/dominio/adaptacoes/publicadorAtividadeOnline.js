/**
 * Domínio: Acessibilidade & Adaptações
 * Publicação Digital de Atividades Adaptadas no Portal do Aluno
 * Referência: specs/RULES.md (RN-59) e specs/TESTS_SPEC.md (UT-33)
 */

/**
 * Normaliza alternativas de uma questão adaptada para objetos estruturados { id, texto }.
 * Suporta formatos como "A) Texto", "A - Texto", "A. Texto" ou objetos pré-formatados.
 * 
 * @param {Array<string|Object>} alternativas
 * @returns {Array<{ id: string, texto: string }>}
 */
export function normalizarAlternativasQuestao(alternativas = []) {
  if (!Array.isArray(alternativas)) return [];

  return alternativas
    .map((alt, idx) => {
      if (!alt) return null;

      if (typeof alt === 'object' && alt.id && alt.texto) {
        return {
          id: String(alt.id).trim().toUpperCase(),
          texto: String(alt.texto).trim(),
        };
      }

      if (typeof alt === 'string') {
        const str = alt.trim();
        const match = str.match(/^([A-Ea-e])[\)\.\-:\s]+(.*)$/);
        if (match) {
          return {
            id: match[1].toUpperCase(),
            texto: match[2].trim(),
          };
        }

        // Sem letra explícita: atribui letra sequencial A, B, C, D, E...
        const letra = String.fromCharCode(65 + idx);
        return {
          id: letra,
          texto: str,
        };
      }

      return null;
    })
    .filter(Boolean);
}

/**
 * Converte uma atividade adaptada DUA no formato canônico da coleção `atividades`
 * com suporte ao Portal do Aluno e Leitor Imersivo.
 * 
 * @param {Object} params
 * @param {Object} params.adaptacao - Objeto de adaptação gerado pela IA ou salvo no banco
 * @param {string} params.turmaId - ID da turma no Diário
 * @param {string} params.alunoId - ID do estudante no Diário
 * @param {string} params.professorId - UID do professor
 * @param {number} [params.bimestre=1] - Bimestre letivo (1 a 4)
 * @param {string} [params.prazoEntrega] - ISO string da data limite de entrega
 * @returns {Object} Atividade formatada para gravação no Firestore
 */
export function converterAdaptadaParaAtividadeOnline({
  adaptacao,
  turmaId,
  alunoId,
  professorId,
  bimestre = 1,
  prazoEntrega,
}) {
  if (!adaptacao || typeof adaptacao !== 'object') {
    throw new Error('A adaptação é obrigatória para conversão online.');
  }

  if (!turmaId || typeof turmaId !== 'string') {
    throw new Error('O ID da turma é obrigatório.');
  }

  if (!alunoId || typeof alunoId !== 'string') {
    throw new Error('O ID do aluno é obrigatório.');
  }

  if (!professorId || typeof professorId !== 'string') {
    throw new Error('O ID do professor é obrigatório.');
  }

  const questoesBrutas =
    adaptacao.atividadeAdaptada?.questoes ||
    adaptacao.questoes ||
    [];

  const qtdQuestoes = questoesBrutas.length || 1;
  const notaPorQuestao = Math.round((10 / qtdQuestoes) * 100) / 100;

  const questoesConvertidas = questoesBrutas.map((q, idx) => {
    const numero = Number(q.numero) || idx + 1;
    const alternativas = normalizarAlternativasQuestao(q.alternativas);
    const tipo = alternativas.length > 0 ? 'multipla_escolha' : 'discursiva';

    // Normalização das imagens de apoio visual
    const imagens = [];
    if (q.imagemUrl) {
      imagens.push({ url: q.imagemUrl });
    } else if (Array.isArray(q.imagens)) {
      q.imagens.forEach((img) => {
        if (typeof img === 'string') imagens.push({ url: img });
        else if (img?.url || img?.base64) imagens.push(img);
      });
    }

    return {
      id: `q_${numero}`,
      numero,
      enunciado: q.enunciado || '',
      tipo,
      notaMaxima: Number(q.notaMaxima) || notaPorQuestao,
      alternativas,
      apoioVisualDescricao: q.apoioVisualDescricao || '',
      imagens,
      scaffolding: q.scaffolding || q.dica || '',
      gabarito: q.gabarito || '',
    };
  });

  const prazoPadrao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    titulo: adaptacao.titulo || 'Atividade Adaptada',
    descricao: adaptacao.atividadeAdaptada?.instrucoesAluno || 'Atividade adaptada de acordo com as diretrizes DUA.',
    disciplina: adaptacao.disciplina || 'Geral',
    anoEscolar: adaptacao.anoEscolar || '',
    bimestre: Number(bimestre) || 1,
    turmaIds: [turmaId],
    professorId,
    tipoAtividade: 'adaptada',
    alunoExclusivoId: alunoId,
    alunoNome: adaptacao.aluno?.nome || '',
    necessidades: adaptacao.aluno?.necessidades || [],
    questoes: questoesConvertidas,
    notaMaxima: 10,
    dataEntrega: prazoEntrega || prazoPadrao,
  };
}

/**
 * Filtra uma lista de atividades para um aluno específico, garantindo que atividades adaptadas
 * exclusivas só apareçam para seu respectivo destinatário.
 * 
 * @param {Array<Object>} atividades
 * @param {string} alunoId
 * @returns {Array<Object>}
 */
export function filtrarAtividadesParaAluno(atividades = [], alunoId) {
  if (!Array.isArray(atividades)) return [];

  return atividades.filter((atv) => {
    // Atividade regular da turma
    if (!atv.alunoExclusivoId) {
      return true;
    }

    // Atividade exclusiva para este aluno
    return atv.alunoExclusivoId === alunoId;
  });
}
