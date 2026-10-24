export function DevolutivasAluno({ historico = [] }) {
  if (!historico.length) return null;
  return (
    <section className="mt-6 space-y-3" aria-label="Devolutivas das atividades">
      <h2 className="text-sm font-extrabold text-[#101942]">Devolutivas das atividades</h2>
      {historico.map((atividade, index) => (
        <details key={`${atividade.atividadeId}-${index}`} className="bg-white border border-[#dce0f0] rounded-2xl p-4 text-sm text-[#101942]">
          <summary className="cursor-pointer font-bold">{atividade.titulo} · {atividade.bimestre}º bimestre</summary>
          {atividade.feedback && <p className="mt-3 whitespace-pre-wrap">{atividade.feedback}</p>}
          {atividade.resposta && <p className="mt-2 whitespace-pre-wrap">Sua resposta: {atividade.resposta}</p>}
          {(atividade.questoes || []).map(questao => (
            <div key={questao.numero} className="mt-3 border-t border-[#dce0f0] pt-3 space-y-2">
              <p className="font-bold">Questão {questao.numero} · Nota: {questao.nota ?? '—'} / {questao.notaMaxima ?? '—'}</p>
              <p className="whitespace-pre-wrap">Sua resposta: {questao.resposta || 'Não informada'}</p>
              <p className="whitespace-pre-wrap">{questao.feedback || 'Feedback não informado.'}</p>
            </div>
          ))}
        </details>
      ))}
    </section>
  );
}
