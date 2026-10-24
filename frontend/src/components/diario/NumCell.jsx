"use client";

import { useState, useRef, useEffect } from 'react';
import { lerNumeroNota } from '@/dominio/diario/criterios';

export const NumCell = ({ value, min = 0, max = 10, onChange, disabled = false, placeholder = '—', label = 'Nota' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [erro, setErro] = useState('');
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const encerrando = useRef(false);
  const navegar = useRef(null);
  const cancelar = useRef(false);
  const displayVal = value === null || value === undefined || value === '' ? placeholder : Number(value).toFixed(2).replace('.', ',');

  const commit = (direcao) => {
    if (encerrando.current) return;
    try {
      const numero = lerNumeroNota(draft, min, max);
      encerrando.current = true;
      onChange(numero);
      navegar.current = direcao || null;
      setEditing(false);
      setErro('');
    } catch (error) { setErro(error.message); }
  };
  useEffect(() => {
    if (editing) ref.current?.select();
    else if (navegar.current) {
      const celulas = [...(buttonRef.current?.closest('table') || buttonRef.current?.parentElement?.parentElement || document).querySelectorAll('[data-nota-cell]')];
      let proxima = celulas[celulas.indexOf(buttonRef.current) + navegar.current];
      if (!proxima) {
        const focaveis = [...document.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],summary')].filter(el => !el.closest('details:not([open])') || el.tagName === 'SUMMARY');
        proxima = focaveis[focaveis.indexOf(buttonRef.current) + navegar.current];
      }
      navegar.current = null;
      (proxima || buttonRef.current)?.focus();
    } else if (cancelar.current) {
      cancelar.current = false; buttonRef.current?.focus();
    }
  }, [editing]);

  if (disabled) return <span className="font-mono text-sm text-slate-500 px-2">{displayVal}</span>;
  return <div className="relative">
    {editing ? <input ref={ref} type="text" inputMode="decimal" aria-label={label} aria-invalid={!!erro} value={draft}
      onChange={e => { setDraft(e.target.value); setErro(''); }} onBlur={() => commit()}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commit(e.shiftKey ? -1 : 1); }
        if (e.key === 'Escape') { e.preventDefault(); encerrando.current = true; cancelar.current = true; setEditing(false); setErro(''); }
      }} className="w-full border border-violet-500 rounded-lg px-2 py-0.5 font-mono text-sm text-slate-900 text-center" style={{ minWidth: 56 }} /> :
      <button ref={buttonRef} type="button" data-nota-cell aria-label={`${label}: ${displayVal}`} onClick={() => {
        encerrando.current = false;
        setDraft(value !== null && value !== undefined && value !== '' ? String(value).replace('.', ',') : ''); setEditing(true);
      }} title="Clique para editar; Enter/Tab avança, Esc cancela" className={`w-full px-2 py-1 font-mono text-sm rounded-lg border border-dashed tabular-nums ${value === null || value === undefined || value === '' ? 'border-slate-300/40 text-slate-400' : 'border-transparent text-slate-900 font-medium'} hover:bg-slate-100/50 text-center cursor-text`}>{displayVal}</button>}
    {erro && <span role="alert" className="block text-xs text-red-700">{erro}</span>}
  </div>;
};
