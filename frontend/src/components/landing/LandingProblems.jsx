"use client";

import { Clock, FileSpreadsheet, FileText, AlertCircle } from "lucide-react";

export function LandingProblems() {
  const problems = [
    {
      num: "01",
      icon: Clock,
      title: "Finais de semana perdidos com correção manual",
      desc: "Corrigir 120 redações ou pilhas de provas consome entre 8 a 14 horas de sábado e domingo. Você termina a semana mais cansado do que começou.",
      cost: "Custo: 50+ horas de lazer perdidas por mês",
    },
    {
      num: "02",
      icon: FileText,
      title: "Horas caçando e formatando questões BNCC",
      desc: "Montar listas de exercícios com gabarito comentado e alinhadas à matriz de referência exige garimpar a internet e diagramar tudo no Word.",
      cost: "Custo: 3 a 5 horas por atividade criada",
    },
    {
      num: "03",
      icon: FileSpreadsheet,
      title: "O caos do fechamento bimestral de notas",
      desc: "Planilhas Excel pesadas, fórmulas quebradas, digitação manual de faltas e pais cobrando boletins no WhatsApp sem um canal organizado.",
      cost: "Custo: Estresse máximo e risco de retrabalho",
    },
  ];

  return (
    <section id="problemas" className="py-24 bg-[#f3f7f5]/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0f766e] mb-3">
            <span className="w-6 h-0.5 bg-[#0f766e]"></span>
            O CUSTO INVISÍVEL
            <span className="w-6 h-0.5 bg-[#0f766e]"></span>
          </div>
          <h2 className="font-head text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#123c3a] tracking-tight">
            Você foi contratado para lecionar, não para virar escravo da burocracia.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4f6b63]">
            A sobrecarga docente consome sua saúde e seu tempo com a família. Veja se você se identifica com essa rotina:
          </p>
        </div>

        {/* Grid de Problemas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((p, idx) => (
            <div
              key={idx}
              className="relative p-8 rounded-2xl bg-white border border-[#d5e3dc] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
            >
              {/* Número gigante decorativo */}
              <span className="absolute top-4 right-6 font-head text-7xl font-extrabold text-[#daebe5] select-none pointer-events-none group-hover:text-[#0f766e]/20 transition-colors">
                {p.num}
              </span>

              {/* Traço rosa da marca (.prob-rule) */}
              <div className="w-12 h-1 bg-[#0f766e] rounded-full mb-6" />

              {/* Ícone */}
              <div className="w-12 h-12 rounded-xl bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center mb-4">
                <p.icon className="w-6 h-6" />
              </div>

              {/* Título & Texto */}
              <h3 className="font-head text-xl font-bold text-[#123c3a] mb-3 leading-snug">
                {p.title}
              </h3>
              <p className="text-sm text-[#4f6b63] leading-relaxed mb-6">
                {p.desc}
              </p>

              {/* Custo Invisível Tag */}
              <div className="pt-4 border-t border-[#d5e3dc]/60 flex items-center gap-2 text-xs font-bold text-[#0b5f59]">
                <AlertCircle className="w-4 h-4 text-[#0f766e] shrink-0" />
                <span>{p.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
