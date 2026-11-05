const LETRAS = ['A', 'B', 'C', 'D', 'E'];
const texto = valor => typeof valor === 'string' && valor.trim().length > 0;
const listaUnica = lista => Array.isArray(lista) && lista.length > 0 && lista.every(texto) && new Set(lista).size === lista.length;

export function fonteOficialValida(valor) {
  if (!texto(valor)) return false;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && (
      url.hostname === 'download.inep.gov.br' ||
      (url.hostname === 'www.gov.br' && url.pathname.startsWith('/inep/'))
    );
  } catch { return false; }
}

export function validarPreparacao(selecao, turmas, questoes) {
  if (!texto(selecao?.titulo) || selecao.titulo.trim().length > 120) return 'O título do aulão deve conter entre 1 e 120 caracteres.';
  if (!Number.isInteger(selecao.duracaoSegundos) || selecao.duracaoSegundos < 10 || selecao.duracaoSegundos > 600) return 'A duração por questão deve ser um número inteiro entre 10 e 600 segundos.';
  const idsTurmas = new Set(turmas.map(t => t.id));
  if (!listaUnica(selecao.turmaIds) || !selecao.turmaIds.every(id => idsTurmas.has(id))) return 'Selecione pelo menos uma turma participante válida, sem repetições.';
  if (!listaUnica(selecao.questaoIds)) return 'Selecione pelo menos uma questão apta para o aulão, sem repetições.';
  const porId = new Map(questoes.map(q => [q.id, q]));
  if (!selecao.questaoIds.every(id => porId.get(id)?.apta === true)) return 'A seleção contém questões não aptas ou não localizadas no acervo.';
  return null;
}

export function validarQuestaoConferencia(questao) {
  if (!texto(questao?.id) || !texto(questao?.enunciado)) return 'Estrutura incompleta: identificador e enunciado são obrigatórios.';
  const alternativas = questao.alternativas;
  if (!Array.isArray(alternativas) || alternativas.length !== 5 || !LETRAS.every(l => alternativas.some(a => a?.id === l && texto(a.texto)))) return 'Estrutura incompleta: são necessárias exatamente 5 alternativas (A–E).';
  if (!LETRAS.includes(questao.gabarito)) return 'Estrutura incompleta: gabarito oficial ausente ou inválido.';
  if (!LETRAS.every(l => texto(questao.explicacoes?.[l]))) return 'Estrutura incompleta: há explicações pendentes para alternativas.';
  if (!Array.isArray(questao.fontes) || !questao.fontes.length || !questao.fontes.every(f => fonteOficialValida(f?.provaUrl) && fonteOficialValida(f?.gabaritoUrl))) return 'Estrutura incompleta: fontes oficiais do INEP ausentes ou inválidas.';
  const imagens = questao.imagens;
  if (!Array.isArray(imagens) || !imagens.every(i => texto(i?.id) && texto(i.url || i.arquivo)) || new Set(imagens.map(i => i.id)).size !== imagens.length) return 'Estrutura incompleta: imagens com identificador, arquivo ou URL ausente ou repetido.';
  const ids = new Set(imagens.map(i => i.id));
  if (!Array.isArray(questao.conteudoRevisao) || !questao.conteudoRevisao.length || !questao.conteudoRevisao.every(b => b?.tipo === 'texto' ? texto(b.texto) : b?.tipo === 'imagem' && texto(b.imagemId) && ids.has(b.imagemId))) return 'Estrutura incompleta: referência de imagem inexistente ou conteúdo preparatório ausente.';
  return null;
}
