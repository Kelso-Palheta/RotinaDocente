import { validarAvatar, AVATAR_PADRAO } from '@/dominio/revisao-autonoma/avatares';
import { MODALIDADES, obterModalidade } from '@/dominio/aula-gamificada/modalidades';
import { criarSessaoJogos, projetarJogos, resumoJogos, aplicarAcaoJogos } from './sessaoJogos';
import { embaralhar, falha, idPadrao, inteiroFaixa, segmento, textoObrigatorio } from '@/dominio/aula-gamificada/comum';
import { validarParaRevisao } from '@/dominio/aula-gamificada/questoes';
import { configuracaoValida, distribuirReforco, MAX_QUESTOES_V2, MAX_FASES_V2 } from '@/dominio/revisao-autonoma/plataformaV2';
import { LIMITE_BYTES_SESSAO, aplicarAcaoV2, assinaturaV2, montarFasesV2, projetarV2, resumoV2, tamanhoEmBytes } from './sessaoV2';

const raiz = key => `revisaoAutonomaAlunos/${key}`;
const sessaoPath = (key, id) => `${raiz(key)}/sessoes/${segmento(id, { max: 80 })}`;
const questoesPath = uid => `aulaGamificadaDocentes/${uid}/questoes`;
const publicada = (q, turmaId) => q?.status === 'revisada' && q.revisaoAutonomaLiberada === true && q.turmaIdsRevisaoAutonoma?.includes(String(turmaId));
const elegivel = (q, turmaId, modo = null) => publicada(q, turmaId) && (modo ? obterModalidade(modo).tiposQuestoes.includes(q.tipo) && q.tipo !== 'resposta_aberta' : q.tipo === 'multipla_escolha');

export class RevisaoAutonomaService {
  constructor({ store, agora = Date.now, gerarId = idPadrao }) { this.store = store; this.agora = agora; this.gerarId = gerarId; }
  aluno(ator) {
    if (ator?.tipo !== 'aluno' || !/^[a-f0-9]{64}$/.test(ator.loginKey || '')) throw falha(401, 'Entre pelo Portal do Aluno.');
    return ator.loginKey;
  }
  async turmas(uid, reader = this.store) {
    for (const path of [`professores/${uid}/turmas/data`, `users/${uid}/turmas/data`, `professores/${uid}`]) {
      const data = await reader.get(path);
      if (Array.isArray(data?.turmas)) return data.turmas;
    }
    return [];
  }
  async autorizar(key, professorId, reader = this.store) {
    segmento(professorId, { max: 128 });
    const v = await reader.get(`alunoLogin/${key}/vinculos/${professorId}`);
    if (!v || v.revogado || v.professorUid !== professorId) throw falha(403, 'Sua matrícula não está ativa com este professor.');
    const turma = (await this.turmas(professorId, reader)).find(t => String(t.id) === String(v.turmaId) && !t.arquivada);
    if (!turma?.alunos?.some(a => String(a.id) === String(v.alunoId))) throw falha(403, 'Sua matrícula não está ativa nesta turma.');
    return turma;
  }
  async publicar(ator, body) {
    if (ator?.tipo !== 'professor') throw falha(403, 'Apenas o professor pode liberar conteúdo.');
    const uid = segmento(ator.uid, { max: 128 });
    const id = segmento(body.questaoId, { max: 60 });
    if (!Array.isArray(body.turmaIds) || body.turmaIds.length > 30) throw falha(422, 'Escolha as turmas autorizadas.');
    const ids = [...new Set(body.turmaIds.map(String))];
    return this.store.transaction(async tx => {
      const q = await tx.get(`${questoesPath(uid)}/${id}`);
      if (!q) throw falha(404, 'Questão não encontrada no seu banco.');
      if (q.revision !== body.expectedRevision) throw falha(409, 'A questão mudou. Atualize antes de liberar.');
      if (!['multipla_escolha','pares','ordenacao'].includes(q.tipo)) throw falha(422, 'A revisão autônoma precisa de uma questão objetiva.');
      validarParaRevisao(q);
      if (q.status !== 'revisada') throw falha(422, 'Aprove a revisão da questão antes de liberar.');
      const turmas = await this.turmas(uid, tx);
      if (ids.some(id => !turmas.some(t => String(t.id) === id && !t.arquivada))) throw falha(403, 'Uma das turmas não pertence à sua conta.');
      const questao = { ...q, turmaIdsRevisaoAutonoma: ids, revisaoAutonomaLiberada: ids.length > 0, revision: q.revision + 1, atualizadoEmMs: this.agora() };
      tx.set(`${questoesPath(uid)}/${id}`, questao);
      return { questao };
    });
  }
  async catalogo(ator) {
    const key = this.aluno(ator);
    const vinculos = await this.store.list(`alunoLogin/${key}/vinculos`);
    const grupos = new Map();
    const jogos = new Map();
    for (const v of vinculos) {
      if (!v.professorUid || v.revogado) continue;
      let turma;
      try { turma = await this.autorizar(key, v.professorUid); } catch (e) { if (e.status === 403) continue; throw e; }
      const banco = await this.store.list(questoesPath(v.professorUid), [['revisaoAutonomaLiberada', '==', true]]);
      for (const q of banco.filter(q => publicada(q, turma.id) && ['multipla_escolha','pares','ordenacao'].includes(q.tipo))) {
        const item = { professorId: v.professorUid, turma: turma.nome || 'Minha turma', disciplina: q.disciplina, conteudo: q.conteudo, dificuldade: q.dificuldade };
        const id = JSON.stringify(item);
        if (q.tipo === 'multipla_escolha') grupos.set(id, { ...item, quantidade: (grupos.get(id)?.quantidade || 0) + 1 });
        const chave = JSON.stringify([item,q.tipo]);
        jogos.set(chave, { ...item, tipo:q.tipo, modalidades:MODALIDADES.filter(m => m.tiposQuestoes.includes(q.tipo)).map(m => m.id), quantidade:(jogos.get(chave)?.quantidade || 0)+1 });
      }
    }
    return { conteudos: [...grupos.values()], jogos:[...jogos.values()] };
  }
  projetar(s) {
    if (s.schema === 3) return projetarJogos(s);
    if (s.schema === 2) return projetarV2(s);
    const q = s.questoes[s.indice];
    const r = s.respostas[s.indice];
    return { id: s.id, revision: s.revision, fase: s.fase, indice: s.indice, total: s.questoes.length, disciplina: s.disciplina, conteudo: s.conteudo, dificuldade: s.dificuldade,
      acertos: s.respostas.filter(r => r.correta).length, erros: s.respostas.filter(r => !r.correta).length,
      questao: s.fase !== 'concluida' && q ? { id: q.id, enunciado: q.enunciado, alternativas: q.alternativas.map(({ id, texto }) => ({ id, texto })), ...(q.imagem ? { imagem: q.imagem } : {}) } : null,
      feedback: s.fase === 'feedback' && r ? { correta: r.correta, alternativaId: r.alternativaId, respostaCorreta: q.respostaCorreta, explicacao: q.explicacao } : null,
    };
  }
  resumo(s) {
    if (s.schema === 3) return resumoJogos(s);
    if (s.schema === 2) return resumoV2(s);
    return { id: s.id, professorId: s.professorId, turmaId: s.turmaId, disciplina: s.disciplina, conteudo: s.conteudo, dificuldade: s.dificuldade, fase: s.fase, progresso: s.respostas.length, total: s.questoes.length, acertos: s.respostas.filter(r => r.correta).length, erros: s.respostas.filter(r => !r.correta).length, atualizadoEmMs: s.atualizadoEmMs };
  }
  async lerSessao(key, id, tx = this.store) {
    const s = await tx.get(sessaoPath(key, id));
    if (!s) throw falha(404, 'Revisão não encontrada na sua conta.');
    const turma = await this.autorizar(key, s.professorId, tx);
    if (String(turma.id) !== s.turmaId) throw falha(403, 'A matrícula desta revisão mudou.');
    if (s.fase !== 'concluida') {
      const ids = s.schema === 2
        ? s.fases[s.faseIndice].eventos.filter(e => e.estado === 'pendente' || e.estado === 'aberto').map(e => e.questaoId)
        : [s.questoes[s.indice].id];
      for (const qid of ids) {
        const q = await tx.get(`${questoesPath(s.professorId)}/${qid}`);
        if (!elegivel(q, turma.id, s.modalidade)) throw falha(403, 'Este conteúdo foi retirado da revisão. Escolha outro conteúdo.');
      }
    }
    return s;
  }
  async obterSessao(ator, id) { return { sessao: this.projetar(await this.lerSessao(this.aluno(ator), id)) }; }
  async criarSessao(ator, body) {
    const key = this.aluno(ator);
    const uid = segmento(body.professorId, { max: 128 });
    const req = segmento(body.requestId, { max: 80 });
    const disciplina = textoObrigatorio(body.disciplina, 'disciplina', { max: 120 });
    const conteudo = textoObrigatorio(body.conteudo, 'conteúdo', { max: 300 });
    const dificuldade = textoObrigatorio(body.dificuldade, 'dificuldade', { max: 20 });
    const modoJogo = body.modalidade ? obterModalidade(body.modalidade).id : null;
    const v2Pedido = !modoJogo && body.fases !== undefined && !body.repetirSessaoId;
    const avatarPedido = v2Pedido ? validarAvatar(body.avatarId) : null;
    const fasesPedidas = v2Pedido ? inteiroFaixa(body.fases, 'fases', { min: 1, max: MAX_FASES_V2 }) : null;
    const estrelasPedidas = v2Pedido ? inteiroFaixa(body.estrelasPorFase, 'estrelas por fase', { min: 0, max: 3 }) : null;
    const quantidade = v2Pedido ? null : inteiroFaixa(body.quantidade, 'quantidade', { min: 1, max: 10 });
    let assinatura = modoJogo ? JSON.stringify(['jogo',modoJogo,uid,disciplina,conteudo,dificuldade,quantidade,body.novaTentativa===true,body.repetirSessaoId || null]) : v2Pedido
      ? JSON.stringify(['v2', uid, disciplina, conteudo, dificuldade, fasesPedidas, estrelasPedidas, body.novaTentativa === true])
      : JSON.stringify([uid, disciplina, conteudo, dificuldade, quantidade, body.repetirSessaoId || null, body.novaTentativa === true]);
    if (v2Pedido && body.avatarId !== undefined) assinatura = JSON.stringify([...JSON.parse(assinatura), 'avatar', avatarPedido]);
    const reqPath = `${raiz(key)}/requisicoes/criar_${req}`;
    return this.store.transaction(async tx => {
      const turma = await this.autorizar(key, uid, tx);
      const anterior = await tx.get(reqPath);
      if (anterior) {
        if (anterior.assinatura !== assinatura) throw falha(409, 'Este pedido já foi usado com outra configuração.');
        return { sessao: this.projetar(await this.lerSessao(key, anterior.sessaoId, tx)) };
      }
      const perfil = await tx.get(raiz(key)) || { historico: [] };
      const criacoesRecentes = (perfil.criacoesRecentes || []).filter(t => t > this.agora() - 3600000);
      if (criacoesRecentes.length >= 30) throw falha(429, 'Limite de novas revisões por hora atingido. Retome uma revisão existente.');
      if (perfil.ativaId && !body.novaTentativa && !body.repetirSessaoId) {
        const ativa = await tx.get(sessaoPath(key, perfil.ativaId));
        if (ativa && ativa.fase !== 'concluida') throw falha(409, 'Você tem uma revisão em andamento. Retome-a ou escolha iniciar outra.');
      }
      let questoes = (await tx.list(questoesPath(uid), [['revisaoAutonomaLiberada', '==', true]])).filter(q => elegivel(q, turma.id, modoJogo) && q.disciplina === disciplina && q.conteudo === conteudo && q.dificuldade === dificuldade);
      let v2 = v2Pedido;
      let avatarOrigem = AVATAR_PADRAO;
      if (body.repetirSessaoId) {
        const origem = await this.lerSessao(key, body.repetirSessaoId, tx);
        if (origem.professorId !== uid || origem.fase !== 'concluida') throw falha(422, 'Conclua a revisão original antes de praticar seus erros.');
        if (origem.schema === 3 && origem.modalidade !== modoJogo) throw falha(422, 'Mantenha o jogo original para revisar os erros.');
        v2 = origem.schema === 2;
        if (v2) avatarOrigem = validarAvatar(origem.avatarId);
        const erros = new Set(v2 ? origem.fases.flatMap(f => f.eventos).filter(e => e.estado === 'concluido' && !e.correta).map(e => e.questaoId) : origem.respostas.filter(r => !r.correta).map(r => r.questaoId));
        questoes = questoes.filter(q => erros.has(q.id));
      }
      if (!questoes.length) throw falha(422, 'Não há questões liberadas para esta seleção.');
      if (!body.repetirSessaoId && !v2 && quantidade > questoes.length) throw falha(422, `Há somente ${questoes.length} questões disponíveis.`);
      const id = segmento(this.gerarId(), { max: 80 });
      if (await tx.get(sessaoPath(key, id))) throw falha(409, 'Não foi possível criar a revisão. Tente novamente.');
      if (modoJogo) {
        const escolhidas = embaralhar(questoes,id).slice(0,quantidade);
        const s = criarSessaoJogos({ id, modalidade:modoJogo, professorId:uid, turmaId:String(turma.id), disciplina, conteudo, dificuldade, questoes:escolhidas, criadoEmMs:this.agora(), atualizadoEmMs:this.agora() });
        if (tamanhoEmBytes(s) > LIMITE_BYTES_SESSAO) throw falha(422,'Treino grande demais. Escolha menos desafios.');
        tx.set(sessaoPath(key,id),s);
        tx.set(raiz(key),{ ...perfil, criacoesRecentes:[...criacoesRecentes,this.agora()], ativaId:id, historico:[this.resumo(s),...(perfil.historico || [])].slice(0,50) });
        tx.set(reqPath,{ assinatura,sessaoId:id });
        return { sessao:this.projetar(s) };
      }
      if (v2) {
        const necessarias = v2Pedido ? fasesPedidas * (estrelasPedidas + 1) : null;
        if (v2Pedido && !configuracaoValida(questoes.length, fasesPedidas, estrelasPedidas)) {
          throw falha(422, necessarias > questoes.length
            ? `Esta aventura precisa de ${necessarias} questões e há somente ${questoes.length} liberadas. Escolha uma configuração menor.`
            : `Configuração inválida. Máximo de ${MAX_QUESTOES_V2} questões por aventura.`);
        }
        const contagens = v2Pedido ? Array(fasesPedidas).fill(estrelasPedidas + 1) : distribuirReforco(questoes.length);
        const total = contagens.reduce((a, b) => a + b, 0);
        const escolhidas = embaralhar(questoes, id).slice(0, total).map(q => ({ ...q, alternativas: embaralhar(q.alternativas, `${id}:${q.id}`) }));
        for (const q of escolhidas) validarParaRevisao(q);
        const s = { schema: 2, avatarId: avatarPedido || avatarOrigem, layoutVersao: 3, id, professorId: uid, turmaId: String(turma.id), disciplina, conteudo, dificuldade, questoes: escolhidas, fases: montarFasesV2(escolhidas, contagens), faseIndice: 0, abertoId: null, pontosJogo: 0, revision: 1, fase: 'jogando', criadoEmMs: this.agora(), atualizadoEmMs: this.agora() };
        if (tamanhoEmBytes(s) > LIMITE_BYTES_SESSAO) throw falha(422, 'A aventura ficou grande demais. Escolha uma configuração menor.');
        tx.set(sessaoPath(key, id), s);
        tx.set(raiz(key), { ...perfil, criacoesRecentes: [...criacoesRecentes, this.agora()], ativaId: id, historico: [this.resumo(s), ...(perfil.historico || [])].slice(0, 50) });
        tx.set(reqPath, { assinatura, sessaoId: id });
        return { sessao: this.projetar(s) };
      }
      questoes = embaralhar(questoes, id).slice(0, quantidade).map(q => ({ ...q, alternativas: embaralhar(q.alternativas, `${id}:${q.id}`) }));
      for (const q of questoes) validarParaRevisao(q);
      const s = { id, professorId: uid, turmaId: String(turma.id), disciplina, conteudo, dificuldade, questoes, respostas: [], indice: 0, revision: 1, fase: 'jogando', criadoEmMs: this.agora(), atualizadoEmMs: this.agora() };
      tx.set(sessaoPath(key, id), s);
      tx.set(raiz(key), { ...perfil, criacoesRecentes: [...criacoesRecentes, this.agora()], ativaId: id, historico: [this.resumo(s), ...(perfil.historico || [])].slice(0, 50) });
      tx.set(reqPath, { assinatura, sessaoId: id });
      return { sessao: this.projetar(s) };
    });
  }
  async alterar(ator, id, body, acao) {
    const key = this.aluno(ator);
    const req = segmento(body.requestId, { max: 80 });
    const reqPath = `${raiz(key)}/requisicoes/${acao}_${segmento(id, { max: 80 })}_${req}`;
    return this.store.transaction(async tx => {
      const s = await this.lerSessao(key, id, tx);
      const assinatura = s.schema === 3 ? JSON.stringify([acao,body.expectedRevision,body.questaoId || null,body.resposta || null]) : s.schema === 2 ? assinaturaV2(acao, body) : JSON.stringify([acao, body.expectedRevision, body.questaoId || null, body.alternativaId || null]);
      const anterior = await tx.get(reqPath);
      if (anterior) {
        if (anterior.assinatura !== assinatura) throw falha(409, 'Este pedido já foi utilizado com outra resposta.');
        return { sessao: this.projetar(s) };
      }
      if (s.revision !== body.expectedRevision) throw falha(409, 'A revisão mudou em outra aba. Retome o progresso atualizado.');
      const perfil = await tx.get(raiz(key)) || { historico: [] };
      if (s.schema === 3) {
        if (acao === 'avancar' && s.indice+1 < s.questoes.length) {
          const proxima = await tx.get(`${questoesPath(s.professorId)}/${s.questoes[s.indice+1].id}`);
          if (!elegivel(proxima,s.turmaId,s.modalidade)) throw falha(403,'O próximo desafio foi retirado pelo professor.');
        }
        const nova = aplicarAcaoJogos(s,body,acao,this.agora());
        if (tamanhoEmBytes(nova) > LIMITE_BYTES_SESSAO) throw falha(422,'Treino grande demais para salvar.');
        tx.set(sessaoPath(key,id),nova);
        tx.set(raiz(key),{ ...perfil,ativaId:nova.fase === 'concluida' ? null : id,historico:[this.resumo(nova),...(perfil.historico || []).filter(r => r.id!==id)].slice(0,50) });
        tx.set(reqPath,{ assinatura });
        return { sessao:this.projetar(nova) };
      }
      if (s.schema === 2) {
        const nova = aplicarAcaoV2(s, body, acao, this.agora());
        if (nova.semMudanca) return { sessao: this.projetar(s) };
        if (tamanhoEmBytes(nova) > LIMITE_BYTES_SESSAO) throw falha(422, 'Sessão grande demais para salvar.');
        tx.set(sessaoPath(key, id), nova);
        tx.set(raiz(key), { ...perfil, ativaId: nova.fase === 'concluida' ? null : id, historico: [this.resumo(nova), ...(perfil.historico || []).filter(r => r.id !== id)].slice(0, 50) });
        tx.set(reqPath, { assinatura });
        return { sessao: this.projetar(nova) };
      }
      if (acao === 'abrir' || acao === 'confirmar') throw falha(409, 'Esta revisão não usa desafios no percurso.');
      const atual = { ...s, revision: s.revision + 1, atualizadoEmMs: this.agora() };
      if (acao === 'responder') {
        const q = s.questoes[s.indice];
        if (s.fase !== 'jogando' || body.questaoId !== q.id) throw falha(409, 'Esta questão já foi respondida ou não é a atual.');
        if (!q.alternativas.some(a => a.id === body.alternativaId)) throw falha(422, 'Escolha uma alternativa válida.');
        atual.respostas = [...s.respostas, { questaoId: q.id, alternativaId: body.alternativaId, correta: body.alternativaId === q.respostaCorreta, respondidoEmMs: this.agora() }];
        atual.fase = 'feedback';
      } else {
        if (s.fase !== 'feedback') throw falha(409, 'Responda e leia a explicação antes de avançar.');
        if (s.indice + 1 === s.questoes.length) atual.fase = 'concluida';
        else {
          const seguinte = await tx.get(`${questoesPath(s.professorId)}/${s.questoes[s.indice + 1].id}`);
          if (!elegivel(seguinte, s.turmaId)) throw falha(403, 'O próximo conteúdo foi retirado pelo professor.');
          atual.indice++;
          atual.fase = 'jogando';
        }
      }
      tx.set(sessaoPath(key, id), atual);
      tx.set(raiz(key), { ...perfil, ativaId: atual.fase === 'concluida' ? null : id, historico: [this.resumo(atual), ...(perfil.historico || []).filter(r => r.id !== id)].slice(0, 50) });
      tx.set(reqPath, { assinatura });
      return { sessao: this.projetar(atual) };
    });
  }
  responder(ator, id, body) { return this.alterar(ator, id, body, 'responder'); }
  avancar(ator, id, body) { return this.alterar(ator, id, body, 'avancar'); }
  abrir(ator, id, body) { return this.alterar(ator, id, body, 'abrir'); }
  confirmar(ator, id, body) { return this.alterar(ator, id, body, 'confirmar'); }
  async historico(ator) {
    const key = this.aluno(ator);
    const perfil = await this.store.get(raiz(key));
    const permitidos = new Map();
    const sessoes = [];
    for (const resumo of perfil?.historico || []) {
      if (!permitidos.has(resumo.professorId)) {
        try { permitidos.set(resumo.professorId, String((await this.autorizar(key, resumo.professorId)).id)); }
        catch (e) { if (e.status !== 403) throw e; permitidos.set(resumo.professorId, null); }
      }
      const turmaAtiva = permitidos.get(resumo.professorId);
      if (turmaAtiva && (!resumo.turmaId || resumo.turmaId === turmaAtiva)) sessoes.push(resumo);
    }
    return { sessoes, ativaId: sessoes.some(s => s.id === perfil?.ativaId) ? perfil.ativaId : null };
  }
}
