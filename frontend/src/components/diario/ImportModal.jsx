"use client";

import { useState, useRef } from 'react';
import { importarXlsxOuCsv } from '@/utils/diario/importXlsx';
import { normalizeNome, cleanNome, titleCase } from '@/utils/diario/calculos';
import { importarViaIA } from '@/utils/diario/importIA';

const ACCEPT_IA = '.pdf,.jpg,.jpeg,.png,.webp';
const ACCEPT_XLSX = '.xlsx,.xls,.csv';
const ACCEPT_ALL = ACCEPT_XLSX + ',' + ACCEPT_IA;

/**
 * Normaliza entrada para formato { nome, dataNascimento? }
 */
const normalizeEntry = (item) => {
  if (typeof item === 'string') return { nome: item };
  return item;
};

export const ImportModal = ({ turma, onConfirm, onClose }) => {
  const [stage, setStage] = useState('drop');
  const [alunos, setAlunos] = useState([]); // array de { nome, dataNascimento? }
  const [erro, setErro] = useState('');
  const [dragging, setDragging] = useState(false);
  const [editNome, setEditNome] = useState(null);
  const inputRef = useRef();

  const existentes = new Set(turma.alunos.map((a) => normalizeNome(a.nome)));

  const processarArquivo = async (file) => {
    setStage('processing');
    setErro('');
    try {
      let resultado;
      const ext = file.name.split('.').pop().toLowerCase();
      if (['xlsx', 'xls', 'csv'].includes(ext)) {
        resultado = await importarXlsxOuCsv(file);
      } else {
        resultado = await importarViaIA(file);
      }
      // Normaliza para array de objetos
      const items = resultado.map(normalizeEntry);
      const limpos = items
        .map(item => ({ ...item, nome: cleanNome(item.nome) }))
        .filter(item => item.nome)
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

      // Deduplica por nome
      const seen = new Set();
      const unicos = limpos.filter(item => {
        const key = normalizeNome(item.nome);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setAlunos(unicos);
      setStage('preview');
    } catch (e) {
      setErro(e.message);
      setStage('error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processarArquivo(file);
  };

  const onPick = (e) => {
    const file = e.target.files?.[0];
    if (file) processarArquivo(file);
  };

  const novos = alunos.filter((a) => !existentes.has(normalizeNome(a.nome)));
  const duplicatas = alunos.filter((a) => existentes.has(normalizeNome(a.nome)));
  const comData = novos.filter(a => a.dataNascimento).length;

  const confirmar = () => {
    // Retorna objetos para manter dataNascimento
    onConfirm(novos);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white border border-[#E2D9F7] rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2D9F7]">
          <div>
            <h2 className="font-semibold text-[#25104A]">Importar Alunos</h2>
            <p className="text-xs text-slate-400 mt-0.5">Turma {turma.nome}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-[#5B4B86] transition-colors text-xl leading-none">×</button>
        </div>

        <div className="p-6">
          {(stage === 'drop' || stage === 'error') && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                  ${dragging ? 'border-[#6315D9] bg-[#F3EDFF]' : 'border-[#B9A6EF] hover:border-[#6315D9] hover:bg-[#F3EDFF]'}`}
              >
                <div className="text-4xl mb-3">📂</div>
                <p className="text-sm text-[#5B4B86] font-medium">Arraste ou clique para selecionar</p>
                <p className="text-xs text-slate-400 mt-1">.xlsx · .csv · .pdf · .jpg · .png · .webp</p>
                <p className="text-[10px] text-[#6E5F94] mt-2">PDF/imagem usa extração por IA</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT_ALL}
                  className="hidden"
                  onChange={onPick}
                />
              </div>
              {stage === 'error' && (
                <div className="mt-3 p-3 bg-[#F3EDFF] border border-[#E2D9F7] rounded-lg text-sm text-[#6315D9]">
                  ⚠ {erro}
                </div>
              )}
            </>
          )}

          {stage === 'processing' && (
            <div className="py-16 flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-[#6315D9] border-t-transparent animate-spin" />
              <p className="text-sm text-slate-400">Processando arquivo…</p>
            </div>
          )}

          {stage === 'preview' && (
            <>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-sm text-[#5B4B86]">
                  <strong className="text-[#6315D9]">{novos.length}</strong> novo{novos.length !== 1 && 's'}
                  {duplicatas.length > 0 && (
                    <>, <strong className="text-[#6315D9]">{duplicatas.length}</strong> já exist{duplicatas.length !== 1 ? 'em' : 'e'}</>
                  )}
                </span>
                {comData > 0 && (
                  <span className="text-[10px] bg-[#F3EDFF] text-[#6315D9] border border-[#E2D9F7] px-2 py-0.5 rounded-full font-medium">
                    📅 {comData} com data de nascimento
                  </span>
                )}
                <button onClick={() => setStage('drop')} className="ml-auto text-xs text-slate-400 hover:text-[#5B4B86]">← trocar arquivo</button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                {alunos.map((aluno, i) => {
                  const isDup = existentes.has(normalizeNome(aluno.nome));
                  return (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${isDup ? 'opacity-40' : 'bg-[#F3EDFF]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isDup ? 'bg-[#6315D9]' : 'bg-[#6315D9]'}`} />
                      {editNome === i ? (
                        <input
                          autoFocus
                          className="flex-1 bg-transparent border-b border-[#6315D9] outline-none text-[#25104A] font-mono text-xs"
                          defaultValue={aluno.nome}
                          onBlur={(e) => {
                            const novo = cleanNome(e.target.value);
                            if (novo) setAlunos((prev) => { const n = [...prev]; n[i] = { ...n[i], nome: novo }; return n; });
                            setEditNome(null);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditNome(null); }}
                        />
                      ) : (
                        <span className="flex-1 font-mono text-xs text-[#25104A]">{titleCase(aluno.nome)}</span>
                      )}
                      {aluno.dataNascimento && (
                        <span className="text-[10px] font-mono text-[#6315D9] bg-[#F3EDFF] px-1.5 py-0.5 rounded border border-[#E2D9F7]" title="Data de nascimento (ddMM)">
                          📅 {aluno.dataNascimento}
                        </span>
                      )}
                      {!isDup && (
                        <button onClick={() => setEditNome(i)} className="text-slate-400 hover:text-[#5B4B86] text-xs">✎</button>
                      )}
                      <button onClick={() => setAlunos((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-[#6315D9] text-xs">×</button>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-[#E2D9F7] text-[#6E5F94] hover:text-[#4A3B7C] hover:border-[#B9A6EF] text-sm transition-all">
                  Cancelar
                </button>
                <button
                  onClick={confirmar}
                  disabled={novos.length === 0}
                  className="flex-1 py-2 rounded-lg bg-[#6315D9] hover:bg-[#5411B8] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
                >
                  Adicionar {novos.length} aluno{novos.length !== 1 && 's'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

