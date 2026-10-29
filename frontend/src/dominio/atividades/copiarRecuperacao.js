/**
 * Regras puras da cópia de atividade de recuperação entre turmas (RN-82).
 *
 * A cópia nasce de uma projeção por campos permitidos: nada de respostas,
 * notas, tokens, vínculos ou metadados operacionais da origem atravessa para
 * a atividade nova. O destino continua sendo a autoridade de contexto,
 * destinatários, versão e orçamento de 10 pontos.
 */

import { interpretarDataEntrega } from './dataEntrega';
import { paraCentesimos, FINALIDADE_RECUPERACAO } from './recuperacaoSemestral';

export const CODIGOS_COPIA = {
  ADAPTADA: 'RECUPERACAO_COPIA_ADAPTADA',
  OUTRA_CONTA: 'RECUPERACAO_COPIA_OUTRA_CONTA',
  ORIGEM_INVALIDA: 'RECUPERACAO_COPIA_ORIGEM_INVALIDA',
  DESTINO_INVALIDO: 'RECUPERACAO_COPIA_DESTINO_INVALIDO',
  MESMA_TURMA: 'RECUPERACAO_COPIA_MESMA_TURMA',
  DESTINO_CANCELADO: 'RECUPERACAO_COPIA_DESTINO_CANCELADO',
  DESTINO_CONGELADO: 'RECUPERACAO_COPIA_DESTINO_CONGELADO',
  DESTINO_OBSOLETO: 'RECUPERACAO_COPIA_DESTINO_OBSOLETO',
  ANO_INCOMPATIVEL: 'RECUPERACAO_COPIA_ANO_INCOMPATIVEL',
  DESTINATARIO_INVALIDO: 'RECUPERACAO_COPIA_DESTINATARIO_INVALIDO',
  SALDO_INSUFICIENTE: 'RECUPERACAO_COPIA_SALDO_INSUFICIENTE',
  ID_INVALIDO: 'RECUPERACAO_COPIA_ID_INVALIDO',
  PRAZO_INVALIDO: 'RECUPERACAO_COPIA_PRAZO_INVALIDO',
  CONTEUDO_INVALIDO: 'RECUPERACAO_COPIA_CONTEUDO_INVALIDO',
};

const erro = (codigo, mensagem) => Object.assign(new Error(mensagem), { code: codigo });

const lista = valor => (Array.isArray(valor) ? valor : []);

const texto = valor => (typeof valor === 'string' ? valor : '');

/** Prazo local digitado: valida inclusive datas que Date normalizaria. */
export function normalizarPrazoCopia(valor) {
  const entrada = texto(valor).trim();
  const brasileiro = entrada.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  const iso = brasileiro
    ? `${brasileiro[3]}-${brasileiro[2]}-${brasileiro[1]}T${brasileiro[4]}:${brasileiro[5]}`
    : entrada;
  const partes = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!partes) return null;
  const data = new Date(iso);
  const reais = [data.getFullYear(), data.getMonth() + 1, data.getDate(), data.getHours(), data.getMinutes()];
  return reais.every((numero, indice) => numero === Number(partes[indice + 1])) ? iso : null;
}

const selecionar = (dados, campos) => Object.fromEntries(
  // Os campos desta whitelist são escalares. Um objeto inesperado não pode
  // carregar metadados privados nem compartilhar referências com a origem.
  campos.filter(campo => {
    const valor = dados?.[campo];
    return valor === null || typeof valor === 'string' || typeof valor === 'boolean'
      || (typeof valor === 'number' && Number.isFinite(valor));
  }).map(campo => [campo, dados[campo]]),
);

const CAMPOS_QUESTAO = [
  'id', 'numero', 'tipo', 'enunciado', 'notaMaxima', 'rubrica', 'gabarito',
  'textoApoio', 'scaffolding', 'apoioVisualDescricao',
];
const CAMPOS_ALTERNATIVA = ['id', 'texto'];
const CAMPOS_TEXTO = ['id', 'html', 'aposQuestao'];
const CAMPOS_MATERIAL = ['id', 'tipo', 'nome', 'texto', 'textoExtraido'];

/** Imagem só entra na cópia quando o conteúdo é acessível no destino. */
function projetarImagem(imagem) {
  if (!imagem || typeof imagem !== 'object') return null;

  if (typeof imagem.base64 === 'string') {
    const base64 = imagem.base64.trim();
    if (base64.startsWith('data:image/') && base64.includes(';base64,')) return { base64 };
  }

  if (typeof imagem.url === 'string') {
    const url = imagem.url.trim();
    if (/^https?:\/\//i.test(url)) return { url };
  }

  return null;
}

function projetarQuestao(questao = {}) {
  const imagensOriginais = lista(questao.imagens);
  const imagens = imagensOriginais.map(projetarImagem).filter(Boolean);
  const avisos = [];

  if (imagens.length < imagensOriginais.length) {
    avisos.push({
      codigo: 'IMAGEM_INDISPONIVEL',
      questaoId: questao.id ?? null,
      mensagem: 'Uma imagem que só existia neste dispositivo não foi copiada. Revise a questão e adicione a imagem novamente.',
    });
  }

  return {
    questao: {
      ...selecionar(questao, CAMPOS_QUESTAO),
      alternativas: lista(questao.alternativas)
        .map(alternativa => selecionar(alternativa, CAMPOS_ALTERNATIVA)),
      imagens,
    },
    avisos,
  };
}

function projetarMaterialApoio(materialApoio) {
  if (!materialApoio || typeof materialApoio !== 'object') return { material: null, aviso: null };

  const textoExtraido = texto(materialApoio.textoExtraido) || texto(materialApoio.texto);
  if (!textoExtraido.trim()) {
    return {
      material: null,
      aviso: {
        codigo: 'MATERIAL_INDISPONIVEL',
        mensagem: 'Um material de apoio sem texto extraído não foi copiado. Anexe o material novamente se ele for necessário.',
      },
    };
  }

  return {
    material: {
      nome: texto(materialApoio.nome).trim() || 'Material',
      textoExtraido,
    },
    aviso: null,
  };
}

/**
 * Whitelist do conteúdo revisável. O mesmo filtro vale para a origem e para
 * o que o professor devolve no formulário — o formulário não é autoridade.
 */
export function projetarConteudoRecuperacao(dados = {}, { professorId } = {}) {
  if (professorId !== undefined) validarOrigemCopia(dados, { professorId });

  const avisos = [];
  const questoes = lista(dados.questoes).map(questao => {
    const projetada = projetarQuestao(questao);
    avisos.push(...projetada.avisos);
    return projetada.questao;
  });

  const materiais = [];
  for (const material of lista(dados.materiais)) {
    if (!(texto(material?.textoExtraido) || texto(material?.texto)).trim()) {
      avisos.push({
        codigo: 'MATERIAL_INDISPONIVEL',
        materialId: material?.id ?? null,
        mensagem: 'Um material sem texto extraído não foi copiado. Anexe o material novamente se ele for necessário.',
      });
      continue;
    }
    materiais.push(selecionar(material, CAMPOS_MATERIAL));
  }

  const apoio = projetarMaterialApoio(dados.materialApoio);
  if (apoio.aviso) avisos.push(apoio.aviso);

  return {
    titulo: texto(dados.titulo),
    questoes,
    textosBase: lista(dados.textosBase)
      .filter(item => texto(item?.html).trim())
      .map(item => selecionar(item, CAMPOS_TEXTO)),
    materiais,
    materialApoio: apoio.material,
    avisos,
  };
}

function ehAtividadeAdaptada(origem) {
  return origem?.tipoAtividade === 'adaptada'
    || Boolean(origem?.alunoExclusivoId)
    || Boolean(origem?.alunoNome)
    || Boolean(origem?.adaptacao)
    || (Array.isArray(origem?.necessidades) && origem.necessidades.length > 0);
}

/** Valida a origem antes de qualquer leitura de destino. */
export function validarOrigemCopia(origem, { professorId } = {}) {
  if (!origem || typeof origem !== 'object' || !origem.id || !origem.conjuntoRecuperacaoId) {
    throw erro(
      CODIGOS_COPIA.ORIGEM_INVALIDA,
      'Selecione uma atividade de recuperação regular para copiar.',
    );
  }
  if (origem.professorId !== professorId) {
    throw erro(CODIGOS_COPIA.OUTRA_CONTA, 'Esta atividade pertence a outra conta.');
  }
  if (ehAtividadeAdaptada(origem)) {
    throw erro(
      CODIGOS_COPIA.ADAPTADA,
      'Esta é uma atividade adaptada individualizada e não pode ser copiada por este fluxo. Crie uma nova atividade regular para o novo destino.',
    );
  }
  if (origem.finalidade !== FINALIDADE_RECUPERACAO) {
    throw erro(
      CODIGOS_COPIA.ORIGEM_INVALIDA,
      'Somente atividades regulares de recuperação semestral podem ser copiadas.',
    );
  }
  return origem;
}

function totalCentesimos(escalas) {
  if (!escalas || typeof escalas !== 'object') return 0;
  return Object.values(escalas).reduce((soma, valor) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero) || numero <= 0) return soma;
    return soma + Math.round(numero * 100);
  }, 0);
}

export function restanteCentesimos(destino) {
  return Math.max(0, 1000 - totalCentesimos(destino?.escalas));
}

function centesimosSeguros(valor) {
  try {
    return paraCentesimos(valor);
  } catch {
    return null;
  }
}

function turmasDaOrigem(origem) {
  return [...new Set([...lista(origem?.turmaIds), ...lista(origem?.turmas)].map(String))];
}

function destinatariosDaTurma(destino, turma) {
  const alunos = new Set(lista(turma?.alunos).map(aluno => String(aluno?.id)));
  const destinatarios = lista(destino?.destinatariosIds).map(String);
  return { destinatarios, alunos };
}

/**
 * Revalida o destino no momento do salvamento. A transação RN-81 continua
 * sendo a autoridade final; esta checagem evita abrir o formulário contra um
 * conjunto cancelado, congelado, obsoleto ou sem saldo.
 */
export function validarDestinoCopia({
  origem,
  destino,
  professorId,
  turma,
  versaoEsperada = null,
  pontos = null,
  destinatariosIds = null,
} = {}) {
  if (!destino || !destino.id || !destino.turmaId) {
    throw erro(CODIGOS_COPIA.DESTINO_INVALIDO, 'Selecione um conjunto de recuperação de destino.');
  }
  if (destino.professorId !== professorId) {
    throw erro(CODIGOS_COPIA.OUTRA_CONTA, 'O conjunto de destino pertence a outra conta.');
  }
  if (turmasDaOrigem(origem).includes(String(destino.turmaId))) {
    throw erro(CODIGOS_COPIA.MESMA_TURMA, 'Escolha um conjunto de outra turma.');
  }
  if (destino.estado === 'cancelado') {
    throw erro(CODIGOS_COPIA.DESTINO_CANCELADO, 'O conjunto de destino está cancelado.');
  }
  if (destino.congelado === true) {
    throw erro(CODIGOS_COPIA.DESTINO_CONGELADO, 'O conjunto de destino já possui entregas e está congelado.');
  }
  if (versaoEsperada != null && Number(destino.versao || 1) !== Number(versaoEsperada)) {
    throw erro(CODIGOS_COPIA.DESTINO_OBSOLETO, 'O conjunto de destino mudou. Reabra a seleção e tente novamente.');
  }
  if (!['1', '2'].includes(String(destino.semestre))) {
    throw erro(CODIGOS_COPIA.DESTINO_INVALIDO, 'O conjunto de destino não tem semestre válido.');
  }
  if (!turma || String(turma.id) !== String(destino.turmaId)) {
    throw erro(CODIGOS_COPIA.DESTINATARIO_INVALIDO, 'A turma do conjunto de destino não está disponível.');
  }
  const anoDaTurma = turma.anoLetivo ?? turma.ano;
  if (anoDaTurma != null && String(destino.anoLetivo) !== String(anoDaTurma)) {
    throw erro(CODIGOS_COPIA.ANO_INCOMPATIVEL, 'O ano letivo do conjunto não corresponde ao da turma de destino.');
  }

  const { destinatarios, alunos } = destinatariosDaTurma(destino, turma);
  if (!destinatarios.length || destinatarios.some(alunoId => !alunos.has(alunoId))) {
    throw erro(CODIGOS_COPIA.DESTINATARIO_INVALIDO, 'O conjunto de destino tem destinatário fora da turma.');
  }
  if (destinatariosIds != null) {
    const solicitados = lista(destinatariosIds).map(String);
    if (!solicitados.length || solicitados.some(alunoId => !destinatarios.includes(alunoId))) {
      throw erro(CODIGOS_COPIA.DESTINATARIO_INVALIDO, 'Os destinatários da cópia precisam pertencer ao conjunto de destino.');
    }
  }

  if (pontos != null) {
    const necessarios = centesimosSeguros(pontos);
    if (necessarios == null || necessarios <= 0) {
      throw erro(CODIGOS_COPIA.CONTEUDO_INVALIDO, 'A atividade copiada precisa valer mais que zero pontos.');
    }
    if (necessarios > restanteCentesimos(destino)) {
      throw erro(CODIGOS_COPIA.SALDO_INSUFICIENTE, 'A cópia excede os pontos restantes do conjunto de destino.');
    }
  }

  return destino;
}

const MOTIVOS = {
  [CODIGOS_COPIA.OUTRA_CONTA]: 'outra_conta',
  [CODIGOS_COPIA.MESMA_TURMA]: 'mesma_turma',
  [CODIGOS_COPIA.DESTINO_CANCELADO]: 'cancelado',
  [CODIGOS_COPIA.DESTINO_CONGELADO]: 'congelado',
  [CODIGOS_COPIA.DESTINO_OBSOLETO]: 'obsoleto',
  [CODIGOS_COPIA.ANO_INCOMPATIVEL]: 'ano_incompativel',
  [CODIGOS_COPIA.DESTINATARIO_INVALIDO]: 'aluno_fora_da_turma',
  [CODIGOS_COPIA.SALDO_INSUFICIENTE]: 'saldo_insuficiente',
};

/** Lista os conjuntos que aceitam a cópia e explica os que não aceitam. */
export function avaliarDestinosCopia({ conjuntos = [], turmas = [], professorId, origem } = {}) {
  const elegiveis = [];
  const indisponiveis = [];
  const pontos = centesimosSeguros(origem?.notaMaxima) ?? 0;

  for (const conjunto of lista(conjuntos)) {
    const turma = lista(turmas).find(item => String(item?.id) === String(conjunto?.turmaId)) || null;
    const restante = restanteCentesimos(conjunto);
    try {
      validarDestinoCopia({
        origem,
        destino: conjunto,
        professorId,
        turma,
        versaoEsperada: null,
        // A revisão permite reduzir a parcela; basta haver saldo positivo.
        // A pontuação final continua validada no salvamento e na transação.
        pontos: 0.01,
      });
      elegiveis.push({
        conjunto,
        turma,
        restante: restante / 100,
        cabe: pontos <= restante,
        completaComCopia: pontos > 0 && pontos === restante,
      });
    } catch (error) {
      indisponiveis.push({
        conjunto,
        motivo: MOTIVOS[error.code] || 'indisponivel',
      });
    }
  }

  return { elegiveis, indisponiveis };
}

function validarConteudo(conteudo) {
  if (!conteudo.titulo.trim() || !conteudo.questoes.length) {
    throw erro(CODIGOS_COPIA.CONTEUDO_INVALIDO, 'A cópia precisa de título e ao menos uma questão.');
  }

  let total = 0;
  for (const questao of conteudo.questoes) {
    if (!texto(questao.enunciado).trim()) {
      throw erro(CODIGOS_COPIA.CONTEUDO_INVALIDO, 'Toda questão da cópia precisa de enunciado.');
    }
    const nota = centesimosSeguros(questao.notaMaxima);
    if (nota == null || nota <= 0) {
      throw erro(CODIGOS_COPIA.CONTEUDO_INVALIDO, 'Toda questão da cópia precisa de pontuação válida.');
    }
    if (questao.tipo === 'objetiva') {
      const alternativas = lista(questao.alternativas);
      const gabaritoValido = alternativas.some(alternativa => (
        alternativa.id === questao.gabarito && texto(alternativa.texto).trim()
      ));
      const preenchidas = alternativas.filter(alternativa => texto(alternativa.texto).trim()).length;
      if (!gabaritoValido || preenchidas < 2) {
        throw erro(CODIGOS_COPIA.CONTEUDO_INVALIDO, 'Questão objetiva da cópia precisa de gabarito e ao menos duas alternativas preenchidas.');
      }
    }
    total += nota;
  }
  return total / 100;
}

/**
 * Monta o payload da atividade nova. O contexto vem sempre do destino; o
 * conteúdo vem da revisão do professor, filtrado novamente pela whitelist.
 */
export function montarAtividadeCopiada({
  origem,
  destino,
  professorId,
  turmaDestino,
  dados,
  versaoEsperada = null,
} = {}) {
  validarOrigemCopia(origem, { professorId });

  const id = texto(dados?.id).trim();
  if (!id || id === String(origem.id) || id.includes('/') || !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw erro(CODIGOS_COPIA.ID_INVALIDO, 'A cópia precisa de uma identificação nova para a atividade.');
  }

  const dataEntrega = interpretarDataEntrega(dados?.dataEntrega);
  if (!dataEntrega) {
    throw erro(CODIGOS_COPIA.PRAZO_INVALIDO, 'Informe um novo prazo válido para a cópia.');
  }

  const conteudo = projetarConteudoRecuperacao(dados || {});
  const notaMaxima = validarConteudo(conteudo);
  const destinatarios = dados?.destinatariosIds != null
    ? lista(dados.destinatariosIds).map(String)
    : lista(destino?.destinatariosIds).map(String);

  validarDestinoCopia({
    origem,
    destino,
    professorId,
    turma: turmaDestino,
    versaoEsperada,
    pontos: notaMaxima,
    destinatariosIds: destinatarios,
  });

  const alunos = lista(turmaDestino?.alunos)
    .filter(aluno => destinatarios.includes(String(aluno.id)))
    .map(aluno => ({ id: aluno.id, nome: aluno.nome }));

  return {
    id,
    professorId,
    titulo: conteudo.titulo.trim(),
    turmas: [destino.turmaId],
    turmaIds: [destino.turmaId],
    notaMaxima,
    dataEntrega,
    textosBase: conteudo.textosBase,
    questoes: conteudo.questoes,
    materiais: conteudo.materiais,
    materialApoio: conteudo.materialApoio,
    alunosPorTurma: { [destino.turmaId]: alunos },
    finalidade: FINALIDADE_RECUPERACAO,
    conjuntoRecuperacaoId: destino.id,
    conjuntoVersao: Number(destino.versao || 1),
    semestre: String(destino.semestre),
    anoLetivo: destino.anoLetivo != null
      ? String(destino.anoLetivo)
      : (turmaDestino?.anoLetivo != null ? String(turmaDestino.anoLetivo) : null),
    destinatariosIds: destinatarios,
  };
}

/**
 * Assinatura idempotente do conteúdo revisado. Um retry depois de resposta
 * perdida só devolve a cópia existente quando o conteúdo é o mesmo.
 */
export function assinaturaConteudoCopia(dados = {}) {
  const conteudo = projetarConteudoRecuperacao(dados);
  const prazo = interpretarDataEntrega(dados?.dataEntrega);
  let total = 0;
  for (const questao of conteudo.questoes) {
    const nota = centesimosSeguros(questao.notaMaxima);
    if (nota == null) return null;
    total += nota;
  }
  return JSON.stringify({
    titulo: conteudo.titulo.trim(),
    notaMaxima: total / 100,
    dataEntrega: prazo ? prazo.toISOString() : null,
    questoes: conteudo.questoes,
    textosBase: conteudo.textosBase,
    materiais: conteudo.materiais,
    materialApoio: conteudo.materialApoio,
  });
}
