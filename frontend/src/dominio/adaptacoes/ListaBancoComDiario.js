import { paraPerfilInclusivo } from '../diario/AlunoDiario';

function normalizarTexto(valor) {
  return String(valor ?? '').trim().toLowerCase();
}

function chaveAluno(aluno) {
  return `${normalizarTexto(aluno.nome)}|${normalizarTexto(aluno.turmaNome)}`;
}

function ehAlunoValido(aluno) {
  return Boolean(aluno && typeof aluno === 'object' && normalizarTexto(aluno.nome));
}

/**
 * Monta a lista unificada do modal "Banco de Alunos Cadastrados":
 * registros do Banco PEI primeiro, depois os alunos do Diário Pedagógico
 * (RN-46) com `origem`/`chave` para renderização e seleção.
 *
 * Deduplicação por `nome|turma` normalizados (minúsculas/trim) com o
 * registro do Banco PEI vencedor. Entradas sem nome válido são descartadas.
 *
 * @param {*} listaBanco Registros do Banco PEI (AlunoAdaptadoRepository)
 * @param {*} listaDiario Saída de `listarAlunosParaSeletor` ({turmaId, turmaNome, aluno})
 * @returns {Array<Object>}
 */
export function montarListaBancoAlunos(listaBanco, listaDiario) {
  const banco = (Array.isArray(listaBanco) ? listaBanco : [])
    .filter(ehAlunoValido)
    .map((aluno) => ({
      ...aluno,
      origem: 'banco',
      chave: `banco:${String(aluno.id ?? '') || chaveAluno(aluno)}`,
    }));

  const chavesCobertas = new Set(banco.map(chaveAluno));
  const diario = [];

  for (const opcao of Array.isArray(listaDiario) ? listaDiario : []) {
    if (!opcao || typeof opcao !== 'object') continue;
    const perfil = paraPerfilInclusivo(opcao.aluno || {});
    if (!perfil) continue;

    const entrada = {
      ...perfil,
      id: String(opcao.aluno?.id ?? ''),
      turmaId: String(opcao.turmaId ?? ''),
      turmaNome: String(opcao.turmaNome ?? ''),
      origem: 'diario',
      chave: `diario:${String(opcao.turmaId ?? '')}:${chaveAluno(perfil)}`,
    };

    const chave = chaveAluno(entrada);
    if (chavesCobertas.has(chave)) continue;
    chavesCobertas.add(chave);
    diario.push(entrada);
  }

  return [...banco, ...diario];
}
