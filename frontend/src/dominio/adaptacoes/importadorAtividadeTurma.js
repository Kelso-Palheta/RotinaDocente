/**
 * Domínio: Acessibilidade & Adaptações DUA
 * Importação e extração de texto de atividades regulares da turma para adaptação.
 * Referência: specs/RULES.md (RN-60) e specs/TESTS_SPEC.md (UT-34).
 */

/**
 * Extrai e formata o conteúdo textual completo de uma atividade da turma,
 * incluindo título, instruções e lista de questões (objetivas e discursivas),
 * preparando o texto para o campo de conteúdo base do gerador DUA.
 *
 * @param {Object} atividade - Objeto da atividade (coleção `atividades` ou do Diário)
 * @returns {string} Texto formatado consolidado
 */
export function extrairTextoAtividadeTurma(atividade) {
  if (!atividade || typeof atividade !== 'object') {
    return '';
  }

  const partes = [];

  const titulo = String(atividade.titulo || atividade.nome || '').trim();
  if (titulo) {
    partes.push(`=== ${titulo} ===`);
  }

  const disciplina = String(atividade.disciplina || '').trim();
  const anoEscolar = String(atividade.anoEscolar || atividade.ano || '').trim();
  const metadados = [];
  if (disciplina) metadados.push(`Disciplina: ${disciplina}`);
  if (anoEscolar) metadados.push(`Ano/Série: ${anoEscolar}`);
  if (metadados.length > 0) {
    partes.push(metadados.join(' | '));
  }

  const instrucoes = String(atividade.descricao || atividade.instrucoes || '').trim();
  if (instrucoes) {
    partes.push(`Instruções: ${instrucoes}`);
  }

  const questoes = Array.isArray(atividade.questoes) ? atividade.questoes : [];
  if (questoes.length > 0) {
    partes.push(''); // Linha em branco separadora
    questoes.forEach((q, idx) => {
      const numero = q.numero ?? idx + 1;
      const enunciado = String(q.enunciado || q.texto || '').trim();
      const blocoQuestao = [`Questão ${numero}: ${enunciado}`];

      if (q.apoioVisualDescricao) {
        blocoQuestao.push(`[Apoio Visual Original: ${q.apoioVisualDescricao}]`);
      }

      if (Array.isArray(q.alternativas) && q.alternativas.length > 0) {
        q.alternativas.forEach((alt, altIdx) => {
          if (typeof alt === 'object' && alt !== null) {
            const letra = alt.id || String.fromCharCode(65 + altIdx);
            blocoQuestao.push(`${letra}) ${alt.texto || ''}`);
          } else if (typeof alt === 'string') {
            const str = alt.trim();
            if (/^[A-Ea-e][\)\.\-:]/.test(str)) {
              blocoQuestao.push(str);
            } else {
              const letra = String.fromCharCode(65 + altIdx);
              blocoQuestao.push(`${letra}) ${str}`);
            }
          }
        });
      }

      partes.push(blocoQuestao.join('\n'));
    });
  }

  return partes.join('\n\n').trim();
}
