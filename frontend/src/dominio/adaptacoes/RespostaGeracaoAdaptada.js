export function textoSeguro(valor) {
  if (valor === null || valor === undefined) return undefined;
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean') return String(valor);
  try {
    return JSON.stringify(valor);
  } catch {
    return undefined;
  }
}

function objetoSeguro(valor) {
  return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {};
}

function listaTextos(valor, { objetoComoLista = false } = {}) {
  if (Array.isArray(valor)) {
    return valor.map(textoSeguro).filter((item) => item !== undefined);
  }
  if (typeof valor === 'string' && valor.trim()) {
    return [valor];
  }
  if (objetoComoLista && valor && typeof valor === 'object') {
    return Object.values(valor)
      .map(textoSeguro)
      .filter((item) => item !== undefined);
  }
  return [];
}

function listaQuestoes(valor) {
  const ehQuestao = (item) => item && typeof item === 'object' && !Array.isArray(item);
  if (Array.isArray(valor)) return valor.filter(ehQuestao);
  if (valor && typeof valor === 'object') return Object.values(valor).filter(ehQuestao);
  return [];
}

const CAMPOS_TEXTO_QUESTAO = [
  'enunciado',
  'tipo',
  'apoioVisualDescricao',
  'apoioVisualPromptIngles',
  'dicaScaffolding',
];

const CAMPOS_TEXTO_GUIA = [
  'objetivoPedagogicoInalterado',
  'tempoEstimado',
  'antecipacaoComportamental',
  'criteriosAvaliacaoFlexibilizada',
];

const CAMPOS_TEXTO_RESPOSTA = ['titulo', 'disciplina', 'anoEscolar'];

function normalizarQuestao(questao) {
  const normalizada = { ...questao };
  for (const campo of CAMPOS_TEXTO_QUESTAO) {
    if (normalizada[campo] !== undefined) {
      normalizada[campo] = textoSeguro(normalizada[campo]);
    }
  }
  normalizada.alternativas = listaTextos(normalizada.alternativas);
  return normalizada;
}

function normalizarGuiaMediacao(guia) {
  const origem = objetoSeguro(guia);
  const normalizada = { ...origem };
  for (const campo of CAMPOS_TEXTO_GUIA) {
    if (normalizada[campo] !== undefined) {
      normalizada[campo] = textoSeguro(normalizada[campo]);
    }
  }
  normalizada.passoAPassoProfessor = listaTextos(origem.passoAPassoProfessor);
  return normalizada;
}

function normalizarAluno(aluno) {
  const origem = objetoSeguro(aluno);
  const normalizada = { ...origem };
  if (normalizada.nome !== undefined) {
    normalizada.nome = textoSeguro(normalizada.nome);
  }
  normalizada.necessidades = listaTextos(origem.necessidades);
  return normalizada;
}

function normalizarAtividade(atividade) {
  const origem = objetoSeguro(atividade);
  const normalizada = { ...origem };
  if (normalizada.instrucoesAluno !== undefined) {
    normalizada.instrucoesAluno = textoSeguro(normalizada.instrucoesAluno);
  }
  normalizada.questoes = listaQuestoes(origem.questoes).map(normalizarQuestao);
  return normalizada;
}

export function normalizarRespostaGeracao(bruta) {
  const origem = objetoSeguro(bruta);
  const normalizada = { ...origem };

  for (const campo of CAMPOS_TEXTO_RESPOSTA) {
    if (normalizada[campo] !== undefined) {
      normalizada[campo] = textoSeguro(normalizada[campo]);
    }
  }

  normalizada.diretrizesHarmonizadas = listaTextos(origem.diretrizesHarmonizadas, {
    objetoComoLista: true,
  });
  normalizada.atividadeAdaptada = normalizarAtividade(origem.atividadeAdaptada);
  normalizada.guiaMediacao = normalizarGuiaMediacao(origem.guiaMediacao);
  normalizada.aluno = normalizarAluno(origem.aluno);

  return normalizada;
}
