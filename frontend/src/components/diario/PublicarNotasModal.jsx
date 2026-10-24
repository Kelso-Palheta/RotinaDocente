'use client';
import { useState } from 'react';
import { conferirFechamento } from '@/dominio/diario/evolucao';
import { calcTotal, fmt, temNota } from '@/utils/diario/calculos';

export function PublicarNotasModal({ turmas, turmaInicialId, bimestre, onPublicar, onClose, resultadoInicial = null }) {
  const [alvo, setAlvo] = useState(turmaInicialId || 'todas');
  const [periodo, setPeriodo] = useState(String(resultadoInicial?.periodo || bimestre));
  const [resultado, setResultado] = useState(resultadoInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const selecionadas = turmas.filter(t => alvo === 'todas' || t.id === alvo);
  const periodos = periodo === 'ano' ? [1, 2, 3, 4] : [Number(periodo)];
  const alunos = selecionadas.flatMap(t => t.alunos.map(aluno => ({ turma: t, aluno })));
  const aptos = alunos.filter(({ aluno }) => Boolean(aluno.dataNascimento)).length;
  const falhas = (resultado?.resultados || []).filter(r => r.status === 'error');
  const publicar = async (repetir = false) => {
    setSalvando(true); setErro('');
    try {
      const alvos = repetir ? falhas.map(({ turmaId, alunoId }) => ({ turmaId, alunoId })) : null;
      const data = await onPublicar({ turmas: selecionadas, periodo, alvos, resultadoAnterior: resultado });
      const anteriores = resultado?.resultados || [];
      const novos = data.resultados || [];
      const completos = repetir ? [...anteriores.filter(a => !novos.some(n => n.turmaId === a.turmaId && n.alunoId === a.alunoId)), ...novos] : novos;
      setResultado({ ...data, periodo, resultados: completos });
    } catch (error) { setErro(error.message); }
    finally { setSalvando(false); }
  };
  return <div className="fixed inset-0 z-[110] bg-slate-950/50 p-4 flex items-center justify-center"><section role="dialog" aria-modal="true" aria-labelledby="titulo-publicar" className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-auto p-6 text-[#101942]">
    <h2 id="titulo-publicar" className="text-xl font-bold">Conferir e publicar no Portal</h2>
    <p className="text-sm text-slate-600 my-2">Salvar guarda no Diário. Sincronizar traz notas das atividades. Publicar atualiza as notas que o aluno vê no Portal.</p>
    <fieldset disabled={salvando || Boolean(resultado)} className="flex flex-wrap gap-4 my-4">
      <label className="text-sm">Turma<select aria-label="Turma para publicar" value={alvo} onChange={e => setAlvo(e.target.value)} className="block border p-2 rounded"><option value="todas">Todas as turmas deste ano</option>{turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></label>
      <label className="text-sm">Período<select aria-label="Período para publicar" value={periodo} onChange={e => setPeriodo(e.target.value)} className="block border p-2 rounded">{[1, 2, 3, 4].map(b => <option key={b} value={b}>{b}º bimestre</option>)}<option value="ano">Ano completo — quatro bimestres</option></select></label>
    </fieldset>
    <p className="font-bold text-sm">{aptos} apto(s) ao acesso · {alunos.length - aptos} sem data de nascimento</p>
    <p className="text-xs text-slate-600 my-2">{periodo === 'ano' ? 'Envia os quatro bimestres das turmas selecionadas.' : `Envia somente o ${periodo}º bimestre e a recuperação do semestre correspondente. Outros bimestres publicados serão preservados.`}</p>
    {selecionadas.map(t => <div key={t.id} className="border rounded-xl p-3 mb-3"><h3 className="font-bold">Turma {t.nome}</h3>{periodos.map(b => { const c = conferirFechamento(t, b); return <p key={b} className="text-xs mt-1">{b}º bimestre: {c.semSimulado} sem simulado; {c.semAtividades} com atividades incompletas; {c.faltasEscala} notas fora da escala.{c.acimaTeto ? ' Atividades excedem o teto: o total será limitado.' : ''}{c.criteriosDivergentes ? ' Critérios variam entre bimestres; confira.' : ''}</p>; })}</div>)}
    <details className="my-3 text-xs"><summary className="cursor-pointer font-bold">Prévia das notas que serão enviadas</summary><div className="overflow-auto max-h-52"><table className="w-full text-left"><thead><tr><th>Turma / aluno</th>{periodos.map(b => <th key={b}>{b}º bim.</th>)}<th>Acesso</th></tr></thead><tbody>{alunos.map(({ turma: t, aluno }) => <tr key={`${t.id}-${aluno.id}`}><td>{t.nome} · {aluno.nome}</td>{periodos.map(b => { const dados = t.bimestres[b] || {}; const nota = dados.notas?.[aluno.id]; return <td key={b}>{temNota(nota, dados.atividades || []) ? fmt(calcTotal(nota.simulado, dados.atividades || [], nota, dados.config)) : 'Sem notas'}</td>; })}<td>{aluno.dataNascimento ? 'Login disponível' : 'Falta nascimento'}</td></tr>)}</tbody></table></div></details>
    {resultado && <section aria-label="Resultado da publicação" className="border rounded-xl p-3 my-4"><h3 className="font-bold">Resultado mantido para conferência</h3><p className="text-sm">{resultado.resultados.filter(r => r.status === 'ok').length} publicados · {resultado.resultados.filter(r => r.status === 'semData').length} sem nascimento · {falhas.length} falhas</p><ul className="max-h-44 overflow-auto text-xs mt-2">{resultado.resultados.map(r => <li key={`${r.turmaId}-${r.alunoId}`} className="py-1">{r.nome}: {r.status === 'ok' ? 'Publicado' : r.status === 'semData' ? 'Não publicado: falta nascimento' : <span className="text-red-700">{r.error}</span>}</li>)}</ul>{resultado.aviso && <p role="alert" className="text-amber-800">{resultado.aviso}</p>}</section>}
    {erro && <p role="alert" className="text-red-700 my-3">{erro}</p>}
    <div className="flex justify-end gap-2 mt-4 flex-wrap"><button type="button" disabled={salvando} onClick={onClose} className="border rounded-xl px-4 py-2">Fechar</button>{resultado ? <>{falhas.length > 0 && <button type="button" disabled={salvando} onClick={() => publicar(true)} className="btn-brand-primary px-4 py-2">Tentar somente as falhas</button>}<button type="button" disabled={salvando} onClick={() => setResultado(null)} className="border rounded-xl px-4 py-2">Nova publicação</button></> : <button type="button" disabled={salvando || !alunos.length} onClick={() => publicar()} className="btn-brand-primary px-4 py-2 disabled:opacity-40">{salvando ? 'Publicando…' : 'Confirmar publicação'}</button>}</div>
  </section></div>;
}
