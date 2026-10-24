"use client";
import { useState } from 'react';
import { prepararCorrecaoManual } from '@/dominio/atividades/correcaoManual';

export function CorrecaoManualForm({ atividade, entrega, onSave, onCancel }) {
  const questoes = atividade.questoes || [];
  const [nota, setNota] = useState(String(entrega.notaRevisada ?? entrega.notaFinal ?? ''));
  const [feedback, setFeedback] = useState(entrega.feedbackGeral ?? (questoes.length ? '' : entrega.feedback || ''));
  const [resultados, setResultados] = useState(() => Object.fromEntries(questoes.map(q => [q.id, {
    nota: String(entrega.resultados?.[q.id]?.notaObtida ?? ''), feedback: entrega.resultados?.[q.id]?.feedback || '',
  }])));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const atualizar = (id, campo, value) => setResultados(prev => ({ ...prev, [id]: { ...prev[id], [campo]: value } }));
  const salvar = async event => {
    event.preventDefault();
    if (salvando) return;
    setErro('');
    const dados = { nota, feedback, resultados };
    try {
      prepararCorrecaoManual(atividade, entrega, dados);
      setSalvando(true);
      await onSave(dados);
    } catch (error) {
      setErro(error.message || 'Falha ao salvar a correção.');
    } finally {
      setSalvando(false);
    }
  };
  return (
    <form onSubmit={salvar} className="space-y-4 rounded-xl border border-[#dce0f0] p-4 bg-[#f7f8fc]">
      <h4 className="font-semibold text-[#101942]">Correção manual</h4>
      {questoes.map((q, index) => (
        <fieldset key={q.id} disabled={salvando} className="space-y-2 border border-[#dce0f0] rounded-lg bg-white p-3">
          <legend className="text-sm font-bold text-[#101942]">Questão {index + 1}</legend>
          <p className="text-sm whitespace-pre-wrap text-[#101942]">{q.enunciado}</p>
          <p className="text-xs text-[#6070a0] whitespace-pre-wrap">Resposta: {entrega.respostas?.[q.id]?.resposta || '(sem resposta)'}</p>
          {q.alternativas?.length > 0 && <ul className="text-xs text-[#6070a0] space-y-1">{q.alternativas.map(alternativa => <li key={alternativa.id}>{alternativa.id}: {alternativa.texto}</li>)}</ul>}
          {q.rubrica && <p className="text-xs text-[#6070a0] whitespace-pre-wrap">Rubrica: {q.rubrica}</p>}
          <label className="block text-xs font-semibold text-[#101942]">Nota da questão {index + 1}
            <input inputMode="decimal" value={resultados[q.id].nota} onChange={e => atualizar(q.id, 'nota', e.target.value)} className="block w-full mt-1 border border-[#dce0f0] rounded p-2" />
          </label>
          <p className="text-xs text-[#6070a0]">Máximo: {q.notaMaxima} ponto(s)</p>
          <label className="block text-xs font-semibold text-[#101942]">Feedback da questão {index + 1}
            <textarea value={resultados[q.id].feedback} onChange={e => atualizar(q.id, 'feedback', e.target.value)} rows={3} className="block w-full mt-1 border border-[#dce0f0] rounded p-2" />
          </label>
        </fieldset>
      ))}
      {!questoes.length && <label className="block text-xs font-semibold text-[#101942]">Nota da atividade
        <input disabled={salvando} inputMode="decimal" value={nota} onChange={e => setNota(e.target.value)} className="block w-full mt-1 border border-[#dce0f0] rounded p-2" />
      </label>}
      <label className="block text-xs font-semibold text-[#101942]">Feedback geral da atividade
        <textarea disabled={salvando} value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="block w-full mt-1 border border-[#dce0f0] rounded p-2" />
      </label>
      <p className="text-xs text-[#6070a0]">{questoes.length ? 'Preencha nota e feedback de cada questão. O total será calculado automaticamente.' : `Máximo: ${atividade.notaMaxima ?? 10} ponto(s). Informe a nota e o feedback.`}</p>
      {erro && <p role="alert" className="text-sm text-red-700">{erro}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={salvando} className="btn-brand-primary px-3 py-2 text-sm">{salvando ? 'Salvando…' : 'Salvar correção manual'}</button>
        <button type="button" disabled={salvando} onClick={onCancel} className="btn-brand-ghost px-3 py-2 text-sm">Voltar</button>
      </div>
    </form>
  );
}
