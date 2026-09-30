"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generatePDF } from '@/lib/redacao/pdf-generator';
import { ArrowLeft, Download, Search, FileText, User, BookOpen, Calendar, Award, Sparkles, AlertCircle } from 'lucide-react';
import { renderFeedbackText } from '@/lib/redacao/renderFeedback';

export default function AlunoRedacaoViewPage() {
  const { id } = useParams();
  const [correction, setCorrection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [backUrl, setBackUrl] = useState('/redacao/aluno');

  const compLabels = [
    'Gramática e Escrita',
    'Compreensão do Tema',
    'Estrutura e Argumento',
    'Coesão e Coerência',
    'Proposta de Intervenção'
  ];

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('aluno_login')) {
      setBackUrl('/aluno');
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        let professorUid = '';
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem('redacao_aluno');
          if (raw) {
            try {
              const data = JSON.parse(raw);
              professorUid = data.professorUid || '';
            } catch {}
          }
        }

        const url = `/api/aluno/redacao/${encodeURIComponent(id)}${professorUid ? `?professorUid=${encodeURIComponent(professorUid)}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || !data.correction) {
          throw new Error(data.error || 'Correção não encontrada.');
        }

        setCorrection(data.correction);
      } catch (err) {
        console.error('Erro ao buscar correção:', err);
        setErro(err.message || 'Erro ao carregar. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleExportPDF = () => {
    if (correction?.result) {
      generatePDF(
        correction.result,
        correction.studentName,
        correction.studentClass,
        correction.essayTheme,
        correction.scoreData
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 animate-pulse shadow-2xl shadow-violet-500/20" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm bg-white border border-slate-200 rounded-3xl p-8 shadow-xl animate-card-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <Search size={28} className="text-red-400" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 mb-2">Não encontrado</h1>
          <p className="text-sm text-slate-400 mb-6">{erro}</p>
          <a href="/redacao/aluno" className="inline-flex items-center justify-center px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition-all">
            ← Tentar outro login
          </a>
        </div>
      </div>
    );
  }

  const scores = correction?.scoreData?.map((item, i) => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'];
    return { ...item, color: colors[i] || '#6366f1' };
  });

  return (
    <div 
      className="min-h-screen bg-[#f8fafc] py-8 px-4 font-sans"
      style={{
        backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(99,102,241,0.05), transparent)',
      }}
    >
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <a 
            href={backUrl} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft size={14} /> {backUrl === '/aluno' ? 'Voltar ao Portal' : 'Buscar outro login'}
          </a>
          <button 
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-violet-500/10 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download size={14} /> Baixar PDF
          </button>
        </div>

        {/* Student Profile Info Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 to-indigo-500" />
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/15">
              {correction.studentName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 tracking-tight">{correction.studentName}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                {correction.studentClass !== 'N/A' && (
                  <span className="flex items-center gap-1"><BookOpen size={12} /> Turma {correction.studentClass}</span>
                )}
                {correction.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> 
                    {correction.createdAt.toDate?.().toLocaleDateString('pt-BR') || new Date(correction.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Theme Card */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-violet-50 rounded-lg text-violet-500"><FileText size={14} /></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tema Proposto</span>
          </div>
          <p className="text-sm font-semibold text-slate-700 leading-relaxed">
            {correction.essayTheme}
          </p>
        </div>

        {/* Total Score Panel */}
        {correction.totalScore != null && (
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl p-8 shadow-xl shadow-indigo-500/15 text-center relative overflow-hidden flex flex-col items-center justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-6 translate-x-6" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl translate-y-12 -translate-x-12" />
            
            <p className="text-xs text-indigo-100 uppercase tracking-widest font-semibold mb-2 flex items-center gap-1.5">
              <Award size={14} className="text-indigo-200" /> Nota Final ENEM
            </p>
            <div className="flex items-baseline justify-center">
              <span className="text-6xl sm:text-7xl font-black tracking-tighter tabular-nums drop-shadow-md">
                {correction.totalScore}
              </span>
              <span className="text-xl text-indigo-200 font-bold ml-1.5">/ 1000</span>
            </div>
          </div>
        )}

        {/* Competencies Section */}
        {scores?.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Notas por Competência</h3>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {scores.map((item, i) => {
                const percentage = Math.min(100, Math.max(0, ((item.A || 0) / 200) * 100));
                return (
                  <div 
                    key={i} 
                    className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-300 group"
                  >
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-slate-100" />
                    <div className="absolute top-0 left-0 h-[3px] transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                    
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs font-bold text-slate-400 uppercase">C{i+1}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-50 border border-slate-100 text-slate-400 font-bold font-mono">/200</span>
                    </div>

                    <div className="my-2">
                      <span className="text-2xl font-black tabular-nums transition-colors" style={{ color: item.color }}>
                        {item.A || 0}
                      </span>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-400 font-semibold leading-tight line-clamp-2" title={compLabels[i]}>
                        {compLabels[i]}
                      </p>
                      {/* Visual progress bar */}
                      <div className="w-full h-1 bg-slate-50 border border-slate-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pedagogical Report */}
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-1.5 bg-violet-50 rounded-lg text-violet-500"><Sparkles size={16} /></div>
            <h3 className="text-sm font-bold text-slate-800">Relatório Pedagógico Detalhado</h3>
          </div>
          {renderFeedbackText(correction.result)}
        </div>

      </div>
    </div>
  );
}
