"use client";

import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Shield } from 'lucide-react';

const CRITERIOS_INEP = [
  { num: 1, titulo: 'Demonstrar domínio da modalidade escrita formal da Língua Portuguesa', cor: '#ef4444', desc: 'Avalia a adequação à norma-padrão da língua portuguesa: ortografia, acentuação, pontuação, concordância, regência, colocação pronominal, estrutura sintática e escolha vocabular.' },
  { num: 2, titulo: 'Compreender a proposta de redação e aplicar conceitos das várias áreas de conhecimento para desenvolver o tema', cor: '#f97316', desc: 'Avalia a leitura e compreensão do tema proposto, a capacidade de delimitar o recorte temático e evitar a tangência ou fuga ao tema.' },
  { num: 3, titulo: 'Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista', cor: '#eab308', desc: 'Avalia a construção da argumentação: projeto de texto, progressão textual, coerência, tipo textual dissertativo-argumentativo e consistência dos argumentos.' },
  { num: 4, titulo: 'Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação', cor: '#22c55e', desc: 'Avalia a coesão textual: uso de conectivos, articulação entre parágrafos e partes do texto, referência, substituição lexical e estruturação lógica.' },
  { num: 5, titulo: 'Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos', cor: '#3b82f6', desc: 'Avalia a proposta de intervenção: presença de agente, ação, meio/ modo, efeito e detalhamento, além do respeito aos direitos humanos.' },
];

const NOTAS_VALIDAS = [0, 40, 80, 120, 160, 200];

export default function CriteriosPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc]"
      style={{ backgroundImage: 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(99,102,241,0.06), transparent)' }}>
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 sm:px-6 py-3 flex items-center gap-3 sticky top-0 z-30 overflow-x-auto no-scrollbar">
        <button onClick={() => router.push('/redacao')}
          className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold bg-[#fff2f6] hover:bg-[#fde4ec] text-[#f60c49] border border-[#f60c49]/30 hover:border-[#f60c49]/50 transition-all duration-300 shadow-sm whitespace-nowrap">
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
        </button>
        <h1 className="text-sm font-semibold text-slate-700 flex items-center gap-2 whitespace-nowrap"><BookOpen size={16} /> Critérios INEP</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f60c49] to-[#d40840] flex items-center justify-center shadow-xl shadow-[#f60c49]/20 mb-4">
            <Shield size={28} color="white" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Competências do ENEM</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">As 5 competências avaliadas na redação do ENEM, conforme a matriz de referência oficial do INEP.</p>
        </div>

        <div className="space-y-4">
          {CRITERIOS_INEP.map((c, i) => (
            <div key={c.num}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-sm"
              style={{ borderLeftWidth: 4, borderLeftColor: c.cor }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl font-black tabular-nums flex-shrink-0" style={{ color: c.cor }}>
                  C{c.num}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{c.titulo}</h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Escala de notas */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 shadow-sm text-center">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Escala de Notas por Competência</h3>
          <div className="flex justify-center gap-3 flex-wrap">
            {NOTAS_VALIDAS.map(n => (
              <span key={n} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-700">
                {n} pts
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Nota total varia de 0 a 1000 pontos (soma das 5 competências × 200)</p>
        </div>
      </main>
    </div>
  );
}
