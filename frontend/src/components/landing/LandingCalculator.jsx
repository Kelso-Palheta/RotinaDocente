"use client";

import { useState } from "react";
import { ArrowRight, Clock, Coffee, Sparkles, Heart } from "lucide-react";

export function LandingCalculator({ onOpenAuth }) {
  const [turmas, setTurmas] = useState(5); // slider de 1 a 15 turmas

  // Cálculos baseados em métricas reais docentes:
  // Média de 30 alunos por turma = 150 alunos
  // Tempo de correção manual e diário: ~8 horas por turma/mês
  const horasTradicional = turmas * 8;
  const horasComEdu = Math.round(turmas * 0.8);
  const horasEconomizadas = horasTradicional - horasComEdu;
  const finsDeSemanaLivres = (horasEconomizadas / 12).toFixed(1);

  return (
    <section id="calculadora" className="py-24 bg-[#eef0f8]/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#dce0f0] shadow-xl relative overflow-hidden">
          {/* Badge decorativo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fff2f6] border border-[#fde4ec] text-[#d40840] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#f60c49]" />
              CALCULADORA DE TEMPO RECUPERADO
            </div>
            <h2 className="font-head text-3xl sm:text-4xl font-extrabold text-[#101942] tracking-tight">
              Quanto tempo você vai ganhar de volta?
            </h2>
<p className="mt-2 text-sm sm:text-base text-[#6070a0]">
               Arraste o seletor abaixo e veja o impacto real do Gestão Docente na sua qualidade de vida.
             </p>
          </div>

          {/* Slider Interativo */}
          <div className="space-y-6 max-w-xl mx-auto mb-10">
            <div className="flex justify-between items-center">
              <label className="font-head font-bold text-sm sm:text-base text-[#101942]">
                Quantas turmas você leciona?
              </label>
              <span className="font-head font-extrabold text-2xl text-[#f60c49] bg-[#fff2f6] px-4 py-1 rounded-xl border border-[#fde4ec]">
                {turmas} {turmas === 1 ? "turma" : "turmas"}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="15"
              value={turmas}
              onChange={(e) => setTurmas(Number(e.target.value))}
              className="w-full h-3 bg-[#dce0f0] rounded-lg appearance-none cursor-pointer accent-[#f60c49]"
            />
            <div className="flex justify-between text-xs font-bold text-[#9098c0]">
              <span>1 turma</span>
              <span>5 turmas</span>
              <span>10 turmas</span>
              <span>15 turmas</span>
            </div>
          </div>

          {/* Resultados Comparativos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-10">
            <div className="p-6 rounded-2xl bg-[#f7f8fc] border border-[#dce0f0]">
              <div className="w-10 h-10 rounded-xl bg-[#eef0f8] text-[#6070a0] flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <div className="font-head text-3xl sm:text-4xl font-extrabold text-[#101942]">
                {horasEconomizadas}h
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#6070a0] mt-1">
                Poupadas todo mês
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#fff2f6] border border-[#fde4ec] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#fde4ec] text-[#d40840] flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-5 h-5 text-[#f60c49]" />
              </div>
              <div className="font-head text-3xl sm:text-4xl font-extrabold text-[#d40840]">
                {finsDeSemanaLivres}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#d40840] mt-1">
                Finais de semana 100% livres
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#f7f8fc] border border-[#dce0f0]">
              <div className="w-10 h-10 rounded-xl bg-[#eef0f8] text-[#22c55e] flex items-center justify-center mx-auto mb-3">
                <Heart className="w-5 h-5" />
              </div>
              <div className="font-head text-3xl sm:text-4xl font-extrabold text-[#22c55e]">
                95%
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#6070a0] mt-1">
                Menos estresse burocrático
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="text-center">
            <button
              onClick={() => onOpenAuth("cadastro")}
              className="btn-brand-primary text-base py-4 px-10 inline-flex items-center gap-3 group"
            >
              <span>Resgatar Minhas {horasEconomizadas} Horas Grátis</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
            </button>
            <p className="text-xs text-[#9098c0] mt-3">
              Comece agora mesmo com 15 créditos mensais sem cadastrar cartão.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
