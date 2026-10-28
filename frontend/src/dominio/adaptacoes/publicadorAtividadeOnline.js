import {pendenciasVisuais} from './qualidadeVisual';
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
  recuperacao = null,
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

  // Recuperação semestral: a atividade adaptada é uma parcela do conjunto,
  // não uma atividade de bimestre. Sem contexto íntegro, nada é publicado.
  let contextoRecuperacao = null;
  if (recuperacao) {
    const conjuntoId = typeof recuperacao.conjuntoId === 'string' ? recuperacao.conjuntoId.trim() : '';
    const semestre = String(recuperacao.semestre ?? '').trim();
    const pontos = Number(recuperacao.pontosMaximos);
    if (!conjuntoId) throw new Error('Conjunto de recuperação obrigatório.');
    if (!['1', '2'].includes(semestre)) throw new Error('Semestre da recuperação inválido.');
    if (!Number.isFinite(pontos) || pontos <= 0 || pontos > 10) {
      throw new Error('A parcela da recuperação deve valer mais que zero e até 10 pontos.');
    }
    contextoRecuperacao = {
      conjuntoId,
      semestre,
      pontosCentesimos: Math.round(pontos * 100),
      conjuntoVersao: recuperacao.conjuntoVersao ?? null,
      anoLetivo: recuperacao.anoLetivo ?? null,
    };
  }

  const questoesBrutas =
    adaptacao.atividadeAdaptada?.questoes ||
    adaptacao.questoes ||
    [];

  if(adaptacao.versaoVisual===2){
    const pendencias=pendenciasVisuais(questoesBrutas);if(pendencias.length)throw new Error(pendencias.join(' '));
    if(!questoesBrutas.length)throw new Error('Inclua ao menos uma questão antes de publicar.');
  }
  const qtdQuestoes = questoesBrutas.length || 1;
  const notaPorQuestao = Math.round((10 / qtdQuestoes) * 100) / 100;
  // Recuperação distribui a parcela inteira em centésimos, sem sobra.
  const baseRecuperacao = contextoRecuperacao
    ? Math.floor(contextoRecuperacao.pontosCentesimos / qtdQuestoes)
    : 0;
  const restoRecuperacao = contextoRecuperacao
    ? contextoRecuperacao.pontosCentesimos % qtdQuestoes
    : 0;

  const questoesConvertidas = questoesBrutas.map((q, idx) => {
    const numero = Number(q.numero) || idx + 1;
    const alternativas = normalizarAlternativasQuestao(q.alternativas);
    const tipo = alternativas.length > 0 ? 'multipla_escolha' : 'discursiva';
    const gabarito=typeof q.gabarito==='string'?q.gabarito.trim():'';
    if(adaptacao.versaoVisual===2 && alternativas.length && (!alternativas.some(a=>a.id===gabarito)||!['multipla_escolha',undefined].includes(q.tipo)))throw new Error(`Questão ${idx+1}: revise o tipo e informe um gabarito válido antes de publicar.`);

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

    const notaQuestao = contextoRecuperacao
      ? (baseRecuperacao + (idx < restoRecuperacao ? 1 : 0)) / 100
      : Number(q.notaMaxima) || (adaptacao.versaoVisual===2 ? (Math.floor(1000/qtdQuestoes)+(idx<1000%qtdQuestoes?1:0))/100 : notaPorQuestao);

    return {
      id: `q_${numero}`,
      numero,
      enunciado: q.enunciado || '',
      tipo,
      notaMaxima: notaQuestao,
      alternativas,
      apoioVisualDescricao: q.apoioVisualDescricao || '',
      imagens,
      scaffolding: q.scaffolding || q.dicaScaffolding || q.dica || '',
      gabarito: q.gabarito || '',
    };
  });

  if (adaptacao.versaoVisual === 2) {
    const soma = questoesConvertidas.reduce((s, q) => s + Math.round(q.notaMaxima * 100), 0);
    if (contextoRecuperacao && soma !== contextoRecuperacao.pontosCentesimos) {
      throw new Error('A soma das questões deve ser exatamente o valor da parcela da recuperação.');
    }
    if (!contextoRecuperacao && soma !== 1000) {
      throw new Error('A soma das questões deve ser exatamente 10 pontos.');
    }
  }
  const prazoPadrao = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const comum = {
    titulo: adaptacao.titulo || 'Atividade Adaptada',
    descricao: adaptacao.atividadeAdaptada?.instrucoesAluno || 'Atividade adaptada de acordo com as diretrizes DUA.',
    disciplina: adaptacao.disciplina || 'Geral',
    anoEscolar: adaptacao.anoEscolar || '',
    turmaIds: [turmaId],
    professorId,
    tipoAtividade: 'adaptada',
    alunoExclusivoId: alunoId,
    alunoNome: adaptacao.aluno?.nome || '',
    necessidades: adaptacao.aluno?.necessidades || [],
    questoes: questoesConvertidas,
    dataEntrega: prazoEntrega || prazoPadrao,
  };

  if (contextoRecuperacao) {
    return {
      ...comum,
      finalidade: 'recuperacao_semestral',
      conjuntoRecuperacaoId: contextoRecuperacao.conjuntoId,
      conjuntoVersao: contextoRecuperacao.conjuntoVersao,
      semestre: contextoRecuperacao.semestre,
      anoLetivo: contextoRecuperacao.anoLetivo,
      destinatariosIds: [alunoId],
      notaMaxima: contextoRecuperacao.pontosCentesimos / 100,
    };
  }

  return {
    ...comum,
    bimestre: Number(bimestre) || 1,
    notaMaxima: 10,
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
    // Recuperação é dirigida apenas aos destinatários escolhidos pelo professor.
    if (atv.finalidade === 'recuperacao_semestral') {
      const destinatarios = Array.isArray(atv.destinatariosIds) ? atv.destinatariosIds : [];
      return destinatarios.includes(alunoId) && (!atv.alunoExclusivoId || atv.alunoExclusivoId === alunoId);
    }

    // Atividade regular da turma
    if (!atv.alunoExclusivoId) {
      return true;
    }

    // Atividade exclusiva para este aluno
    return atv.alunoExclusivoId === alunoId;
  });
}
