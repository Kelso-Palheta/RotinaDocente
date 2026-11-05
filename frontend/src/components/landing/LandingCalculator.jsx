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
    <section id="calculadora" className="py-24 bg-[#f3edff]/50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-[#e2d9f7] shadow-xl relative overflow-hidden">
          {/* Badge decorativo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f3edff] border border-[#e7dbfd] text-[#5411b8] text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#6315d9]" />
              CALCULADORA DE TEMPO RECUPERADO
            </div>
            <h2 className="font-head text-3xl sm:text-4xl font-extrabold text-[#25104a] tracking-tight">
              Quanto tempo você vai ganhar de volta?
            </h2>
<p className="mt-2 text-sm sm:text-base text-[#5b4b86]">
               Arraste o seletor abaixo e veja o impacto real do Rotina Docente na sua qualidade de vida.
             </p>
          </div>

          {/* Slider Interativo */}
          <div className="space-y-6 max-w-xl mx-auto mb-10">
            <div className="flex justify-between items-center">
              <label className="font-head font-bold text-sm sm:text-base text-[#25104a]">
                Quantas turmas você leciona?
              </label>
              <span className="font-head font-extrabold text-2xl text-[#6315d9] bg-[#f3edff] px-4 py-1 rounded-xl border border-[#e7dbfd]">
                {turmas} {turmas === 1 ? "turma" : "turmas"}
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="15"
              value={turmas}
              onChange={(e) => setTurmas(Number(e.target.value))}
              className="w-full h-3 bg-[#e2d9f7] rounded-lg appearance-none cursor-pointer accent-[#6315d9]"
            />
            <div className="flex justify-between text-xs font-bold text-[#6e5f94]">
              <span>1 turma</span>
              <span>5 turmas</span>
              <span>10 turmas</span>
              <span>15 turmas</span>
            </div>
          </div>

          {/* Resultados Comparativos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center mb-10">
            <div className="p-6 rounded-2xl bg-[#f3edff] border border-[#e2d9f7]">
              <div className="w-10 h-10 rounded-xl bg-[#f3edff] text-[#5b4b86] flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <div className="font-head text-3xl sm:text-4xl font-extrabold text-[#25104a]">
                {horasEconomizadas}h
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#5b4b86] mt-1">
                Poupadas todo mês
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#f3edff] border border-[#e7dbfd] shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-[#e7dbfd] text-[#5411b8] flex items-center justify-center mx-auto mb-3">
                <Coffee className="w-5 h-5 text-[#6315d9]" />
              </div>
              <div className="font-head text-3xl sm:text-4xl font-extrabold text-[#5411b8]">
                {finsDeSemanaLivres}
              </div>
              <div className="text-xs sm:text-sm font-bold text-[#5411b8] mt-1">
                Finais de semana 100% livres
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#f3edff] border border-[#e2d9f7]">
              <div className="w-10 h-10 rounded-xl bg-[#f3edff] text-[#6315D9] flex items-center justify-center mx-auto mb-3">
                <Heart className="w-5 h-5" />
              </div>
              <div className="font-head text-3xl sm:text-4xl font-extrabold text-[#6315D9]">
                95%
              </div>
              <div className="text-xs sm:text-sm font-semibold text-[#5b4b86] mt-1">
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
            <p className="text-xs text-[#6e5f94] mt-3">
              Comece agora mesmo com 15 créditos mensais sem cadastrar cartão.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
