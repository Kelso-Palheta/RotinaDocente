import { falha, validarComando, faseEfetiva } from "./sala";
const ids = (v) =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((x) => typeof x === "string" && x.length > 0) &&
  new Set(v).size === v.length;
const tempo = (v) => Number.isInteger(v) && v >= 10 && v <= 600;
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
    const idx = s.indiceBloco + (b.acao === "avancar_conteudo" ? 1 : -1);
    if (idx < 0 || idx >= s.sequenciaAula.length)
      throw falha(409, "Limite da introdução alcançado.");
    return "conteudo";
  }
  const fase = validarComando(s, b, agora);
  if (
    b.acao === "abrir_pergunta" &&
    s.indiceBloco !== s.sequenciaAula.length - 1
  )
    throw falha(409, "Conclua a introdução antes de abrir as questões.");
  return b.acao === "proxima_rodada" ? "pergunta" : fase;
}
export function publicarTematico(base, s, congelada) {
  if (s.schemaVersion !== 2) return base;
  const p = { ...base, schemaVersion: 2 };
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
          }))
      : [];
  p.rodada = { ...p.rodada, questao: null, conteudo: [] };
  p.feedback = null;
  p.aula = {
    conteudoId: a.id,
    tituloConteudo: a.titulo,
    indiceBloco: s.indiceBloco,
    totalBlocos: s.sequenciaAula.length,
    ultimoBloco: s.indiceBloco === s.sequenciaAula.length - 1,
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
