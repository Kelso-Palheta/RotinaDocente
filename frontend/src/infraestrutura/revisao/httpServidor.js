const CABECALHOS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};
const MENSAGENS = {
  400: "Requisição inválida.",
  401: "Sessão inválida ou expirada.",
  403: "Acesso não autorizado.",
  404: "Recurso não encontrado.",
  405: "Método não permitido.",
  409: "O estado mudou. Atualize e tente novamente.",
  413: "Arquivo de requisição muito grande.",
  422: "Dados inválidos para esta operação.",
  429: "Limite de acesso atingido. Tente novamente.",
  503: "Serviço temporariamente indisponível.",
};
const falha = (status) =>
  Object.assign(new Error(MENSAGENS[status]), { status });
const erroPublico = (erro) => {
  const status = Object.hasOwn(MENSAGENS, erro?.status) ? erro.status : 500;
  const mensagemPublica =
    erro?.publica === true &&
    status !== 500 &&
    typeof erro.message === "string" &&
    erro.message.trim();
  return {
    status,
    error: mensagemPublica
      ? erro.message
      : MENSAGENS[status] || "Não foi possível concluir a operação.",
  };
};
const json = (dados, status = 200, cookie) =>
  new Response(JSON.stringify(dados), {
    status,
    headers: {
      ...CABECALHOS,
      "Content-Type": "application/json; charset=utf-8",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
const docente = (ator) => {
  if (ator?.tipo !== "professor") throw falha(403);
};

async function lerBody(request) {
  if (Number(request.headers.get("content-length")) > 65536) throw falha(413);
  const leitor = request.body?.getReader();
  if (!leitor) throw falha(400);
  const partes = [];
  let tamanho = 0;
  try {
    while (true) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > 65536) {
        await leitor.cancel();
        throw falha(413);
      }
      partes.push(value);
    }
    const buffer = Buffer.concat(partes, tamanho);
    const body = JSON.parse(buffer.toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw falha(400);
    return body;
  } catch (erro) {
    if (erro.status) throw erro;
    throw falha(400);
  } finally {
    leitor.releaseLock();
  }
}

function validarOrigem(request) {
  const origin = request.headers.get("origin");
  if (origin !== null && origin !== new URL(request.url).origin)
    throw falha(403);
  if (!request.headers.has("authorization") && origin === null)
    throw falha(403);
}

function mesmaIdentidade(a, b) {
  return (
    a?.tipo === b?.tipo &&
    (a.tipo === "professor" ? a.uid === b.uid : a.loginKey === b.loginKey)
  );
}

function criarStream({ request, ator, codigo, service, autenticar, cookie }) {
  let controller,
    assinatura,
    fechado = false,
    heartbeat,
    expiracao,
    ultimoAuth = Date.now(),
    processando = false;
  const encoder = new TextEncoder();
  function limpar() {
    if (fechado) return;
    fechado = true;
    clearInterval(heartbeat);
    clearTimeout(expiracao);
    request.signal.removeEventListener("abort", encerrar);
    assinatura?.fechar();
  }
  function encerrar() {
    limpar();
    try {
      controller?.close();
    } catch {
      /* O consumidor pode já ter cancelado. */
    }
  }
  function enviar(evento, valor) {
    if (fechado) return;
    try {
      controller.enqueue(
        encoder.encode(`event: ${evento}\ndata: ${JSON.stringify(valor)}\n\n`),
      );
    } catch {
      limpar();
    }
  }
  function aoErro(erro) {
    enviar("erro", erroPublico(erro));
    encerrar();
  }
  const stream = new ReadableStream({
    start(c) {
      controller = c;
      request.signal.addEventListener("abort", encerrar, { once: true });
      if (request.signal.aborted) {
        encerrar();
        return;
      }
      expiracao = setTimeout(encerrar, 240000);
      heartbeat = setInterval(async () => {
        if (fechado || processando) return;
        processando = true;
        try {
          if (Date.now() - ultimoAuth >= 30000) {
            const atual = await autenticar(request);
            if (!mesmaIdentidade(ator, atual)) throw falha(401);
            await service.autorizarSala(atual, codigo);
            ultimoAuth = Date.now();
          }
          if (!fechado) await assinatura?.emitir();
        } catch (erro) {
          aoErro(erro);
        } finally {
          processando = false;
        }
      }, 15000);
      // Não devolver a promessa de setup ao ReadableStream: cancelamento deve ser imediato.
      Promise.resolve()
        .then(() =>
          service.assinar(
            ator,
            codigo,
            (pacote) => enviar("estado", pacote),
            aoErro,
          ),
        )
        .then((handle) => {
          if (fechado) handle?.fechar();
          else assinatura = handle;
        }, aoErro);
    },
    cancel() {
      limpar();
    },
  });
  return new Response(stream, {
    headers: {
      ...CABECALHOS,
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
      ...(cookie ? { "Set-Cookie": cookie } : {}),
    },
  });
}

/** BFF sem autoridade de sala em memória; toda autorização de conteúdo passa pelo serviço. */
export function criarHandlerRevisao({
  service,
  autenticar,
  autorizarMidia,
  lerImagemAcervo,
  lerImagemConteudo,
  emitirCookieMidia,
}) {
  return async function handler(request, contexto) {
    try {
      const metodo = request.method;
      if (!["GET", "POST"].includes(metodo)) throw falha(405);
      const params = await contexto?.params;
      const partes = params?.partes;
      if (
        !Array.isArray(partes) ||
        partes.some(
          (p) =>
            typeof p !== "string" ||
            !p ||
            p.length > 200 ||
            /[\/\\\x00-\x1f]/.test(p) ||
            p === "." ||
            p === "..",
        )
      )
        throw falha(400);
      const [grupo, id, acao, qid, imagemId] = partes;
      if (
        metodo === "GET" &&
        grupo === "salas" &&
        acao === "conteudos" &&
        partes[4] === "imagens" &&
        partes.length === 6
      ) {
        const ator = await autorizarMidia(request);
        await service.validarImagemAulaSala(ator, id, qid, partes[5]);
        const { buffer, mime } = await lerImagemConteudo(qid, partes[5]);
        return new Response(buffer, {
          headers: { ...CABECALHOS, "Content-Type": mime },
        });
      }
      if (
        metodo === "GET" &&
        grupo === "conteudos" &&
        acao === "imagens" &&
        partes.length === 4
      ) {
        const ator = await autorizarMidia(request);
        docente(ator);
        const { buffer, mime } = await lerImagemConteudo(id, qid);
        return new Response(buffer, {
          headers: { ...CABECALHOS, "Content-Type": mime },
        });
      }
      const imagemDocente =
        metodo === "GET" &&
        grupo === "questoes" &&
        acao === "imagens" &&
        partes.length === 4;
      const imagemSala =
        metodo === "GET" &&
        grupo === "salas" &&
        acao === "imagens" &&
        partes.length === 5;
      if (imagemDocente || imagemSala) {
        const ator = await autorizarMidia(request);
        let questaoId, figuraId;
        if (imagemDocente) {
          docente(ator);
          questaoId = id;
          figuraId = qid;
        } else {
          const pacote = await service.estado(ator, id);
          const estado = pacote?.estado;
          const questao = estado?.rodada?.questao;
          if (
            ![
              "conteudo",
              "pergunta",
              "encerrada",
              "feedback",
              "ranking",
              "finalizada",
            ].includes(estado?.fase) ||
            questao?.id !== qid ||
            !questao.imagens?.some((i) => i.id === imagemId)
          )
            throw falha(404);
          if (
            estado.fase === "conteudo" &&
            !estado.rodada.conteudo?.some(
              (b) => b.tipo === "imagem" && b.imagemId === imagemId,
            )
          )
            throw falha(404);
          if (typeof service.validarImagemSala === "function")
            await service.validarImagemSala(ator, id, qid, imagemId);
          questaoId = qid;
          figuraId = imagemId;
        }
        const { buffer, mime } = await lerImagemAcervo(questaoId, figuraId);
        return new Response(buffer, {
          headers: { ...CABECALHOS, "Content-Type": mime },
        });
      }
      const ator = await autenticar(request);
      if (metodo === "POST") validarOrigem(request);
      if (grupo === "catalogo" && partes.length === 1 && metodo === "GET") {
        docente(ator);
        return json(
          await service.catalogo(ator),
          200,
          await emitirCookieMidia(ator),
        );
      }
      if (grupo === "conteudos" && partes.length === 2 && metodo === "GET") {
        docente(ator);
        return json(
          await service.conteudo(ator, id),
          200,
          await emitirCookieMidia(ator),
        );
      }
      if (
        grupo === "conteudos" &&
        acao === "aprovar" &&
        partes.length === 3 &&
        metodo === "POST"
      ) {
        docente(ator);
        return json(
          await service.aprovarConteudo(ator, id, await lerBody(request)),
        );
      }
      if (grupo === "questoes" && partes.length === 2 && metodo === "GET") {
        docente(ator);
        return json(
          await service.questao(ator, id),
          200,
          await emitirCookieMidia(ator),
        );
      }
      if (
        grupo === "questoes" &&
        acao === "aprovar" &&
        partes.length === 3 &&
        metodo === "POST"
      ) {
        docente(ator);
        return json(await service.aprovar(ator, id, await lerBody(request)));
      }
      if (grupo === "salas" && partes.length === 1 && metodo === "POST") {
        docente(ator);
        const body = await lerBody(request);
        return json(await service.criar(ator, body.selecao));
      }
      if (grupo === "salas" && partes.length === 2 && metodo === "GET")
        return json(await service.estado(ator, id));
      if (grupo === "salas" && partes.length === 3) {
        if (acao === "edicao") {
          docente(ator);
          if (metodo === "GET") {
            return json(await service.obterEdicao(ator, id));
          }
          if (metodo === "POST") {
            return json(await service.editar(ator, id, await lerBody(request)));
          }
          throw falha(405);
        }
        if (acao === "eventos" && metodo === "GET") {
          await service.autorizarSala(ator, id);
          const cookie =
            ator.tipo === "professor" ? await emitirCookieMidia(ator) : null;
          return criarStream({
            request,
            ator,
            codigo: id,
            service,
            autenticar,
            cookie,
          });
        }
        if (metodo === "POST") {
          if (acao === "entrar") {
            await lerBody(request);
            return json(await service.entrar(ator, id));
          }
          if (acao === "comandos") {
            docente(ator);
            return json(
              await service.comandar(ator, id, await lerBody(request)),
            );
          }
          if (acao === "respostas")
            return json(
              await service.responder(ator, id, await lerBody(request)),
            );
        }
      }
      throw falha(404);
    } catch (erro) {
      const publico = erroPublico(erro);
      return json({ error: publico.error }, publico.status);
    }
  };
}
