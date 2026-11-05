import {
  validarSelecaoTematica,
  transicaoTematica,
  publicarTematico,
} from "@/dominio/revisao/tematico";
import { validarPreparacao } from "@/dominio/revisao/preparacao";
import {
  falha,
  segmento,
  codigoSala,
  LETRAS,
  LIMITE_PARTICIPANTES,
  faseEfetiva,
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
    acervoTematico,
    agora = Date.now,
    gerarCodigo,
    gerarId = () => crypto.randomUUID(),
    idParticipante = (t, a) =>
      encodeURIComponent(t) + "_" + encodeURIComponent(a),
  }) {
    Object.assign(this, {
      store,
      acervo,
      acervoTematico,
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
    const tematico = this.acervoTematico
      ? await this.acervoTematico.listarCatalogoTematico()
      : null;
    const revisoesAula = tematico
      ? await this.store.list(`revisaoDocentes/${uid}/aulas`)
      : [];
    const checksAula = ["conteudo", "imagens", "cobertura"];
    return {
      ...(tematico
        ? {
            trilhas: tematico.trilhas,
            conteudos: tematico.conteudos.map((a) => ({
              ...a,
              apta: revisoesAula.some(
                (r) =>
                  r.id === a.id &&
                  r.hashFonte === a.hashFonte &&
                  r.aprovada === true &&
                  checksAula.every((k) => r.confirmacoes?.[k] === true),
              ),
            })),
          }
        : {}),
      questoes: fontes.map((q) => ({
        ...q,
        ...(tematico
          ? {
              conteudoIds:
                tematico.questoes.find((v) => v.questaoId === q.id)
                  ?.conteudoIds || [],
            }
          : {}),
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
  async conteudoDocente(uid, id, reader = this.store) {
    if (!this.acervoTematico) throw falha(503, "Acervo temático indisponível.");
    const fonte = await this.acervoTematico.lerConteudoTematico(segmento(id));
    const revisao = await reader.get(`revisaoDocentes/${uid}/aulas/${id}`);
    const aprovada =
      revisao?.aprovada === true &&
      revisao.hashFonte === fonte.hashFonte &&
      ["conteudo", "imagens", "cobertura"].every(
        (k) => revisao.confirmacoes?.[k] === true,
      );
    return { ...fonte, aprovada };
  }
  async conteudo(ator, id) {
    const fonte = await this.conteudoDocente(this.docente(ator), id);
    const [mapa, metas] = await Promise.all([
      this.acervoTematico.listarCatalogoTematico(),
      this.acervo.listarAcervo(),
    ]);
    const vinculadas = new Set(
      mapa.questoes
        .filter((q) => q.conteudoIds.includes(id))
        .map((q) => q.questaoId),
    );
    return {
      conteudo: {
        ...fonte.conteudo,
        questoesVinculadas: metas
          .filter((q) => vinculadas.has(q.id))
          .map((q) => ({ id: q.id, tema: q.tema, ano: q.ano })),
        status: fonte.aprovada ? "revisada" : "rascunho",
        imagens: fonte.conteudo.imagens.map(({ arquivo, ...img }) => ({
          ...img,
          url: `/api/revisao/conteudos/${id}/imagens/${img.id}`,
        })),
      },
      hashFonte: fonte.hashFonte,
    };
  }
  async aprovarConteudo(ator, id, body) {
    const uid = this.docente(ator),
      fonte = await this.conteudoDocente(uid, id);
    if (body?.hashFonte !== fonte.hashFonte)
      throw falha(409, "A aula ou sua cobertura mudou. Reabra a conferência.");
    if (
      !["conteudo", "imagens", "cobertura"].every(
        (k) => body.confirmacoes?.[k] === true,
      )
    )
      throw falha(422, "Confirme os três itens da aula.");
    await this.store.set(`revisaoDocentes/${uid}/aulas/${id}`, {
      id,
      hashFonte: fonte.hashFonte,
      aprovada: true,
      confirmacoes: { conteudo: true, imagens: true, cobertura: true },
      aprovadaEmMs: this.agora(),
    });
    return this.conteudo(ator, id);
  }
  async publicacao(sala, questao, reader = this.store) {
    let aula = null;
    if (sala.schemaVersion === 2 && sala.fase === "conteudo")
      aula = await reader.get(
        `${caminho(sala.codigo)}/aulas/${sala.sequenciaAula[sala.indiceBloco].conteudoId}`,
      );
    return publicarTematico(montarPublicacao(sala, questao), sala, aula);
  }
  async validarImagemAulaSala(ator, codigo, id, imagemId) {
    const { sala } = await this.autorizarSala(ator, codigo);
    if (
      sala.schemaVersion !== 2 ||
      sala.fase !== "conteudo" ||
      sala.sequenciaAula[sala.indiceBloco]?.conteudoId !== id
    )
      throw falha(404, "Imagem indisponível nesta fase.");
    const aula = await this.store.get(`${caminho(codigo)}/aulas/${id}`);
    const bloco = aula?.conteudo.blocos.find(
      (b) => b.id === sala.sequenciaAula[sala.indiceBloco].blocoId,
    );
    if (bloco?.tipo !== "imagem" || bloco.imagemId !== imagemId)
      throw falha(404, "Imagem indisponível neste bloco.");
    const atual = await this.acervoTematico.lerConteudoTematico(id);
    if (atual.hashFonte !== aula.hashFonte)
      throw falha(409, "A fonte da aula mudou. Confira e crie uma nova sala.");
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
    const tematico = this.acervoTematico
      ? await this.acervoTematico.listarCatalogoTematico()
      : null;
    if (tematico) validarSelecaoTematica(selecao, tematico);
    else if (selecao?.schemaVersion === 2 || selecao?.conteudoIds)
      throw falha(503, "Acervo temático indisponível.");
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
      const aulas = tematico
        ? await Promise.all(
            selecao.conteudoIds.map((id) => this.conteudoDocente(uid, id, tx)),
          )
        : [];
      if (aulas.some((a) => !a.aprovada))
        throw falha(
          422,
          "Confira e aprove as aulas selecionadas antes de criar a sala.",
        );
      if (
        aulas.some((a) => Buffer.byteLength(JSON.stringify(a), "utf8") > 700000)
      )
        throw falha(
          422,
          "A aula excede o tamanho permitido. Divida o conteúdo.",
        );
      const sequencia = aulas.flatMap((a) =>
        a.conteudo.blocos.map((b) => ({
          conteudoId: a.conteudo.id,
          blocoId: b.id,
        })),
      );
      if (tematico && (!sequencia.length || sequencia.length > 192))
        throw falha(422, "Divida a revisão em até 192 blocos.");
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
        ...(tematico
          ? {
              schemaVersion: 2,
              conteudoIds: [...selecao.conteudoIds],
              sequenciaAula: sequencia,
              indiceBloco: 0,
            }
          : {}),
        titulo: selecao.titulo.trim(),
        professorId: uid,
        turmaIds: [...selecao.turmaIds],
        roster,
        duracaoSegundos: selecao.duracaoSegundos,
        rodadas: questoes.map((q) => ({
          id: this.gerarId(),
          questaoId: q.questao.id,
          ...(tematico
            ? {
                duracaoSegundos:
                  selecao.duracaoPorQuestao[q.questao.id] ??
                  selecao.duracaoSegundos,
                usaDuracaoPadrao: selecao.duracaoPorQuestao[q.questao.id] == null,
              }
            : {}),
        })),
        indice: 0,
        fase: "espera",
        revisao: 1,
        encerraEmMs: null,
        perguntaAbertaEmMs: null,
        criadaEmMs: this.agora(),
        ranking: [],
      };
      // A publicação inicial não contém aula nem pergunta; todas as leituras precedem escritas.
      const publicado = publicarTematico(
        montarPublicacao(sala, questoes[0].questao),
        sala,
        null,
      );
      tx.create(caminho(codigo), sala);
      aulas.forEach((a) =>
        tx.create(`${caminho(codigo)}/aulas/${a.conteudo.id}`, {
          conteudo: a.conteudo,
          hashFonte: a.hashFonte,
        }),
      );
      questoes.forEach((q, i) =>
        tx.create(`${caminho(codigo)}/conteudo/${sala.rodadas[i].id}`, {
          questao: q.questao,
          hashFonte: q.hashFonte,
        }),
      );
      tx.create(`${caminho(codigo)}/publicacao/estado`, publicado);
    });
    return { sala: { id: codigo, codigo } };
  }
  async obterEdicao(ator, codigo) {
    const uid = this.docente(ator);
    codigoSala(codigo);
    const sala = await this.store.get(caminho(codigo));
    if (!sala) throw falha(404, "Sala não encontrada. Confira o código.");
    if (sala.professorId !== uid)
      throw falha(403, "Esta sala pertence a outro professor.");
    if (sala.fase !== "espera")
      throw falha(409, "A sala já foi iniciada e não pode mais ser editada.");

    const participantes = await this.store.list(
      `${caminho(codigo)}/participantes`,
    );
    const podeEditarTurmas = participantes.length === 0;

    const duracaoPorQuestao = {};
    for (const r of sala.rodadas || []) {
      if (r.duracaoSegundos != null && !r.usaDuracaoPadrao) {
        duracaoPorQuestao[r.questaoId] = r.duracaoSegundos;
      }
    }

    const selecao = {
      titulo: sala.titulo,
      turmaIds: [...(sala.turmaIds || [])],
      questaoIds: (sala.rodadas || []).map((r) => r.questaoId),
      duracaoSegundos: sala.duracaoSegundos,
      ...(sala.schemaVersion === 2
        ? {
            schemaVersion: 2,
            conteudoIds: [...(sala.conteudoIds || [])],
            quantidadeQuestoes: (sala.rodadas || []).length,
            duracaoPorQuestao,
          }
        : {}),
    };

    return {
      codigo: sala.codigo,
      revisao: sala.revisao,
      podeEditarTurmas,
      totalParticipantes: participantes.length,
      selecao,
    };
  }
  async editar(ator, codigo, body) {
    const uid = this.docente(ator);
    codigoSala(codigo);
    const selecao = body?.selecao;
    const revisaoEsperada =
      body?.revisaoEsperada ?? body?.revisao ?? body?.versaoEsperada;
    if (revisaoEsperada == null)
      throw falha(422, "Versão esperada da sala é obrigatória.");

    if (
      !selecao ||
      !Array.isArray(selecao?.questaoIds) ||
      selecao.questaoIds.length === 0 ||
      selecao.questaoIds.length > 20 ||
      !Array.isArray(selecao?.turmaIds) ||
      selecao.turmaIds.length === 0 ||
      selecao.turmaIds.length > 10
    )
      throw falha(422, "Selecione de uma a vinte questões e até dez turmas.");

    const tematico = this.acervoTematico
      ? await this.acervoTematico.listarCatalogoTematico()
      : null;

    let revisaoFinal = 1;
    await this.store.transaction(async (tx) => {
      const sala = await tx.get(caminho(codigo));
      if (!sala) throw falha(404, "Sala não encontrada. Confira o código.");
      if (sala.professorId !== uid)
        throw falha(403, "Esta sala pertence a outro professor.");
      if (sala.fase !== "espera")
        throw falha(409, "A sala já foi iniciada e não pode mais ser editada.");
      if (Number(sala.revisao) !== Number(revisaoEsperada))
        throw falha(
          409,
          "A sala foi alterada concorrentemente. Recarregue os dados antes de salvar.",
        );

      const participantes = await tx.list(`${caminho(codigo)}/participantes`);
      const temParticipantes = participantes.length > 0;
      const turmasIguais =
        Array.isArray(sala.turmaIds) &&
        selecao.turmaIds.length === sala.turmaIds.length &&
        selecao.turmaIds.every((id) => sala.turmaIds.includes(String(id)));

      if (temParticipantes && !turmasIguais)
        throw falha(
          409,
          "Não é possível alterar as turmas após a entrada de participantes.",
        );

      if (sala.schemaVersion === 2) {
        if (!tematico) throw falha(503, "Acervo temático indisponível.");
        validarSelecaoTematica(selecao, tematico);
      }

      const todasTurmas = await this.turmas(uid, tx);
      const turmasSelecionadas = todasTurmas.filter((t) =>
        selecao.turmaIds.includes(String(t.id)),
      );
      if (turmasSelecionadas.some((t) => t.arquivada))
        throw falha(422, "Uma das turmas selecionadas foi arquivada.");
      if (turmasSelecionadas.length !== selecao.turmaIds.length)
        throw falha(422, "Turma selecionada não encontrada ou arquivada.");

      const turmasAtivas = todasTurmas.filter((t) => !t.arquivada);
      const questoes = await Promise.all(
        selecao.questaoIds.map((id) => this.questaoDocente(uid, id, tx)),
      );
      const erro = validarPreparacao(
        selecao,
        turmasAtivas.map((t) => ({ ...t, id: String(t.id) })),
        questoes.map((q) => ({ ...q.questao, apta: q.aprovada })),
      );
      if (erro) throw falha(422, erro);

      let aulas = [];
      let sequencia = [];
      if (sala.schemaVersion === 2) {
        aulas = await Promise.all(
          selecao.conteudoIds.map((id) => this.conteudoDocente(uid, id, tx)),
        );
        if (aulas.some((a) => !a.aprovada))
          throw falha(
            422,
            "Confira e aprove as aulas selecionadas antes de salvar a sala.",
          );
        if (
          aulas.some(
            (a) => Buffer.byteLength(JSON.stringify(a), "utf8") > 700000,
          )
        )
          throw falha(
            422,
            "A aula excede o tamanho permitido. Divida o conteúdo.",
          );
        sequencia = aulas.flatMap((a) =>
          a.conteudo.blocos.map((b) => ({
            conteudoId: a.conteudo.id,
            blocoId: b.id,
          })),
        );
        if (!sequencia.length || sequencia.length > 192)
          throw falha(422, "Divida a revisão em até 192 blocos.");
      }

      let roster = sala.roster;
      if (!turmasIguais) {
        roster = [
          ...new Set(
            turmasSelecionadas.flatMap((t) =>
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
      }

      // Preservar conteúdos congelados que não mudaram
      const novasRodadas = [];
      const novosDocumentos = [];
      const documentosRemovidos = [];
      const rodadaIdsUsados = new Set();
      for (let i = 0; i < selecao.questaoIds.length; i += 1) {
        const qId = selecao.questaoIds[i];
        const qDoc = questoes[i];
        const existente = (sala.rodadas || []).find(
          (r) => r.questaoId === qId && !rodadaIdsUsados.has(r.id),
        );
        let rodadaId = existente?.id;
        let congelado = null;
        if (rodadaId) {
          congelado = await tx.get(`${caminho(codigo)}/conteudo/${rodadaId}`);
        }
        if (congelado && congelado.hashFonte === qDoc.hashFonte) {
          rodadaIdsUsados.add(rodadaId);
        } else {
          rodadaId = this.gerarId();
          novosDocumentos.push([`${caminho(codigo)}/conteudo/${rodadaId}`, {
            questao: qDoc.questao,
            hashFonte: qDoc.hashFonte,
          }]);
        }
        novasRodadas.push({
          id: rodadaId,
          questaoId: qId,
          ...(sala.schemaVersion === 2
            ? {
                duracaoSegundos:
                  selecao.duracaoPorQuestao?.[qId] ??
                  selecao.duracaoSegundos,
                usaDuracaoPadrao: selecao.duracaoPorQuestao?.[qId] == null,
              }
            : {}),
        });
      }

      // Limpar rodadas antigas não utilizadas
      for (const r of sala.rodadas || []) {
        if (!novasRodadas.some((nr) => nr.id === r.id)) {
          documentosRemovidos.push(`${caminho(codigo)}/conteudo/${r.id}`);
        }
      }

      // Para aulas temáticas
      if (sala.schemaVersion === 2) {
        for (const a of aulas) {
          const aulaCongelada = await tx.get(
            `${caminho(codigo)}/aulas/${a.conteudo.id}`,
          );
          if (!aulaCongelada || aulaCongelada.hashFonte !== a.hashFonte) {
            novosDocumentos.push([`${caminho(codigo)}/aulas/${a.conteudo.id}`, {
              conteudo: a.conteudo,
              hashFonte: a.hashFonte,
            }]);
          }
        }
        for (const antigaAulaId of sala.conteudoIds || []) {
          if (!selecao.conteudoIds.includes(antigaAulaId)) {
            documentosRemovidos.push(`${caminho(codigo)}/aulas/${antigaAulaId}`);
          }
        }
      }

      const salaAtualizada = {
        ...sala,
        titulo: selecao.titulo.trim(),
        turmaIds: turmasIguais ? sala.turmaIds : [...selecao.turmaIds],
        roster,
        duracaoSegundos: selecao.duracaoSegundos,
        rodadas: novasRodadas,
        revisao: sala.revisao + 1,
        ...(sala.schemaVersion === 2
          ? {
              conteudoIds: [...selecao.conteudoIds],
              sequenciaAula: sequencia,
              indiceBloco: 0,
            }
          : {}),
      };

      const publicado = publicarTematico(
        montarPublicacao(salaAtualizada, questoes[0].questao),
        salaAtualizada,
        null,
      );

      // O Firestore exige concluir todas as leituras antes da primeira escrita.
      for (const [path, dados] of novosDocumentos) tx.set(path, dados);
      for (const path of documentosRemovidos) tx.delete(path);
      tx.set(caminho(codigo), salaAtualizada);
      tx.set(`${caminho(codigo)}/publicacao/estado`, publicado);
      revisaoFinal = salaAtualizada.revisao;
    });

    return { sala: { id: codigo, codigo, revisao: revisaoFinal } };
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
      const fase = transicaoTematica(sala, body, agora);
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
      if (sala.schemaVersion === 2) {
        if (body.acao === "avancar_conteudo") atual.indiceBloco += 1;
        if (body.acao === "voltar_conteudo") atual.indiceBloco -= 1;
      }
      if (body.acao === "proxima_rodada") {
        atual.encerraEmMs = null;
        atual.perguntaAbertaEmMs = null;
        atual.ranking = [];
      }
      if (fase === "pergunta") {
        atual.perguntaAbertaEmMs = agora;
        atual.encerraEmMs =
          agora +
          (sala.rodadas[indice].duracaoSegundos ?? sala.duracaoSegundos) * 1000;
      }
      if (["ranking", "finalizada"].includes(fase))
        atual.ranking = calcularRanking(participantes);
      const publicado = await this.publicacao(atual, congelada.questao, tx);
      tx.set(caminho(codigo), atual);
      tx.set(`${caminho(codigo)}/publicacao/estado`, publicado);
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
