import {
  codigoSala,
  falha,
  hashRequisicao,
  idRequisicao,
  inteiroFaixa,
  listaObrigatoria,
  normalizarId,
  segmento,
  textoObrigatorio,
} from "@/dominio/aula-gamificada/comum";
import {
  MODALIDADES,
  obterModalidade,
  regraPontuacao,
  validarTipoModalidade,
} from "@/dominio/aula-gamificada/modalidades";
import {
  facesDasCartas,
  normalizarQuestao,
  validarParaRevisao,
  validarQuestao,
  validarResposta,
} from "@/dominio/aula-gamificada/questoes";
import {
  montarPromptGeracao,
  normalizarRespostaIA,
  validarEntradaGeracao,
} from "@/dominio/aula-gamificada/geracao";
import {
  aceitaRespostas,
  aplicarComando,
  montarConteudo,
  montarRoster,
  projetarEstado,
  validarEquipes,
} from "@/dominio/aula-gamificada/sala";
import { pontuarMemoria, pontuarResposta } from "@/dominio/aula-gamificada/pontuacao";

const salaPath = (codigo) => `aulaGamificadaSalas/${codigo}`;
const conteudoPath = (codigo, indice) => `${salaPath(codigo)}/conteudos/${indice}`;
const participantesPath = (codigo) => `${salaPath(codigo)}/participantes`;
const participantePath = (codigo, id) => `${participantesPath(codigo)}/${id}`;
const respostasPath = (codigo) => `${salaPath(codigo)}/respostas`;
const respostaPath = (codigo, rodada, participanteId) =>
  `${respostasPath(codigo)}/${rodada}_${participanteId}`;
const questoesPath = (uid) => `aulaGamificadaDocentes/${uid}/questoes`;
const questaoPath = (uid, id) => `${questoesPath(uid)}/${id}`;
const requisicoesPath = (uid) => `aulaGamificadaDocentes/${uid}/requisicoes`;
const requisicaoPath = (uid, chave) => `${requisicoesPath(uid)}/${chave}`;

const copia = (valor) => structuredClone(valor);

/**
 * Serviço do módulo Aula Gamificada.
 * Não conhece HTTP: recebe atores já autenticados e devolve dados de domínio.
 * A persistência é sempre injetada (Firestore Admin em produção, memória em testes).
 */
export class AulaGamificadaService {
  constructor({
    store,
    ia = null,
    agora = Date.now,
    gerarId = () => crypto.randomUUID(),
    gerarCodigo,
    idParticipante = (turmaId, alunoId) => `${turmaId}:${alunoId}`,
  }) {
    Object.assign(this, { store, ia, agora, gerarId, gerarCodigo, idParticipante });
  }

  docente(ator) {
    if (ator?.tipo !== "professor")
      throw falha(403, "Entre com a conta docente para esta ação.");
    return segmento(ator.uid, { campo: "UID do professor", max: 128 });
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

  async catalogo(ator) {
    const uid = this.docente(ator);
    const [questoes, turmas, salas] = await Promise.all([
      this.store.list(questoesPath(uid)),
      this.turmas(uid),
      this.store.list("aulaGamificadaSalas", [["professorId", "==", uid]]),
    ]);
    return {
      modalidades: MODALIDADES.map((modalidade) => ({
        id: modalidade.id,
        nome: modalidade.nome,
        tiposQuestoes: [...modalidade.tiposQuestoes],
      })),
      turmas: turmas
        .filter((turma) => !turma.arquivada)
        .map((turma) => ({
          id: String(turma.id),
          nome: turma.nome || "Turma",
          totalAlunos: turma.alunos?.length || 0,
          // Roster mínimo para montar equipes: o ID estável de participante
          // já vem calculado pelo servidor e é o mesmo usado na sala.
          alunos: (turma.alunos || []).map((aluno) => ({
            id: this.idParticipante(String(turma.id), String(aluno.id)),
            alunoId: String(aluno.id),
            nome: String(aluno.nome || "Estudante").trim().slice(0, 80),
          })),
        })),
      questoes: questoes.sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0)),
      salas: salas
        .sort((a, b) => (b.criadoEmMs || 0) - (a.criadoEmMs || 0))
        .slice(0, 30)
        .map((sala) => ({
          id: sala.codigo,
          codigo: sala.codigo,
          titulo: sala.titulo,
          modalidade: sala.modalidade,
          fase: sala.fase,
          criadaEmMs: sala.criadoEmMs,
        })),
    };
  }

  async gerar(ator, body, userConfig) {
    const uid = this.docente(ator);
    if (!userConfig?.apiKey)
      throw falha(400, "Conecte sua chave de IA para gerar questões.");
    if (!this.ia?.gerar) throw falha(503, "Geração por IA indisponível.");
    const entrada = validarEntradaGeracao(body, {
      modalidade: body?.modalidade,
    });
    const { systemPrompt, prompt } = montarPromptGeracao(entrada);
    const json = await this.ia.gerar({ systemPrompt, prompt, userConfig });
    const { questoes } = normalizarRespostaIA(json, entrada, {
      gerarId: this.gerarId,
      professorId: uid,
    });
    return { questoes };
  }

  async salvarQuestao(ator, body) {
    const uid = this.docente(ator);
    if (!body || typeof body !== "object")
      throw falha(422, "Dados da questão inválidos.");
    const requestId = idRequisicao(body.requestId);
    const chave = hashRequisicao("questao", uid, requestId);
    return this.store.transaction(async (tx) => {
      const anterior = await tx.get(requisicaoPath(uid, chave));
      if (anterior) return copia(anterior.resposta);

      const entrada = body.questao;
      if (!entrada || typeof entrada !== "object" || Array.isArray(entrada))
        throw falha(422, "Informe a questão a salvar.");

      // Presença de expectedRevision indica edição; ausência indica criação,
      // inclusive quando o rascunho veio da IA com id já atribuído pelo servidor.
      const editando = body.expectedRevision !== undefined;
      let id = null;
      let existente = null;
      if (editando) {
        if (entrada.id === undefined || entrada.id === null || entrada.id === "")
          throw falha(422, "Informe o ID da questão que será editada.");
        id = segmento(String(entrada.id), { campo: "ID da questão", max: 60 });
        existente = await tx.get(questaoPath(uid, id));
        if (!existente) throw falha(404, "Questão não encontrada no seu banco.");
        if (
          !Number.isInteger(Number(body.expectedRevision)) ||
          Number(body.expectedRevision) !== existente.revision
        )
          throw falha(409, "A questão mudou. Recarregue antes de salvar.");
      } else if (
        entrada.id !== undefined &&
        entrada.id !== null &&
        entrada.id !== ""
      ) {
        id = segmento(String(entrada.id), { campo: "ID da questão", max: 60 });
        const colisao = await tx.get(questaoPath(uid, id));
        if (colisao)
          throw falha(409, "Já existe uma questão com este ID.");
      }

      const questao = normalizarQuestao(entrada, {
        gerarId: this.gerarId,
        agora: this.agora,
        professorId: uid,
        novosIdsPares: true,
        novosIdsItens: true,
      });
      if (id) questao.id = id;
      if (existente) {
        questao.revision = existente.revision + 1;
        questao.criadoEmMs = existente.criadoEmMs;
        delete questao.revisadaEmMs;
      } else {
        questao.revision = 1;
        questao.criadoEmMs = this.agora();
      }
      questao.status = "rascunho";
      questao.professorId = uid;
      validarQuestao(questao);

      const resposta = { questao };
      tx.set(questaoPath(uid, questao.id), questao);
      tx.set(requisicaoPath(uid, chave), {
        tipo: "questao",
        requestId,
        resposta,
        criadoEmMs: this.agora(),
      });
      return resposta;
    });
  }

  async revisarQuestao(ator, id, body) {
    const uid = this.docente(ator);
    const questaoId = segmento(String(id ?? ""), { campo: "ID da questão", max: 60 });
    const requestId = idRequisicao(body?.requestId);
    const chave = hashRequisicao("revisao", uid, questaoId, requestId);
    return this.store.transaction(async (tx) => {
      const anterior = await tx.get(requisicaoPath(uid, chave));
      if (anterior) return copia(anterior.resposta);

      const existente = await tx.get(questaoPath(uid, questaoId));
      if (!existente) throw falha(404, "Questão não encontrada no seu banco.");
      if (
        body?.expectedRevision === undefined ||
        !Number.isInteger(Number(body.expectedRevision)) ||
        Number(body.expectedRevision) !== existente.revision
      )
        throw falha(409, "A questão mudou. Recarregue antes de revisar.");

      validarParaRevisao(existente);
      const agora = this.agora();
      const questao = {
        ...existente,
        status: "revisada",
        revision: existente.revision + 1,
        revisadaEmMs: agora,
        atualizadoEmMs: agora,
      };
      const resposta = { questao };
      tx.set(questaoPath(uid, questaoId), questao);
      tx.set(requisicaoPath(uid, chave), {
        tipo: "revisao",
        requestId,
        resposta,
        criadoEmMs: agora,
      });
      return resposta;
    });
  }

  async criarSala(ator, config) {
    const uid = this.docente(ator);
    if (!config || typeof config !== "object")
      throw falha(422, "Configuração da sala inválida.");
    const requestId = idRequisicao(config.requestId);
    const chave = hashRequisicao("sala", uid, requestId);

    return this.store.transaction(async (tx) => {
      const anterior = await tx.get(requisicaoPath(uid, chave));
      if (anterior) return copia(anterior.resposta);

      const modalidade = String(config.modalidade ?? "");
      obterModalidade(modalidade);
      const titulo = textoObrigatorio(config.titulo, "título da sala", { max: 200 });
      const turmaIds = listaObrigatoria(config.turmaIds, "turmas", {
        min: 1,
        max: 30,
      }).map(String);
      const questaoIds = listaObrigatoria(config.questaoIds, "questões", {
        min: 1,
        max: 50,
      }).map(String);
      const tempoSegundos = inteiroFaixa(config.tempoSegundos, "tempo por rodada", {
        min: 10,
        max: 3600,
      });

      const turmas = (await this.turmas(uid, tx)).filter((t) => !t.arquivada);
      const turmasValidas = new Set(turmas.map((t) => String(t.id)));
      if (turmaIds.some((id) => !turmasValidas.has(id)))
        throw falha(422, "Uma das turmas não pertence ao professor.");

      const questoes = [];
      for (const id of questaoIds) {
        const questao = await tx.get(
          questaoPath(uid, segmento(id, { campo: "ID da questão", max: 60 })),
        );
        if (!questao)
          throw falha(404, "Uma das questões não está no banco do professor.");
        if (questao.status !== "revisada")
          throw falha(422, "Revise as questões antes de criar a sala.");
        validarTipoModalidade(modalidade, questao.tipo);
        questoes.push(questao);
      }

      const roster = montarRoster(
        turmas.map((turma) => ({ ...turma, id: String(turma.id) })),
        turmaIds,
        this.idParticipante,
      );
      if (!roster.length)
        throw falha(422, "As turmas selecionadas não possuem estudantes.");

      const equipes =
        modalidade === "equipes"
          ? validarEquipes(config.equipes, roster)
          : [];
      if (modalidade === "equipes" && equipes.length < 2)
        throw falha(422, "Cadastre pelo menos duas equipes para este modo.");

      const codigo = codigoSala(this.gerarCodigo());
      const existente = await tx.get(salaPath(codigo));
      if (existente)
        throw falha(409, "O código da sala já existe. Tente criar novamente.");

      const agora = this.agora();
      const equipeDe = new Map(
        equipes.flatMap((equipe) =>
          equipe.participanteIds.map((participanteId) => [
            participanteId,
            equipe.id,
          ]),
        ),
      );
      const sala = {
        codigo,
        professorId: uid,
        titulo,
        modalidade,
        turmaIds,
        questaoIds,
        roster: roster.map((participante) => participante.id),
        tempoSegundos,
        rodada: 1,
        totalRodadas: questaoIds.length,
        fase: "espera",
        encerraEmMs: null,
        revelado: false,
        revision: 1,
        equipes,
        regraPontuacao: regraPontuacao(modalidade),
        schemaVersion: 1,
        criadoEmMs: agora,
        atualizadoEmMs: agora,
      };

      const resposta = { sala };
      tx.set(salaPath(codigo), sala);
      questoes.forEach((questao, indice) => {
        tx.set(
          conteudoPath(codigo, indice),
          montarConteudo(questao, modalidade, {
            codigo,
            indice,
            segredoSemente: this.gerarId(),
          }),
        );
      });
      roster.forEach((participante) => {
        tx.set(participantePath(codigo, participante.id), {
          ...participante,
          pontos: 0,
          equipeId: equipeDe.get(participante.id) ?? null,
          entrouEmMs: null,
          criadoEmMs: agora,
        });
      });
      tx.set(requisicaoPath(uid, chave), {
        tipo: "sala",
        requestId,
        resposta,
        criadoEmMs: agora,
      });
      return resposta;
    });
  }

  async autorizarAluno(ator, sala, reader = this.store) {
    if (ator?.tipo !== "aluno")
      throw falha(403, "Entre com a conta de estudante para participar.");
    const loginKey = segmento(String(ator.loginKey ?? ""), {
      campo: "login do aluno",
      max: 200,
    });
    const professorId = segmento(String(sala.professorId), {
      campo: "UID do professor",
      max: 128,
    });
    const vinculo = await reader.get(
      `alunoLogin/${loginKey}/vinculos/${professorId}`,
    );
    if (!vinculo || vinculo.revogado === true)
      throw falha(403, "Sua matrícula não está vinculada a este professor.");
    if (String(vinculo.professorUid) !== String(sala.professorId))
      throw falha(403, "Sua matrícula não está vinculada a este professor.");
    if (!sala.turmaIds.map(String).includes(String(vinculo.turmaId)))
      throw falha(403, "Você não está nas turmas desta sala.");
    const turmas = await this.turmas(professorId, reader);
    const turma = turmas.find(
      (candidata) =>
        String(candidata.id) === String(vinculo.turmaId) && !candidata.arquivada,
    );
    const aluno = turma?.alunos?.find(
      (candidato) => String(candidato.id) === String(vinculo.alunoId),
    );
    if (!aluno)
      throw falha(403, "Sua matrícula não está ativa nesta turma.");
    const participanteId = this.idParticipante(
      String(vinculo.turmaId),
      String(vinculo.alunoId),
    );
    if (Array.isArray(sala.roster) && !sala.roster.includes(participanteId))
      throw falha(403, "Você não está nas turmas desta sala.");
    const participante = await reader.get(
      participantePath(sala.codigo, participanteId),
    );
    if (!participante)
      throw falha(403, "Você não está nas turmas desta sala.");
    return { vinculo, participanteId, participante };
  }

  async entrar(ator, codigo, _body = {}) {
    codigoSala(codigo);
    const inicial = await this.store.get(salaPath(codigo));
    if (!inicial) throw falha(404, "Sala não encontrada. Confira o código.");
    // Validação antecipada fora da transação, para devolver o erro correto.
    await this.autorizarAluno(ator, inicial);

    return this.store.transaction(async (tx) => {
      const sala = await tx.get(salaPath(codigo));
      if (!sala) throw falha(404, "Sala não encontrada. Confira o código.");
      // Revalida o vínculo dentro da transação: uma resposta concorrente
      // não pode ser perdida por uma gravação baseada em leitura antiga.
      const { participanteId, participante } = await this.autorizarAluno(
        ator,
        sala,
        tx,
      );
      const indice = Math.min(
        Math.max(sala.rodada - 1, 0),
        sala.totalRodadas - 1,
      );
      const conteudo = await tx.get(conteudoPath(codigo, indice));
      if (!conteudo) throw falha(503, "Conteúdo da sala indisponível.");
      const participantes = await tx.list(participantesPath(codigo));
      const respostas = await tx.list(respostasPath(codigo));

      const agora = this.agora();
      let atual = participante;
      if (!participante.entrouEmMs) {
        // Atualiza somente a presença, preservando pontos e progresso.
        atual = { ...participante, entrouEmMs: agora };
        tx.set(participantePath(codigo, participanteId), atual);
      }
      const lista = (participantes || []).map((p) =>
        p.id === participanteId ? atual : p,
      );
      const estado = await this.projetar(sala, {
        ator,
        participanteId,
        reader: tx,
        conteudo,
        participantes: lista,
        respostas,
      });
      return { estado };
    });
  }

  async estado(ator, codigo) {
    codigoSala(codigo);
    const sala = await this.store.get(salaPath(codigo));
    if (!sala) throw falha(404, "Sala não encontrada. Confira o código.");
    if (ator?.tipo === "professor") {
      const uid = this.docente(ator);
      if (sala.professorId !== uid)
        throw falha(403, "Esta sala pertence a outro professor.");
      return { estado: await this.projetar(sala, { ator }) };
    }
    const { participanteId } = await this.autorizarAluno(ator, sala);
    return { estado: await this.projetar(sala, { ator, participanteId }) };
  }

  async projetar(
    sala,
    { ator, participanteId = null, reader = this.store, conteudo, participantes, respostas } = {},
  ) {
    const indice = Math.min(Math.max(sala.rodada - 1, 0), sala.totalRodadas - 1);
    const conteudoFinal = conteudo ?? (await reader.get(conteudoPath(sala.codigo, indice)));
    if (!conteudoFinal) throw falha(503, "Conteúdo da sala indisponível.");
    const participantesFinal =
      participantes ?? (await reader.list(participantesPath(sala.codigo)));
    const respostasFinal =
      respostas ?? (await reader.list(respostasPath(sala.codigo)));
    const daRodada = (respostasFinal || []).filter(
      (registro) => Number(registro.rodada) === Number(sala.rodada),
    );
    const participante = participanteId
      ? (participantesFinal || []).find((p) => p.id === participanteId) ?? null
      : null;
    const registro = participanteId
      ? daRodada.find((r) => r.participanteId === participanteId) ?? null
      : null;

    return projetarEstado({
      sala,
      conteudo: conteudoFinal,
      ator,
      participante,
      participantes: participantesFinal || [],
      respostas: daRodada,
      recibo: registro?.ultimoRecibo ?? null,
      agora: this.agora(),
    });
  }

  async comandar(ator, codigo, comando) {
    const uid = this.docente(ator);
    codigoSala(codigo);
    const requestId = idRequisicao(comando?.requestId);
    const chave = hashRequisicao("comando", uid, codigo, requestId);

    return this.store.transaction(async (tx) => {
      const anterior = await tx.get(requisicaoPath(uid, chave));
      if (anterior) return copia(anterior.resposta);

      const sala = await tx.get(salaPath(codigo));
      if (!sala) throw falha(404, "Sala não encontrada. Confira o código.");
      if (sala.professorId !== uid)
        throw falha(403, "Esta sala pertence a outro professor.");

      const participantes = await tx.list(participantesPath(codigo));
      const respostas = await tx.list(respostasPath(codigo));
      const indiceAtual = Math.min(
        Math.max(sala.rodada - 1, 0),
        sala.totalRodadas - 1,
      );
      const conteudoAtual = await tx.get(conteudoPath(codigo, indiceAtual));
      if (!conteudoAtual) throw falha(503, "Conteúdo da sala indisponível.");

      const atual = aplicarComando(sala, comando, this.agora());
      const indiceAlvo = Math.min(
        Math.max(atual.rodada - 1, 0),
        atual.totalRodadas - 1,
      );
      // Troca de rodada: o conteúdo da rodada nova precisa ser lido antes das
      // escritas e usado na projeção, nunca o conteúdo da rodada anterior.
      const conteudoAlvo =
        indiceAlvo === indiceAtual
          ? conteudoAtual
          : await tx.get(conteudoPath(codigo, indiceAlvo));
      if (!conteudoAlvo) throw falha(503, "Conteúdo da sala indisponível.");

      const mapaParticipantes = participantes.map((p) => ({ ...p }));

      // A memória consolida a pontuação da rodada uma única vez, por valor absoluto.
      if (atual.modalidade === "memoria" && comando.acao === "ranking") {
        const daRodada = respostas.filter(
          (registro) => Number(registro.rodada) === Number(sala.rodada),
        );
        for (const registro of daRodada) {
          const participante = mapaParticipantes.find(
            (p) => p.id === registro.participanteId,
          );
          if (!participante) continue;
          const pontosRodada = pontuarMemoria(
            conteudoAtual.segredo.questao,
            registro.encontrados || [],
          );
          const pontos =
            (Number(participante.pontos) || 0) -
            (Number(registro.pontos) || 0) +
            pontosRodada;
          if (pontos !== participante.pontos) {
            participante.pontos = pontos;
            tx.set(participantePath(codigo, participante.id), participante);
          }
        }
      }

      tx.set(salaPath(codigo), atual);
      const estado = await this.projetar(atual, {
        ator,
        reader: tx,
        conteudo: conteudoAlvo,
        participantes: mapaParticipantes,
        respostas,
      });
      const resposta = { estado };
      tx.set(requisicaoPath(uid, chave), {
        tipo: "comando",
        requestId,
        resposta,
        criadoEmMs: this.agora(),
      });
      return resposta;
    });
  }

  async responder(ator, codigo, body = {}) {
    codigoSala(codigo);
    const requestId = idRequisicao(body.requestId);
    const rodada = inteiroFaixa(body.rodada, "rodada", { min: 1, max: 999 });

    return this.store.transaction(async (tx) => {
      const sala = await tx.get(salaPath(codigo));
      if (!sala) throw falha(404, "Sala não encontrada. Confira o código.");
      const { participanteId, participante } = await this.autorizarAluno(
        ator,
        sala,
        tx,
      );
      if (!participante.entrouEmMs)
        throw falha(409, "Entre na sala antes de responder.");
      if (Number(rodada) !== Number(sala.rodada))
        throw falha(409, "Esta rodada não está aberta.");

      const conteudo = await tx.get(conteudoPath(codigo, rodada - 1));
      if (!conteudo) throw falha(503, "Conteúdo da sala indisponível.");
      const caminhoResposta = respostaPath(codigo, rodada, participanteId);
      const registro = await tx.get(caminhoResposta);
      const chaveRecibo = hashRequisicao(
        "recibo",
        codigo,
        rodada,
        participanteId,
        requestId,
      );
      const reciboAnterior = registro?.recibos?.[chaveRecibo];
      if (reciboAnterior) return { recibo: copia(reciboAnterior) };

      if (!aceitaRespostas(sala, this.agora()))
        throw falha(409, "O prazo desta rodada terminou.");
      if (sala.fase !== "pergunta")
        throw falha(409, "A rodada não está aberta para respostas.");

      const questao = conteudo.segredo.questao;
      const agora = this.agora();

      if (sala.modalidade === "memoria") {
        if (registro?.completo)
          throw falha(409, "Você já concluiu este tabuleiro.");
        const virarId = normalizarId(body?.resposta?.virarId, "carta virada");
        const cartasValidas = new Set(
          questao.pares.flatMap((par) => [par.esquerda.id, par.direita.id]),
        );
        if (!cartasValidas.has(virarId))
          throw falha(422, "A carta informada não existe neste tabuleiro.");

        const viradas = registro?.viradas || [];
        const encontrados = [...(registro?.encontrados || [])];
        let novasViradas;
        let cartasReveladas;
        if (viradas.length === 0) {
          novasViradas = [virarId];
          cartasReveladas = [virarId];
        } else if (viradas[0] === virarId) {
          novasViradas = viradas;
          cartasReveladas = [virarId];
        } else {
          const anterior = viradas[0];
          const par = questao.pares.find(
            (candidato) =>
              (candidato.esquerda.id === anterior &&
                candidato.direita.id === virarId) ||
              (candidato.direita.id === anterior &&
                candidato.esquerda.id === virarId),
          );
          if (par) {
            encontrados.push(par.id);
            novasViradas = [];
            cartasReveladas = [virarId];
          } else {
            novasViradas = [];
            cartasReveladas = [anterior, virarId];
          }
        }

        const encontradosUnicos = [...new Set(encontrados)];
        const cartasEncontradas = questao.pares
          .filter((par) => encontradosUnicos.includes(par.id))
          .flatMap((par) => [par.esquerda.id, par.direita.id]);
        const completo = encontradosUnicos.length === questao.pares.length;
        const pontosRodada = pontuarMemoria(questao, encontradosUnicos);
        const recibo = {
          status: "confirmado",
          rodadaId: String(rodada),
          reciboId: `rcp_${chaveRecibo.slice(0, 24)}`,
          recebidoEmMs: agora,
          virarId,
          cartasReveladas: [...cartasReveladas],
          cartasEncontradas,
          cartasVisiveis: [...cartasReveladas],
          facesVisiveis: facesDasCartas(questao, cartasReveladas),
          facesEncontradas: facesDasCartas(questao, cartasEncontradas),
          completo,
        };
        const pontos =
          (Number(participante.pontos) || 0) -
          (Number(registro?.pontos) || 0) +
          pontosRodada;
        tx.set(caminhoResposta, {
          rodada: Number(rodada),
          participanteId,
          encontrados: encontradosUnicos,
          viradas: novasViradas,
          completo,
          pontos: pontosRodada,
          recibos: { ...(registro?.recibos || {}), [chaveRecibo]: recibo },
          ultimoRecibo: recibo,
          atualizadoEmMs: agora,
        });
        tx.set(participantePath(codigo, participanteId), {
          ...participante,
          pontos,
          progresso: {
            paresEncontrados: encontradosUnicos.length,
            totalPares: questao.pares.length,
            completo,
          },
          atualizadoEmMs: agora,
        });
        return { recibo: copia(recibo) };
      }

      if (registro?.resposta)
        throw falha(409, "Você já respondeu esta rodada.");
      const resposta = validarResposta(questao, body.resposta);
      const pontosRodada = pontuarResposta(questao, resposta);
      const recibo = {
        status: "confirmado",
        rodadaId: String(rodada),
        reciboId: `rcp_${chaveRecibo.slice(0, 24)}`,
        recebidoEmMs: agora,
        resposta: copia(resposta),
      };
      const pontos =
        (Number(participante.pontos) || 0) -
        (Number(registro?.pontos) || 0) +
        pontosRodada;
      tx.set(caminhoResposta, {
        rodada: Number(rodada),
        participanteId,
        resposta,
        pontos: pontosRodada,
        recibos: { ...(registro?.recibos || {}), [chaveRecibo]: recibo },
        ultimoRecibo: recibo,
        atualizadoEmMs: agora,
      });
      tx.set(participantePath(codigo, participanteId), {
        ...participante,
        pontos,
        atualizadoEmMs: agora,
      });
      return { recibo: copia(recibo) };
    });
  }
}
