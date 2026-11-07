import { falha, validarComando, faseEfetiva } from "./sala";
const ids = (v) =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((x) => typeof x === "string" && x.length > 0) &&
  new Set(v).size === v.length;
const tempo = (v) => Number.isInteger(v) && v >= 10 && v <= 600;

export function resolverAtribuicoes(s, c) {
  const atribuicoes = {};
  for (const qId of s.questaoIds || []) {
    const qInfo = c?.questoes?.find((q) => q.questaoId === qId);
    const vinculosValidos = (s.conteudoIds || []).filter((cid) =>
      qInfo?.conteudoIds?.includes(cid),
    );
    const atribuicao = s.atribuicoes?.[qId];
    if (atribuicao) {
      if (!vinculosValidos.includes(atribuicao)) {
        throw falha(
          422,
          "A seleção contém atribuição inválida de questão para assunto.",
        );
      }
      atribuicoes[qId] = atribuicao;
    } else {
      const primeiroValido = vinculosValidos[0];
      if (!primeiroValido) {
        throw falha(422, "A seleção contém questão fora do conteúdo escolhido.");
      }
      atribuicoes[qId] = primeiroValido;
    }
  }
  return atribuicoes;
}

export function validarSelecaoTematica(s, c) {
  if (
    !ids(s?.conteudoIds) ||
    s.conteudoIds.length > 8 ||
    !s.conteudoIds.every((id) => c.conteudos.some((a) => a.id === id))
  )
    throw falha(422, "Escolha de uma a oito aulas válidas, sem repetições.");
  if (
    !Number.isInteger(s.quantidadeQuestoes) ||
    s.quantidadeQuestoes < 1 ||
    s.quantidadeQuestoes > 20 ||
    !ids(s.questaoIds) ||
    s.questaoIds.length !== s.quantidadeQuestoes
  )
    throw falha(
      422,
      "Selecione exatamente a quantidade de questões definida (1 a 20).",
    );
  if (
    !s.questaoIds.every((id) =>
      c.questoes.some(
        (q) =>
          q.questaoId === id &&
          q.conteudoIds.some((a) => s.conteudoIds.includes(a)),
      ),
    )
  )
    throw falha(422, "A seleção contém questão fora do conteúdo escolhido.");
  if (
    !tempo(s.duracaoSegundos) ||
    !s.duracaoPorQuestao ||
    typeof s.duracaoPorQuestao !== "object" ||
    Array.isArray(s.duracaoPorQuestao) ||
    !Object.entries(s.duracaoPorQuestao).every(
      ([id, t]) => s.questaoIds.includes(id) && tempo(t),
    )
  )
    throw falha(
      422,
      "Revise os tempos inteiros de 10 a 600 segundos das questões selecionadas.",
    );

  if (s.modoFluxo === "sequencia_assunto") {
    const atribuicoes = resolverAtribuicoes(s, c);
    const assuntosComQuestoes = new Set(Object.values(atribuicoes));
    if (!s.conteudoIds.every((cid) => assuntosComQuestoes.has(cid))) {
      throw falha(
        422,
        "Cada assunto selecionado deve conter ao menos uma questão.",
      );
    }
  }
}
export function transicaoTematica(s, b, agora) {
  if (s.schemaVersion !== 2) return validarComando(s, b, agora);
  if (["avancar_conteudo", "voltar_conteudo"].includes(b?.acao)) {
    if (
      b.revisao !== s.revisao ||
      b.rodadaId !== s.rodadas[s.indice].id ||
      faseEfetiva(s, agora) !== "conteudo"
    )
      throw falha(409, "A introdução mudou. Atualize antes de avançar.");

    if (s.modoFluxo === "sequencia_assunto") {
      const atualAssuntoId =
        s.rodadas[s.indice]?.conteudoId ||
        s.sequenciaAula[s.indiceBloco]?.conteudoId;
      const blocosAssunto = s.sequenciaAula.filter(
        (x) => x.conteudoId === atualAssuntoId,
      );
      const posAtual = blocosAssunto.findIndex(
        (x) => x.blocoId === s.sequenciaAula[s.indiceBloco]?.blocoId,
      );
      const novaPos = posAtual + (b.acao === "avancar_conteudo" ? 1 : -1);
      if (novaPos < 0 || novaPos >= blocosAssunto.length)
        throw falha(409, "Limite da introdução alcançado.");
      return "conteudo";
    }

    const idx = s.indiceBloco + (b.acao === "avancar_conteudo" ? 1 : -1);
    if (idx < 0 || idx >= s.sequenciaAula.length)
      throw falha(409, "Limite da introdução alcançado.");
    return "conteudo";
  }

  if (s.modoFluxo === "sequencia_assunto") {
    if (b?.acao === "apresentar_proximo_assunto") {
      if (
        b.revisao !== s.revisao ||
        b.rodadaId !== s.rodadas[s.indice]?.id
      )
        throw falha(
          409,
          "A sala mudou. Confira o estado atualizado antes de continuar.",
        );
      const fase = faseEfetiva(s, agora);
      if (fase !== "ranking" || s.soQuestoes)
        throw falha(409, "Essa ação não está disponível nesta fase.");
      if (s.indice >= s.rodadas.length - 1)
        throw falha(409, "Esta é a última rodada. Finalize a sala.");
      const proximaRodada = s.rodadas[s.indice + 1];
      if (proximaRodada?.conteudoId === s.rodadas[s.indice]?.conteudoId)
        throw falha(
          409,
          "O próximo assunto só pode ser aberto ao término de todas as questões do assunto atual.",
        );
      return "conteudo";
    }

    if (b?.acao === "proxima_rodada" && !s.soQuestoes) {
      const proximaRodada = s.rodadas[s.indice + 1];
      if (
        proximaRodada &&
        proximaRodada.conteudoId !== s.rodadas[s.indice]?.conteudoId
      ) {
        throw falha(
          409,
          "Apresente o conteúdo do próximo assunto antes de abrir a questão.",
        );
      }
    }
  }

  const fase = validarComando(s, b, agora);
  if (b.acao === "abrir_pergunta") {
    if (s.modoFluxo === "sequencia_assunto") {
      const atualAssuntoId =
        s.rodadas[s.indice]?.conteudoId ||
        s.sequenciaAula[s.indiceBloco]?.conteudoId;
      const blocosAssunto = s.sequenciaAula.filter(
        (x) => x.conteudoId === atualAssuntoId,
      );
      const posAtual = blocosAssunto.findIndex(
        (x) => x.blocoId === s.sequenciaAula[s.indiceBloco]?.blocoId,
      );
      if (posAtual !== blocosAssunto.length - 1)
        throw falha(409, "Conclua a introdução antes de abrir as questões.");
    } else {
      if (s.indiceBloco !== s.sequenciaAula.length - 1)
        throw falha(409, "Conclua a introdução antes de abrir as questões.");
    }
  }
  return b.acao === "proxima_rodada" ? "pergunta" : fase;
}
export function publicarTematico(base, s, congelada) {
  if (s.schemaVersion !== 2) return base;
  const p = { ...base, schemaVersion: 2 };
  if (s.modoFluxo) p.modoFluxo = s.modoFluxo;

  if (s.modoFluxo === "sequencia_assunto" && !s.soQuestoes && p.fase === "ranking") {
    if (s.indice < s.rodadas.length - 1) {
      const mudaAssunto =
        s.rodadas[s.indice + 1]?.conteudoId !== s.rodadas[s.indice]?.conteudoId;
      p.proximaAcao = mudaAssunto
        ? "apresentar_proximo_assunto"
        : "proxima_rodada";
      p.textoProximaAcao = mudaAssunto
        ? "Apresentar próximo assunto"
        : "Próxima pergunta";
    } else {
      p.proximaAcao = "finalizar";
      p.textoProximaAcao = "Finalizar aulão";
    }
  }

  if (p.fase !== "conteudo") return p;
  const ref = s.sequenciaAula[s.indiceBloco],
    a = congelada?.conteudo,
    b = a?.blocos?.find((x) => x.id === ref.blocoId);
  if (!ref || a?.id !== ref.conteudoId || !b)
    throw falha(503, "Bloco da aula indisponível.");
  const imagens =
    b.tipo === "imagem"
      ? a.imagens
          .filter((i) => i.id === b.imagemId)
          .map((i) => ({
            id: i.id,
            url: `/api/revisao/salas/${s.codigo}/conteudos/${a.id}/imagens/${i.id}`,
            alt: i.alt,
            legenda: i.legenda,
            licenca: i.licenca,
            credito: i.credito || "",
            fonteUrl: i.fonteUrl || null,
            licencaUrl: i.licencaUrl || null,
            autorUrl: i.autorUrl || null,
            alteracoes: i.alteracoes || null,
          }))
      : [];
  p.rodada = { ...p.rodada, questao: null, conteudo: [] };
  p.feedback = null;

  const blocosDoAssunto =
    s.modoFluxo === "sequencia_assunto"
      ? s.sequenciaAula.filter((x) => x.conteudoId === ref.conteudoId)
      : s.sequenciaAula;
  const posNoAssunto =
    s.modoFluxo === "sequencia_assunto"
      ? blocosDoAssunto.findIndex((x) => x.blocoId === ref.blocoId)
      : s.indiceBloco;
  const ultimoBloco =
    s.modoFluxo === "sequencia_assunto"
      ? posNoAssunto === blocosDoAssunto.length - 1
      : s.indiceBloco === s.sequenciaAula.length - 1;

  p.aula = {
    conteudoId: a.id,
    tituloConteudo: a.titulo,
    indiceBloco: posNoAssunto,
    totalBlocos: blocosDoAssunto.length,
    ultimoBloco,
    bloco: {
      id: b.id,
      titulo: b.titulo,
      tipo: b.tipo,
      texto: b.texto,
      ...(b.tipo === "imagem" ? { imagemId: b.imagemId } : {}),
      imagens,
    },
  };
  return p;
}
