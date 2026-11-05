"use client";

import { useState } from "react";
import { Check, ArrowRight, Sparkles, ShieldCheck, Zap, Layers, Award, Star } from "lucide-react";

export function LandingPricing({ onOpenAuth }) {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section id="precos" className="py-24 bg-[#f3edff]/40 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#6315d9] mb-3">
            <span className="w-6 h-0.5 bg-[#6315d9]"></span>
            PLANOS TRANSPARENTES
            <span className="w-6 h-0.5 bg-[#6315d9]"></span>
          </div>
          <h2 className="font-head text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#25104a] tracking-tight">
            Investimento acessível que se paga no primeiro fim de semana livre.
          </h2>
<p className="mt-4 text-base sm:text-lg text-[#5b4b86]">
             O Diário de Notas é 100% gratuito. Escolha o plano de automação ideal para a sua rotina e assine sem fidelidade.
           </p>

          {/* Toggle Mensal / Anual */}
          <div className="mt-8 inline-flex items-center gap-3 p-1.5 rounded-full bg-white border border-[#e2d9f7] shadow-xs">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
                !isAnnual
                  ? "bg-[#25104a] text-white shadow-xs"
                  : "text-[#5b4b86] hover:text-[#25104a]"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-5 py-2 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                isAnnual
                  ? "bg-[#6315d9] text-white shadow-xs"
                  : "text-[#5b4b86] hover:text-[#25104a]"
              }`}
            >
              <span>Anual</span>
              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                -25% OFF
              </span>
            </button>
          </div>
        </div>

        {/* Grid de 4 Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* Card 1: Gratuito */}
          <div className="p-6 rounded-3xl bg-white border border-[#e2d9f7] shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold text-[#25104a] uppercase tracking-wider bg-[#F3EDFF] px-2.5 py-1 rounded-full">
                  Freemium
                </span>
                <h3 className="font-head text-xl font-bold text-[#25104a] mt-2">Diário Gratuito</h3>
                <p className="text-xs text-[#5b4b86] mt-1">Gestão de notas, faltas e publicação de boletins sem custos.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-head text-4xl font-extrabold text-[#25104a]">R$ 0</span>
                <span className="text-xs text-[#5b4b86] font-semibold">/para sempre</span>
              </div>

              <ul className="space-y-2.5 text-xs text-[#25104a] font-medium border-t border-[#e2d9f7] pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315D9] shrink-0" />
                  <span><strong>Diário Pedagógico de Notas</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315D9] shrink-0" />
                  <span>Cálculo automático de médias</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315D9] shrink-0" />
                  <span>Publicação no <strong>Portal do Aluno</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315D9] shrink-0" />
                  <span>Exportação de Caderneta Escolar PDF</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <span className="w-4 h-4 flex items-center justify-center text-[10px]">✕</span>
                  <span>Módulos de IA e Calendário</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onOpenAuth("cadastro")}
                className="w-full btn-brand-ghost py-3 text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>Usar Diário Grátis</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6315d9]" />
              </button>
            </div>
          </div>

          {/* Card 2: Professor Geral (Destaque) */}
          <div className="p-6 rounded-3xl bg-white border-2 border-[#25104a] shadow-lg flex flex-col justify-between relative hover:scale-[1.02] transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#25104a] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#6315d9]" />
              MAIS ESCOLHIDO
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold text-[#6315D9] uppercase tracking-wider bg-[#F3EDFF] px-2.5 py-1 rounded-full">
                  Essencial Hub
                </span>
                <h3 className="font-head text-xl font-extrabold text-[#25104a] mt-2">Professor Geral</h3>
                <p className="text-xs text-[#5b4b86] mt-1">Automatize planejamento, aulas e atividades de todas as disciplinas.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-head text-4xl font-extrabold text-[#25104a]">
                  R$ {isAnnual ? "11,90" : "14,90"}
                </span>
                <span className="text-xs text-[#5b4b86] font-semibold">/mês</span>
              </div>
              {isAnnual && (
                <p className="text-[10px] text-[#6315D9] font-bold">
                  Cobrado anualmente (R$ 142,80/ano)
                </p>
              )}

              <ul className="space-y-2.5 text-xs text-[#25104a] font-semibold border-t border-[#e2d9f7] pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span><strong>Tudo do Diário Gratuito</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span><strong>Calendário com Smart Shift</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span>Gerador de Atividades BNCC</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span>Hub de Agentes Pedagógicos IA</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span>Dashboard Analytics & Relatório PDF</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400 font-normal">
                  <span className="w-4 h-4 flex items-center justify-center text-[10px]">✕</span>
                  <span>Sem Corretor de Redações</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onOpenAuth("cadastro")}
                className="w-full bg-[#25104a] hover:bg-[#180a30] text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Assinar Professor Geral</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#6315d9]" />
              </button>
            </div>
          </div>

          {/* Card 3: Hub Completo Pro (Destaque Rosa) */}
          <div className="p-6 rounded-3xl bg-white border-2 border-[#6315d9] shadow-xl flex flex-col justify-between relative hover:scale-[1.02] transition-all bg-gradient-to-b from-white to-[#F3EDFF]/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#6315d9] text-white text-[10px] font-extrabold uppercase tracking-wider shadow-md flex items-center gap-1">
              <Star className="w-3 h-3" />
              SUÍTE COMPLETA IA
            </div>

            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold text-[#6315d9] uppercase tracking-wider bg-[#F3EDFF] px-2.5 py-1 rounded-full">
                  Hub Completo
                </span>
                <h3 className="font-head text-xl font-extrabold text-[#25104a] mt-2">Hub Completo Pro</h3>
                <p className="text-xs text-[#5b4b86] mt-1">Todas as ferramentas do Hub liberadas, incluindo correção de redação.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-head text-4xl font-extrabold text-[#25104a]">
                  R$ {isAnnual ? "19,90" : "24,90"}
                </span>
                <span className="text-xs text-[#5b4b86] font-semibold">/mês</span>
              </div>
              {isAnnual && (
                <p className="text-[10px] text-[#6315D9] font-bold">
                  Cobrado anualmente (R$ 238,80/ano)
                </p>
              )}

              <ul className="space-y-2.5 text-xs text-[#25104a] font-semibold border-t border-[#e2d9f7] pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span><strong>Tudo do Plano Professor Geral</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span><strong>Corretor de Redação ENEM Ilimitado</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span>Extração OCR de Manuscritos & Fotos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span>Avaliação nas 5 Competências C1–C5</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#6315d9] shrink-0" />
                  <span>Emissão de Laudos de Redação em PDF</span>
                </li>
              </ul>
            </div>

            <div className="pt-6">
              <button
                onClick={() => onOpenAuth("cadastro")}
                className="w-full btn-brand-primary py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#6315d9]/25"
              >
                <span>Assinar Hub Pro</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Combo Total Hub + SimuladoApp */}
          <div className="p-6 rounded-3xl bg-[#25104a] text-white border border-white/10 shadow-xl flex flex-col justify-between hover:scale-[1.02] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6315d9]/15 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-5 relative z-10">
              <div>
                <span className="text-[10px] font-bold text-[#B9A6EF] uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                  Combo Supremo
                </span>
                <h3 className="font-head text-xl font-extrabold text-white mt-2">Combo Total</h3>
                <p className="text-xs text-[#B9A6EF] mt-1">Hub Completo + Plataforma de Simulados Online para seus alunos.</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-head text-4xl font-extrabold text-white">
                  R$ {isAnnual ? "29,90" : "39,90"}
                </span>
                <span className="text-xs text-[#B9A6EF] font-semibold">/mês</span>
              </div>
              {isAnnual && (
                <p className="text-[10px] text-[#B9A6EF] font-bold">
                  Cobrado anualmente (R$ 358,80/ano)
                </p>
              )}

              <ul className="space-y-2.5 text-xs text-[#E2D9F7] font-medium border-t border-white/10 pt-5">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#B9A6EF] shrink-0" />
                  <span><strong>Hub Completo Pro Ilimitado</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#B9A6EF] shrink-0" />
                  <span><strong>Plano Básico SimuladoApp</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#B9A6EF] shrink-0" />
                  <span>Aplicação de provas online para alunos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#B9A6EF] shrink-0" />
                  <span>Sincronização automática de notas no Diário</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#B9A6EF] shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <div className="pt-6 relative z-10">
              <button
                onClick={() => onOpenAuth("cadastro")}
                className="w-full bg-gradient-to-r from-[#6315d9] to-[#6315D9] hover:from-[#5411b8] hover:to-[#5411B8] text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#6315d9]/30 transition-all"
              >
                <span>Assinar Combo Total</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé Informativo para Especialistas em Redação */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-[#e2d9f7] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3EDFF] text-[#6315D9] flex items-center justify-center shrink-0">
              <Award size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#25104a]">Professor(a) focado exclusivamente em Redação?</h4>
              <p className="text-xs text-[#5b4b86]">
                Temos o plano <strong>Especialista Redação</strong> (Diário de Notas + Corretor de Redações ENEM) por <strong>R$ 14,90/mês</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenAuth("cadastro")}
            className="px-4 py-2 bg-[#F3EDFF] hover:bg-[#E2D9F7] text-[#25104a] rounded-xl text-xs font-bold transition-colors shrink-0"
          >
            Conhecer Plano Redação
          </button>
        </div>
      </div>
    </section>
  );
}
