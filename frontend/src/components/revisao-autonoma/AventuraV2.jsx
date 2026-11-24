'use client';
import { rotuloDisciplina } from './rotulos';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BarraControleAudiovisual, ProvedorAudiovisualSala, useAudiovisualSala } from '@/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala';
import FeedbackEmocional from '@/components/aula-gamificada/audiovisual/FeedbackEmocional';
import { RenderTextoSeguro } from '@/components/aula-gamificada/RenderTextoSeguro';
import { validarUrlImagemSegura } from '@/components/aula-gamificada/constantes';
import { PercursoV2 } from './PercursoV2';
import { ControlesPlataforma } from './ControlesPlataforma';
import { limparEntrada, useEntradaTeclado } from './entrada';
import { destravarOrientacao, elementoEmTelaCheia, estaEmRetrato, pedirTelaCheia, sairDaTelaCheia, suportaTelaCheia, travarPaisagem } from './telaCheia';

const ROTULO_ESTADO = { pendente: 'pendente', aberto: 'em andamento', respondido: 'respondido', concluido: 'revisado' };

function PainelDesafio({ sessao, ocupado, pendente, onResponder, onConfirmar }) {
  const [alt, setAlt] = useState('');
  const raiz = useRef(null);
  const { aberto, feedback: fb } = sessao;
  const q = aberto.questao;
  useEffect(() => { raiz.current?.focus(); }, [aberto.eventoId]);
  const travado = ocupado || pendente || Boolean(fb);
  const chave = fb ? `${sessao.id}:${fb.eventoId}` : '';
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/65 p-3 sm:items-center" style={{ touchAction: 'pan-y' }}>
      <section ref={raiz} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Desafio pedagógico" className="my-auto w-full max-w-2xl space-y-3 rounded-3xl border-4 border-[#B9A6EF] bg-white p-4 text-[#25104A] outline-none sm:p-6">
        <h2 className="text-xl font-black">{aberto.tipo === 'portal' ? '🌀 Desafio do portal' : '⭐ Estrela-desafio'}</h2>
        <RenderTextoSeguro texto={q.enunciado} />
        {q.imagem && validarUrlImagemSegura(q.imagem.url) && <figure>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={q.imagem.url} alt={q.imagem.alt || 'Imagem do desafio'} className="max-h-48 w-full object-contain" /></figure>}
        <fieldset disabled={travado} className="space-y-2">
          <legend className="mb-1 font-bold">Escolha uma alternativa</legend>
          {q.alternativas.map((a) => (
            <label key={a.id} className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 ${(fb ? fb.alternativaId : alt) === a.id ? 'border-[#6315D9] bg-[#F3EDFF]' : 'border-[#E2D9F7]'} ${fb && fb.respostaCorreta === a.id ? 'ring-2 ring-emerald-500' : ''}`}>
              <input type="radio" name="alternativa-v2" disabled={travado} checked={(fb ? fb.alternativaId : alt) === a.id} onChange={() => setAlt(a.id)} />
              <RenderTextoSeguro texto={a.texto} />
            </label>
          ))}
        </fieldset>
        {!fb && <button type="button" disabled={!alt || ocupado || pendente} onClick={() => onResponder(alt)} className="min-h-12 rounded-xl bg-[#6315D9] px-6 py-3 font-black text-white disabled:opacity-40">Confirmar resposta</button>}
        {fb && (
          <div className={`space-y-3 rounded-2xl border p-4 ${fb.correta ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
            <FeedbackEmocional tipo={fb.correta ? 'acerto' : 'erro'} chave={chave} fundoClaro className="text-[#25104A]" />
            <p><strong>Resposta correta: </strong>{q.alternativas.find((a) => a.id === fb.respostaCorreta)?.texto}</p>
            <RenderTextoSeguro texto={fb.explicacao} />
            <p className="text-sm font-bold">{fb.correta ? '+100 pontos de jogo (não valem nota).' : 'Sem desconto de pontos. Você está aprendendo!'}</p>
            <button type="button" disabled={ocupado || pendente} onClick={onConfirmar} className="min-h-12 rounded-xl bg-[#6315D9] px-5 py-3 font-black text-white disabled:opacity-40">Li a explicação · Continuar</button>
          </div>
        )}
      </section>
    </div>
  );
}

function PalcoAventura({ sessao, ocupado, pendente, erro, emJogo, setEmJogo, onAbrir, onResponder, onConfirmar, onAvancar, onSair, onVerResultado, onRepetir, onRecarregar }) {
  const palco = useRef(null);
  const entrada = useRef({ esquerda: false, direita: false, pular: false });
  const estavaEmTelaCheia = useRef(false);
  const emJogoRef = useRef(emJogo);
  useEffect(() => { emJogoRef.current = emJogo; }, [emJogo]);
  const audio = useAudiovisualSala();
  const [pausaManual, setPausaManual] = useState(false);
  const [menu, setMenu] = useState(false);
  const [aviso, setAviso] = useState('');
  const [avisoGirar, setAvisoGirar] = useState(false);
  const [telaCheia, setTelaCheia] = useState(false);
  const [fsSuportado, setFsSuportado] = useState(false);
  const concluida = sessao.fase === 'concluida';
  const portal = sessao.eventos.find((e) => e.tipo === 'portal');
  const faseConcluida = !concluida && portal?.estado === 'concluido';
  const pausado = !emJogo || pausaManual || menu || ocupado || pendente || Boolean(sessao.aberto) || faseConcluida || concluida;
  useEntradaTeclado(entrada, emJogo && !pausado);

  const entrar = () => {
    const el = palco.current;
    // Tudo que depende de ativação do usuário é pedido AQUI, de forma síncrona, antes de qualquer await.
    audio?.desbloquearPorGesto?.();
    const fs = pedirTelaCheia(el);
    setEmJogo(true); setPausaManual(false); setMenu(false);
    fs.then((ok) => {
      setTelaCheia(ok);
      estavaEmTelaCheia.current = ok;
      if (ok) travarPaisagem().then((travou) => { if (!travou && estaEmRetrato()) setAvisoGirar(true); });
      else if (estaEmRetrato()) setAvisoGirar(true);
    });
  };
  const alternarTelaCheia = () => {
    if (elementoEmTelaCheia()) { sairDaTelaCheia(); return; }
    const fs = pedirTelaCheia(palco.current);
    fs.then((ok) => { setTelaCheia(ok); estavaEmTelaCheia.current = ok; if (ok) travarPaisagem(); });
  };
  const sair = () => { limparEntrada(entrada.current); destravarOrientacao(); sairDaTelaCheia(); onSair(); };

  useEffect(() => { setFsSuportado(suportaTelaCheia(palco.current)); }, []);

  useEffect(() => {
    const aoMudar = () => {
      const dentro = elementoEmTelaCheia() === palco.current && Boolean(palco.current);
      setTelaCheia(dentro);
      if (!dentro && estavaEmTelaCheia.current) { limparEntrada(entrada.current); destravarOrientacao(); if (emJogoRef.current) { setPausaManual(true); setMenu(true); } }
      estavaEmTelaCheia.current = dentro;
    };
    const aoPerderFoco = () => { limparEntrada(entrada.current); if (emJogoRef.current) { setPausaManual(true); setMenu(true); } };
    const aoOcultar = () => { if (document.hidden) aoPerderFoco(); };
    document.addEventListener('fullscreenchange', aoMudar);
    document.addEventListener('webkitfullscreenchange', aoMudar);
    document.addEventListener('visibilitychange', aoOcultar);
    window.addEventListener('blur', aoPerderFoco);
    const el = palco.current;
    const entradaAtual = entrada.current;
    return () => {
      document.removeEventListener('fullscreenchange', aoMudar);
      document.removeEventListener('webkitfullscreenchange', aoMudar);
      document.removeEventListener('visibilitychange', aoOcultar);
      window.removeEventListener('blur', aoPerderFoco);
      limparEntrada(entradaAtual);
      destravarOrientacao();
      if (elementoEmTelaCheia() === el) sairDaTelaCheia();
    };
  }, []);

  useEffect(() => {
    if (!emJogo) return undefined;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = anterior; };
  }, [emJogo]);

  const aoEvento = useCallback((ev) => {
    audio?.dispararEvento?.(`ra:${sessao.id}:${ev.id}:${ev.tipo === 'portal' ? 'portal' : 'coleta'}`, ev.tipo === 'portal' ? 'portal' : 'coleta');
    onAbrir(ev.id);
  }, [audio, sessao.id, onAbrir]);
  const aoSom = useCallback((s) => audio?.tocarEfeitoLivre?.(s), [audio]);
  const aoPortalFechado = useCallback(() => {
    setAviso(`Portal trancado: ${sessao.estrelasRespondidas} de ${sessao.estrelasTotal} estrelas revisadas.`);
    setTimeout(() => setAviso(''), 3200);
  }, [sessao.estrelasRespondidas, sessao.estrelasTotal]);

  const alternarSom = () => audio?.definirSomAtivo?.(!audio.estadoAudio.somAtivo);
  const continuar = () => { setMenu(false); setPausaManual(false); };
  const rotuloEntrar = sessao.desafiosRespondidos > 0 || sessao.faseAtual > 1 ? 'Continuar' : 'Jogar';

  return (
    <section
      ref={palco}
      data-testid="palco-imersivo"
      data-em-jogo={emJogo ? 'sim' : 'nao'}
      aria-label="Palco da Aventura do Conhecimento"
      className={emJogo ? 'fixed inset-0 z-[70] flex flex-col bg-[#150D35] text-white' : 'relative overflow-hidden rounded-3xl border-4 border-[#00DDEB] bg-[#25104A] p-5 text-white shadow-xl sm:p-8'}
    >
      {!emJogo && (
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-black text-[#FFE500] sm:text-3xl">Sua aventura está pronta!</h2>
          <p>{rotuloDisciplina(sessao.disciplina)} · {sessao.conteudo} · {sessao.totalFases} {sessao.totalFases === 1 ? 'fase' : 'fases'} · {sessao.total} desafios</p>
          <p className="text-sm text-[#E7DBFD]">Estrelas escondem perguntas pelo caminho; o portal guarda o desafio final de cada fase. Pontos de jogo e estrelas não valem nota.</p>
          <p className="text-sm text-[#E7DBFD]">Ao tocar, o jogo abre em tela cheia e ativa o som. Para melhor experiência, use o celular deitado (paisagem).</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={entrar} className="min-h-14 rounded-2xl bg-[#FFE500] px-8 py-3 text-xl font-black text-[#25104A]">{rotuloEntrar} ▶</button>
            <button type="button" onClick={onSair} className="min-h-14 rounded-2xl border-2 border-white/60 px-5 py-3 font-bold">Sair e continuar depois</button>
          </div>
        </div>
      )}
      {emJogo && (
        <>
          <header className="z-30 flex min-h-11 flex-wrap items-center justify-between gap-2 bg-black/40 px-3 py-1 pt-[max(0.25rem,env(safe-area-inset-top))] text-sm font-bold">
            <span data-testid="hud-progresso">Fase {sessao.faseAtual}/{sessao.totalFases} · ★ {sessao.estrelasRespondidas}/{sessao.estrelasTotal} · ✓ {sessao.acertos} · {sessao.pontosJogo} pts</span>
            <span className="flex gap-2">
              <button type="button" aria-label="Pausar" onClick={() => { limparEntrada(entrada.current); setMenu(true); }} className="min-h-10 min-w-10 rounded-lg border border-white/50 px-2">⏸</button>
              <button type="button" aria-label="Ligar ou desligar o som" aria-pressed={Boolean(audio?.estadoAudio?.somAtivo)} onClick={alternarSom} className="min-h-10 min-w-10 rounded-lg border border-white/50 px-2">{audio?.estadoAudio?.somAtivo === false ? '🔇' : '🔊'}</button>
              <button type="button" aria-label="Abrir menu e desafios do modo acessível" onClick={() => { limparEntrada(entrada.current); setMenu(true); }} className="min-h-10 rounded-lg border border-white/50 px-2">♿ Desafios</button>
              {fsSuportado && <button type="button" aria-label={telaCheia ? 'Sair da tela cheia' : 'Entrar em tela cheia'} onClick={alternarTelaCheia} className="min-h-10 min-w-10 rounded-lg border border-white/50 px-2">{telaCheia ? '🗗' : '⛶'}</button>}
            </span>
          </header>
          <div className="relative min-h-0 flex-1">
            <PercursoV2
              key={`${sessao.id}:${sessao.faseAtual}`}
              sessaoId={sessao.id}
              fase={sessao.faseAtual}
              eventos={sessao.eventos}
              portalLiberado={sessao.portalLiberado}
              pausado={pausado}
              entradaRef={entrada}
              onEvento={aoEvento}
              onPortalFechado={aoPortalFechado}
              onSom={aoSom}
              reduzirAnimacao={Boolean(audio?.reduzirAnimacao)}
            />
            <ControlesPlataforma entradaRef={entrada} desabilitado={pausado} />
            {aviso && <p role="status" className="absolute left-1/2 top-3 z-30 -translate-x-1/2 rounded-xl bg-black/80 px-4 py-2 text-center text-sm font-bold">{aviso}</p>}
            {avisoGirar && (
              <div role="status" className="absolute inset-x-3 top-14 z-30 flex items-center justify-between gap-3 rounded-xl bg-[#FFE500] px-4 py-2 text-sm font-bold text-[#25104A]">
                <span>Gire o aparelho para a horizontal para jogar melhor. O modo acessível funciona em pé.</span>
                <button type="button" onClick={() => setAvisoGirar(false)} className="min-h-10 rounded-lg border border-[#25104A] px-3">Dispensar</button>
              </div>
            )}
            {erro && (
              <div role="alert" className="absolute inset-x-3 bottom-24 z-30 space-y-2 rounded-xl bg-amber-100 p-3 text-sm font-bold text-[#25104A]">
                <p>{erro}</p>
                <div className="flex flex-wrap gap-2">
                  {pendente && <button type="button" disabled={ocupado} onClick={onRepetir} className="min-h-10 rounded-lg bg-[#6315D9] px-3 text-white">Tentar o mesmo envio novamente</button>}
                  <button type="button" disabled={ocupado} onClick={onRecarregar} className="min-h-10 rounded-lg border border-[#25104A] px-3">Recarregar progresso salvo</button>
                </div>
              </div>
            )}
            {sessao.aberto && <PainelDesafio sessao={sessao} ocupado={ocupado} pendente={pendente} onResponder={onResponder} onConfirmar={onConfirmar} />}
            {faseConcluida && (
              <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/70 p-4" style={{ touchAction: 'pan-y' }}>
                <div role="dialog" aria-modal="true" aria-label="Fase concluída" className="w-full max-w-md space-y-3 rounded-3xl border-4 border-[#FFE500] bg-[#25104A] p-5 text-center">
                  <FeedbackEmocional tipo="fase" chave={`${sessao.id}:fase${sessao.faseAtual}`} />
                  <p>{sessao.estrelasRespondidas} de {sessao.estrelasTotal} estrelas revisadas · {sessao.pontosJogo} pontos de jogo</p>
                  <button type="button" disabled={ocupado || pendente} onClick={onAvancar} className="min-h-12 rounded-xl bg-[#FFE500] px-6 py-3 font-black text-[#25104A] disabled:opacity-40">{sessao.faseAtual === sessao.totalFases ? 'Concluir aventura' : 'Próxima fase →'}</button>
                </div>
              </div>
            )}
            {concluida && (
              <div className="absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
                <div role="dialog" aria-modal="true" aria-label="Aventura concluída" className="w-full max-w-md space-y-3 rounded-3xl border-4 border-[#FFE500] bg-[#25104A] p-5 text-center">
                  <FeedbackEmocional tipo="vitoria" chave={`${sessao.id}:vitoria`} />
                  <p>{sessao.acertos} acertos em {sessao.total} desafios · {sessao.pontosJogo} pontos de jogo</p>
                  <button type="button" onClick={() => { destravarOrientacao(); sairDaTelaCheia(); onVerResultado(); }} className="min-h-12 rounded-xl bg-[#FFE500] px-6 py-3 font-black text-[#25104A]">Ver resultado</button>
                </div>
              </div>
            )}
            {menu && (
              <div className="absolute inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-3" style={{ touchAction: 'pan-y' }}>
                <div role="dialog" aria-modal="true" aria-label="Menu da aventura" className="my-auto w-full max-w-lg space-y-3 rounded-3xl border-4 border-[#00DDEB] bg-[#25104A] p-4">
                  <h2 className="text-xl font-black">Aventura pausada</h2>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={continuar} className="min-h-12 rounded-xl bg-[#FFE500] px-5 font-black text-[#25104A]">▶ Continuar</button>
                    {fsSuportado && !telaCheia && <button type="button" onClick={() => { alternarTelaCheia(); continuar(); }} className="min-h-12 rounded-xl border-2 border-white/60 px-4 font-bold">⛶ Tela cheia</button>}
                    {telaCheia && <button type="button" onClick={() => sairDaTelaCheia()} className="min-h-12 rounded-xl border-2 border-white/60 px-4 font-bold">🗗 Sair da tela cheia</button>}
                    <button type="button" onClick={sair} className="min-h-12 rounded-xl border-2 border-white/60 px-4 font-bold">Sair e continuar depois</button>
                  </div>
                  <BarraControleAudiovisual />
                  <div role="group" aria-label="Modo acessível: escolher desafio" className="space-y-2">
                    <h3 className="font-black">Modo acessível — escolha um desafio sem precisar pular</h3>
                    <p className="text-xs text-[#E7DBFD]">Mesmas perguntas, regras e pontos do percurso. O portal abre quando todas as estrelas forem revisadas.</p>
                    <ul className="space-y-2">
                      {sessao.eventos.map((e, i) => {
                        const bloqueado = (e.tipo === 'portal' && !sessao.portalLiberado) || e.estado === 'concluido' || e.estado === 'respondido';
                        const nome = e.tipo === 'portal' ? 'Portal' : `Estrela ${i + 1}`;
                        return (
                          <li key={e.id}>
                            <button type="button" disabled={bloqueado || ocupado || pendente} onClick={() => { setMenu(false); setPausaManual(false); onAbrir(e.id); }} aria-label={`${nome}: ${ROTULO_ESTADO[e.estado]}`} className="flex min-h-12 w-full items-center justify-between rounded-xl border-2 border-white/40 px-3 text-left font-bold disabled:opacity-50">
                              <span>{e.tipo === 'portal' ? '🌀' : '★'} {nome}</span>
                              <span className="text-sm">{e.estado === 'concluido' ? (e.correta ? '✓ acerto' : '✗ aprender') : e.tipo === 'portal' && !sessao.portalLiberado ? `🔒 ${sessao.estrelasRespondidas}/${sessao.estrelasTotal} estrelas` : ROTULO_ESTADO[e.estado]}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function AventuraV2(props) {
  const [emJogo, setEmJogo] = useState(false);
  const faseAudio = props.sessao.fase === 'concluida' ? 'encerrada' : emJogo ? 'desafio' : 'espera';
  return (
    <ProvedorAudiovisualSala modalidade="plataforma" fase={faseAudio}>
      <PalcoAventura {...props} emJogo={emJogo} setEmJogo={setEmJogo} />
    </ProvedorAudiovisualSala>
  );
}
