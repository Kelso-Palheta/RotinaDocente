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
  avaliarRodadaTabuleiro,
  avaliarTentativaHerois,
  equipeDaVezTabuleiro,
  inicializarTabuleiroEstado,
  montarConteudo,
  montarRoster,
  projetarEstado,
  validarEquipes,
} from "@/dominio/aula-gamificada/sala";

function equipesPadraoTabuleiro(roster = []) {
  const azul = { id: "eq_azul", nome: "Equipe Azul", cor: "azul", participanteIds: [] };
  const verde = { id: "eq_verde", nome: "Equipe Verde", cor: "verde", participanteIds: [] };
  roster.forEach((p, idx) => {
    (idx % 2 === 0 ? azul : verde).participanteIds.push(p.id);
  });
  return [azul, verde];
}
import { pontuarMemoria, pontuarResposta } from "@/dominio/aula-gamificada/pontuacao";
import {
  arredondarDuasCasas,
  gerarRelatorioSala,
  validarConfiguracaoAvaliacao,
} from "@/dominio/aula-gamificada/avaliacao";
import { anoLetivoTurma } from "@/dominio/diario/evolucao";

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
          : modalidade === "tabuleiro"
            ? Array.isArray(config.equipes) && config.equipes.length
              ? validarEquipes(config.equipes, roster)
              : equipesPadraoTabuleiro(roster)
            : [];
      if (["equipes", "tabuleiro"].includes(modalidade) && equipes.length < 2)
        throw falha(422, "Cadastre pelo menos duas equipes para este modo.");
      if (modalidade === "tabuleiro" && equipes.length > 4)
        throw falha(422, "O Tabuleiro aceita no máximo quatro equipes.");

      const turmasSelecionadas = turmas.filter((t) => turmaIds.includes(String(t.id)));
      const { finalidade, avaliacao } = validarConfiguracaoAvaliacao({
        finalidade: config.finalidade ?? "revisao",
        avaliacao: config.avaliacao ?? null,
        modalidade,
        turmas: turmasSelecionadas,
      });

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
        finalidade,
        ...(avaliacao ? { avaliacao } : {}),
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
        ...(modalidade === "tabuleiro"
          ? { tabuleiroEstado: inicializarTabuleiroEstado(equipes) }
          : {}),
        regraPontuacao: regraPontuacao(modalidade),
        schemaVersion: 1,
        criadoEmMs: agora,
        atualizadoEmMs: agora,
      };

      const resposta = { sala };
      tx.set(salaPath(codigo), sala);
      tx.set(`aulaGamificadaDocentes/${uid}/salas/${codigo}`, {
        codigo,
        professorId: uid,
        titulo,
        modalidade,
        finalidade,
        ...(avaliacao ? { avaliacao } : {}),
        turmaIds,
        fase: sala.fase,
        criadoEmMs: agora,
      });
      if (finalidade === "avaliativa" && avaliacao) {
        for (const tId of turmaIds) {
          const atvId = `ag_${codigo}_${tId}`;
          tx.set(`atividades/${atvId}`, {
            id: atvId,
            professorId: uid,
            origem: "aula_gamificada",
            salaCodigo: codigo,
            modalidade,
            titulo: avaliacao.tituloAtividade,
            disciplina: avaliacao.disciplina,
            conteudo: avaliacao.conteudo || "",
            bimestre: avaliacao.bimestre,
            anoLetivo: avaliacao.anoLetivo,
            turmaIds: [tId],
            notaMaxima: avaliacao.valorMaximo,
            status: "aguardando_publicacao",
            criadoEmMs: agora,
            atualizadoEmMs: agora,
          });
        }
      }
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

      // Tabuleiro avança uma única vez ao revelar a rodada.
      if (
        atual.modalidade === "tabuleiro" &&
        comando.acao === "revelar" &&
        Number(atual.tabuleiroEstado?.ultimaRodadaAvaliada) !== Number(sala.rodada)
      ) {
        const daRodada = respostas.filter(
          (registro) => Number(registro.rodada) === Number(sala.rodada),
        );
        atual.tabuleiroEstado = avaliarRodadaTabuleiro({
          tabuleiroEstado: atual.tabuleiroEstado,
          equipes: atual.equipes,
          rodada: sala.rodada,
          questao: conteudoAtual.segredo.questao,
          respostasRodada: daRodada,
        });
      }

      // Leituras na transação devem preceder qualquer escrita (exigência do Firestore).
      const resumoIdx = await tx.get(`aulaGamificadaDocentes/${uid}/salas/${codigo}`);

      tx.set(salaPath(codigo), atual);
      if (resumoIdx) {
        tx.set(`aulaGamificadaDocentes/${uid}/salas/${codigo}`, {
          ...resumoIdx,
          fase: atual.fase,
          ...(atual.encerradaEmMs ? { encerradaEmMs: atual.encerradaEmMs } : {}),
        });
      }
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

      if (sala.modalidade === "tabuleiro") {
        const equipeAtiva = equipeDaVezTabuleiro(sala.equipes, rodada);
        if (!equipeAtiva || participante.equipeId !== equipeAtiva.id)
          throw falha(409, "Aguarde a vez da sua equipe.");
      }

      if (sala.modalidade === "herois") {
        const resposta = validarResposta(questao, body.resposta);
        const pontosTentativa = pontuarResposta(questao, resposta);
        const evalHeroi = avaliarTentativaHerois({
          sala,
          registro,
          acertou: pontosTentativa > 0,
          agora,
        });
        const recibo = {
          status: "confirmado",
          rodadaId: String(rodada),
          reciboId: `rcp_${chaveRecibo.slice(0, 24)}`,
          recebidoEmMs: agora,
          resposta: copia(resposta),
          tentativas: evalHeroi.tentativas,
          maxTentativas: evalHeroi.maxTentativas,
          podeTentarNovamente: evalHeroi.podeTentarNovamente,
          estadoHeroi: evalHeroi.estadoHeroi,
        };
        const pontos =
          (Number(participante.pontos) || 0) -
          (Number(registro?.pontos) || 0) +
          evalHeroi.pontosRodada;
        tx.set(caminhoResposta, {
          rodada: Number(rodada),
          participanteId,
          primeiraResposta: registro?.primeiraResposta ?? copia(resposta),
          resposta,
          tentativas: evalHeroi.tentativas,
          acertou: evalHeroi.acertou,
          pontos: evalHeroi.pontosRodada,
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

  async contextoAvaliacao(ator) {
    const uid = this.docente(ator);
    const turmas = (await this.turmas(uid, this.store)).filter((t) => !t.arquivada);
    const anosSet = new Map();
    for (const t of turmas) {
      const ano = anoLetivoTurma(t);
      const id = ano ? String(ano) : "legado";
      const rotulo = ano ? String(ano) : "Legado (ano não informado)";
      anosSet.set(id, { id, rotulo });
    }
    return {
      anos: [...anosSet.values()].sort((a, b) => a.id.localeCompare(b.id)),
      bimestres: ["1", "2", "3", "4"],
      turmas: turmas.map((t) => ({
        id: String(t.id),
        nome: t.nome || t.titulo || String(t.id),
        anoLetivo: anoLetivoTurma(t) ? String(anoLetivoTurma(t)) : "legado",
        bimestres: Object.fromEntries(
          ["1", "2", "3", "4"].map((b) => [
            b,
            {
              atividades: (t.bimestres?.[b]?.atividades || []).map((a) => ({
                id: String(a.id),
                nome: a.nome || a.titulo || String(a.id),
                max: Number(a.max ?? a.notaMaxima ?? 10),
              })),
            },
          ]),
        ),
      })),
    };
  }

  async listarAvaliacoes(ator, filtros = {}) {
    const uid = this.docente(ator);
    const limite = Math.min(Math.max(Number(filtros.limite) || 20, 1), 100);

    const indexadas = await this.store.list(`aulaGamificadaDocentes/${uid}/salas`);
    const legadas = await this.store.list("aulaGamificadaSalas", [["professorId", "==", uid]]);
    const porCodigo = new Map();
    for (const s of legadas || []) {
      if (s?.codigo) porCodigo.set(s.codigo, s);
    }
    for (const s of indexadas || []) {
      if (s?.codigo) porCodigo.set(s.codigo, { ...(porCodigo.get(s.codigo) || {}), ...s });
    }

    const deMs = filtros.de ? Date.parse(String(filtros.de)) : null;
    const ateMs = filtros.ate ? Date.parse(String(filtros.ate)) : null;

    const preFiltradas = [...porCodigo.values()].filter((s) => {
      if (filtros.finalidade && (s.finalidade || "revisao") !== filtros.finalidade) return false;
      if (filtros.turmaId && !(s.turmaIds || []).map(String).includes(String(filtros.turmaId)))
        return false;
      if (filtros.bimestre && String(s.avaliacao?.bimestre || "") !== String(filtros.bimestre))
        return false;
      if (filtros.ano && String(s.avaliacao?.anoLetivo || "") !== String(filtros.ano))
        return false;
      if (Number.isFinite(deMs) && (Number(s.criadoEmMs) || 0) < deMs) return false;
      if (Number.isFinite(ateMs) && (Number(s.criadoEmMs) || 0) > ateMs) return false;
      if (
        filtros.disciplina &&
        !String(s.avaliacao?.disciplina || "")
          .toLowerCase()
          .includes(String(filtros.disciplina).toLowerCase())
      )
        return false;
      if (
        filtros.conteudo &&
        !String(s.avaliacao?.conteudo || s.titulo || "")
          .toLowerCase()
          .includes(String(filtros.conteudo).toLowerCase())
      )
        return false;
      return true;
    });

    let filtradas = preFiltradas;
    if (filtros.alunoId) {
      const alunoFiltro = String(filtros.alunoId).trim();
      const turmaFiltro = filtros.turmaId ? String(filtros.turmaId).trim() : null;
      filtradas = [];
      for (const s of preFiltradas) {
        const roster = Array.isArray(s.roster) ? s.roster.map(String) : [];
        const turmasEscopo = turmaFiltro
          ? [turmaFiltro]
          : Array.isArray(s.turmaIds)
            ? s.turmaIds.map(String)
            : [];
        const idsEsperados = new Set(
          turmasEscopo.map((tId) => String(this.idParticipante(tId, alunoFiltro))),
        );
        const matchRoster = roster.some((pid) => {
          if (idsEsperados.has(pid)) return true;
          if (pid === alunoFiltro) return true;
          if (turmaFiltro) return pid === `${turmaFiltro}:${alunoFiltro}`;
          return pid.endsWith(`:${alunoFiltro}`);
        });
        if (matchRoster) {
          filtradas.push(s);
          continue;
        }
        const participantesSala = await this.store.list(participantesPath(s.codigo));
        const matchParticipante = (participantesSala || []).some(
          (p) =>
            p &&
            String(p.alunoId) === alunoFiltro &&
            (!turmaFiltro || String(p.turmaId) === turmaFiltro),
        );
        if (matchParticipante) {
          filtradas.push(s);
        }
      }
    }

    filtradas.sort((a, b) => {
      const diff = (Number(b.criadoEmMs) || 0) - (Number(a.criadoEmMs) || 0);
      if (diff !== 0) return diff;
      return String(b.codigo || "").localeCompare(String(a.codigo || ""));
    });

    let inicio = 0;
    if (filtros.cursor) {
      const [cMsStr, cCod] = String(filtros.cursor).split("_");
      const cMs = Number(cMsStr);
      if (Number.isFinite(cMs) && cCod) {
        const idx = filtradas.findIndex(
          (s) => (Number(s.criadoEmMs) || 0) === cMs && String(s.codigo) === cCod,
        );
        if (idx >= 0) inicio = idx + 1;
        else {
          const pos = filtradas.findIndex(
            (s) =>
              (Number(s.criadoEmMs) || 0) < cMs ||
              ((Number(s.criadoEmMs) || 0) === cMs && String(s.codigo || "").localeCompare(cCod) < 0),
          );
          inicio = pos >= 0 ? pos : filtradas.length;
        }
      } else {
        inicio = Math.max(Number(filtros.cursor) || 0, 0);
      }
    }

    const itens = filtradas.slice(inicio, inicio + limite);
    const ultimo = itens[itens.length - 1];
    const proximoCursor =
      inicio + itens.length < filtradas.length && ultimo
        ? `${Number(ultimo.criadoEmMs) || 0}_${ultimo.codigo}`
        : null;
    return {
      itens,
      totalFiltrado: filtradas.length,
      proximoCursor,
    };
  }

  async carregarDadosRelatorio(codigo, reader = this.store) {
    const sala = await reader.get(salaPath(codigo));
    if (!sala) throw falha(404, "Sala não encontrada.");
    const conteudos = [];
    for (let i = 0; i < (sala.totalRodadas || 1); i++) {
      const c = await reader.get(conteudoPath(codigo, i));
      if (c) conteudos.push(c);
    }
    const participantes = await reader.list(participantesPath(codigo));
    const respostas = await reader.list(respostasPath(codigo));
    const avalDoc = (await reader.get(`${salaPath(codigo)}/avaliacao/estado`)) || {};
    return { sala, conteudos, participantes, respostas, avalDoc };
  }

  async relatorioSala(ator, codigo) {
    codigoSala(codigo);
    const { sala, conteudos, participantes, respostas, avalDoc } =
      await this.carregarDadosRelatorio(codigo);

    const relatorio = gerarRelatorioSala({
      sala,
      conteudos,
      participantes,
      respostas,
      revisoesPorParticipante: avalDoc.revisoesPorParticipante || {},
      auditoria: avalDoc.auditoria || [],
      zerarAusentes: Boolean(avalDoc.zerarAusentes),
      sincronizacao: avalDoc.sincronizacao || null,
    });

    if (ator?.tipo === "professor") {
      if (sala.professorId !== this.docente(ator)) {
        throw falha(403, "Esta sala pertence a outro professor.");
      }
      return {
        ...relatorio,
        revision: sala.revision,
        pendenciasAtualizacao: avalDoc.pendenciasAtualizacao || null,
        versaoPublicada: avalDoc.snapshotPublicado?.versaoPublicada ?? avalDoc.versaoPublicada ?? null,
      };
    }

    const { participanteId, participante } = await this.autorizarAluno(ator, sala, this.store);
    if (!avalDoc.publicadoPortal) {
      throw falha(403, "Este resultado ainda não foi disponibilizado pelo professor.");
    }
    const snapshotParticipante = avalDoc.snapshotPublicado?.porParticipante?.[participanteId] || null;
    if (snapshotParticipante) {
      return {
        sala: avalDoc.snapshotPublicado.sala || relatorio.sala,
        configuracaoCongelada:
          avalDoc.snapshotPublicado.configuracaoCongelada || relatorio.configuracaoCongelada,
        versaoPublicada: avalDoc.snapshotPublicado.versaoPublicada ?? null,
        publicadaEmMs: avalDoc.snapshotPublicado.publicadaEmMs ?? null,
        meuResultado: copia(snapshotParticipante),
      };
    }
    const versaoAtiva = avalDoc.versaoPublicada;
    if (versaoAtiva) {
      const [versaoDoc, partDoc] = await Promise.all([
        this.store.get(`${salaPath(codigo)}/avaliacaoVersoes/${versaoAtiva}`),
        this.store.get(`${salaPath(codigo)}/avaliacaoPublicados/${versaoAtiva}_${participanteId}`),
      ]);
      if (versaoDoc && partDoc) {
        const { detalhesCompactos = [], ...restoAluno } = partDoc;
        const questoesBase = versaoDoc.questoesBase || {};
        const detalhesQuestoes = detalhesCompactos.map((d) => {
          const baseQ = questoesBase[String(d.rodada)] || {};
          return {
            ...d,
            ...(baseQ.enunciado !== undefined ? { enunciado: baseQ.enunciado } : {}),
            ...(baseQ.respostaCorreta !== undefined ? { respostaCorreta: baseQ.respostaCorreta } : {}),
            ...(baseQ.explicacao !== undefined ? { explicacao: baseQ.explicacao } : {}),
          };
        });
        return {
          sala: versaoDoc.sala || relatorio.sala,
          configuracaoCongelada: versaoDoc.configuracaoCongelada || relatorio.configuracaoCongelada,
          versaoPublicada: versaoDoc.versaoPublicada ?? versaoAtiva,
          publicadaEmMs: versaoDoc.publicadaEmMs ?? null,
          meuResultado: {
            ...restoAluno,
            detalhesQuestoes,
          },
        };
      }
    }
    if (avalDoc.pendenciasAtualizacao?.portalPendente) {
      const resumoPortal = participante?.alunoId
        ? await this.store.get(`aulaGamificadaPortal/${participante.alunoId}/avaliacoes/${codigo}`)
        : null;
      if (!resumoPortal) {
        throw falha(409, "Resultado publicado em atualização; aguarde nova publicação do professor.");
      }
      return {
        sala: relatorio.sala,
        configuracaoCongelada: relatorio.configuracaoCongelada,
        versaoPublicada: resumoPortal.versaoPublicada ?? null,
        publicadaEmMs: resumoPortal.publicadaEmMs ?? null,
        snapshotLegadoLimitado: true,
        limitacoes: [
          "Detalhes da versão publicada anterior indisponíveis neste registro legado até nova publicação docente.",
        ],
        meuResultado: {
          participanteId,
          alunoId: resumoPortal.alunoId,
          turmaId: resumoPortal.turmaId,
          nome: participante?.nomeExibicao || "Estudante",
          situacao: resumoPortal.situacao,
          aproveitamento: resumoPortal.aproveitamento,
          notaFinal: resumoPortal.notaFinal,
          detalhesQuestoes: [],
          snapshotLegadoLimitado: true,
        },
      };
    }
    const meuResultado = relatorio.alunos.find((a) => a.participanteId === participanteId) || null;
    if (!meuResultado) throw falha(404, "Participação não encontrada nesta sala.");
    return {
      sala: relatorio.sala,
      configuracaoCongelada: relatorio.configuracaoCongelada,
      meuResultado,
    };
  }

  async reconstruirRelatorioDeCompacto(codigo, tx, compacto) {
    const { sala, conteudos, participantes, respostas } = await this.carregarDadosRelatorio(codigo, tx);
    return gerarRelatorioSala({
      sala: { ...sala, revision: compacto.revision ?? sala.revision },
      conteudos,
      participantes,
      respostas,
      revisoesPorParticipante: compacto.revisoesPorParticipante || {},
      auditoria: compacto.auditoria || [],
      zerarAusentes: Boolean(compacto.zerarAusentes),
      sincronizacao: compacto.sincronizacao || null,
    });
  }

  async revisarNotaAvaliacao(ator, codigo, body = {}) {
    const uid = this.docente(ator);
    codigoSala(codigo);
    const requestId = idRequisicao(body.requestId);
    const chave = hashRequisicao("rev_nota", uid, codigo, requestId);

    return this.store.transaction(async (tx) => {
      const anterior = await tx.get(requisicaoPath(uid, chave));
      if (anterior) {
        if (anterior.resposta) return copia(anterior.resposta);
        const relatorio = await this.reconstruirRelatorioDeCompacto(codigo, tx, anterior.compacto || {});
        return { relatorio, revision: anterior.compacto?.revision };
      }

      const { sala, conteudos, participantes, respostas, avalDoc } =
        await this.carregarDadosRelatorio(codigo, tx);
      if (sala.professorId !== uid) throw falha(403, "Esta sala pertence a outro professor.");
      if (sala.finalidade !== "avaliativa" || !sala.avaliacao) {
        throw falha(422, "Apenas salas avaliativas permitem revisão formal de notas.");
      }
      if (sala.fase !== "encerrada") {
        throw falha(409, "Encerre a partida antes de revisar notas.");
      }
      if (Number(body.expectedRevision) !== Number(sala.revision)) {
        throw falha(409, "A sala mudou. Recarregue antes de revisar a nota.");
      }

      const pid = String(body.participanteId ?? "").trim();
      if (!participantes.some((p) => p.id === pid)) {
        throw falha(404, "Estudante não encontrado nesta sala.");
      }
      const brutoNota = body.notaRevisada;
      if (
        brutoNota === undefined ||
        brutoNota === null ||
        brutoNota === "" ||
        typeof brutoNota === "boolean" ||
        !Number.isFinite(Number(brutoNota))
      ) {
        throw falha(422, "Informe uma nota revisada numérica válida.");
      }
      const valorMax = Number(sala.avaliacao?.valorMaximo);
      if (!Number.isFinite(valorMax) || valorMax <= 0) {
        throw falha(422, "Valor máximo da avaliação inválido.");
      }
      const nota = arredondarDuasCasas(Number(brutoNota));
      if (nota < 0 || nota > valorMax) {
        throw falha(422, `A nota revisada deve estar entre 0 e ${valorMax}.`);
      }
      const justificativa = textoObrigatorio(body.justificativa, "justificativa da revisão", {
        max: 500,
      });

      const agora = this.agora();
      const revAnterior = avalDoc.revisoesPorParticipante?.[pid] || null;
      const versao = (Number(revAnterior?.versao) || 0) + 1;
      const revisoesPorParticipante = {
        ...(avalDoc.revisoesPorParticipante || {}),
        [pid]: { notaRevisada: nota, justificativa, versao, atualizadoEmMs: agora },
      };
      const auditoria = [
        ...(avalDoc.auditoria || []),
        {
          id: this.gerarId(),
          tipo: "revisao_nota",
          participanteId: pid,
          notaAnterior: revAnterior?.notaRevisada ?? null,
          notaNova: nota,
          justificativa,
          versao,
          professorId: uid,
          criadoEmMs: agora,
        },
      ];

      const novoAvalDoc = {
        ...avalDoc,
        revisoesPorParticipante,
        auditoria,
        ...(avalDoc.publicadoPortal ||
        avalDoc.sincronizacao?.status === "sincronizada" ||
        avalDoc.pendenciasAtualizacao?.portalPendente ||
        avalDoc.pendenciasAtualizacao?.diarioPendente
          ? {
              pendenciasAtualizacao: {
                portalPendente: Boolean(
                  avalDoc.publicadoPortal || avalDoc.pendenciasAtualizacao?.portalPendente,
                ),
                diarioPendente:
                  avalDoc.sincronizacao?.status === "sincronizada" ||
                  Boolean(avalDoc.pendenciasAtualizacao?.diarioPendente),
                revisaoVersao: versao,
              },
            }
          : {}),
        atualizadoEmMs: agora,
      };
      const novaSala = { ...sala, revision: sala.revision + 1, atualizadoEmMs: agora };
      tx.set(`${salaPath(codigo)}/avaliacao/estado`, novoAvalDoc);
      tx.set(salaPath(codigo), novaSala);

      const relatorio = gerarRelatorioSala({
        sala: novaSala,
        conteudos,
        participantes,
        respostas,
        revisoesPorParticipante,
        auditoria,
        zerarAusentes: Boolean(novoAvalDoc.zerarAusentes),
        sincronizacao: novoAvalDoc.sincronizacao || null,
      });
      const resposta = { relatorio, revision: novaSala.revision };
      const compacto = {
        revision: novaSala.revision,
        zerarAusentes: Boolean(novoAvalDoc.zerarAusentes),
        revisoesPorParticipante,
        auditoria,
        sincronizacao: novoAvalDoc.sincronizacao || null,
      };
      tx.set(requisicaoPath(uid, chave), { tipo: "rev_nota", requestId, compacto, criadoEmMs: agora });
      return resposta;
    });
  }

  async finalizarAvaliacao(ator, codigo, body = {}) {
    const uid = this.docente(ator);
    codigoSala(codigo);
    const requestId = idRequisicao(body.requestId);
    const chave = hashRequisicao("fin_av", uid, codigo, requestId);

    return this.store.transaction(async (tx) => {
      const anterior = await tx.get(requisicaoPath(uid, chave));
      if (anterior) {
        if (anterior.resposta) return copia(anterior.resposta);
        const relatorio = await this.reconstruirRelatorioDeCompacto(codigo, tx, anterior.compacto || {});
        return {
          relatorio,
          revision: anterior.compacto?.revision,
          publicadoPortal: Boolean(anterior.compacto?.publicadoPortal),
        };
      }

      const { sala, conteudos, participantes, respostas, avalDoc } =
        await this.carregarDadosRelatorio(codigo, tx);
      if (sala.professorId !== uid) throw falha(403, "Esta sala pertence a outro professor.");
      if (sala.fase !== "encerrada") {
        throw falha(409, "Encerre a partida antes de finalizar a avaliação.");
      }
      if (Number(body.expectedRevision) !== Number(sala.revision)) {
        throw falha(409, "A sala mudou. Recarregue antes de finalizar.");
      }

      // Ler todas as atividades antes de iniciar qualquer escrita (regra de transação Firestore).
      const atividadesLidas = new Map();
      if (sala.finalidade === "avaliativa" && sala.avaliacao) {
        for (const tId of sala.turmaIds || []) {
          const atvPath = `atividades/ag_${codigo}_${tId}`;
          const atv = await tx.get(atvPath);
          if (atv) atividadesLidas.set(atvPath, atv);
        }
      }

      const agora = this.agora();
      const zerarAusentes = Boolean(body.zerarAusentes);
      const publicarPortal = Boolean(body.publicarPortal);
      const relatorio = gerarRelatorioSala({
        sala,
        conteudos,
        participantes,
        respostas,
        revisoesPorParticipante: avalDoc.revisoesPorParticipante || {},
        auditoria: avalDoc.auditoria || [],
        zerarAusentes,
        sincronizacao: avalDoc.sincronizacao || null,
      });

      if (sala.finalidade === "avaliativa" && sala.avaliacao) {
        for (const a of relatorio.alunos) {
          if (!a.turmaId || typeof a.notaFinal !== "number") continue;
          const activityId = `ag_${codigo}_${a.turmaId}`;
          const entregaId = `ag_${codigo}_${a.turmaId}_${a.alunoId}`;
          tx.set(`entregas/${entregaId}`, {
            id: entregaId,
            activityId,
            professorId: uid,
            turmaId: a.turmaId,
            alunoId: a.alunoId,
            bimestre: sala.avaliacao.bimestre,
            origem: "aula_gamificada",
            salaCodigo: codigo,
            status: a.versaoRevisao > 0 ? "revisado" : "corrigido",
            notaFinal: a.notaCalculada ?? a.notaFinal,
            ...(a.notaRevisada !== null ? { notaRevisada: a.notaRevisada } : {}),
            ...(a.justificativaRevisao ? { justificativaRevisao: a.justificativaRevisao } : {}),
            aproveitamento: a.aproveitamento,
            situacao: a.situacao,
            atualizadoEmMs: agora,
          });
        }

        for (const [atvPath, atv] of atividadesLidas.entries()) {
          tx.set(atvPath, {
            ...atv,
            status: publicarPortal ? "publicada" : "finalizada",
            atualizadoEmMs: agora,
          });
        }
      }

      const versaoPublicada = publicarPortal
        ? (Number(avalDoc.snapshotPublicado?.versaoPublicada ?? avalDoc.versaoPublicada) || 0) + 1
        : (avalDoc.snapshotPublicado?.versaoPublicada ?? avalDoc.versaoPublicada ?? null);

      const { snapshotPublicado: _legacySnap, ...avalSemLegacy } = avalDoc;
      const novoAvalDoc = {
        ...(publicarPortal ? avalSemLegacy : avalDoc),
        finalizada: true,
        finalizadaEmMs: agora,
        zerarAusentes,
        publicadoPortal: publicarPortal || Boolean(avalDoc.publicadoPortal),
        ...(publicarPortal
          ? {
              versaoPublicada,
              publicadaEmMs: agora,
              ...(avalDoc.pendenciasAtualizacao
                ? {
                    pendenciasAtualizacao: {
                      ...avalDoc.pendenciasAtualizacao,
                      portalPendente: false,
                    },
                  }
                : {}),
            }
          : {}),
      };
      const novaSala = { ...sala, revision: sala.revision + 1, atualizadoEmMs: agora };
      tx.set(`${salaPath(codigo)}/avaliacao/estado`, novoAvalDoc);
      tx.set(salaPath(codigo), novaSala);

      if (publicarPortal) {
        const questoesBase = {};
        for (const a of relatorio.alunos) {
          for (const d of a.detalhesQuestoes || []) {
            const rk = String(d.rodada);
            if (!questoesBase[rk]) {
              questoesBase[rk] = {
                rodada: d.rodada,
                ...(d.enunciado !== undefined ? { enunciado: d.enunciado } : {}),
                ...(d.respostaCorreta !== undefined ? { respostaCorreta: d.respostaCorreta } : {}),
                ...(d.explicacao !== undefined ? { explicacao: d.explicacao } : {}),
              };
            }
          }
        }
        tx.set(`${salaPath(codigo)}/avaliacaoVersoes/${versaoPublicada}`, {
          versaoPublicada,
          publicadaEmMs: agora,
          sala: copia(relatorio.sala),
          configuracaoCongelada: copia(relatorio.configuracaoCongelada),
          questoesBase,
        });
        for (const a of relatorio.alunos) {
          const { detalhesQuestoes = [], ...restoAluno } = a;
          const detalhesCompactos = detalhesQuestoes.map(
            ({ enunciado: _e, respostaCorreta: _r, explicacao: _x, ...restoDet }) => restoDet,
          );
          tx.set(`${salaPath(codigo)}/avaliacaoPublicados/${versaoPublicada}_${a.participanteId}`, {
            ...restoAluno,
            detalhesCompactos,
          });
        }
      }

      if (publicarPortal && sala.finalidade === "avaliativa") {
        for (const a of relatorio.alunos) {
          if (!a.turmaId || typeof a.notaFinal !== "number") continue;
          const recPath = `aulaGamificadaPortal/${a.alunoId}/avaliacoes/${codigo}`;
          tx.set(recPath, {
            codigo,
            professorId: uid,
            turmaId: a.turmaId,
            alunoId: a.alunoId,
            titulo: sala.avaliacao.tituloAtividade,
            disciplina: sala.avaliacao.disciplina,
            conteudo: sala.avaliacao.conteudo || "",
            modalidade: sala.modalidade,
            bimestre: sala.avaliacao.bimestre,
            anoLetivo: sala.avaliacao.anoLetivo,
            valorMaximo: sala.avaliacao.valorMaximo,
            aproveitamento: a.aproveitamento,
            notaFinal: a.notaFinal,
            situacao: a.situacao,
            versaoPublicada,
            versaoRevisao: a.versaoRevisao ?? 0,
            publicadaEmMs: agora,
          });
        }
      }

      const resposta = { relatorio, revision: novaSala.revision, publicadoPortal: novoAvalDoc.publicadoPortal };
      const compacto = {
        revision: novaSala.revision,
        publicadoPortal: novoAvalDoc.publicadoPortal,
        versaoPublicada,
        zerarAusentes,
        revisoesPorParticipante: copia(novoAvalDoc.revisoesPorParticipante || {}),
        auditoria: copia(novoAvalDoc.auditoria || []),
        sincronizacao: copia(novoAvalDoc.sincronizacao || null),
      };
      tx.set(requisicaoPath(uid, chave), { tipo: "fin_av", requestId, compacto, criadoEmMs: agora });
      return resposta;
    });
  }

  async sincronizarDiario(ator, codigo, body = {}) {
    const uid = this.docente(ator);
    codigoSala(codigo);
    const requestId = idRequisicao(body.requestId);
    const dryRun = Boolean(body.dryRun);
    const chave = hashRequisicao(dryRun ? "sync_prev" : "sync_real", uid, codigo, requestId);

    return this.store.transaction(async (tx) => {
      if (!dryRun) {
        const anterior = await tx.get(requisicaoPath(uid, chave));
        if (anterior) return copia(anterior.resposta);
      }

      const { sala, conteudos, participantes, respostas, avalDoc } =
        await this.carregarDadosRelatorio(codigo, tx);
      if (sala.professorId !== uid) throw falha(403, "Esta sala pertence a outro professor.");
      if (sala.finalidade !== "avaliativa" || !sala.avaliacao) {
        throw falha(422, "Apenas salas avaliativas podem ser sincronizadas com o Diário.");
      }
      if (sala.fase !== "encerrada" || avalDoc.finalizada !== true) {
        throw falha(409, "Conclua e finalize a avaliação antes de sincronizar com o Diário.");
      }
      if (Number(body.expectedRevision) !== Number(sala.revision)) {
        throw falha(409, "A sala mudou. Confira o relatório atualizado antes de sincronizar.");
      }

      let diarioPath = `professores/${uid}/turmas/data`;
      let diarioDoc = await tx.get(diarioPath);
      if (!diarioDoc || !Array.isArray(diarioDoc.turmas)) {
        for (const legadoPath of [`users/${uid}/turmas/data`, `professores/${uid}`]) {
          const cand = await tx.get(legadoPath);
          if (cand && Array.isArray(cand.turmas) && cand.turmas.length) {
            diarioDoc = cand;
            diarioPath = legadoPath;
            break;
          }
        }
      }
      if (!diarioDoc || !Array.isArray(diarioDoc.turmas)) {
        throw falha(404, "Diário de turmas não encontrado.");
      }
      if (
        !dryRun &&
        body.diarioRevisionEsperada !== undefined &&
        Number(body.diarioRevisionEsperada) !== Number(diarioDoc.revision || 0)
      ) {
        throw falha(409, "O Diário mudou desde a prévia. Gere uma nova prévia antes de sincronizar.");
      }

      const relatorio = gerarRelatorioSala({
        sala,
        conteudos,
        participantes,
        respostas,
        revisoesPorParticipante: avalDoc.revisoesPorParticipante || {},
        auditoria: avalDoc.auditoria || [],
        zerarAusentes: Boolean(avalDoc.zerarAusentes),
        sincronizacao: avalDoc.sincronizacao || null,
      });

      const turmaFiltro = Array.isArray(body.turmaIds) && body.turmaIds.length
        ? body.turmaIds.map(String)
        : sala.turmaIds.map(String);

      const bimestre = String(sala.avaliacao.bimestre);
      const valorMaxAval = Number(sala.avaliacao.valorMaximo);
      const novasTurmas = diarioDoc.turmas.map((t) => ({ ...t }));
      const alteracoes = [];
      const conflitos = [];
      const linhasDetalhadas = [];
      const pendencias = [];

      for (const tId of turmaFiltro) {
        const tIdx = novasTurmas.findIndex((t) => String(t.id) === String(tId));
        if (tIdx < 0) {
          pendencias.push({ tipo: "turma_ausente", turmaId: tId, motivo: "Turma não encontrada no Diário." });
          continue;
        }
        const turma = novasTurmas[tIdx];
        const anoAtualTurma = anoLetivoTurma(turma) ? String(anoLetivoTurma(turma)) : "legado";
        const anoAvaliacao =
          String(sala.avaliacao.anoLetivo || "legado").trim().toLowerCase() === "legado"
            ? "legado"
            : String(sala.avaliacao.anoLetivo).trim();
        if (anoAtualTurma !== anoAvaliacao) {
          throw falha(
            422,
            `Ano letivo incompatível para a turma ${turma.nome || tId}: avaliação congelada em ${anoAvaliacao}, mas o Diário está em ${anoAtualTurma}.`,
          );
        }
        const bData = turma.bimestres?.[bimestre] || { atividades: [], notas: {} };
        const atvs = [...(bData.atividades || [])];
        const colunaCfg =
          body.colunaPorTurma?.[tId] || sala.avaliacao.colunaPorTurma?.[tId] || {};

        let atvId;
        let colunaNome;
        let colunaMax = valorMaxAval;

        if (colunaCfg.atvId) {
          const existente = atvs.find((a) => String(a.id) === String(colunaCfg.atvId));
          if (!existente) {
            throw falha(422, `A coluna selecionada (${colunaCfg.atvId}) não existe na turma ${turma.nome || tId}.`);
          }
          const maxExistente = Number(existente.max ?? existente.notaMaxima);
          if (Number.isFinite(maxExistente) && maxExistente !== valorMaxAval) {
            throw falha(
              422,
              `Escala incompatível: coluna "${existente.nome || existente.id}" tem máximo ${maxExistente}, mas a avaliação vale ${valorMaxAval}.`,
            );
          }
          atvId = String(existente.id);
          colunaNome = existente.nome || existente.titulo || sala.avaliacao.tituloAtividade;
          colunaMax = maxExistente || valorMaxAval;
        } else {
          atvId = `ag_${codigo}_${tId}`;
          const jaCriada = atvs.find((a) => String(a.id) === atvId);
          if (jaCriada) {
            const maxJa = Number(jaCriada.max ?? jaCriada.notaMaxima);
            if (Number.isFinite(maxJa) && maxJa !== valorMaxAval) {
              throw falha(422, `Escala incompatível na coluna ${atvId} (máximo ${maxJa} vs ${valorMaxAval}).`);
            }
            colunaNome = jaCriada.nome || sala.avaliacao.tituloAtividade;
            colunaMax = maxJa || valorMaxAval;
          } else {
            colunaNome = colunaCfg.nomeColuna || sala.avaliacao.tituloAtividade;
            atvs.push({ id: atvId, nome: colunaNome, max: valorMaxAval });
          }
        }

        const notas = { ...(bData.notas || {}) };
        for (const a of relatorio.alunos) {
          if (String(a.turmaId) !== String(tId)) continue;
          if (typeof a.notaFinal !== "number") {
            pendencias.push({
              tipo: "sem_nota",
              turmaId: tId,
              alunoId: a.alunoId,
              nome: a.nome,
              situacao: a.situacao,
            });
            continue;
          }
          if (!(turma.alunos || []).some((al) => String(al.id) === String(a.alunoId))) {
            pendencias.push({ tipo: "aluno_fora_turma", turmaId: tId, alunoId: a.alunoId, nome: a.nome });
            continue;
          }
          const notaAtual = notas[a.alunoId]?.[atvId];
          const temConflito = typeof notaAtual === "number" && notaAtual !== a.notaFinal;
          if (temConflito) {
            conflitos.push({
              turmaId: tId,
              alunoId: a.alunoId,
              atvId,
              notaExistente: notaAtual,
              notaNova: a.notaFinal,
            });
          }
          linhasDetalhadas.push({
            turmaId: tId,
            turmaNome: turma.nome || tId,
            alunoId: a.alunoId,
            alunoNome: a.nome,
            atvId,
            colunaNome,
            valorMaximoColuna: colunaMax,
            notaAtual: typeof notaAtual === "number" ? notaAtual : null,
            notaNova: a.notaFinal,
            conflito: temConflito,
          });
          notas[a.alunoId] = { ...(notas[a.alunoId] || {}), [atvId]: a.notaFinal };
          alteracoes.push({ turmaId: tId, alunoId: a.alunoId, bimestre, atvId });
        }

        novasTurmas[tIdx] = {
          ...turma,
          bimestres: {
            ...(turma.bimestres || {}),
            [bimestre]: { ...bData, atividades: atvs, notas },
          },
        };
      }

      if (dryRun) {
        return {
          previa: {
            alteracoes,
            conflitos,
            linhasDetalhadas,
            pendencias,
            bimestre,
            valorMaximo: valorMaxAval,
            diarioRevision: Number(diarioDoc.revision) || 0,
          },
        };
      }

      if (conflitos.length > 0 && !body.confirmarSobrescrita) {
        throw falha(
          409,
          "Existem notas diferentes já lançadas na coluna selecionada. Confirme a sobrescrita na prévia antes de sincronizar.",
        );
      }

      const agora = this.agora();
      const sincronizadas = alteracoes.length;
      if (sincronizadas > 0) {
        tx.set(diarioPath, {
          ...diarioDoc,
          turmas: novasTurmas,
          revision: (Number(diarioDoc.revision) || 0) + 1,
          lastUpdated: agora,
        });
      }

      const novaSincronizacao = {
        status: sincronizadas > 0 && pendencias.length === 0 ? "sincronizada" : pendencias.length > 0 ? "pendente" : "sem_lancamentos",
        sincronizadaEmMs: agora,
        sincronizadas,
        pendencias,
      };
      tx.set(`${salaPath(codigo)}/avaliacao/estado`, {
        ...avalDoc,
        sincronizacao: novaSincronizacao,
        ...(avalDoc.pendenciasAtualizacao ? { pendenciasAtualizacao: { ...avalDoc.pendenciasAtualizacao, diarioPendente: false } } : {}),
        atualizadoEmMs: agora,
      });

      const resposta = {
        sincronizadas,
        alteracoes,
        pendencias,
        sincronizacao: novaSincronizacao,
      };
      tx.set(requisicaoPath(uid, chave), { tipo: "sync_real", requestId, resposta, criadoEmMs: agora });
      return resposta;
    });
  }

  async minhasAvaliacoes(ator) {
    if (ator?.tipo !== "aluno") {
      throw falha(403, "Entre com a conta de estudante para consultar suas avaliações.");
    }
    const loginKey = segmento(String(ator.loginKey ?? ""), { campo: "login do aluno", max: 200 });
    const vinculos = await this.store.list(`alunoLogin/${loginKey}/vinculos`);
    const ativos = vinculos.filter((v) => v && v.revogado !== true && v.alunoId);
    const avaliacoes = [];
    for (const v of ativos) {
      const lista = await this.store.list(`aulaGamificadaPortal/${v.alunoId}/avaliacoes`);
      for (const item of lista) {
        if (String(item.turmaId) === String(v.turmaId) && String(item.professorId) === String(v.professorUid)) {
          avaliacoes.push(item);
        }
      }
    }
    avaliacoes.sort((a, b) => (Number(b.publicadaEmMs) || 0) - (Number(a.publicadaEmMs) || 0));
    return { avaliacoes };
  }
}
