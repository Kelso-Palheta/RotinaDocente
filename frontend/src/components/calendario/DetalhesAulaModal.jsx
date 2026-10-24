'use client';

import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle, Trash2, X, BookOpen, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { conteudos } from '@/dominio/calendario/evolucao';

export function DetalhesAulaModal(props) {
  if (!props.isOpen || !props.aula) return null;
  return <RegistroAula key={props.aula.id} {...props} />;
}

function RegistroAula({ onClose, aula, topicosDisponiveis = [], onUpdateStatus, onRemoveTopico, onAddTopico, onExcluirAula, onExcluirDiaSemana }) {
  const [status, setStatus] = useState(aula.status || 'AGENDADA');
  const [justificativa, setJustificativa] = useState(aula.execucao?.justificativa || '');
  const [restante, setRestante] = useState(aula.execucao?.restante || '');
  const [decisao, setDecisao] = useState('smart_shift');
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');
  const [selecionado, setSelecionado] = useState('');
  const topicos = conteudos(aula);
  const dataFormatada = aula.dataAgendada ? format(parseISO(aula.dataAgendada), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '';
  const diaSemana = aula.dataAgendada ? parseISO(aula.dataAgendada).getDay() : null;
  const nomeDiaSemana = ['domingos', 'segundas-feiras', 'terças-feiras', 'quartas-feiras', 'quintas-feiras', 'sextas-feiras', 'sábados'][diaSemana];
  const exigeJustificativa = ['PARCIAL', 'NAO_REALIZADA'].includes(status);

  async function executar(acao) {
    if (ocupado) return;
    setOcupado(true); setErro('');
    try { await acao(); onClose(); }
    catch (error) { setErro(error.message || 'Não foi possível salvar. Tente novamente.'); }
    finally { setOcupado(false); }
  }

  async function salvarRegistro() {
    if (exigeJustificativa && !justificativa.trim()) { setErro('Informe a justificativa da aula.'); return; }
    if (status === 'PARCIAL' && !restante.trim()) { setErro('Informe o conteúdo restante da aula parcial.'); return; }
    await executar(() => onUpdateStatus(aula.id, status, aula, { decisao, execucao: { justificativa: justificativa.trim(), restante: status === 'PARCIAL' ? restante.trim() : '' } }));
  }

  const opcoes = [
    ['CONCLUIDA', 'Concluída', 'Aula lecionada', CheckCircle2, 'text-emerald-600'],
    ['AGENDADA', 'Agendada', 'No cronograma', Calendar, 'text-blue-600'],
    ['PARCIAL', 'Parcial', 'Conteúdo incompleto', AlertCircle, 'text-amber-600'],
    ['NAO_REALIZADA', 'Não realizada', 'Aula não lecionada', XCircle, 'text-rose-600'],
  ];

  return <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60">
    <div role="dialog" aria-modal="true" aria-labelledby="registro-aula-titulo" className="bg-white rounded-3xl max-w-xl w-full max-h-[94vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col text-[#101942]">
      <header className="bg-[#101942] text-white p-5 flex justify-between items-start gap-3">
        <div><h2 id="registro-aula-titulo" className="font-bold">Registrar realização da aula</h2><p className="text-sm capitalize mt-1">{dataFormatada}</p><p className="text-xs text-slate-300 flex gap-2 items-center mt-1"><Clock size={13} />{aula.horarioInicio} às {aula.horarioFim} · {aula.duracaoAlocadaAulas || 1} tempo(s)</p></div>
        <button aria-label="Fechar registro da aula" onClick={onClose} disabled={ocupado} className="p-2 rounded-full bg-white/10"><X size={18} /></button>
      </header>
      <div className="p-5 space-y-5 overflow-y-auto">
        {erro && <div role="alert" className="p-3 text-sm bg-red-50 border border-red-200 text-red-700 rounded-xl">{erro}</div>}
        {aula.conteudoEncaminhado && <p className="p-3 text-sm bg-amber-50 border border-amber-200 rounded-xl">Este registro preserva o histórico. O conteúdo restante já foi encaminhado para outra aula ou para os pendentes.</p>}
        <fieldset disabled={ocupado} className="space-y-2"><legend className="text-sm font-semibold mb-2">Status da aula</legend>
          <div className="grid grid-cols-2 gap-2">{opcoes.map(([valor, titulo, ajuda, Icon, cor]) => <button key={valor} type="button" aria-pressed={status === valor} onClick={() => { setStatus(valor); setErro(''); }} className={`p-3 rounded-xl border flex items-center gap-2 text-left ${status === valor ? 'border-[#101942] bg-slate-100 ring-1 ring-[#101942]' : 'border-slate-200'}`}><Icon size={18} className={cor} /><span><span className="block text-sm font-bold">{titulo}</span><span className="block text-xs text-slate-500">{ajuda}</span></span></button>)}</div>
        </fieldset>
        <fieldset disabled={ocupado} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="aula-justificativa">{exigeJustificativa ? 'Justificativa' : 'Observação (opcional)'}</label>
          <textarea id="aula-justificativa" value={justificativa} onChange={e => setJustificativa(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm" rows={2} />
          {status === 'PARCIAL' && <><label className="block text-sm font-medium" htmlFor="aula-restante">Conteúdo restante</label><textarea id="aula-restante" value={restante} onChange={e => setRestante(e.target.value)} className="w-full border border-slate-300 rounded-xl p-3 text-sm" rows={2} /></>}
          {exigeJustificativa && topicos.length > 0 && <fieldset className="space-y-2 text-sm"><legend className="font-semibold mb-2">Destino do conteúdo {status === 'PARCIAL' ? 'restante' : 'não realizado'}</legend>
            <label className="block"><input type="radio" name="destino-conteudo" checked={decisao === 'smart_shift'} onChange={() => setDecisao('smart_shift')} /> Reagendar nas próximas aulas</label>
            <p className="text-xs text-slate-500">Desloca os conteúdos seguintes. Se faltar espaço, os conteúdos sem vaga ficam pendentes.</p>
            <label className="block"><input type="radio" name="destino-conteudo" checked={decisao === 'pular'} onChange={() => setDecisao('pular')} /> Devolver aos pendentes e manter próximas datas</label>
          </fieldset>}
        </fieldset>
        <section className="space-y-3"><h3 className="text-sm font-semibold">Conteúdos da aula ({topicos.length})</h3>
          {topicos.length ? topicos.map((topico, index) => {
            const titulo = topico.topicoTitulo || topico.titulo || `Conteúdo ${topico.topicoOrdem || topico.ordem || index + 1}`;
            const id = topico.topicoId || topico.id || topico.ordem || index;
            return <div key={`${id}:${index}`} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{titulo}</p>{topico.descricao && <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap">{topico.descricao}</p>}</div>
              {onRemoveTopico && !aula.conteudoEncaminhado && <button aria-label={`Desassociar ${titulo}`} disabled={ocupado} onClick={() => executar(() => onRemoveTopico(aula.id, id))} className="text-red-700 text-xs underline shrink-0">Desassociar</button>}
            </div>;
          }) : <p className="text-sm text-slate-500 flex gap-2"><BookOpen size={18} />Nenhum conteúdo vinculado a esta aula.</p>}
          {onAddTopico && topicosDisponiveis.length > 0 && !aula.conteudoEncaminhado && <label className="block text-sm font-medium">Vincular conteúdo disponível<select aria-label="Vincular conteúdo disponível" value={selecionado} disabled={ocupado} onChange={e => { const valor = e.target.value; setSelecionado(valor); const topico = topicosDisponiveis.find(item => String(item.id) === valor); if (topico) executar(() => onAddTopico(aula.id, topico)); }} className="w-full mt-2 p-3 bg-white border border-slate-300 rounded-xl text-sm"><option value="">Selecione um conteúdo…</option>{topicosDisponiveis.map(topico => <option key={topico.id} value={topico.id}>Conteúdo {topico.ordem}: {topico.titulo}</option>)}</select></label>}
        </section>
        {(onExcluirAula || onExcluirDiaSemana) && <details className="border-t pt-3"><summary className="cursor-pointer text-sm font-semibold">Opções avançadas</summary><div className="flex flex-col items-start gap-3 mt-3">
          {onExcluirAula && <button disabled={ocupado} className="text-sm text-red-700 flex gap-2 items-center" onClick={() => { if (window.confirm(`Excluir esta aula de ${aula.dataAgendada}, ${aula.horarioInicio}? Aulas realizadas serão preservadas.`)) executar(() => onExcluirAula(aula.id)); }}><Trash2 size={15} />Excluir esta aula</button>}
          {onExcluirDiaSemana && diaSemana !== null && <button disabled={ocupado} className="text-sm text-red-700" onClick={() => { if (window.confirm(`Excluir as aulas futuras não realizadas das ${nomeDiaSemana} desta turma neste ano? Aulas realizadas serão preservadas.`)) executar(() => onExcluirDiaSemana(diaSemana, nomeDiaSemana)); }}>Excluir aulas futuras das {nomeDiaSemana}</button>}
        </div></details>}
      </div>
      <footer className="p-4 bg-slate-50 border-t flex justify-end flex-wrap gap-3"><button disabled={ocupado} onClick={onClose} className="btn-brand-ghost">Cancelar</button><button disabled={ocupado || !onUpdateStatus} onClick={salvarRegistro} className="btn-brand-primary flex gap-2 items-center">{ocupado && <Loader2 size={15} className="animate-spin" />}Salvar registro da aula</button></footer>
    </div>
  </div>;
}
