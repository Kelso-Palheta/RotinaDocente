'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, Loader2, Upload } from 'lucide-react';
import { useCalendarioPedagogico } from '@/hooks/calendario/useCalendarioPedagogico';
import { getClientAIHeaders } from '@/utils/aiHeaders';
import { extractTextFromDocument } from '@/utils/atividades/documentExtractor';
import { validarConteudosImportados } from '@/dominio/calendario/importacao';

export function ImportPlanejamentoModal(props) {
  if (!props.isOpen || !props.turmaSelecionada) return null;
  return <ImportPlanejamentoEditor key={`${props.turmaSelecionada.id}:${props.anoLetivo || new Date().getFullYear()}`} {...props} />;
}

function ImportPlanejamentoEditor({ onClose, turmaSelecionada, onImportSuccess, onSalvar, anoLetivo = new Date().getFullYear() }) {
  const [texto, setTexto] = useState('');
  const [topicos, setTopicos] = useState(null);
  const [modo, setModo] = useState('mesclar');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const [nomeArquivo, setNomeArquivo] = useState('');
  const inputRef = useRef(null);
  const ativo = useRef(true);
  const { salvarPlanejamento } = useCalendarioPedagogico(anoLetivo);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);

  async function lerArquivo(event) {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo) return;
    setLoading('Lendo arquivo…'); setError('');
    try {
      const resultado = await extractTextFromDocument(arquivo, { allowImages: true });
      if (!ativo.current) return;
      if (!resultado.texto?.trim()) throw new Error('Não foi encontrado texto no arquivo. Tente outra imagem ou cole o texto.');
      setTexto(resultado.texto); setNomeArquivo(arquivo.name); setTopicos(null);
    } catch (err) { if (ativo.current) setError(err.message); }
    finally { if (ativo.current) setLoading(''); }
  }

  async function extrair() {
    if (!texto.trim()) { setError('Envie um arquivo ou cole o texto do planejamento.'); return; }
    setLoading('Organizando conteúdos com IA…'); setError('');
    try {
      const response = await fetch('/api/calendario/importar', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...getClientAIHeaders() },
        body: JSON.stringify({ text: texto, disciplina: turmaSelecionada.disciplina || 'Geral', anoLetivo }),
      });
      const data = await response.json();
      if (!ativo.current) return;
      if (!response.ok) throw new Error(data.message || data.error || 'Não foi possível extrair os conteúdos.');
      setTopicos(validarConteudosImportados(data.topicos).map(item => ({ ...item, id: crypto.randomUUID() })));
    } catch (err) { if (ativo.current) setError(err.message); }
    finally { if (ativo.current) setLoading(''); }
  }

  function editar(index, campo, valor) {
    setTopicos(items => items.map((item, i) => i === index ? { ...item, [campo]: valor } : item));
  }

  async function salvar() {
    setError('');
    try {
      const revisados = validarConteudosImportados(topicos).map((item, index) => ({ ...item, id: topicos[index].id, associado: false }));
      setLoading('Salvando conteúdos…');
      if (onSalvar) await onSalvar(revisados, { modo });
      else await salvarPlanejamento(turmaSelecionada.id, revisados, { modo });
      if (!ativo.current) return;
      await onImportSuccess?.(revisados);
      if (ativo.current) onClose();
    } catch (err) { if (ativo.current) setError(err.message || 'Não foi possível salvar os conteúdos.'); }
    finally { if (ativo.current) setLoading(''); }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
    <div role="dialog" aria-modal="true" aria-labelledby="importar-conteudos-titulo" className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <h2 id="importar-conteudos-titulo" className="text-lg font-bold text-[#101942] flex items-center gap-2"><FileText className="w-5 h-5 text-[#f60c49]" />Importar conteúdos</h2>
        <button aria-label="Fechar importação" onClick={onClose} disabled={!!loading}><X className="w-5 h-5" /></button>
      </header>
      <div className="p-6 overflow-y-auto space-y-4 text-[#101942]">
        <p className="text-sm">{turmaSelecionada.nome} · Ano letivo {anoLetivo}. Envie um arquivo ou cole texto; revise antes de salvar.</p>
        {error && <div role="alert" className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
        {!topicos ? <>
          <input ref={inputRef} aria-label="Arquivo do planejamento" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.txt,.md" className="hidden" disabled={!!loading} onChange={lerArquivo} />
          <button className="btn-brand-navy flex items-center gap-2" disabled={!!loading} onClick={() => inputRef.current?.click()}><Upload className="w-4 h-4" />Enviar PDF, imagem ou documento</button>
          {nomeArquivo && <p className="text-sm break-all">Arquivo: {nomeArquivo}</p>}
          <p className="text-xs text-slate-600">PDF/DOCX/TXT/MD até 15 MB; imagens JPG/PNG/WebP até 7 MB. PDF escaneado: até 10 páginas. Imagens e organização dos conteúdos usam sua chave de IA conectada.</p>
          <label className="block text-sm font-medium" htmlFor="texto-planejamento">Texto do planejamento</label>
          <textarea id="texto-planejamento" value={texto} onChange={e => setTexto(e.target.value)} disabled={!!loading} className="w-full h-56 p-3 border rounded-lg text-sm" placeholder="Cole o planejamento aqui ou revise o texto extraído do arquivo." />
        </> : <>
          <p className="text-sm">Revise os {topicos.length} conteúdos, a sequência e a quantidade de aulas de cada um.</p>
          {topicos.map((topico, index) => <fieldset key={index} className="border rounded-lg p-3 space-y-2" disabled={!!loading}>
            <legend className="text-sm font-semibold">Conteúdo {index + 1}</legend>
            <label className="block text-sm">Título do conteúdo {index + 1}<input aria-label={`Título do conteúdo ${index + 1}`} value={topico.titulo} onChange={e => editar(index, 'titulo', e.target.value)} className="w-full border rounded p-2" /></label>
            <label className="block text-sm">Descrição do conteúdo {index + 1}<textarea value={topico.descricao} onChange={e => editar(index, 'descricao', e.target.value)} className="w-full border rounded p-2" /></label>
            <label className="block text-sm">Duração do conteúdo {index + 1} (aulas)<input type="number" min="1" max="200" step="1" value={topico.duracaoEstimadaAulas} onChange={e => editar(index, 'duracaoEstimadaAulas', e.target.value)} className="ml-2 w-20 border rounded p-2" /></label>
            <button className="text-sm text-red-700 underline" onClick={() => setTopicos(items => items.filter((_, i) => i !== index))}>Remover conteúdo {index + 1}</button>
          </fieldset>)}
          <fieldset disabled={!!loading} className="space-y-2 text-sm"><legend className="font-semibold mb-2">Como salvar?</legend>
            <label className="block"><input type="radio" name="modo-importacao" checked={modo === 'mesclar'} onChange={() => setModo('mesclar')} /> Adicionar aos conteúdos existentes</label>
            <label className="block"><input type="radio" name="modo-importacao" checked={modo === 'substituir'} onChange={() => setModo('substituir')} /> Substituir conteúdos pendentes</label>
            <p className="text-xs text-slate-600">Conteúdos vinculados a aulas e histórico de realização serão preservados.</p>
          </fieldset>
        </>}
      </div>
      <footer className="p-4 border-t flex flex-wrap items-center justify-end gap-3">
        {loading && <span role="status" className="text-sm flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{loading}</span>}
        <button onClick={onClose} disabled={!!loading} className="btn-brand-ghost">Cancelar</button>
        {topicos && <button onClick={() => { setTopicos(null); setError(''); }} disabled={!!loading} className="btn-brand-ghost">Voltar ao texto</button>}
        <button onClick={topicos ? salvar : extrair} disabled={!!loading || (topicos && !topicos.length)} className="btn-brand-primary">{topicos ? 'Salvar conteúdos' : 'Extrair conteúdos'}</button>
      </footer>
    </div>
  </div>;
}
