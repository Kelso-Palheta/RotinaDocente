"use client";

export const FeedbackView = ({ entrega, atividade }) => {
  const notaMaxima = atividade?.notaMaxima || 10;
  const nota = entrega.notaRevisada ?? entrega.notaFinal;
  const statusLabel = entrega.tipoCorrecao === 'manual' || entrega.status === 'revisado' ? 'Corrigido manualmente pelo professor' : 'Corrigido por IA';
  const questoes = atividade?.questoes;
  const resultados = entrega.resultados;

  return (
    <div className="animate-card-in space-y-4">
      {/* Nota geral */}
      <div className="text-center py-4">
        <div className="inline-flex items-baseline gap-1">
          <span className="text-4xl font-bold text-violet-500 tabular-nums">
            {nota != null ? nota.toFixed(2).replace('.', ',') : '—'}
          </span>
          <span className="text-sm text-slate-400">/ {notaMaxima.toFixed(1).replace('.', ',')}</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">{statusLabel}</p>
      </div>

      {entrega.feedbackGeral && <section className="bg-slate-50 border border-slate-200 rounded-xl p-4"><h3 className="text-sm font-semibold text-slate-900">Feedback geral da atividade</h3><p className="text-sm text-slate-600 whitespace-pre-wrap mt-2">{entrega.feedbackGeral}</p></section>}
      {/* Multi-questão: resultados por questão */}
      {questoes?.length > 0 && resultados ? (
        questoes.map((q, i) => {
          const res = resultados[q.id];
          const resposta = entrega.respostas?.[q.id]?.resposta;
          if (!res) return null;
          return (
            <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${q.tipo === 'objetiva' ? 'bg-blue-500' : 'bg-violet-500'}`}>{i + 1}</span>
                <span className="text-xs font-semibold text-slate-900 flex-1 truncate">{q.enunciado?.slice(0, 60)}{q.enunciado?.length > 60 ? '…' : ''}</span>
                <span className={`text-xs font-mono font-bold tabular-nums ${res.notaObtida >= res.notaMaxima ? 'text-green-600' : res.notaObtida > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                  {res.notaObtida.toFixed(1).replace('.', ',')} / {res.notaMaxima.toFixed(1).replace('.', ',')}
                </span>
              </div>

              {q.tipo === 'objetiva' && (
                <p className={`text-xs mt-1 ${res.correto ? 'text-green-600' : 'text-red-500'}`}>
                  {res.correto ? '✓ Correta' : '✗ Incorreta'}
                  {resposta && <span className="text-slate-400 ml-1">(marcou: {resposta})</span>}
                </p>
              )}

              {res.feedback && (
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{res.feedback}</p>
              )}

              {q.tipo === 'discursiva' && resposta && (
                <div className="mt-2 bg-white rounded-lg p-2 border border-slate-200">
                  <p className="text-[10px] text-slate-400 mb-1 uppercase font-semibold">Sua resposta</p>
                  <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">{resposta}</p>
                </div>
              )}
            </div>
          );
        })
      ) : (
        /* Legado: feedback único */
        <>
          {entrega.feedback && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Feedback</p>
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{entrega.feedback}</p>
            </div>
          )}
          {entrega.criterios?.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-3">Critérios</p>
              <div className="space-y-2">
                {entrega.criterios.map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{c.nome}</span>
                    <span className="text-xs font-mono text-slate-900 tabular-nums">{c.pontos_obtidos}/{c.pontos_maximos}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {entrega.respostaTexto && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">Sua resposta</p>
              <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-wrap">{entrega.respostaTexto}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
