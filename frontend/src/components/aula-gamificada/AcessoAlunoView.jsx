'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSalaGamificada } from './useSalaGamificada';
import { SalaAlunoView } from './SalaAlunoView';
import { MODALIDADES_PADRAO, normalizarCodigoSala } from './constantes';
import { obterMinhasAvaliacoes, obterRelatorioSala } from './api';

function SalaAlunoConectada({ codigo, loginKey, onTrocarSala }) {
  const { estado, conexao, erro, ocupado, reconectar, enviarResposta } = useSalaGamificada({
    codigo,
    papel: 'aluno',
    contextoUid: loginKey,
    ativo: true,
  });

  return (
    <main className="arte-pagina min-h-screen text-[#25104A]">
      <nav aria-label="Navegação da sala" className="arte-barra-roxa px-4 py-3 text-sm">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onTrocarSala}
              className="min-h-10 rounded-xl border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
            >
              ← Trocar sala
            </button>
            <span className="text-xs font-bold text-[#E7DBFD]">
              Sala <strong className="font-mono text-[#FFE500]">{codigo}</strong>
            </span>
          </div>
          <Link href="/aluno/notas" className="text-xs font-bold text-[#E7DBFD] underline hover:text-white">
            Voltar ao boletim
          </Link>
        </div>
      </nav>

      {!estado ? (
        <div className="max-w-xl mx-auto p-6 sm:p-10 space-y-4">
          <p role={erro ? 'alert' : 'status'} className={`rounded-2xl border p-4 text-sm font-bold ${erro ? 'border-red-300 bg-red-50 text-red-900' : 'border-[#E2D9F7] bg-white text-[#25104A]'}`}>
            {erro || 'Entrando na sala e recuperando sua participação…'}
          </p>
          {erro && (
            <button
              type="button"
              onClick={reconectar}
              className="min-h-11 rounded-xl bg-[#6315D9] px-4 py-2 text-sm font-extrabold text-white"
            >
              Tentar conectar novamente
            </button>
          )}
        </div>
      ) : (
        <SalaAlunoView
          estado={estado}
          conexao={conexao}
          ocupado={ocupado}
          erro={erro}
          onResponder={enviarResposta}
          onReconectar={reconectar}
        />
      )}
    </main>
  );
}

export function AcessoAlunoView({ codigoInicial = '' }) {
  const [sessao, setSessao] = useState(null);
  const [minhasAvaliacoes, setMinhasAvaliacoes] = useState([]);
  const [relatorioAluno, setRelatorioAluno] = useState(null);
  const [erroRelatorio, setErroRelatorio] = useState(null);
  const [erroSessao, setErroSessao] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [codigoDigitado, setCodigoDigitado] = useState(() => normalizarCodigoSala(codigoInicial));
  const [salaAtiva, setSalaAtiva] = useState(() => normalizarCodigoSala(codigoInicial));

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    async function validarSessao() {
      try {
        const res = await fetch('/api/aluno/sessao', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (res.status === 401) {
          if (ativo) {
            setSessao(null);
            setSalaAtiva('');
            setErroSessao('Faça login no Portal do Aluno para participar da Aula Gamificada.');
          }
          return;
        }
        if (!res.ok) {
          throw new Error('Não foi possível validar sua sessão do Portal.');
        }
        const dados = await res.json();
        if (!ativo) return;
        if (!dados?.authenticated || !dados?.aluno?.loginKey) {
          setSessao(null);
          setSalaAtiva('');
          setErroSessao('Faça login no Portal do Aluno para participar da Aula Gamificada.');
          return;
        }
        setSessao(dados.aluno);
        setErroSessao(null);
        obterMinhasAvaliacoes({ signal: controller.signal })
          .then((av) => {
            if (ativo && Array.isArray(av?.avaliacoes)) setMinhasAvaliacoes(av.avaliacoes);
          })
          .catch(() => {});
      } catch (e) {
        if (ativo && e?.name !== 'AbortError') {
          setSessao(null);
          setErroSessao(e?.message || 'Erro ao verificar sua sessão do Portal.');
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    validarSessao();
    return () => {
      ativo = false;
      controller.abort();
    };
  }, []);

  if (carregando) {
    return (
      <main className="arte-pagina min-h-screen flex items-center justify-center p-6 text-[#25104A]">
        <p role="status" className="font-bold">Verificando sua sessão do Portal do Aluno…</p>
      </main>
    );
  }

  if (sessao && salaAtiva) {
    return (
      <SalaAlunoConectada
        key={`${sessao.loginKey}:${salaAtiva}`}
        codigo={salaAtiva}
        loginKey={sessao.loginKey}
        onTrocarSala={() => setSalaAtiva('')}
      />
    );
  }

  const codigoValido = /^[A-Z0-9]{4,12}$/.test(codigoDigitado);

  return (
    <main className="arte-pagina min-h-screen flex items-center justify-center p-4">
      <section className="arte-banner-festival arte-cartaz w-full max-w-lg p-6 sm:p-8 text-white space-y-5">
        <div className="space-y-1.5">
          <span className="arte-selo">Portal do Aluno · {MODALIDADES_PADRAO.length} Jogos ao Vivo</span>
          <h1 className="font-head text-3xl font-black text-white">Aula Gamificada</h1>
        </div>

        {erroSessao && (
          <p role="alert" className="rounded-xl border border-amber-300 bg-amber-950/60 p-3 text-sm font-semibold text-amber-100">
            {erroSessao}
          </p>
        )}

        {sessao ? (
          <>
            <p className="text-sm text-[#E7DBFD]">
              Olá, <strong className="text-white">{sessao.nome || 'estudante'}</strong>! Digite o código informado pelo professor para entrar na sala da sua turma.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (codigoValido) setSalaAtiva(codigoDigitado);
              }}
              className="space-y-4"
            >
              <div>
                <label htmlFor="codigo-sala-gamificada" className="block text-xs font-black uppercase tracking-wider text-[#FFE500]">
                  Código da sala
                </label>
                <input
                  id="codigo-sala-gamificada"
                  name="codigo"
                  type="text"
                  value={codigoDigitado}
                  onChange={(e) => setCodigoDigitado(normalizarCodigoSala(e.target.value))}
                  maxLength={12}
                  required
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  placeholder="Ex.: BIO2026"
                  className="mt-2 w-full min-h-14 rounded-2xl border-2 border-[#B9A6EF] bg-[#25104A] px-4 py-3 font-mono text-2xl font-black tracking-widest text-white uppercase focus-visible:outline-2 focus-visible:outline-[#00DDEB]"
                />
              </div>

              <button
                type="submit"
                disabled={!codigoValido}
                className="w-full min-h-12 rounded-2xl bg-[#FFE500] px-5 py-3 text-base font-black text-[#25104A] shadow-md transition hover:bg-[#00DDEB] disabled:opacity-45"
              >
                Entrar na aula gamificada
              </button>
            </form>
            <p className="text-xs text-[#E7DBFD]">
              Sua resposta vale somente após confirmação do servidor. Salas de revisão não alteram suas notas; avaliações publicadas aparecem abaixo.
            </p>
            {minhasAvaliacoes.length > 0 && (
              <div className="rounded-2xl border border-[#B9A6EF]/40 bg-[#1B0A3B]/80 p-4 space-y-2">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#FFE500]">
                  Minhas Avaliações (Portal)
                </h2>
                <ul className="space-y-2 text-xs">
                  {minhasAvaliacoes.map((av) => (
                    <li
                      key={av.codigo}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-2"
                    >
                      <div>
                        <strong className="block text-white">{av.titulo}</strong>
                        <span className="text-[#E7DBFD]">
                          {av.disciplina} · {av.bimestre}º Bim · {av.modalidade}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#B9EF00]">
                          {typeof av.notaFinal === 'number' ? av.notaFinal.toFixed(2) : '-'} / {av.valorMaximo}
                        </span>
                        <button
                          type="button"
                          onClick={async () => {
                            setErroRelatorio(null);
                            try {
                              const r = await obterRelatorioSala({ codigo: av.codigo });
                              setRelatorioAluno(r);
                            } catch (e) {
                              setErroRelatorio(e?.message || 'Não foi possível abrir a devolutiva.');
                            }
                          }}
                          className="rounded-lg bg-[#FFE500] px-2.5 py-1 text-[11px] font-black text-[#25104A]"
                        >
                          Ver devolutiva
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {erroRelatorio && <p role="alert" className="text-xs font-bold text-amber-200">{erroRelatorio}</p>}
                {relatorioAluno?.meuResultado && (
                  <div className="rounded-xl border border-[#00DDEB]/50 bg-[#12062A] p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#00DDEB]">
                        Devolutiva — {relatorioAluno.configuracaoCongelada?.tituloAtividade || relatorioAluno.sala?.titulo}
                      </strong>
                      <button
                        type="button"
                        onClick={() => setRelatorioAluno(null)}
                        className="text-[#E7DBFD] underline"
                      >
                        Fechar
                      </button>
                    </div>
                    <p>
                      Nota final:{' '}
                      <strong className="text-[#B9EF00]">
                        {typeof relatorioAluno.meuResultado.notaFinal === 'number'
                          ? relatorioAluno.meuResultado.notaFinal.toFixed(2)
                          : '-'}
                      </strong>{' '}
                      · Respondidas: {relatorioAluno.meuResultado.respondidas}/{relatorioAluno.meuResultado.elegiveis}
                    </p>
                    {relatorioAluno.meuResultado.justificativaRevisao && (
                      <p className="text-amber-200">
                        Revisão docente: {relatorioAluno.meuResultado.justificativaRevisao}
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {(relatorioAluno.meuResultado.detalhesQuestoes || []).map((q) => (
                        <li key={q.rodada} className="rounded-lg bg-white/5 p-2">
                          <strong className="block text-white">Q{q.rodada}: {q.enunciado}</strong>
                          <span className="block text-[#E7DBFD]">
                            Status: {q.status} · Gabarito: {JSON.stringify(q.respostaCorreta)}
                          </span>
                          {q.explicacao && <span className="block text-[#B9EF00]">{q.explicacao}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <Link href="/aluno/notas" className="inline-block text-sm font-bold text-[#00DDEB] underline">
              ← Voltar ao boletim
            </Link>
          </>
        ) : (
          <Link
            href="/aluno"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#FFE500] px-5 py-3 text-sm font-black text-[#25104A] hover:bg-[#00DDEB]"
          >
            Fazer login no Portal do Aluno
          </Link>
        )}
      </section>
    </main>
  );
}
