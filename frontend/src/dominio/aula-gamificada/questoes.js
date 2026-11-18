import {
  embaralhar,
  ehObjeto,
  falha,
  idPadrao,
  listaObrigatoria,
  normalizarId,
  segmento,
  textoObrigatorio,
  textoOpcional,
} from './comum';
import { validarTipoModalidade } from './modalidades';

export const DIFICULDADES = Object.freeze(['facil', 'medio', 'dificil']);
export const TIPOS_QUESTAO = Object.freeze(['multipla_escolha', 'pares', 'ordenacao']);

const semAcento = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const chaveTexto = (valor) => semAcento(valor).replace(/\s+/g, ' ').trim();

export function normalizarDificuldade(valor) {
  const chave = semAcento(valor).trim();
  const mapa = { facil: 'facil', medio: 'medio', dificil: 'dificil' };
  if (!mapa[chave])
    throw falha(422, 'A dificuldade deve ser fácil, médio ou difícil.');
  return mapa[chave];
}

export function normalizarTipo(valor) {
  const chave = semAcento(valor).replace(/[\s-]+/g, '_');
  const mapa = {
    multipla_escolha: 'multipla_escolha',
    multiplaescolha: 'multipla_escolha',
    pares: 'pares',
    ordenacao: 'ordenacao',
  };
  if (!mapa[chave]) throw falha(422, 'Tipo de questão inválido. Use múltipla escolha, pares ou ordenação.');
  return mapa[chave];
}

function normalizarOrigem(origem) {
  const base = ehObjeto(origem) ? origem : {};
  const tipo = base.tipo ?? 'manual';
  if (!['manual', 'tema', 'material'].includes(tipo))
    throw falha(422, 'Origem da questão inválida.');
  const nomeArquivo = textoOpcional(base.nomeArquivo, 'nome do arquivo', { max: 200 });
  const arquivo = nomeArquivo ? nomeArquivo.split(/[\\/]/).pop() : '';
  return arquivo ? { tipo, nomeArquivo: arquivo } : { tipo };
}

function normalizarImagem(imagem) {
  if (imagem === null || imagem === undefined || imagem === '') return null;
  if (!ehObjeto(imagem)) throw falha(422, 'Imagem inválida.');
  const url = textoObrigatorio(imagem.url, 'URL da imagem', { max: 4000 });
  if (!/^https?:\/\//i.test(url) && !/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(url))
    throw falha(422, 'A imagem deve ter origem http(s) ou data:image válida.');
  const alt = textoObrigatorio(imagem.alt, 'alternativa textual da imagem', { max: 500 });
  return { url, alt };
}

function normalizarAlternativas(alternativas) {
  const lista = listaObrigatoria(alternativas, 'alternativas', { min: 2, max: 10 });
  const ids = new Set();
  return lista.map((entrada, indice) => {
    let id;
    let texto;
    if (typeof entrada === 'string') {
      const bruto = textoObrigatorio(entrada, `alternativa ${indice + 1}`, { max: 1000 });
      const comLetra = bruto.match(/^([A-Za-z])[).\-:\s]+(.*)$/);
      id = comLetra ? comLetra[1] : String.fromCharCode(65 + indice);
      texto = comLetra ? comLetra[2].trim() : bruto;
    } else if (ehObjeto(entrada)) {
      id = entrada.id ?? entrada.letra ?? String.fromCharCode(65 + indice);
      texto = textoObrigatorio(entrada.texto, `texto da alternativa ${indice + 1}`, { max: 1000 });
    } else {
      throw falha(422, `Alternativa ${indice + 1} inválida.`);
    }
    const canonico = normalizarId(id, `ID da alternativa ${indice + 1}`);
    if (ids.has(canonico))
      throw falha(422, 'As alternativas precisam ter IDs únicos.');
    ids.add(canonico);
    return { id: canonico, texto };
  });
}

function normalizarCarta(carta, lado, indice, { gerarId, novosIdsPares, mapa }) {
  let idAntigo = null;
  let texto;
  let imagem = null;
  if (typeof carta === 'string') {
    texto = textoObrigatorio(carta, `${lado} do par ${indice + 1}`, { max: 1000 });
  } else if (ehObjeto(carta)) {
    texto = textoObrigatorio(carta.texto, `${lado} do par ${indice + 1}`, { max: 1000 });
    if (carta.id !== undefined && carta.id !== null)
      idAntigo = normalizarId(carta.id, `ID da carta ${lado} do par ${indice + 1}`);
    imagem = normalizarImagem(carta.imagem);
  } else {
    throw falha(422, `Carta ${lado} do par ${indice + 1} inválida.`);
  }
  const id = novosIdsPares ? gerarId() : idAntigo ?? gerarId();
  if (idAntigo) mapa.set(idAntigo, id);
  return { id, texto, ...(imagem ? { imagem } : {}) };
}

function normalizarPares(entrada, { gerarId, novosIdsPares }) {
  const lista = listaObrigatoria(entrada.pares, 'pares', { min: 2, max: 30 });
  const mapaEsquerda = new Map();
  const mapaDireita = new Map();
  const porTextoEsquerda = new Map();
  const porTextoDireita = new Map();
  const idsCartas = new Set();
  const textosEsquerda = new Set();
  const textosDireita = new Set();

  const pares = lista.map((entradaPar, indice) => {
    if (!ehObjeto(entradaPar)) throw falha(422, `Par ${indice + 1} inválido.`);
    const esquerda = normalizarCarta(entradaPar.esquerda, 'esquerda', indice, {
      gerarId,
      novosIdsPares,
      mapa: mapaEsquerda,
    });
    const direita = normalizarCarta(entradaPar.direita, 'direita', indice, {
      gerarId,
      novosIdsPares,
      mapa: mapaDireita,
    });
    for (const carta of [esquerda, direita]) {
      if (idsCartas.has(carta.id))
        throw falha(422, 'As cartas precisam ter IDs únicos.');
      idsCartas.add(carta.id);
    }
    const chaveEsquerda = chaveTexto(esquerda.texto);
    const chaveDireita = chaveTexto(direita.texto);
    if (textosEsquerda.has(chaveEsquerda))
      throw falha(422, 'Os itens da coluna esquerda precisam ser únicos.');
    if (textosDireita.has(chaveDireita))
      throw falha(422, 'Os itens da coluna direita precisam ser únicos.');
    textosEsquerda.add(chaveEsquerda);
    textosDireita.add(chaveDireita);
    porTextoEsquerda.set(chaveEsquerda, esquerda.id);
    porTextoDireita.set(chaveDireita, direita.id);

    const idPar = entradaPar.id
      ? normalizarId(entradaPar.id, `ID do par ${indice + 1}`)
      : gerarId();
    return { id: idPar, esquerda, direita };
  });

  const resolver = (valor, mapa, porTexto, lado) => {
    const bruto = typeof valor === 'number' ? String(valor) : String(valor ?? '').trim();
    if (!bruto) throw falha(422, `O gabarito de pares não informou o item ${lado}.`);
    if (mapa.has(bruto)) return mapa.get(bruto);
    if (idsCartas.has(bruto)) return bruto;
    const porTextoId = porTexto.get(chaveTexto(bruto));
    if (porTextoId) return porTextoId;
    throw falha(422, `O gabarito de pares referencia um item ${lado} inexistente.`);
  };

  const porPar = new Map(pares.map((p) => [`${p.esquerda.id}__${p.direita.id}`, p]));
  const entradaCorreta = entrada.respostaCorreta;
  const correta =
    Array.isArray(entradaCorreta) && entradaCorreta.length
      ? entradaCorreta.map((item, indice) => {
          let esquerdaId;
          let direitaId;
          if (Array.isArray(item)) {
            [esquerdaId, direitaId] = item;
          } else if (ehObjeto(item)) {
            esquerdaId = item.esquerdaId ?? item.esquerda;
            direitaId = item.direitaId ?? item.direita;
          } else {
            throw falha(422, `Gabarito do par ${indice + 1} inválido.`);
          }
          const esquerda = resolver(esquerdaId, mapaEsquerda, porTextoEsquerda, 'esquerda');
          const direita = resolver(direitaId, mapaDireita, porTextoDireita, 'direita');
          if (!porPar.has(`${esquerda}__${direita}`))
            throw falha(422, 'O gabarito de pares deve associar itens do mesmo par.');
          return { esquerdaId: esquerda, direitaId: direita };
        })
      : pares.map((p) => ({ esquerdaId: p.esquerda.id, direitaId: p.direita.id }));

  if (correta.length !== pares.length)
    throw falha(422, 'O gabarito de pares deve cobrir todos os pares exatamente uma vez.');
  const cobertos = new Set(correta.map((p) => p.esquerdaId));
  if (cobertos.size !== pares.length || correta.some((p) => !porPar.has(`${p.esquerdaId}__${p.direitaId}`)))
    throw falha(422, 'O gabarito de pares deve cobrir todos os pares exatamente uma vez.');

  return { pares, respostaCorreta: correta };
}

function normalizarItens(entrada, { gerarId, novosIdsItens = false }) {
  const lista = listaObrigatoria(entrada.itens, 'itens', { min: 2, max: 30 });
  const ids = new Set();
  const mapaAntigos = new Map();
  const porTexto = new Map();
  const itens = lista.map((item, indice) => {
    let idAntigo = null;
    let texto;
    if (typeof item === 'string') {
      texto = textoObrigatorio(item, `item ${indice + 1}`, { max: 1000 });
    } else if (ehObjeto(item)) {
      texto = textoObrigatorio(item.texto, `texto do item ${indice + 1}`, { max: 1000 });
      if (item.id !== undefined && item.id !== null) {
        idAntigo = normalizarId(item.id, `ID do item ${indice + 1}`);
      }
    } else {
      throw falha(422, `Item ${indice + 1} inválido.`);
    }
    const id = novosIdsItens ? gerarId() : idAntigo ?? gerarId();
    if (ids.has(id)) throw falha(422, 'Os itens precisam ter IDs únicos.');
    ids.add(id);
    if (idAntigo) mapaAntigos.set(idAntigo, id);
    porTexto.set(chaveTexto(texto), id);
    return { id, texto };
  });

  const entradaCorreta = entrada.respostaCorreta;
  const ordem =
    Array.isArray(entradaCorreta) && entradaCorreta.length
      ? entradaCorreta.map((valor, indice) => {
          if (typeof valor === 'number') {
            const alvo = itens[valor];
            if (!alvo) throw falha(422, `A ordem correta referencia a posição ${valor} inexistente.`);
            return alvo.id;
          }
          const bruto = String(valor ?? '').trim();
          if (mapaAntigos.has(bruto)) return mapaAntigos.get(bruto);
          if (ids.has(bruto)) return bruto;
          const porTextoId = porTexto.get(chaveTexto(bruto));
          if (porTextoId) return porTextoId;
          throw falha(422, `A ordem correta referencia um item inexistente: ${bruto || 'vazio'}.`);
        })
      : itens.map((item) => item.id);

  if (ordem.length !== itens.length || new Set(ordem).size !== itens.length || ordem.some((id) => !ids.has(id)))
    throw falha(422, 'A ordem correta deve ser uma permutação de todos os itens.');

  return { itens, respostaCorreta: ordem };
}

function normalizarStatus(valor) {
  const status = valor ?? 'rascunho';
  if (!['rascunho', 'revisada'].includes(status))
    throw falha(422, 'Status da questão inválido.');
  return status;
}

export function normalizarQuestao(
  entrada,
  {
    gerarId = idPadrao,
    agora = Date.now,
    professorId = undefined,
    origem = undefined,
    novosIdsPares = false,
    novosIdsItens = false,
  } = {},
) {
  if (!ehObjeto(entrada)) throw falha(422, 'Questão inválida.');
  const tipo = normalizarTipo(entrada.tipo);
  const uidProfessor = professorId ?? entrada.professorId;
  const base = {
    id: entrada.id ? normalizarId(entrada.id, 'ID da questão') : gerarId(),
    revision: entrada.revision === undefined ? 1 : Number(entrada.revision),
    disciplina: textoObrigatorio(entrada.disciplina, 'disciplina', { max: 120 }),
    anoEscolar: textoObrigatorio(entrada.anoEscolar, 'série/ano', { max: 120 }),
    conteudo: textoObrigatorio(entrada.conteudo, 'conteúdo', { max: 300 }),
    dificuldade: normalizarDificuldade(entrada.dificuldade),
    tipo,
    enunciado: textoObrigatorio(entrada.enunciado, 'enunciado', { max: 8000 }),
    imagem: normalizarImagem(entrada.imagem),
    alternativas: null,
    pares: null,
    itens: null,
    respostaCorreta: null,
    explicacao: textoOpcional(entrada.explicacao, 'explicação pedagógica', { max: 8000 }),
    justificativaDificuldade: textoOpcional(
      entrada.justificativaDificuldade,
      'justificativa da dificuldade',
      { max: 4000 },
    ),
    status: normalizarStatus(entrada.status),
    origem: normalizarOrigem(origem ?? entrada.origem),
    professorId: uidProfessor
      ? segmento(String(uidProfessor), { campo: 'UID do professor', max: 128 })
      : null,
    criadoEmMs: Number.isFinite(entrada.criadoEmMs) ? entrada.criadoEmMs : agora(),
    atualizadoEmMs: agora(),
  };
  if (!Number.isInteger(base.revision) || base.revision < 1)
    throw falha(422, 'Revisão da questão inválida.');

  if (tipo === 'multipla_escolha') {
    base.alternativas = normalizarAlternativas(entrada.alternativas);
    const alvo = String(entrada.respostaCorreta ?? '').trim();
    const alternativa = base.alternativas.find(
      (a) => a.id.toLowerCase() === alvo.toLowerCase(),
    );
    if (!alternativa)
      throw falha(422, 'O gabarito deve ser o ID de uma das alternativas.');
    base.respostaCorreta = alternativa.id;
  } else if (tipo === 'pares') {
    const normalizado = normalizarPares(entrada, { gerarId, novosIdsPares });
    base.pares = normalizado.pares;
    base.respostaCorreta = normalizado.respostaCorreta;
  } else {
    const normalizado = normalizarItens(entrada, { gerarId, novosIdsItens });
    base.itens = normalizado.itens;
    base.respostaCorreta = normalizado.respostaCorreta;
  }

  if (entrada.revisadaEmMs !== undefined && Number.isFinite(entrada.revisadaEmMs))
    base.revisadaEmMs = entrada.revisadaEmMs;

  return base;
}

function validarAlternativasSalvas(alternativas) {
  const lista = listaObrigatoria(alternativas, 'alternativas', { min: 2, max: 10 });
  const ids = new Set();
  for (const [indice, alternativa] of lista.entries()) {
    if (!ehObjeto(alternativa)) throw falha(422, `Alternativa ${indice + 1} inválida.`);
    const id = normalizarId(alternativa.id, `ID da alternativa ${indice + 1}`);
    textoObrigatorio(alternativa.texto, `texto da alternativa ${indice + 1}`, { max: 1000 });
    if (ids.has(id)) throw falha(422, 'As alternativas precisam ter IDs únicos.');
    ids.add(id);
  }
  return new Set(lista.map((a) => normalizarId(a.id)));
}

function validarParesSalvos(pares, respostaCorreta) {
  const lista = listaObrigatoria(pares, 'pares', { min: 2, max: 30 });
  const ids = new Set();
  const textosEsquerda = new Set();
  const textosDireita = new Set();
  const paresValidos = new Map();
  for (const [indice, par] of lista.entries()) {
    if (!ehObjeto(par) || !ehObjeto(par.esquerda) || !ehObjeto(par.direita))
      throw falha(422, `Par ${indice + 1} inválido.`);
    const esquerdaId = normalizarId(par.esquerda.id, `ID da carta esquerda do par ${indice + 1}`);
    const direitaId = normalizarId(par.direita.id, `ID da carta direita do par ${indice + 1}`);
    textoObrigatorio(par.esquerda.texto, `texto da carta esquerda do par ${indice + 1}`, { max: 1000 });
    textoObrigatorio(par.direita.texto, `texto da carta direita do par ${indice + 1}`, { max: 1000 });
    normalizarImagem(par.esquerda.imagem);
    normalizarImagem(par.direita.imagem);
    for (const id of [esquerdaId, direitaId]) {
      if (ids.has(id)) throw falha(422, 'As cartas precisam ter IDs únicos.');
      ids.add(id);
    }
    const chaveEsquerda = chaveTexto(par.esquerda.texto);
    const chaveDireita = chaveTexto(par.direita.texto);
    if (textosEsquerda.has(chaveEsquerda) || textosDireita.has(chaveDireita))
      throw falha(422, 'Os itens de cada coluna precisam ser únicos.');
    textosEsquerda.add(chaveEsquerda);
    textosDireita.add(chaveDireita);
    paresValidos.set(`${esquerdaId}__${direitaId}`, true);
  }
  if (!Array.isArray(respostaCorreta) || respostaCorreta.length !== lista.length)
    throw falha(422, 'O gabarito de pares deve cobrir todos os pares exatamente uma vez.');
  const cobertos = new Set();
  for (const par of respostaCorreta) {
    if (!ehObjeto(par)) throw falha(422, 'Gabarito de pares inválido.');
    const esquerdaId = normalizarId(par.esquerdaId, 'ID esquerdo do gabarito');
    const direitaId = normalizarId(par.direitaId, 'ID direito do gabarito');
    if (!paresValidos.has(`${esquerdaId}__${direitaId}`))
      throw falha(422, 'O gabarito de pares deve associar itens do mesmo par.');
    if (cobertos.has(esquerdaId))
      throw falha(422, 'O gabarito de pares deve cobrir todos os pares exatamente uma vez.');
    cobertos.add(esquerdaId);
  }
  if (cobertos.size !== lista.length)
    throw falha(422, 'O gabarito de pares deve cobrir todos os pares exatamente uma vez.');
}

function validarItensSalvos(itens, respostaCorreta) {
  const lista = listaObrigatoria(itens, 'itens', { min: 2, max: 30 });
  const ids = new Set();
  const textos = new Set();
  for (const [indice, item] of lista.entries()) {
    if (!ehObjeto(item)) throw falha(422, `Item ${indice + 1} inválido.`);
    const id = normalizarId(item.id, `ID do item ${indice + 1}`);
    const texto = textoObrigatorio(item.texto, `texto do item ${indice + 1}`, { max: 1000 });
    if (ids.has(id)) throw falha(422, 'Os itens precisam ter IDs únicos.');
    const chave = chaveTexto(texto);
    if (textos.has(chave)) throw falha(422, 'Os itens precisam ser únicos.');
    ids.add(id);
    textos.add(chave);
  }
  if (
    !Array.isArray(respostaCorreta) ||
    respostaCorreta.length !== lista.length ||
    new Set(respostaCorreta.map((id) => normalizarId(id))).size !== lista.length ||
    respostaCorreta.some((id) => !ids.has(normalizarId(id)))
  )
    throw falha(422, 'A ordem correta deve ser uma permutação de todos os itens.');
}

export function validarQuestao(questao) {
  if (!ehObjeto(questao)) throw falha(422, 'Questão inválida.');
  normalizarId(questao.id, 'ID da questão');
  const tipo = normalizarTipo(questao.tipo);
  normalizarDificuldade(questao.dificuldade);
  textoObrigatorio(questao.disciplina, 'disciplina', { max: 120 });
  textoObrigatorio(questao.anoEscolar, 'série/ano', { max: 120 });
  textoObrigatorio(questao.conteudo, 'conteúdo', { max: 300 });
  textoObrigatorio(questao.enunciado, 'enunciado', { max: 8000 });
  normalizarStatus(questao.status);
  if (questao.imagem !== null && questao.imagem !== undefined) normalizarImagem(questao.imagem);
  if (!Number.isInteger(questao.revision) || questao.revision < 1)
    throw falha(422, 'Revisão da questão inválida.');

  if (tipo === 'multipla_escolha') {
    const ids = validarAlternativasSalvas(questao.alternativas);
    if (!ids.has(normalizarId(questao.respostaCorreta, 'gabarito')))
      throw falha(422, 'O gabarito deve ser o ID de uma das alternativas.');
  } else if (tipo === 'pares') {
    validarParesSalvos(questao.pares, questao.respostaCorreta);
  } else {
    validarItensSalvos(questao.itens, questao.respostaCorreta);
  }
  return true;
}

export function validarParaRevisao(questao) {
  validarQuestao(questao);
  textoObrigatorio(questao.explicacao, 'explicação pedagógica', { max: 8000 });
  return true;
}

export function paresPrivados(questao) {
  return (questao.pares || []).map((par) => ({
    esquerdaId: par.esquerda.id,
    direitaId: par.direita.id,
  }));
}

const cartaPublica = (carta) => ({
  id: carta.id,
  texto: carta.texto,
  ...(carta.imagem ? { imagem: { ...carta.imagem } } : {}),
});

/** Mapa privado id → carta completa. Só o servidor projeta faces ao jogador. */
export function mapaDeCartas(questao) {
  const mapa = new Map();
  for (const par of questao?.pares || []) {
    for (const carta of [par.esquerda, par.direita]) {
      mapa.set(carta.id, cartaPublica(carta));
    }
  }
  return mapa;
}

/**
 * Projeta as faces que o jogador pode ver, na ordem pedida.
 * IDs desconhecidos ou repetidos são ignorados.
 */
export function facesDasCartas(questao, ids = []) {
  const mapa = mapaDeCartas(questao);
  const vistos = new Set();
  const faces = [];
  for (const id of ids || []) {
    if (vistos.has(id) || !mapa.has(id)) continue;
    vistos.add(id);
    faces.push(mapa.get(id));
  }
  return faces;
}

export function questaoPublica(questao, modalidade, { seed = '' } = {}) {
  validarQuestao(questao);
  validarTipoModalidade(modalidade, questao.tipo);
  const base = {
    id: questao.id,
    tipo: questao.tipo,
    enunciado: questao.enunciado,
    ...(questao.imagem ? { imagem: { ...questao.imagem } } : {}),
  };
  if (questao.tipo === 'multipla_escolha') {
    return {
      ...base,
      alternativas: embaralhar(
        questao.alternativas.map(({ id, texto }) => ({ id, texto })),
        `${seed}:alternativas`,
      ),
    };
  }
  if (questao.tipo === 'pares') {
    if (modalidade === 'memoria') {
      // Apenas IDs: o tabuleiro oculto não pode viajar no estado público.
      // As faces visíveis são projetadas por `projetarEstado`, conforme as viradas.
      const ids = questao.pares.flatMap((par) => [par.esquerda.id, par.direita.id]);
      return { ...base, cartas: embaralhar(ids, `${seed}:cartas`) };
    }
    return {
      ...base,
      esquerda: embaralhar(
        questao.pares.map((p) => cartaPublica(p.esquerda)),
        `${seed}:esquerda`,
      ),
      direita: embaralhar(
        questao.pares.map((p) => cartaPublica(p.direita)),
        `${seed}:direita`,
      ),
    };
  }
  return {
    ...base,
    itens: embaralhar(
      questao.itens.map(({ id, texto }) => ({ id, texto })),
      `${seed}:itens`,
    ),
  };
}

export function validarResposta(questao, resposta) {
  if (!ehObjeto(resposta)) throw falha(422, 'Resposta inválida.');
  if (questao.tipo === 'multipla_escolha') {
    const alvo = String(resposta.alternativaId ?? '').trim();
    const alternativa = questao.alternativas.find(
      (a) => a.id.toLowerCase() === alvo.toLowerCase(),
    );
    if (!alternativa) throw falha(422, 'Escolha uma alternativa válida.');
    return { alternativaId: alternativa.id };
  }

  if (questao.tipo === 'pares') {
    const lista = listaObrigatoria(resposta.pares, 'pares da resposta', {
      min: 1,
      max: questao.pares.length,
    });
    const esquerdaIds = new Set(questao.pares.map((p) => p.esquerda.id));
    const direitaIds = new Set(questao.pares.map((p) => p.direita.id));
    const usadosEsquerda = new Set();
    const usadosDireita = new Set();
    return {
      pares: lista.map((par, indice) => {
        if (!ehObjeto(par)) throw falha(422, `Par ${indice + 1} da resposta inválido.`);
        const esquerdaId = normalizarId(par.esquerdaId, `ID esquerdo do par ${indice + 1}`);
        const direitaId = normalizarId(par.direitaId, `ID direito do par ${indice + 1}`);
        if (!esquerdaIds.has(esquerdaId) || !direitaIds.has(direitaId))
          throw falha(422, 'A resposta referencia uma carta inexistente.');
        if (usadosEsquerda.has(esquerdaId) || usadosDireita.has(direitaId))
          throw falha(422, 'Cada carta pode ser usada uma única vez na resposta.');
        usadosEsquerda.add(esquerdaId);
        usadosDireita.add(direitaId);
        return { esquerdaId, direitaId };
      }),
    };
  }

  const itensIds = new Set(questao.itens.map((i) => i.id));
  if (!Array.isArray(resposta.ordem) || resposta.ordem.length !== questao.itens.length)
    throw falha(422, 'A ordem deve conter todos os itens exatamente uma vez.');
  const ordem = resposta.ordem.map((id, indice) => normalizarId(id, `ID da posição ${indice + 1}`));
  if (new Set(ordem).size !== ordem.length || ordem.some((id) => !itensIds.has(id)))
    throw falha(422, 'A ordem deve conter todos os itens exatamente uma vez.');
  return { ordem };
}
