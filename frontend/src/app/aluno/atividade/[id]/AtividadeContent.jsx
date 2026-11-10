"use client";

import { CabecalhoPagina } from '@/components/ui/CabecalhoPagina';
import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { decodeToken } from '@/utils/diario/tokenUtils';
import { interpretarDataEntrega, formatarDataEntrega } from '@/dominio/atividades/dataEntrega';
import { RespostaForm } from './RespostaForm';
import { ConfirmacaoView } from './ConfirmacaoView';
import { FeedbackView } from './FeedbackView';
import { ErroView } from './ErroView';

export default function AtividadeContent() {
  const { id: activityId } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  return <AtividadePorAcesso key={JSON.stringify([activityId, token])} activityId={activityId} token={token} />;
}

function AtividadePorAcesso({ activityId, token }) {
  const urlAtividade = `/api/aluno/atividade/${encodeURIComponent(activityId)}?token=${encodeURIComponent(token)}`;
  const [estado, setEstado] = useState('carregando');
  const [erroTipo, setErroTipo] = useState('token_invalido');
  const [atividade, setAtividade] = useState(null);
  const [alunoInfo, setAlunoInfo] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [operacao, setOperacao] = useState(null);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [verificacaoPendente, setVerificacaoPendente] = useState(false);

  useEffect(() => {
    if (!token) {
      queueMicrotask(() => { setErroTipo('token_invalido'); setEstado('erro'); });
      return;
    }

    const decoded = decodeToken(token);
    if (!decoded || decoded.activityId !== activityId) {
      queueMicrotask(() => { setErroTipo('token_invalido'); setEstado('erro'); });
      return;
    }

    fetch(urlAtividade)
      .then(async (res) => {
        if (!res.ok) {
          const error = new Error('Falha ao carregar atividade.'); error.status = res.status; throw error;
        }
        return res.json();
      })
      .then((data) => {
        const atv = data.atividade;
        const ent = data.entrega;
        const info = data.alunoInfo || { alunoId: decoded.alunoId };

        if (!atv) {
          setErroTipo('atividade_nao_encontrada');
          setEstado('erro');
          return;
        }

        setAtividade(atv);
        setAlunoInfo(info);

        const agora = new Date();
        const prazo = interpretarDataEntrega(atv.dataEntrega);
        if (prazo && prazo < agora && !ent) {
          setErroTipo('prazo_encerrado');
          setEstado('erro');
          return;
        }

        if (ent) {
          setEntrega(ent);
          setEstado(ent.status === 'corrigido' || ent.status === 'revisado' ? 'feedback' : 'confirmacao');
        } else {
          setEstado('form');
        }
      })
      .catch(error => {
        setErroTipo(error.status === 401 ? 'login_necessario' : error.status === 403 ? 'token_invalido' : 'erro_carregamento');
        setEstado('erro');
      });
  }, [activityId, token, urlAtividade]);

  function mostrarEntrega(registro) {
    setEntrega(registro);
    setEstado(['corrigido', 'revisado'].includes(registro.status) ? 'feedback' : 'confirmacao');
  }

  async function consultarComprovante() {
    const res = await fetch(urlAtividade, { cache: 'no-store' });
    if (!res.ok) throw new Error('Comprovante indisponível.');
    const data = await res.json();
    if (!data?.atividade || !Object.hasOwn(data, 'entrega')) throw new Error('Comprovante indisponível.');
    if (data.entrega) mostrarEntrega(data.entrega);
    return Boolean(data.entrega);
  }

  async function verificarEntrega(mensagemSemEntrega) {
    try {
      const registrada = await consultarComprovante();
      setVerificacaoPendente(false);
      if (!registrada) setErroEnvio(mensagemSemEntrega || 'A consulta ainda não encontrou uma entrega. Você pode tentar enviar novamente.');
    } catch {
      setVerificacaoPendente(true);
      setErroEnvio('Não foi possível confirmar o envio. Quando a conexão voltar, verifique a entrega. Suas respostas continuam nesta página.');
    }
  }

  async function handleVerificarEntrega() {
    if (operacao) return;
    setOperacao('verificando');
    setErroEnvio(null);
    try {
      await verificarEntrega();
    } finally {
      setOperacao(null);
    }
  }

  const handleSubmit = async (respostaTexto, respostas) => {
    if (!atividade || !alunoInfo || operacao || verificacaoPendente) return;
    setOperacao('enviando');
    setErroEnvio(null);
    try {
      const res = await fetch('/api/aluno/entregar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          token,
          alunoId: alunoInfo.alunoId,
          turmaId: alunoInfo.turmaId,
          bimestre: atividade.bimestre,
          ...(respostas != null ? { respostas } : { respostaTexto }),
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success === true) {
        const registrada = await consultarComprovante().catch(() => false);
        if (!registrada) mostrarEntrega({ status: 'entregue' });
      } else if (res.status >= 400 && res.status < 500 && res.status !== 409 && data?.error) {
        setErroEnvio(data.error);
      } else {
        await verificarEntrega(res.status === 409 ? data?.error : null);
      }
    } catch {
      await verificarEntrega();
    } finally {
      setOperacao(null);
    }
  };

  if (estado === 'carregando') {
    return (
      <div className="min-h-screen bg-[#f3edff] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#25104a] border-2 border-[#6315d9] animate-spin" />
          <span className="text-xs font-bold text-[#5b4b86]">Carregando atividade...</span>
        </div>
      </div>
    );
  }

  if (estado === 'erro') {
    const dataStr = interpretarDataEntrega(atividade?.dataEntrega)
      ? formatarDataEntrega(atividade.dataEntrega)
      : null;
    return <ErroView tipo={erroTipo} dataEntrega={dataStr} />;
  }

  const prazoStr = formatarDataEntrega(atividade?.dataEntrega);

  return (
    <div className="arte-pagina min-h-screen font-sans selection:bg-[#6315d9] selection:text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="mb-6 overflow-hidden rounded-3xl">
          <CabecalhoPagina
            titulo={atividade?.titulo}
            badge="Atividade"
            badgeCor="ciano"
            variante="compacto"
            subtitulo={<>
              {alunoInfo?.nome && <span className="block">Estudante: <strong>{alunoInfo.nome}</strong></span>}
              <span className="block">Prazo de entrega: {prazoStr}</span>
            </>}
            acoes={
              <a
                href={typeof window !== 'undefined' && sessionStorage.getItem('aluno_login') ? '/aluno/notas' : '/aluno'}
                className="inline-flex items-center rounded-xl border border-[#e2d9f7] bg-white px-3 py-2 text-xs font-bold text-[#25104a] hover:bg-[#f3edff] focus-visible:outline-2 focus-visible:outline-[#6315d9]"
              >
                Voltar ao Boletim
              </a>
            }
          />
        </div>

        {estado === 'form' && (() => {
          const textos = atividade?.textosBase?.length > 0
            ? atividade.textosBase
            : (atividade?.textoBase ? [{ id: 'legacy', html: atividade.textoBase, aposQuestao: null }] : []);
          return <>
            <RespostaForm atividade={atividade} onSubmit={handleSubmit} loading={operacao === 'enviando'}
              bloquearEnvio={verificacaoPendente} textos={textos} />
            {erroEnvio && <p role="alert" className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">{erroEnvio}</p>}
            {verificacaoPendente && (
              <button type="button" onClick={handleVerificarEntrega} disabled={Boolean(operacao)}
                className="btn-brand-ghost mt-2 px-4 py-2 text-sm font-bold">
                {operacao === 'verificando' ? 'Verificando…' : 'Verificar entrega'}
              </button>
            )}
          </>;
        })()}

        {estado === 'confirmacao' && <ConfirmacaoView submittedAt={entrega?.submittedAt} />}
        {estado === 'feedback' && (
          <FeedbackView entrega={entrega} atividade={atividade} />
        )}
      </div>
    </div>
  );
}
