"use client";
import { useState } from 'react';
import { CorrecaoManualForm } from './CorrecaoManualForm';
import { fmt } from '@/utils/diario/calculos';

export const EntregaDrawer = ({ entrega, atividade, alunoNome, onManual, onCorrigir, onClose, modoInicial = 'visualizar', corrigindo = false }) => {
  const [manual, setManual] = useState(modoInicial === 'manual');
  const [erro, setErro] = useState('');
  const notaAtual = entrega.notaRevisada ?? entrega.notaFinal;
  const questoes = atividade?.questoes || [];
  const corrigirIA = async () => {
    setErro('');
    try { await onCorrigir(); } catch (error) { setErro(error.message || 'Falha na correção.'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <section role="dialog" aria-modal="true" aria-label={`Correção de ${alunoNome}`} className="relative w-full max-w-xl bg-white border-l border-[#dce0f0] h-full overflow-y-auto">
        <header className="p-5 border-b border-[#dce0f0] flex items-center justify-between sticky top-0 bg-white z-10">
          <div><h3 className="font-semibold text-[#101942]">{alunoNome}</h3>{entrega.submittedAt?.toDate && <p className="text-xs text-[#6070a0]">{entrega.submittedAt.toDate().toLocaleString('pt-BR')}</p>}</div>
          <button type="button" aria-label="Fechar correção" onClick={onClose} className="text-xl text-[#6070a0]">×</button>
        </header>
        <div className="p-5 space-y-5">
          <div className="bg-[#f7f8fc] rounded-xl p-4 border border-[#dce0f0]">
            <p className="text-xs font-semibold text-[#101942]">Nota da atividade</p>
            <p className="text-2xl font-bold font-mono text-[#101942]">{fmt(notaAtual)} <span className="text-sm">/ {fmt(atividade?.notaMaxima ?? 10)}</span></p>
            {entrega.notaIA != null && <p className="text-xs text-[#6070a0]">Nota IA anterior: {fmt(entrega.notaIA)}</p>}
            {entrega.tipoCorrecao === 'manual' || entrega.status === 'revisado' ? <p className="text-xs text-[#6070a0]">Correção manual do professor</p> : entrega.modeloIA && <p className="text-xs text-[#6070a0]">Modelo: {entrega.modeloIA}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button type="button" disabled={corrigindo || manual} onClick={corrigirIA} className="btn-brand-primary px-3 py-2.5 text-sm">{corrigindo ? 'Corrigindo…' : 'Corrigir com IA'}</button>
            <button type="button" disabled={corrigindo} onClick={() => setManual(true)} className="btn-brand-navy px-3 py-2.5 text-sm">Corrigir manualmente</button>
          </div>
          {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
          {manual && <CorrecaoManualForm atividade={atividade} entrega={entrega} onCancel={() => setManual(false)} onSave={async dados => {
            await onManual(dados);
            setManual(false);
          }} />}
          {questoes.length ? <div className="space-y-3">{questoes.map((q, i) => {
            const res = entrega.resultados?.[q.id];
            return <article key={q.id} className="rounded-xl border border-[#dce0f0] p-4 space-y-2">
              <h4 className="text-sm font-bold text-[#101942]">Questão {i + 1}</h4>
              <p className="text-sm text-[#101942] whitespace-pre-wrap">{q.enunciado}</p>
              <p className="text-xs text-[#6070a0] whitespace-pre-wrap">Resposta: {entrega.respostas?.[q.id]?.resposta || '(sem resposta)'}</p>
              {q.alternativas?.find(a => a.id === entrega.respostas?.[q.id]?.resposta)?.texto && <p className="text-xs text-[#6070a0]">Alternativa marcada: {q.alternativas.find(a => a.id === entrega.respostas?.[q.id]?.resposta).texto}</p>}
              {res ? <><p className="font-mono text-sm text-[#101942]">{fmt(res.notaObtida)} / {fmt(res.notaMaxima)}</p><p className="text-sm text-[#6070a0] whitespace-pre-wrap">{res.feedback}</p></> : <p className="text-xs text-[#6070a0]">Ainda não corrigida</p>}
            </article>;
          })}</div> : <div className="rounded-xl border border-[#dce0f0] p-4"><h4 className="font-semibold text-[#101942]">Resposta</h4><p className="text-sm text-[#6070a0] whitespace-pre-wrap">{entrega.respostaTexto || '(sem resposta textual)'}</p></div>}
          {!questoes.length && entrega.criterios?.length > 0 && <div className="rounded-xl border border-[#dce0f0] p-4"><h4 className="font-semibold text-[#101942]">Critérios</h4>{entrega.criterios.map((criterio, index) => <p key={index} className="text-sm text-[#6070a0]">{criterio.nome}: {criterio.pontos_obtidos} / {criterio.pontos_maximos}</p>)}</div>}
          {entrega.feedback && <div className="rounded-xl border border-[#dce0f0] p-4"><h4 className="font-semibold text-[#101942]">Feedback da atividade</h4><p className="text-sm text-[#6070a0] whitespace-pre-wrap">{entrega.feedback}</p></div>}
        </div>
      </section>
    </div>
  );
};
