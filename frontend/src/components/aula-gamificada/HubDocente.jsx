'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { AbasNavegacao } from '@/components/ui/AbasNavegacao';
import { CatalogoModalidades } from './CatalogoModalidades';
import { BancoQuestoes } from './BancoQuestoes';
import { GeradorIAQuestoes } from './GeradorIAQuestoes';
import { PrepararSala } from './PrepararSala';
import HistoricoAvaliacoes from './HistoricoAvaliacoes';
import RelatorioAvaliacao from './RelatorioAvaliacao';
import * as apiAula from './api';

const CATALOGO_VAZIO = {
  donoUid: null,
  modalidades: [],
  turmas: [],
  questoes: [],
  salas: [],
  contextoAvaliacao: null,
};

/**
 * Componente isolado por `key={uid}`: trocar de conta desmonta imediatamente
 * catálogo, aba ativa, editores abertos e rascunhos da conta anterior.
 */
function HubDocenteAutenticado({ uid, obterToken }) {
  const [abaAtiva, setAbaAtiva] = useState('catalogo');
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState(null);
  const [catalogo, setCatalogo] = useState(CATALOGO_VAZIO);
  const [tentativaCarga, setTentativaCarga] = useState(0);

  const [modalidadeSalaInicial, setModalidadeSalaInicial] = useState('quiz');
  const [modalidadeGerarInicial, setModalidadeGerarInicial] = useState('quiz');
  const [questaoIdsGuia, setQuestaoIdsGuia] = useState([]);
  const [tipoGerarInicial, setTipoGerarInicial] = useState('multipla_escolha');
  const [tipoCriarInicial, setTipoCriarInicial] = useState(null);
  const [codigoRelatorioAberto, setCodigoRelatorioAberto] = useState(null);
  const [rascunhosGerador, setRascunhosGerador] = useState([]);

  const tentarNovamente = useCallback(() => {
    setCarregando(true);
    setErroCarga(null);
    setTentativaCarga((n) => n + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let ativo = true;

    const obterCtx = (() => {
      try {
        return typeof apiAula.obterContextoAvaliacao === 'function' ? apiAula.obterContextoAvaliacao : null;
      } catch {
        return null;
      }
    })();

    Promise.all([
      apiAula.buscarCatalogo({ obterToken, signal: controller.signal }),
      obterCtx
        ? obterCtx({ obterToken, signal: controller.signal }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([dados, contextoAv]) => {
        if (!ativo || controller.signal.aborted) return;
        // Confirma novamente que o Firebase continua autenticado na mesma conta.
        if (auth?.currentUser?.uid && auth.currentUser.uid !== uid) return;
        setCatalogo({
          donoUid: uid,
          modalidades: Array.isArray(dados?.modalidades) ? dados.modalidades : [],
          turmas: Array.isArray(dados?.turmas) ? dados.turmas : [],
          questoes: Array.isArray(dados?.questoes) ? dados.questoes : [],
          salas: Array.isArray(dados?.salas) ? dados.salas : [],
          contextoAvaliacao: contextoAv || null,
        });
        setErroCarga(null);
        setCarregando(false);
      })
      .catch((err) => {
        if (!ativo || controller.signal.aborted || err?.name === 'AbortError') return;
        setErroCarga(err?.message || 'Não foi possível carregar o catálogo da Aula Gamificada.');
        setCarregando(false);
      });

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [uid, obterToken, tentativaCarga]);

  // Garante que dados de outro UID jamais sejam exibidos.
  const catalogoSeguro = catalogo.donoUid === uid ? catalogo : CATALOGO_VAZIO;

  const totalModalidades = catalogoSeguro.modalidades.length;
  const rotuloCatalogo = totalModalidades > 0 ? `Catálogo (${totalModalidades} jogos)` : 'Catálogo';

  const abas = [
    {
      id: 'catalogo',
      rotulo: rotuloCatalogo,
      icone: '🎮',
      ...(totalModalidades > 0 ? { contagem: totalModalidades } : {}),
    },
    { id: 'banco', rotulo: 'Banco de Questões', icone: '📚', contagem: catalogoSeguro.questoes.length },
    { id: 'gerar', rotulo: 'Gerar com IA', icone: '✨' },
    { id: 'salas', rotulo: 'Preparar Sala', icone: '🚀', contagem: catalogoSeguro.salas.length },
    { id: 'historico', rotulo: 'Histórico e Avaliações', icone: '📊' },
  ];

  const integrarQuestao = (novaOuAtualizada) => {
    setCatalogo((prev) => {
      if (prev.donoUid !== uid) return prev;
      const existe = prev.questoes.some((q) => q.id === novaOuAtualizada.id);
      const questoes = existe
        ? prev.questoes.map((q) => (q.id === novaOuAtualizada.id ? novaOuAtualizada : q))
        : [novaOuAtualizada, ...prev.questoes];
      return { ...prev, questoes };
    });
  };

  const integrarSala = (novaSala) => {
    setCatalogo((prev) => {
      if (prev.donoUid !== uid) return prev;
      return {
        ...prev,
        salas: [novaSala, ...prev.salas.filter((s) => s.codigo !== novaSala.codigo)],
      };
    });
  };

  return (
    <div className="arte-pagina min-h-screen text-[#25104A] flex flex-col">
      <CabecalhoPagina
        titulo="Aula Gamificada"
        subtitulo={
          totalModalidades > 0
            ? `Crie questões manuais ou com IA por tema e anexos, calibre dificuldades para a série e conduza ${totalModalidades} modalidades ao vivo sem alterar notas.`
            : 'Crie questões manuais ou com IA por tema e anexos, calibre dificuldades para a série e conduza modalidades ao vivo sem alterar notas.'
        }
        badge={totalModalidades > 0 ? `Todas as disciplinas · ${totalModalidades} jogos` : 'Todas as disciplinas'}
        badgeCor="amarelo"
        voltarUrl="/"
        acoes={
          <Link
            href="/aluno/aula-gamificada"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-10 inline-flex items-center rounded-xl border border-[#6315D9] bg-white px-3.5 py-2 text-xs font-extrabold text-[#6315D9] hover:bg-[#F3EDFF]"
          >
            Tela do aluno ↗
          </Link>
        }
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <AbasNavegacao abas={abas} abaAtiva={abaAtiva} onSelect={setAbaAtiva} />

        {erroCarga ? (
          <section
            role="alert"
            className="rounded-2xl border-2 border-red-300 bg-red-50 p-6 space-y-3 text-red-950"
          >
            <h2 className="font-head text-lg font-black">Falha ao carregar a Aula Gamificada</h2>
            <p className="text-sm font-medium">{erroCarga}</p>
            <button
              type="button"
              onClick={tentarNovamente}
              className="min-h-11 rounded-xl bg-red-800 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-900"
            >
              Tentar novamente
            </button>
          </section>
        ) : carregando ? (
          <div className="rounded-2xl border border-[#E2D9F7] bg-white p-8 text-center">
            <p role="status" className="text-sm font-bold text-[#5B4B86]">
              Carregando catálogo, turmas, banco de questões e salas…
            </p>
          </div>
        ) : (
          <div role="tabpanel" id={`tabpanel-${abaAtiva}`} aria-labelledby={`tab-${abaAtiva}`}>
            {abaAtiva === 'catalogo' && (
              <CatalogoModalidades
                modalidadesServidor={catalogoSeguro.modalidades}
                onSelecionarParaSala={(modId) => {
                  setModalidadeSalaInicial(modId);
                  setQuestaoIdsGuia([]);
                  setAbaAtiva('salas');
                }}
                onSelecionarParaGerar={(tipo, modId) => {
                  setTipoGerarInicial(tipo);
                  if (modId) setModalidadeGerarInicial(modId);
                  setAbaAtiva('gerar');
                }}
                onCriarManual={(tipo) => {
                  setTipoCriarInicial(tipo);
                  setAbaAtiva('banco');
                }}
              />
            )}

            {abaAtiva === 'banco' && (
              <BancoQuestoes
                key={uid}
                questoes={catalogoSeguro.questoes}
                turmas={catalogoSeguro.turmas}
                obterToken={obterToken}
                tipoInicialCriar={tipoCriarInicial}
                onLimparTipoInicial={() => setTipoCriarInicial(null)}
                onQuestaoAtualizada={integrarQuestao}
              />
            )}

            {abaAtiva === 'gerar' && (
              <GeradorIAQuestoes
                key={`${uid}:${modalidadeGerarInicial}:${tipoGerarInicial}`}
                uid={uid}
                obterToken={obterToken}
                modalidadeInicial={modalidadeGerarInicial}
                modalidadesServidor={catalogoSeguro.modalidades}
                tipoInicial={tipoGerarInicial}
                rascunhosExternos={rascunhosGerador}
                onRascunhosChange={setRascunhosGerador}
                onQuestaoSalva={integrarQuestao}
                onContinuarParaSala={({ modalidade, questaoIds }) => {
                  setModalidadeSalaInicial(modalidade || modalidadeGerarInicial);
                  setQuestaoIdsGuia(questaoIds || []);
                  setAbaAtiva('salas');
                }}
              />
            )}

            {abaAtiva === 'salas' && (
              <PrepararSala
                key={`${uid}:${modalidadeSalaInicial}:${questaoIdsGuia.join(',')}`}
                modalidadesServidor={catalogoSeguro.modalidades}
                turmas={catalogoSeguro.turmas}
                contextoAvaliacao={catalogoSeguro.contextoAvaliacao}
                questoes={catalogoSeguro.questoes}
                salas={catalogoSeguro.salas}
                modalidadeInicial={modalidadeSalaInicial}
                questaoIdsIniciais={questaoIdsGuia}
                obterToken={obterToken}
                onSalaCriada={integrarSala}
              />
            )}

            {abaAtiva === 'historico' && (
              <div className="space-y-6">
                <HistoricoAvaliacoes
                  turmas={catalogoSeguro.turmas}
                  contextoAvaliacao={catalogoSeguro.contextoAvaliacao}
                  obterToken={obterToken}
                  onAbrirRelatorio={(codigo) => setCodigoRelatorioAberto(codigo)}
                />
                {codigoRelatorioAberto && (
                  <RelatorioAvaliacao
                    key={codigoRelatorioAberto}
                    codigo={codigoRelatorioAberto}
                    obterToken={obterToken}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export function HubDocente() {
  const { user, loading } = useAuth();
  const uid = user?.uid;

  const obterToken = useCallback(async () => {
    const atual = auth?.currentUser;
    if (!uid || !atual || atual.uid !== uid) {
      throw new Error('Sua conta mudou. Faça login novamente com sua conta Firebase.');
    }
    return atual.getIdToken();
  }, [uid]);

  const autorizadoDocente = Boolean(user && !user.isDjango && auth?.currentUser && auth.currentUser.uid === uid);

  if (loading) {
    return (
      <main className="arte-pagina min-h-screen p-8 text-[#25104A]">
        <p role="status" className="font-bold">Verificando acesso docente…</p>
      </main>
    );
  }

  if (!autorizadoDocente) {
    return (
      <main className="arte-pagina min-h-screen p-8 text-[#25104A] flex items-center justify-center">
        <section className="max-w-lg w-full rounded-3xl border-2 border-[#E2D9F7] bg-white p-6 sm:p-8 space-y-4 shadow-sm">
          <h1 className="font-head text-2xl font-black text-[#25104A]">Aula Gamificada</h1>
          <p className="text-sm text-[#5B4B86]">
            Faça login de professor com sua conta Firebase para gerenciar seu banco privado de questões e abrir salas ao vivo.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-xl bg-[#6315D9] px-5 py-2.5 text-sm font-extrabold text-white hover:bg-[#5411B8]"
          >
            Voltar para entrar
          </Link>
        </section>
      </main>
    );
  }

  return <HubDocenteAutenticado key={uid} uid={uid} obterToken={obterToken} />;
}
