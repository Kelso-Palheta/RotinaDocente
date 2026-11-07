import { validarQuestaoConferencia } from "./preparacao";
export const LETRAS = ["A", "B", "C", "D", "E"];
export const LIMITE_PARTICIPANTES = 100;
export const falha = (status, message) =>
  Object.assign(new Error(message), { status, publica: true });
export function segmento(valor) {
  if (
    typeof valor !== "string" ||
    !valor.length ||
    valor.length > 180 ||
    /[/\\\u0000-\u001f]/.test(valor) ||
    [".", ".."].includes(valor)
  )
    throw falha(400, "Identificador inválido.");
  return valor;
}
export function codigoSala(valor) {
  if (typeof valor !== "string" || !/^[A-Z0-9]{4,12}$/.test(valor))
    throw falha(400, "Informe o código exibido pelo professor.");
  return valor;
}
export function faseEfetiva(sala, agora) {
  return sala.fase === "pergunta" && agora >= sala.encerraEmMs
    ? "encerrada"
    : sala.fase;
}
export function validarComando(sala, comando, agora) {
  if (
    comando?.revisao !== sala.revisao ||
    comando.rodadaId !== sala.rodadas[sala.indice]?.id
  )
    throw falha(
      409,
      "A sala mudou. Confira o estado atualizado antes de continuar.",
    );
  const fase = faseEfetiva(sala, agora);
  if (comando.acao === "reiniciar") {
    if (comando.confirmarReinicio !== true)
      throw falha(422, "Confirme que deseja zerar as respostas e o placar.");
    return "espera";
  }
  if (fase === "finalizada") throw falha(409, "Esta sala já foi finalizada.");
  if (comando.acao === "alterar_tempo") {
    const tempo = comando.duracaoSegundos;
    if (!Number.isInteger(tempo) || tempo < 10 || tempo > 600)
      throw falha(422, "Informe um tempo entre 10 e 600 segundos.");
    return sala.fase;
  }
  if (comando.acao === "iniciar_so_questoes" && ["espera", "conteudo"].includes(fase))
    return "pergunta";
  if (comando.acao === "finalizar") return "finalizada";
  const mapa = {
    espera: ["mostrar_conteudo", "conteudo"],
    conteudo: ["abrir_pergunta", "pergunta"],
    pergunta: ["encerrar_pergunta", "encerrada"],
    encerrada: ["mostrar_feedback", "feedback"],
    feedback: ["mostrar_ranking", "ranking"],
    ranking: ["proxima_rodada", "conteudo"],
  };
  if (!mapa[fase] || mapa[fase][0] !== comando.acao)
    throw falha(409, "Essa ação não está disponível nesta fase.");
  if (
    comando.acao === "proxima_rodada" &&
    sala.indice >= sala.rodadas.length - 1
  )
    throw falha(409, "Esta é a última rodada. Finalize a sala.");
  return comando.acao === "proxima_rodada" && sala.soQuestoes ? "pergunta" : mapa[fase][1];
}
export function calcularRanking(participantes) {
  const lista = participantes
    .map((p) => ({
      participanteId: p.id,
      nomeExibicao: p.nomeExibicao,
      pontos: Number.isFinite(p.pontos) ? p.pontos : 0,
    }))
    .sort(
      (a, b) =>
        b.pontos - a.pontos ||
        a.nomeExibicao.localeCompare(b.nomeExibicao, "pt-BR") ||
        a.participanteId.localeCompare(b.participanteId),
    );
  return lista.map((p, i) => ({
    ...p,
    posicao:
      i > 0 && p.pontos === lista[i - 1].pontos
        ? lista.findIndex((x) => x.pontos === p.pontos) + 1
        : i + 1,
  }));
}
export function montarPublicacao(sala, questao) {
  const fase = sala.fase;
  const mostrouPergunta = sala.perguntaAbertaEmMs != null;
  const revelar =
    ["pergunta", "encerrada", "feedback", "ranking"].includes(fase) ||
    (fase === "finalizada" && mostrouPergunta);
  const apoio = fase === "conteudo";
  const imagensApoio = new Set(
    (questao?.conteudoRevisao || [])
      .filter((b) => b.tipo === "imagem")
      .map((b) => b.imagemId),
  );
  const imagens = (questao?.imagens || [])
    .filter((i) => revelar || (apoio && imagensApoio.has(i.id)))
    .map((i) => ({
      id: i.id,
      url: `/api/revisao/salas/${sala.codigo}/imagens/${questao.id}/${i.id}`,
      alt: i.alt,
    }));
  return {
    sala: {
      id: sala.id,
      codigo: sala.codigo,
      titulo: sala.titulo,
      revisao: sala.revisao,
      limiteParticipantes: LIMITE_PARTICIPANTES,
      duracaoSegundos: sala.duracaoSegundos,
    },
    fase,
    rodada: {
      id: sala.rodadas[sala.indice].id,
      numero: sala.indice + 1,
      total: sala.rodadas.length,
      encerraEmMs: sala.encerraEmMs ?? null,
      questao:
        revelar || apoio
          ? {
              id: questao.id,
              ano: questao.ano,
              aplicacoes: questao.aplicacoes,
              tema: questao.tema,
              imagens,
              ...(revelar
                ? {
                    enunciado: questao.enunciado,
                    alternativas: questao.alternativas.map((a) => ({
                      id: a.id,
                      texto: a.texto,
                    })),
                  }
                : {}),
            }
          : null,
      conteudo: apoio
        ? questao.conteudoRevisao.map((b) =>
            b.tipo === "texto"
              ? { tipo: "texto", texto: b.texto }
              : {
                  tipo: "imagem",
                  imagemId: b.imagemId,
                  legenda: b.legenda || "",
                },
          )
        : [],
    },
    feedback:
      mostrouPergunta && ["feedback", "ranking", "finalizada"].includes(fase)
        ? {
            gabarito: questao.gabarito,
            explicacoes: Object.fromEntries(
              LETRAS.map((l) => [l, questao.explicacoes[l]]),
            ),
          }
        : null,
    ranking: ["ranking", "finalizada"].includes(fase) ? sala.ranking || [] : [],
    ...(fase === "ranking" && sala.soQuestoes && sala.indice < sala.rodadas.length - 1
      ? { proximaAcao: "proxima_rodada", textoProximaAcao: "Próxima pergunta" }
      : {}),
  };
}
export function projetarEstado(
  publicacao,
  { tipo, participanteId, participantes = [], respostas = [], agora },
) {
  const estado = structuredClone(publicacao);
  if (estado.fase === "pergunta" && agora >= estado.rodada.encerraEmMs)
    estado.fase = "encerrada";
  estado.agoraServidorMs = agora;
  estado.conexao = "conectado";
  if (tipo === "aluno") {
    estado.participacao = null;
    const propria = estado.ranking.find(
      (p) => p.participanteId === participanteId,
    );
    estado.ranking = estado.ranking.slice(0, 10);
    if (
      propria &&
      !estado.ranking.some((p) => p.participanteId === participanteId)
    )
      estado.ranking.push(propria);
  } else {
    const mapa = new Map(participantes.map((p) => [p.id, p]));
    const atuais = respostas.filter((r) => mapa.has(r.participanteId));
    estado.participacao = {
      total: participantes.length,
      respondidos: atuais.length,
      respondentes: atuais.map((r) => ({
        id: r.participanteId,
        nomeExibicao: mapa.get(r.participanteId).nomeExibicao,
      })),
      distribuicao: Object.fromEntries(
        LETRAS.map((l) => [
          l,
          atuais.filter((r) => r.alternativa === l).length,
        ]),
      ),
    };
  }
  return estado;
}
const texto = (v, max = 20000) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= max;
export function ajustarQuestao(base, ajustes = {}) {
  if (!ajustes || typeof ajustes !== "object" || Array.isArray(ajustes))
    throw falha(400, "Ajustes inválidos.");
  const q = structuredClone(base);
  for (const campo of [
    "enunciado",
    "alternativas",
    "explicacoes",
    "conteudoRevisao",
  ])
    if (Object.hasOwn(ajustes, campo))
      q[campo] = structuredClone(ajustes[campo]);
  if (
    !texto(q.enunciado) ||
    !Array.isArray(q.alternativas) ||
    !q.alternativas.every(
      (a) => a && LETRAS.includes(a.id) && texto(a.texto, 4000),
    ) ||
    !q.explicacoes ||
    !LETRAS.every((l) => texto(q.explicacoes[l], 8000)) ||
    !Array.isArray(q.conteudoRevisao) ||
    q.conteudoRevisao.length > 20
  )
    throw falha(
      422,
      "Revise o texto, as cinco alternativas e os cinco comentários.",
    );
  q.alternativas = q.alternativas.map((a) => ({ id: a.id, texto: a.texto }));
  q.explicacoes = Object.fromEntries(LETRAS.map((l) => [l, q.explicacoes[l]]));
  q.conteudoRevisao = q.conteudoRevisao.map((b) => {
    if (b?.tipo === "texto" && texto(b.texto, 12000))
      return { tipo: "texto", texto: b.texto };
    if (
      b?.tipo === "imagem" &&
      q.imagens.some((i) => i.id === b.imagemId) &&
      typeof (b.legenda || "") === "string"
    )
      return {
        tipo: "imagem",
        imagemId: b.imagemId,
        legenda: (b.legenda || "").slice(0, 500),
      };
    throw falha(422, "Conteúdo preparatório inválido.");
  });
  const erro = validarQuestaoConferencia(q);
  if (erro) throw falha(422, erro);
  return q;
}
