'use client';
import { useState } from 'react';
import { anoLetivoTurma } from '@/dominio/diario/evolucao';
export function ContextoAnoDiario({ turmas, turmaAtual, ano, onAno, arquivadas, onArquivadas, onArquivar, onCopiar, onAtribuirAno }) {
  const [copiando, setCopiando] = useState(false);
  const [anoDestino, setAnoDestino] = useState(new Date().getFullYear() + 1);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState('');
  const anos = [...new Set([new Date().getFullYear(), new Date().getFullYear() + 1, ...turmas.map(anoLetivoTurma).filter(Boolean)])].sort((a, b) => a - b);
  const copiar = async () => { setErro(''); try { if (!nome.trim() || !Number.isInteger(Number(anoDestino)) || Number(anoDestino) < 1900 || Number(anoDestino) > 2200) throw new Error('Informe nome e ano válido.'); await onCopiar({ anoLetivo: Number(anoDestino), nome: nome.trim() }); setCopiando(false); } catch (error) { setErro(error.message); } };
  return <section aria-label="Ano letivo e arquivo" className="px-4 py-2 border-b text-xs flex flex-wrap items-center gap-3 bg-slate-50">
    <label>Ano letivo <select aria-label="Ano letivo" value={ano} onChange={e => onAno(e.target.value)} className="border rounded-lg p-1.5 bg-white"><option value="legado">Legado — ano não informado</option>{anos.map(a => <option key={a} value={a}>{a}</option>)}</select></label>
    <label><input type="checkbox" checked={arquivadas} onChange={e => onArquivadas(e.target.checked)} /> Ver arquivadas</label>
    {turmaAtual && <details className="relative"><summary className="cursor-pointer font-bold">Organizar turma</summary><div className="absolute z-40 top-full mt-2 bg-white border rounded-xl p-3 shadow-lg w-72 space-y-3"><p>{turmaAtual.nome} · {anoLetivoTurma(turmaAtual) || 'Ano não informado'}</p><button type="button" onClick={onArquivar} className="block underline">{turmaAtual.arquivada ? 'Reativar turma' : 'Arquivar turma'}</button>{!anoLetivoTurma(turmaAtual) && <button type="button" onClick={onAtribuirAno} className="block underline">Definir ano desta turma legada</button>}<button type="button" onClick={() => { setNome(turmaAtual.nome); setCopiando(true); }} className="block underline">Copiar alunos para outro ano</button></div></details>}
    {copiando && <div className="fixed inset-0 z-[120] bg-slate-950/50 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="Copiar alunos" className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4"><h2 className="font-bold text-lg">Copiar / promover alunos</h2><p>Cria outra turma com novos IDs e notas vazias. A turma original será preservada.</p><label className="block">Ano de destino<input aria-label="Ano de destino" type="number" value={anoDestino} onChange={e => setAnoDestino(e.target.value)} className="block border rounded p-2 w-full" /></label><label className="block">Nome da nova turma<input aria-label="Nome da nova turma" value={nome} onChange={e => setNome(e.target.value)} className="block border rounded p-2 w-full" /></label>{erro && <p role="alert" className="text-red-700">{erro}</p>}<div className="flex gap-2 justify-end"><button type="button" onClick={() => setCopiando(false)} className="border rounded p-2">Cancelar</button><button type="button" onClick={copiar} className="btn-brand-primary p-2">Confirmar cópia sem notas</button></div></section></div>}
  </section>;
}
