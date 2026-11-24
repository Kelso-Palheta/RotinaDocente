'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { rotuloDisciplina } from './rotulos';
import { Plataforma2D } from './Plataforma2D';
import { AventuraV2 } from './AventuraV2';
import { opcoesConfiguracao } from '@/dominio/revisao-autonoma/plataformaV2';
import { novoPedidoLivre, requisitarLivre } from './api';
import { RenderTextoSeguro } from '@/components/aula-gamificada/RenderTextoSeguro';
import { rotuloDificuldade, validarUrlImagemSegura } from '@/components/aula-gamificada/constantes';

export function RevisaoAutonoma() {
  const [conteudos, setConteudos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [filtros, setFiltros] = useState({ disciplina: '', conteudo: '', dificuldade: '', origem: '' });
  const { disciplina, conteudo, dificuldade, origem } = filtros;
  const [tamanho, setTamanho] = useState(null);
  const [verResultado, setVerResultado] = useState(false);
  const [novaTentativa, setNovaTentativa] = useState(false);
  const [sessao, setSessao] = useState(null);
  const [desafio, setDesafio] = useState(false);
  const [alternativa, setAlternativa] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [pendente, setPendente] = useState(false);
  const pedido = useRef(null);
  const trava = useRef(false);
  const montado = useRef(false);
  const sessaoId = useRef(null);
  const geracao = useRef(0);
  const campo = useRef(null);
  const ctrlAtivo = useRef(null);
  useEffect(() => { sessaoId.current = sessao?.id || null; }, [sessao]);
  const abrirDesafio = useCallback(() => setDesafio(true), []);
  const invalidarAcesso = useCallback((mensagem) => {
    geracao.current++;
    ctrlAtivo.current?.abort();
    pedido.current = null;
    setPendente(false);
    setSessao(null);
    setDesafio(false);
    setAlternativa('');
    setFiltros({ disciplina: '', conteudo: '', dificuldade: '', origem: '' });
    setTamanho(null);
    setVerResultado(false);
    setConteudos([]);
    setHistorico([]);
    setErro(mensagem);
  }, []);
  useEffect(() => {
    if (desafio) campo.current?.focus();
  }, [desafio]);
  useEffect(() => {
    montado.current = true;
    const ctrl = new AbortController();
    let ativo = true;
    const refGeracao = geracao;
    const versaoInicial = refGeracao.current;
    Promise.all([requisitarLivre('catalogo', { signal: ctrl.signal }), requisitarLivre('historico', { signal: ctrl.signal })]).then(([cat, hist]) => {
      if (ativo && refGeracao.current === versaoInicial) { setConteudos(cat.conteudos); setHistorico(hist.sessoes); }
    }).catch(e => {
      if (ativo && refGeracao.current === versaoInicial) {
        if ([401, 403].includes(e.status)) {
          invalidarAcesso(e.status === 401 ? 'Entre no Portal para revisar seus conteúdos.' : e.message);
        } else {
          setErro(e.message);
        }
      }
    }).finally(() => { if (ativo) setCarregando(false); });
    const conferir = async () => {
      if (sessaoId.current) {
        try { await requisitarLivre(`sessoes/${encodeURIComponent(sessaoId.current)}`, { signal: ctrl.signal }); }
        catch (e) {
          if (ativo && [401, 403, 404].includes(e.status)) {
            invalidarAcesso('Seu acesso mudou. Recarregue ou entre novamente no Portal.');
          }
        }
        return;
      }
      const versaoFoco = ++refGeracao.current;
      ctrlAtivo.current?.abort();
      pedido.current = null;
      setPendente(false);
      try {
        const [cat, hist] = await Promise.all([
          requisitarLivre('catalogo', { signal: ctrl.signal }),
          requisitarLivre('historico', { signal: ctrl.signal }),
        ]);
        if (!ativo || refGeracao.current !== versaoFoco) return;
        const novosConteudos = Array.isArray(cat?.conteudos) ? cat.conteudos : [];
        const novoHistorico = Array.isArray(hist?.sessoes) ? hist.sessoes : [];
        setConteudos(novosConteudos);
        setHistorico(novoHistorico);
        setFiltros(prev => {
          const daDisciplina = novosConteudos.filter(c => rotuloDisciplina(c.disciplina) === prev.disciplina);
          const doAssunto = daDisciplina.filter(c => c.conteudo === prev.conteudo);
          return {
            disciplina: daDisciplina.length ? prev.disciplina : '',
            conteudo: doAssunto.length ? prev.conteudo : '',
            dificuldade: doAssunto.some(c => c.dificuldade === prev.dificuldade) ? prev.dificuldade : '',
            origem: doAssunto.some(c => c.dificuldade === prev.dificuldade) ? prev.origem : '',
          };
        });
      } catch (e) {
        if (ativo && refGeracao.current === versaoFoco && [401, 403, 404].includes(e.status)) {
          invalidarAcesso('Seu acesso mudou. Recarregue ou entre novamente no Portal.');
        }
      }
    };
    window.addEventListener('focus', conferir);
    return () => {
      ativo = false;
      montado.current = false;
      refGeracao.current++;
      ctrl.abort();
      ctrlAtivo.current?.abort();
      window.removeEventListener('focus', conferir);
    };
  }, [invalidarAcesso]);
  const atualizarHistorico = async (versao) => {
    try {
      const h = await requisitarLivre('historico', { signal: ctrlAtivo.current?.signal });
      if (montado.current && geracao.current === versao) setHistorico(h.sessoes);
    } catch { /* A sessão foi salva; o histórico pode ser recarregado. */ }
  };
  const executar = async (path, body) => {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro('');
    pedido.current ||= { path, body: { ...body, requestId: novoPedidoLivre() } };
    const atual = pedido.current;
    const versao = geracao.current;
    const ctrl = new AbortController();
    ctrlAtivo.current = ctrl;
    try {
      const data = await requisitarLivre(atual.path, { body: atual.body, signal: ctrl.signal });
      if (!montado.current || geracao.current !== versao) return;
      pedido.current = null; setPendente(false); setSessao(data.sessao); setDesafio(data.sessao.schema === 2 ? false : data.sessao.fase !== 'jogando'); setAlternativa('');
      if (atual.path === 'sessoes') setVerResultado(false);
      await atualizarHistorico(versao);
    } catch (e) {
      if (montado.current && geracao.current === versao) {
        if ([401, 403, 404].includes(e.status)) {
          invalidarAcesso(e.message || 'Seu acesso expirou ou mudou. Entre novamente no Portal.');
        } else if ([400, 409, 422, 429].includes(e.status)) {
          pedido.current = null;
          setPendente(false);
          setErro(e.message);
        } else {
          setErro(e.message);
          setPendente(true);
        }
      }
    }
    finally { trava.current = false; if (montado.current) setOcupado(false); }
  };
  const retomar = async id => {
    if (trava.current) return;
    trava.current = true; setOcupado(true); setErro('');
    const versao = ++geracao.current;
    const ctrl = new AbortController();
    ctrlAtivo.current = ctrl;
    try {
      const data = await requisitarLivre(`sessoes/${encodeURIComponent(id)}`, { signal: ctrl.signal });
      if (montado.current && geracao.current === versao) { pedido.current = null; setPendente(false); setSessao(data.sessao); setDesafio(data.sessao.schema === 2 ? false : data.sessao.fase !== 'jogando'); setAlternativa(''); setVerResultado(data.sessao.fase === 'concluida'); }
    } catch (e) {
      if (montado.current && geracao.current === versao) {
        if ([401, 403, 404].includes(e.status)) {
          invalidarAcesso(e.message || 'Seu acesso expirou ou mudou. Entre novamente no Portal.');
        } else {
          setErro(e.message);
        }
      }
    }
    finally { trava.current = false; if (montado.current) setOcupado(false); }
  };
  const disponiveis = conteudos.filter(c => rotuloDisciplina(c.disciplina) === disciplina);
  const assuntos = [...new Set(disponiveis.map(c => c.conteudo))].sort();
  const doConteudo = disponiveis.filter(c => c.conteudo === conteudo);
  const niveis = ['facil', 'medio', 'dificil'].filter(n => doConteudo.some(c => c.dificuldade === n));
  const candidatos = doConteudo.filter(c => c.dificuldade === dificuldade);
  const chaveOrigem = c => JSON.stringify([c.professorId, c.turma, c.disciplina, c.conteudo, c.dificuldade]);
  const selecionado = candidatos.find(c => chaveOrigem(c) === origem);
  const quantidade = selecionado?.quantidade || 0;
  const chaveSelecionada = selecionado ? chaveOrigem(selecionado) : '';
  const config = opcoesConfiguracao(quantidade);
  const chaveConfiguracao = JSON.stringify([chaveSelecionada, quantidade]);
  const tamanhoValido = tamanho?.chave === chaveConfiguracao;
  const fases = tamanhoValido ? tamanho.fases : config.sugerida?.fases || 1;
  const estrelas = tamanhoValido ? tamanho.estrelas : config.sugerida?.estrelasPorFase ?? 1;
  const escolherConteudo = valor => {
    const registros = disponiveis.filter(c => c.conteudo === valor);
    const niveisDisponiveis = [...new Set(registros.map(c => c.dificuldade))];
    const nivel = niveisDisponiveis.length === 1 ? niveisDisponiveis[0] : '';
    setFiltros({ disciplina, conteudo: valor, dificuldade: nivel, origem: nivel && registros.length === 1 ? chaveOrigem(registros[0]) : '' });
    setTamanho(null);
  };
  const escolherFases = valor => {
    const f = Number(valor);
    const validas = config.opcoes.filter(o => o.fases === f).map(o => o.estrelasPorFase);
    setTamanho({ chave: chaveConfiguracao, fases: f, estrelas: validas.includes(estrelas) ? estrelas : validas[validas.length - 1] ?? 1 });
  };
  const necessarias = fases * (estrelas + 1);
  const configOk = config.opcoes.some(o => o.fases === fases && o.estrelasPorFase === estrelas);
  const iniciar = e => {
    e.preventDefault();
    if (selecionado && configOk) executar('sessoes', { ...selecionado, fases, estrelasPorFase: estrelas, novaTentativa });
  };
  const reforcar = () => {
    const atual = historico.find(h => h.id === sessao.id);
    if (atual) executar('sessoes', { professorId: atual.professorId, disciplina: sessao.disciplina, conteudo: sessao.conteudo, dificuldade: sessao.dificuldade, quantidade: Math.min(10, sessao.erros), repetirSessaoId: sessao.id });
  };
  return <main className="arte-pagina min-h-screen text-[#25104A] px-4 py-6 sm:p-8">
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/aluno/notas" className="inline-block rounded-full border border-[#B9A6EF] px-4 py-2 font-bold">← Portal do Aluno</Link>
      <header className="arte-banner-festival rounded-3xl p-5 sm:p-8 text-white">
        <span className="arte-selo">AVENTURA DO CONHECIMENTO · PLATAFORMA 2D</span>
        <h1 className="text-3xl sm:text-5xl font-black mt-4">Revisar sozinho</h1>
        <p className="mt-3 max-w-2xl">Explore um percurso longo, colete estrelas-desafio e atravesse o portal de cada fase. Jogue de casa, no seu ritmo, sem sala ou professor conectado.</p>
        <p className="mt-2 text-sm text-[#E7DBFD]">Seu histórico mostra aprendizagem. Quedas e estrelas não alteram acertos nem notas do boletim.</p>
      </header>
      {erro && <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 space-y-3"><p>{erro}</p>{(pendente || sessao) && <div className="flex flex-wrap gap-3">{pendente && <button type="button" disabled={ocupado} onClick={() => executar(pedido.current.path, pedido.current.body)} className="rounded-xl bg-[#6315D9] text-white font-bold p-3">Tentar o mesmo envio novamente</button>}{sessao && <button type="button" disabled={ocupado} onClick={() => retomar(sessao.id)} className="rounded-xl border font-bold p-3">Recarregar progresso salvo</button>}</div>}<Link href="/aluno" className="underline font-bold">Entrar no Portal</Link></div>}
      {carregando && <p role="status">Carregando seus conteúdos e histórico...</p>}
      {!carregando && !sessao && <form onSubmit={iniciar} className="rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-7 space-y-4">
        <h2 className="text-2xl font-black">Prepare sua aventura</h2>
        {!conteudos.length && <p>Não há conteúdos liberados para sua matrícula. Peça ao professor para liberar questões no Banco de Questões → Revisar sozinho.</p>}
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="font-bold">Disciplina<select required disabled={ocupado || pendente} value={disciplina} onChange={e => { setFiltros({ disciplina: e.target.value, conteudo: '', dificuldade: '', origem: '' }); setTamanho(null); }} className="block mt-1 w-full rounded-xl border p-3"><option value="">Escolha</option>{[...new Set(conteudos.map(c => rotuloDisciplina(c.disciplina)))].sort().map(d => <option key={d}>{d}</option>)}</select></label>
          <label className="font-bold">Conteúdo<select required disabled={!disciplina || ocupado || pendente} value={conteudo} onChange={e => escolherConteudo(e.target.value)} className="block mt-1 w-full rounded-xl border p-3"><option value="">Escolha</option>{assuntos.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
          <label className="font-bold">Dificuldade<select required disabled={!conteudo || ocupado || pendente} value={dificuldade} onChange={e => { const nivel = e.target.value; const registros = doConteudo.filter(c => c.dificuldade === nivel); setFiltros({ ...filtros, dificuldade: nivel, origem: registros.length === 1 ? chaveOrigem(registros[0]) : '' }); setTamanho(null); }} className="block mt-1 w-full rounded-xl border p-3"><option value="">Escolha</option>{niveis.map(n => <option key={n} value={n}>{rotuloDificuldade(n)}</option>)}</select></label>
          {(candidatos.length > 1 || (candidatos.length > 0 && origem && !selecionado)) && <label className="font-bold sm:col-span-3">Turma e professor<select required disabled={ocupado || pendente} value={origem} onChange={e => { setFiltros({ ...filtros, origem: e.target.value }); setTamanho(null); }} className="block mt-1 w-full rounded-xl border p-3"><option value="">Escolha a origem das questões</option>{candidatos.map((c, i) => <option key={chaveOrigem(c)} value={chaveOrigem(c)}>{c.turma} · Professor {i + 1} · {c.quantidade} questões</option>)}</select></label>}

        </div>
        {selecionado && config.opcoes.length > 0 && <div className="space-y-3 rounded-2xl bg-[#F3EDFF] p-4">
          <p className="font-bold">Escolha o tamanho da aventura</p>
          {config.disponivel === 1
            ? <p className="text-sm">Há somente 1 questão liberada: sua aventura terá uma fase com o portal do desafio.</p>
            : <div className="flex flex-wrap gap-4">
              <label className="font-bold">Fases<select aria-label="Fases" disabled={ocupado || pendente} value={fases} onChange={e => escolherFases(e.target.value)} className="ml-2 rounded-xl border p-2">{[...new Set(config.opcoes.map(o => o.fases))].map(f => <option key={f} value={f}>{f}</option>)}</select></label>
              <label className="font-bold">Estrelas-desafio por fase<select aria-label="Estrelas por fase" disabled={ocupado || pendente} value={estrelas} onChange={e => setTamanho({ chave: chaveConfiguracao, fases, estrelas: Number(e.target.value) })} className="ml-2 rounded-xl border p-2">{config.opcoes.filter(o => o.fases === fases).map(o => <option key={o.estrelasPorFase} value={o.estrelasPorFase}>{o.estrelasPorFase}</option>)}</select></label>
            </div>}
          <p className="text-sm" data-testid="resumo-configuracao">{necessarias} questões necessárias · {config.disponivel} liberadas pelo professor · cada fase: {estrelas} {estrelas === 1 ? 'estrela' : 'estrelas'} + 1 portal. Sem pressão de tempo.</p>
          {config.disponivel < 12 && <p className="text-xs">Quer uma aventura maior (até 3 fases × 3 estrelas)? Peça ao professor para liberar mais questões.</p>}
        </div>}
        {selecionado && config.opcoes.length === 0 && <p role="status">Este conteúdo ainda não tem questões liberadas suficientes.</p>}
        {historico.some(h => h.fase !== 'concluida') && <label className="flex gap-3 text-sm"><input type="checkbox" disabled={ocupado || pendente} checked={novaTentativa} onChange={e => setNovaTentativa(e.target.checked)} />Quero iniciar outra revisão; as anteriores continuam no histórico.</label>}
        <button type="submit" disabled={!selecionado || !configOk || ocupado || pendente} className="rounded-2xl bg-[#6315D9] px-6 py-3 text-white font-black disabled:opacity-40">Começar a jogar →</button>
      </form>}
      {sessao?.schema === 2 && !verResultado && <AventuraV2
        sessao={sessao} ocupado={ocupado} pendente={pendente} erro={erro}
        onAbrir={eventoId => executar(`sessoes/${sessao.id}/abrir`, { eventoId, expectedRevision: sessao.revision })}
        onResponder={alternativaId => executar(`sessoes/${sessao.id}/responder`, { eventoId: sessao.aberto.eventoId, questaoId: sessao.aberto.questao.id, alternativaId, expectedRevision: sessao.revision })}
        onConfirmar={() => executar(`sessoes/${sessao.id}/confirmar`, { eventoId: sessao.feedback.eventoId, expectedRevision: sessao.revision })}
        onAvancar={() => executar(`sessoes/${sessao.id}/avancar`, { expectedRevision: sessao.revision })}
        onSair={() => { geracao.current++; pedido.current = null; setPendente(false); setSessao(null); }}
        onVerResultado={() => setVerResultado(true)}
        onRepetir={() => pedido.current && executar(pedido.current.path, pedido.current.body)}
        onRecarregar={() => retomar(sessao.id)}
      />}
      {sessao && sessao.schema !== 2 && sessao.fase !== 'concluida' && <>
        <div className="flex flex-wrap justify-between items-center gap-3 rounded-2xl bg-[#F3EDFF] border border-[#E2D9F7] p-4"><strong>{rotuloDisciplina(sessao.disciplina)} · {sessao.conteudo} · Fase {sessao.indice + 1}/{sessao.total}</strong><span>✓ {sessao.acertos} acertos · {sessao.erros} para revisar</span><button type="button" disabled={ocupado || pendente} onClick={() => { geracao.current++; setSessao(null); setDesafio(false); }} className="underline font-bold">Sair e continuar depois</button></div>
        <Plataforma2D key={`${sessao.id}:${sessao.indice}`} fase={sessao.indice + 1} pausado={desafio || ocupado} onDesafio={abrirDesafio} />
        {desafio && <section ref={campo} tabIndex={-1} className="rounded-3xl border-2 border-[#B9A6EF] bg-white p-5 sm:p-7 space-y-4" aria-label="Desafio pedagógico">
          <h2 className="text-2xl font-black">Portal do conhecimento</h2>
          <RenderTextoSeguro texto={sessao.questao.enunciado} />
          {sessao.questao.imagem && validarUrlImagemSegura(sessao.questao.imagem.url) && <figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={sessao.questao.imagem.url} alt={sessao.questao.imagem.alt || 'Imagem do desafio'} className="max-h-80 w-full object-contain" /></figure>}
          <fieldset disabled={ocupado || pendente || sessao.fase === 'feedback'} className="space-y-2"><legend className="font-bold mb-2">Escolha uma alternativa</legend>{sessao.questao.alternativas.map(a => <label key={a.id} className={`flex gap-3 p-4 rounded-xl border-2 cursor-pointer ${alternativa === a.id || sessao.feedback?.alternativaId === a.id ? 'border-[#6315D9] bg-[#F3EDFF]' : 'border-[#E2D9F7]'}`}><input type="radio" name="alternativa" disabled={ocupado || pendente || sessao.fase === 'feedback'} checked={sessao.feedback ? sessao.feedback.alternativaId === a.id : alternativa === a.id} onChange={() => setAlternativa(a.id)} /><RenderTextoSeguro texto={a.texto} /></label>)}</fieldset>
          {sessao.fase === 'jogando' && <button type="button" disabled={!alternativa || ocupado || pendente} onClick={() => executar(`sessoes/${sessao.id}/responder`, { questaoId: sessao.questao.id, expectedRevision: sessao.revision, alternativaId: alternativa })} className="rounded-xl bg-[#6315D9] px-6 py-3 text-white font-black disabled:opacity-40">Confirmar resposta</button>}
          {sessao.feedback && <div role="status" className={`rounded-2xl border p-5 space-y-3 ${sessao.feedback.correta ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}><h3 className="text-xl font-black">{sessao.feedback.correta ? 'Muito bem! Desafio superado.' : 'Vamos aprender com essa resposta.'}</h3><p><strong>Resposta correta: </strong>{sessao.questao.alternativas.find(a => a.id === sessao.feedback.respostaCorreta)?.texto}</p><RenderTextoSeguro texto={sessao.feedback.explicacao} /><button type="button" disabled={ocupado || pendente} onClick={() => executar(`sessoes/${sessao.id}/avancar`, { expectedRevision: sessao.revision })} className="rounded-xl bg-[#6315D9] px-5 py-3 font-black text-white disabled:opacity-40">Li a explicação · {sessao.indice + 1 === sessao.total ? 'Concluir aventura' : 'Próxima fase →'}</button></div>}
        </section>}
      </>}
      {sessao?.fase === 'concluida' && (sessao.schema !== 2 || verResultado) && <section className="rounded-3xl border-4 border-[#FFE500] bg-[#25104A] text-white p-7 space-y-4"><h2 className="text-3xl font-black text-[#FFE500]">🏆 Aventura concluída!</h2><p>{sessao.acertos} acertos em {sessao.total} desafios · {Math.round(100 * sessao.acertos / sessao.total)}% de aproveitamento</p>{sessao.schema === 2 && <p className="font-bold">{sessao.pontosJogo} pontos de jogo · {sessao.totalFases} {sessao.totalFases === 1 ? 'fase' : 'fases'} (pontos de jogo não valem nota)</p>}<p>Seu resultado foi salvo. Pratique novamente para acompanhar sua evolução.</p><div className="flex flex-wrap gap-3">{sessao.erros > 0 && <button type="button" disabled={ocupado || pendente} onClick={reforcar} className="rounded-xl bg-[#FFE500] text-[#25104A] p-3 font-black disabled:opacity-40">Revisar somente os erros</button>}<button type="button" disabled={ocupado || pendente} onClick={() => setSessao(null)} className="rounded-xl border p-3 font-bold">Escolher outro conteúdo</button></div></section>}
      {!carregando && <section className="rounded-3xl border-2 border-[#E2D9F7] bg-white p-5 sm:p-7 space-y-4"><h2 className="text-2xl font-black">Meu histórico de revisão</h2><p className="text-sm">Últimas 50 revisões. As tentativas anteriores não são sobrescritas.</p>{!historico.length && <p>Sua primeira aventura aparecerá aqui.</p>}<div className="space-y-3">{historico.map(h => <article key={h.id} className="flex flex-wrap justify-between items-center gap-3 rounded-xl border p-4"><div><strong>{rotuloDisciplina(h.disciplina)} · {h.conteudo}</strong><p className="text-sm">{rotuloDificuldade(h.dificuldade)} · {h.progresso}/{h.total} desafios · {h.acertos} acertos · {h.erros} erros{h.schema === 2 ? ` · ${h.pontosJogo} pontos de jogo · ${h.totalFases} ${h.totalFases === 1 ? 'fase' : 'fases'}` : ''}</p><p className="text-xs text-[#5B4B86]">{new Date(h.atualizadoEmMs).toLocaleString('pt-BR')} · {h.fase === 'concluida' ? 'Concluída' : 'Em andamento'}</p></div><button type="button" disabled={ocupado || pendente} onClick={() => retomar(h.id)} className="rounded-xl bg-[#F3EDFF] p-3 font-bold disabled:opacity-40">{h.fase === 'concluida' ? 'Ver resultado' : h.schema === 2 ? 'Continuar aventura' : 'Retomar fase'}</button></article>)}</div></section>}
    </div>
  </main>;
}
