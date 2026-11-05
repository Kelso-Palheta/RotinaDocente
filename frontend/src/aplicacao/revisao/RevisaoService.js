import { validarPreparacao } from "@/dominio/revisao/preparacao";
import {
  falha,
  segmento,
  codigoSala,
  LETRAS,
  LIMITE_PARTICIPANTES,
  faseEfetiva,
  validarComando,
  calcularRanking,
  montarPublicacao,
  projetarEstado,
  ajustarQuestao,
} from "@/dominio/revisao/sala";
const CHECKS = ["transcricao", "gabarito", "imagens", "explicacoes"];
const caminho = (codigo) => `revisaoSalas/${codigo}`;
const copiaAjustes = (q) =>
  Object.fromEntries(
    ["enunciado", "alternativas", "explicacoes", "conteudoRevisao"].map((k) => [
      k,
      q[k],
    ]),
  );
export class RevisaoService {
  constructor({
    store,
    acervo,
    agora = Date.now,
    gerarCodigo,
    gerarId = () => crypto.randomUUID(),
    idParticipante = (t, a) =>
      encodeURIComponent(t) + "_" + encodeURIComponent(a),
  }) {
    Object.assign(this, {
      store,
      acervo,
      agora,
      gerarCodigo,
      gerarId,
      idParticipante,
    });
  }
  docente(ator) {
    if (ator?.tipo !== "professor")
      throw falha(403, "Entre com a conta docente para esta ação.");
    return segmento(ator.uid);
  }
  async turmas(uid, reader = this.store) {
    for (const path of [
      `professores/${uid}/turmas/data`,
      `users/${uid}/turmas/data`,
      `professores/${uid}`,
    ]) {
      const data = await reader.get(path);
      if (Array.isArray(data?.turmas)) return data.turmas;
    }
    return [];
  }
  async fonte(id) {
    const fonte = await this.acervo.lerQuestaoAcervo(id);
    if (this.acervo.hashRevisaoAcervo)
      fonte.hashFonte = await this.acervo.hashRevisaoAcervo(id);
    return fonte;
  }
  async catalogo(ator) {
    const uid = this.docente(ator);
    const [fontes, revisoes, turmas, salas] = await Promise.all([
      this.acervo.listarAcervo(),
      this.store.list(`revisaoDocentes/${uid}/questoes`),
      this.turmas(uid),
      this.store.list("revisaoSalas", [["professorId", "==", uid]]),
    ]);
    if (this.acervo.hashRevisaoAcervo)
      await Promise.all(
        fontes.map(async (q) => {
          q.hashFonte = await this.acervo.hashRevisaoAcervo(q.id);
        }),
      );
    const mapa = new Map(revisoes.map((r) => [r.id, r]));
    return {
      questoes: fontes.map((q) => ({
        ...q,
        apta:
          mapa.get(q.id)?.hashFonte === q.hashFonte &&
          mapa.get(q.id)?.aprovada === true &&
          CHECKS.every((k) => mapa.get(q.id)?.confirmacoes?.[k] === true),
      })),
      turmas: turmas
        .filter((t) => !t.arquivada)
        .map((t) => ({
          id: String(t.id),
          nome: t.nome || "Turma",
          totalAlunos: t.alunos?.length || 0,
        })),
      salas: salas
        .sort((a, b) => b.criadaEmMs - a.criadaEmMs)
        .slice(0, 30)
        .map((s) => ({
          id: s.id,
          codigo: s.codigo,
          titulo: s.titulo,
          fase: faseEfetiva(s, this.agora()),
          criadaEmMs: s.criadaEmMs,
        })),
    };
  }
  async questaoDocente(uid, id, reader = this.store) {
    const fonte = await this.fonte(id);
    const revisao = await reader.get(
      `revisaoDocentes/${uid}/questoes/${segmento(id)}`,
    );
    const aprovada =
      revisao?.hashFonte === fonte.hashFonte &&
      revisao.aprovada === true &&
      CHECKS.every((k) => revisao.confirmacoes?.[k] === true);
    const questao = aprovada
      ? ajustarQuestao(fonte.questao, revisao.ajustes)
      : structuredClone(fonte.questao);
    questao.status = aprovada ? "revisada" : "rascunho";
    questao.revisao = Object.fromEntries(CHECKS.map((k) => [k, aprovada]));
    return { questao, hashFonte: fonte.hashFonte, aprovada };
  }
  async questao(ator, id) {
    const uid = this.docente(ator);
    const q = await this.questaoDocente(uid, id);
    q.questao.imagens = q.questao.imagens.map((i) => ({
      ...i,
      url: `/api/revisao/questoes/${q.questao.id}/imagens/${i.id}`,
    }));
    return { questao: q.questao, hashFonte: q.hashFonte };
  }
  async aprovar(ator, id, body) {
    const uid = this.docente(ator);
    const fonte = await this.fonte(id);
    if (body?.hashFonte !== fonte.hashFonte)
      throw falha(409, "A fonte desta questão mudou. Reabra a conferência.");
    if (!CHECKS.every((k) => body.confirmacoes?.[k] === true))
      throw falha(422, "Confirme os quatro itens da conferência docente.");
    if (JSON.stringify(body.ajustes || {}).length > 64000)
      throw falha(422, "A revisão excede o tamanho permitido.");
    const q = ajustarQuestao(fonte.questao, body.ajustes || {});
    await this.acervo.validarImagensAcervo(q);
    await this.store.set(`revisaoDocentes/${uid}/questoes/${segmento(id)}`, {
      id,
      hashFonte: fonte.hashFonte,
      ajustes: copiaAjustes(q),
      confirmacoes: Object.fromEntries(CHECKS.map((k) => [k, true])),
      aprovada: true,
      aprovadaEmMs: this.agora(),
    });
    return this.questao(ator, id);
  }
  async criar(ator, selecao) {
    const uid = this.docente(ator);
    if (
      !Array.isArray(selecao?.questaoIds) ||
      selecao.questaoIds.length > 20 ||
      !Array.isArray(selecao?.turmaIds) ||
      selecao.turmaIds.length > 10
    )
      throw falha(422, "Selecione de uma a vinte questões e até dez turmas.");
    const codigo = codigoSala(this.gerarCodigo());
    await this.store.transaction(async (tx) => {
      const existente = await tx.get(caminho(codigo));
      if (existente)
        throw falha(409, "O código da sala já existe. Tente criar novamente.");
      const turmas = (await this.turmas(uid, tx)).filter((t) => !t.arquivada);
      const questoes = await Promise.all(
        selecao.questaoIds.map((id) => this.questaoDocente(uid, id, tx)),
      );
      const erro = validarPreparacao(
        selecao,
        turmas.map((t) => ({ ...t, id: String(t.id) })),
        questoes.map((q) => ({ ...q.questao, apta: q.aprovada })),
      );
      if (erro) throw falha(422, erro);
      const roster = [
        ...new Set(
          turmas
            .filter((t) => selecao.turmaIds.includes(String(t.id)))
            .flatMap((t) =>
              (t.alunos || []).map((a) =>
                this.idParticipante(String(t.id), String(a.id)),
              ),
            ),
        ),
      ];
      if (!roster.length || roster.length > LIMITE_PARTICIPANTES)
        throw falha(
          422,
          `As turmas devem conter de 1 a ${LIMITE_PARTICIPANTES} alunos no total. Divida em salas menores.`,
        );
      const sala = {
        id: codigo,
        codigo,
        titulo: selecao.titulo.trim(),
        professorId: uid,
        turmaIds: [...selecao.turmaIds],
        roster,
        duracaoSegundos: selecao.duracaoSegundos,
        rodadas: questoes.map((q) => ({
          id: this.gerarId(),
          questaoId: q.questao.id,
        })),
        indice: 0,
        fase: "espera",
        revisao: 1,
        encerraEmMs: null,
        perguntaAbertaEmMs: null,
        criadaEmMs: this.agora(),
        ranking: [],
      };
      tx.create(caminho(codigo), sala);
      questoes.forEach((q, i) =>
        tx.create(`${caminho(codigo)}/conteudo/${sala.rodadas[i].id}`, {
          questao: q.questao,
          hashFonte: q.hashFonte,
        }),
      );
      tx.create(
        `${caminho(codigo)}/publicacao/estado`,
        montarPublicacao(sala, questoes[0].questao),
      );
    });
    return { sala: { id: codigo, codigo } };
  }
  async autorizarSala(
    ator,
    codigo,
    reader = this.store,
    { participanteObrigatorio = true } = {},
  ) {
    codigoSala(codigo);
    const sala = await reader.get(caminho(codigo));
    if (!sala) throw falha(404, "Sala não encontrada. Confira o código.");
    if (ator?.tipo === "professor") {
      if (this.docente(ator) !== sala.professorId)
        throw falha(403, "Esta sala pertence a outro professor.");
      return { sala, participante: null };
    }
    if (ator?.tipo !== "aluno") throw falha(401, "Entre no Portal do Aluno.");
    const loginKey = segmento(ator.loginKey);
    const vinculo = await reader.get(
      `alunoLogin/${loginKey}/vinculos/${sala.professorId}`,
    );
    if (
      !vinculo ||
      vinculo.revogado ||
      vinculo.professorUid !== sala.professorId ||
      !sala.turmaIds.includes(String(vinculo.turmaId))
    )
      throw falha(403, "Seu vínculo não permite participar desta sala.");
    const turma = (await this.turmas(sala.professorId, reader)).find(
      (t) => String(t.id) === String(vinculo.turmaId) && !t.arquivada,
    );
    const aluno = turma?.alunos?.find(
      (a) => String(a.id) === String(vinculo.alunoId),
    );
    const id = this.idParticipante(
      String(vinculo.turmaId),
      String(vinculo.alunoId),
    );
    if (!aluno || !sala.roster.includes(id))
      throw falha(
        403,
        "Matrícula não encontrada entre os participantes desta sala.",
      );
    const cadastrado = await reader.get(
      `${caminho(codigo)}/participantes/${id}`,
    );
    if (participanteObrigatorio && !cadastrado)
      throw falha(403, "Entre na sala antes de acompanhar ou responder.");
    return {
      sala,
      participante: {
        id,
        nomeExibicao: String(aluno.nome || "Estudante")
          .trim()
          .slice(0, 80),
        ...cadastrado,
      },
    };
  }
  async entrar(ator, codigo) {
    if (ator?.tipo !== "aluno")
      throw falha(403, "Use o Portal do Aluno para entrar como participante.");
    await this.store.transaction(async (tx) => {
      const { sala, participante } = await this.autorizarSala(
        ator,
        codigo,
        tx,
        { participanteObrigatorio: false },
      );
      if (sala.fase === "finalizada")
        throw falha(409, "Esta sala já foi finalizada.");
      const path = `${caminho(codigo)}/participantes/${participante.id}`;
      const atual = await tx.get(path);
      if (!atual)
        tx.create(path, {
          id: participante.id,
          nomeExibicao: participante.nomeExibicao,
          pontos: 0,
          entrouEmMs: this.agora(),
        });
    });
    return { sala: { id: codigo, codigo } };
  }
  async validarImagemSala(ator, codigo, questaoId, imagemId) {
    const { sala } = await this.autorizarSala(ator, codigo);
    const congelada = await this.store.get(
      `${caminho(codigo)}/conteudo/${sala.rodadas[sala.indice].id}`,
    );
    if (!congelada) throw falha(404, "Imagem indisponível.");
    const publicado = montarPublicacao(sala, congelada.questao);
    if (
      publicado.rodada.questao?.id !== questaoId ||
      !publicado.rodada.questao.imagens.some((i) => i.id === imagemId)
    )
      throw falha(404, "Imagem indisponível nesta fase.");
    const atual = await this.fonte(questaoId);
    if (atual.hashFonte !== congelada.hashFonte)
      throw falha(
        409,
        "A fonte desta imagem mudou. Crie uma nova sala após conferir a questão atualizada.",
      );
  }
  async estado(ator, codigo) {
    const { sala, participante } = await this.autorizarSala(ator, codigo);
    const publicado = await this.store.get(
      `${caminho(codigo)}/publicacao/estado`,
    );
    if (!publicado)
      throw falha(503, "Estado da sala temporariamente indisponível.");
    const docente = ator.tipo === "professor";
    const [participantes, respostas, recibo] = await Promise.all([
      docente ? this.store.list(`${caminho(codigo)}/participantes`) : [],
      docente
        ? this.store.list(`${caminho(codigo)}/respostas`, [
            ["rodadaId", "==", publicado.rodada.id],
          ])
        : [],
      participante
        ? this.store.get(
            `${caminho(codigo)}/respostas/${publicado.rodada.id}__${participante.id}`,
          )
        : null,
    ]);
    return this.pacote(
      ator,
      publicado,
      participante,
      participantes,
      respostas,
      recibo,
    );
  }
  pacote(
    ator,
    publicado,
    participante,
    participantes = [],
    respostas = [],
    recibo = null,
  ) {
    return {
      estado: projetarEstado(publicado, {
        tipo: ator.tipo,
        participanteId: participante?.id,
        participantes,
        respostas,
        agora: this.agora(),
      }),
      envio: recibo
        ? this.reciboPublico(recibo)
        : {
            status: "nao_enviado",
            alternativa: null,
            rodadaId: publicado.rodada.id,
          },
    };
  }
  reciboPublico(r) {
    return {
      status: "confirmado",
      alternativa: r.alternativa,
      rodadaId: r.rodadaId,
      reciboId: r.id,
      recebidoEmMs: r.recebidoEmMs,
    };
  }
  async comandar(ator, codigo, body) {
    this.docente(ator);
    await this.store.transaction(async (tx) => {
      const { sala } = await this.autorizarSala(ator, codigo, tx);
      const agora = this.agora();
      const fase = validarComando(sala, body, agora);
      let indice = sala.indice;
      if (body.acao === "proxima_rodada") indice += 1;
      const congelada = await tx.get(
        `${caminho(codigo)}/conteudo/${sala.rodadas[indice].id}`,
      );
      if (!congelada) throw falha(503, "Conteúdo desta rodada indisponível.");
      const participantes = ["ranking", "finalizada"].includes(fase)
        ? await tx.list(`${caminho(codigo)}/participantes`)
        : [];
      const atual = { ...sala, fase, indice, revisao: sala.revisao + 1 };
      if (body.acao === "proxima_rodada") {
        atual.encerraEmMs = null;
        atual.perguntaAbertaEmMs = null;
        atual.ranking = [];
      }
      if (fase === "pergunta") {
        atual.perguntaAbertaEmMs = agora;
        atual.encerraEmMs = agora + sala.duracaoSegundos * 1000;
      }
      if (["ranking", "finalizada"].includes(fase))
        atual.ranking = calcularRanking(participantes);
      tx.set(caminho(codigo), atual);
      tx.set(
        `${caminho(codigo)}/publicacao/estado`,
        montarPublicacao(atual, congelada.questao),
      );
    });
    return this.estado(ator, codigo);
  }
  async responder(ator, codigo, body) {
    if (ator?.tipo !== "aluno")
      throw falha(403, "Use sua sessão do Portal para responder.");
    if (!LETRAS.includes(body?.alternativa))
      throw falha(422, "Escolha uma alternativa de A a E.");
    segmento(body.rodadaId);
    const recibo = await this.store.transaction(async (tx) => {
      const { sala, participante } = await this.autorizarSala(ator, codigo, tx);
      const id = `${body.rodadaId}__${participante.id}`;
      const path = `${caminho(codigo)}/respostas/${id}`;
      const anterior = await tx.get(path);
      if (anterior) {
        if (anterior.alternativa !== body.alternativa)
          throw falha(
            409,
            "Sua resposta já foi confirmada e não pode ser trocada.",
          );
        return anterior;
      }
      const rodada = sala.rodadas[sala.indice];
      if (
        body.rodadaId !== rodada.id ||
        faseEfetiva(sala, this.agora()) !== "pergunta"
      )
        throw falha(409, "A rodada não está aberta para respostas.");
      const congelada = await tx.get(
        `${caminho(codigo)}/conteudo/${rodada.id}`,
      );
      if (!congelada)
        throw falha(503, "Conteúdo indisponível. Tente novamente.");
      // Reexecutado em cada retry da transação, depois de todas as leituras.
      const recebidoEmMs = this.agora();
      if (recebidoEmMs >= sala.encerraEmMs)
        throw falha(409, "O tempo desta rodada terminou.");
      const pontos = body.alternativa === congelada.questao.gabarito ? 1000 : 0;
      const resposta = {
        id,
        rodadaId: rodada.id,
        participanteId: participante.id,
        alternativa: body.alternativa,
        pontos,
        recebidoEmMs,
      };
      tx.create(path, resposta);
      tx.set(`${caminho(codigo)}/participantes/${participante.id}`, {
        ...participante,
        pontos: participante.pontos + pontos,
      });
      return resposta;
    });
    return { envio: this.reciboPublico(recibo) };
  }
  async assinar(ator, codigo, onEstado, onErro) {
    const { participante } = await this.autorizarSala(ator, codigo);
    let ativo = true,
      publicado = null,
      participantes = [],
      respostas = [],
      recibo = null,
      rodada = null,
      versao = 0,
      stopRespostas = null,
      timerPrazo = null,
      timerEmitir = null;
    const stops = [];
    const falhar = (erro) => {
      if (ativo) onErro(erro);
    };
    const emitir = () => {
      if (!ativo || !publicado) return;
      onEstado(
        this.pacote(
          ator,
          publicado,
          participante,
          participantes,
          respostas,
          recibo,
        ),
      );
    };
    const agendar = () => {
      if (!ativo || timerEmitir) return;
      timerEmitir = setTimeout(() => {
        timerEmitir = null;
        emitir();
      }, 100);
    };
    try {
      if (ator.tipo === "professor")
        stops.push(
          this.store.listenList(
            `${caminho(codigo)}/participantes`,
            [],
            (lista) => {
              participantes = lista;
              agendar();
            },
            falhar,
          ),
        );
      stops.push(
        this.store.listenDoc(
          `${caminho(codigo)}/publicacao/estado`,
          (data) => {
            if (!ativo) return;
            if (!data) {
              falhar(falha(404, "Sala indisponível."));
              return;
            }
            if (publicado && data.sala.revisao < publicado.sala.revisao) return;
            publicado = data;
            clearTimeout(timerPrazo);
            if (
              data.fase === "pergunta" &&
              data.rodada.encerraEmMs > this.agora()
            )
              timerPrazo = setTimeout(
                emitir,
                data.rodada.encerraEmMs - this.agora() + 1,
              );
            if (rodada !== data.rodada.id) {
              rodada = data.rodada.id;
              const contexto = ++versao;
              recibo = null;
              respostas = [];
              stopRespostas?.();
              stopRespostas = null;
              if (ator.tipo === "professor")
                stopRespostas = this.store.listenList(
                  `${caminho(codigo)}/respostas`,
                  [["rodadaId", "==", rodada]],
                  (lista) => {
                    if (ativo && contexto === versao) {
                      respostas = lista;
                      agendar();
                    }
                  },
                  falhar,
                );
              else
                stopRespostas = this.store.listenDoc(
                  `${caminho(codigo)}/respostas/${rodada}__${participante.id}`,
                  (r) => {
                    if (ativo && contexto === versao) {
                      recibo = r;
                      agendar();
                    }
                  },
                  falhar,
                );
            }
            agendar();
          },
          falhar,
        ),
      );
    } catch (e) {
      ativo = false;
      stops.forEach((stop) => stop());
      stopRespostas?.();
      clearTimeout(timerPrazo);
      clearTimeout(timerEmitir);
      throw e;
    }
    return {
      emitir,
      fechar: () => {
        ativo = false;
        versao++;
        stops.forEach((stop) => stop());
        stopRespostas?.();
        clearTimeout(timerPrazo);
        clearTimeout(timerEmitir);
      },
    };
  }
}
