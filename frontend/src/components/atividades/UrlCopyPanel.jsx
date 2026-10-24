"use client";

import { useState } from 'react';

export const UrlCopyPanel = ({ activityId, alunosInfo, onClose }) => {
  const [copiedId, setCopiedId] = useState(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  const copyUrl = async (alunoId, token) => {
    const url = `${baseUrl}/aluno/atividade/${activityId}?token=${encodeURIComponent(token)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedId(alunoId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAll = async () => {
    const linhas = Object.entries(alunosInfo)
      .filter(([, info]) => info.token).map(([alunoId, info]) => {
        const url = `${baseUrl}/aluno/atividade/${activityId}?token=${encodeURIComponent(info.token)}`;
        return `${info.nome} → ${url}`;
      })
      .join('\n');

    try {
      await navigator.clipboard.writeText(linhas);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = linhas;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    alert('Todas as URLs copiadas!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200 max-h-[80vh] flex flex-col animate-card-in">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Links da Atividade</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-xl leading-none">&times;</button>
        </div>

        <p className="px-5 pt-3 text-xs text-slate-600">Links antigos exigem login no Portal do Aluno. Cada link pertence somente ao aluno e à turma indicados.</p>
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {Object.entries(alunosInfo).length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">Carregando alunos...</p>
          )}
          {Object.entries(alunosInfo).map(([alunoId, info]) => (
            <div key={alunoId} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="flex-1 text-sm text-slate-900 truncate">{info.nome}</span>
              <button
                disabled={!info.token}
                onClick={() => copyUrl(alunoId, info.token)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex-shrink-0 ${
                  copiedId === alunoId
                    ? 'bg-green-50 text-green-600 border border-green-200'
                    : 'bg-slate-50 hover:bg-violet-50 text-slate-400 hover:text-violet-500 border border-slate-200'
                }`}
              >
                {!info.token ? 'Acesso pendente' : copiedId === alunoId ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200">
          <button
            onClick={copyAll}
            className="w-full py-3 bg-violet-500 hover:bg-violet-400 rounded-xl text-white text-sm font-semibold transition-all btn-3d-primary"
            disabled={!Object.values(alunosInfo).some(info => info.token)}
          >
            Copiar Todas as URLs
          </button>
        </div>
      </div>
    </div>
  );
};
