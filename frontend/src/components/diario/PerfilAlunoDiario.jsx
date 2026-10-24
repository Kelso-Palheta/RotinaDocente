'use client';
import {useState} from 'react';
import {montarLinhaTempoAluno,ocorrenciasDoAluno} from '@/dominio/diario/acompanhamento';
/** Prévia local: trocar a visualização nunca muda a autorização do relatório. */
export function PerfilAlunoDiario({aluno,turma,historicoAtividades=[],onFechar,onExportar,carregando=false}){
 const [privacidade,setPrivacidade]=useState('familia');
 const [tipo,setTipo]=useState('');
 const eventos=montarLinhaTempoAluno({aluno,turma,historicoAtividades,familia:privacidade==='familia'}).filter(e=>!tipo||e.tipo===tipo);
 const autorizadas=ocorrenciasDoAluno(turma?.ocorrencias||[],aluno.id||aluno.uid,{familia:true});
 return <section className="space-y-3 text-left" aria-label="Perfil e linha do tempo do aluno">
   <h3 className="font-bold text-[#101942]">Acompanhamento de {aluno.nome}</h3>
   <p className="text-xs text-slate-600">Prévia local. Exportar não envia mensagens nem publica no Portal. A Ficha familiar inclui somente ocorrências autorizadas deste aluno ou da turma toda ({autorizadas.length}).</p>
   <div className="flex gap-2 flex-wrap">
    <label className="text-xs">Visualização<select aria-label="Privacidade da linha do tempo" value={privacidade} onChange={e=>setPrivacidade(e.target.value)} className="block border rounded p-2"><option value="familia">Prévia familiar</option><option value="todos">Professor: incluir anotações internas</option></select></label>
    <label className="text-xs">Registros<select aria-label="Tipo da linha do tempo" value={tipo} onChange={e=>setTipo(e.target.value)} className="block border rounded p-2"><option value="">Todos</option><option value="nota">Notas</option><option value="feedback">Feedback</option><option value="frequencia">Frequência</option><option value="ocorrencia">Ocorrências</option></select></label>
   </div>
   {carregando&&<p role="status" className="text-xs">Carregando feedback das atividades...</p>}
   <ol className="space-y-2 max-h-72 overflow-auto">
    {eventos.map(e=><li key={e.id} className="border rounded-xl p-3 text-xs bg-slate-50"><p className="text-slate-500">{e.data?e.data.slice(0,10).split('-').reverse().join('/'):'Data não registrada'} • {e.tipo}{!e.familia?' • Interno, excluído da Ficha familiar':''}</p><h4 className="font-bold">{e.titulo}</h4><p className="whitespace-pre-wrap">{e.descricao}</p>{e.questoes?.map((q,i)=><div key={q.numero||i} className="mt-2 border-t pt-2"><strong>Questão {q.numero||i+1}</strong><p>{q.feedback||'Sem feedback por questão.'}</p></div>)}</li>)}
   </ol>
   {!eventos.length&&<p className="text-xs text-slate-500">Nenhum registro nesta visualização.</p>}
   <div className="flex gap-2 justify-end">{onFechar&&<button type="button" onClick={onFechar} className="px-3 py-2 text-xs border rounded">Fechar prévia</button>}{onExportar&&<button type="button" disabled={carregando} onClick={onExportar} className="btn-brand-primary px-3 py-2 text-xs">Exportar Ficha 360º</button>}</div>
 </section>;
}
