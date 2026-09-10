"use client";

import { useState } from "react";
import { ArrowRight, Calendar, ClipboardList, PenTool, BookOpen, CheckCircle, Sparkles } from "lucide-react";

export function LandingJourney({ onOpenAuth }) {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      num: "1",
      icon: Calendar,
      title: "Planejamento e Grade Horária Inteligente",
      desc: "Defina seus dias de aula e importe seu plano pedagógico. O sistema distribui os tópicos automaticamente pelas semanas letivas e detecta feriados.",
      badge: "MÓDULO: CALENDÁRIO PEDAGÓGICO",
      mockupData: {
        title: "Grade Horária Semanal & Tópicos",
        headerPill: "Automático",
        items: [
          { day: "Segunda-feira", time: "07:30 - 09:10", topic: "Vanguardas Europeias (Modernismo)" },
          { day: "Quarta-feira", time: "09:30 - 11:10", topic: "Produção Textual: Dissertação ENEM" },
          { day: "Quinta-feira", time: "08:20 - 10:00", topic: "Exercícios de Fixação & Análise" },
        ],
        highlight: "✨ Remanejamento por drag-and-drop sem conflito de salas.",
      },
    },
    {
      num: "2",
      icon: ClipboardList,
      title: "Geração de Atividades e Provas BNCC",
      desc: "Gere simulados e atividades temáticas com questões de alta qualidade, 4 alternativas, alinhamento curricular e gabarito comentado pronto para imprimir ou enviar online.",
      badge: "MÓDULO: GERADOR DE ATIVIDADES",
      mockupData: {
        title: "Atividade Gerada com IA (BNCC)",
        headerPill: "5 Questões com Gabarito",
        items: [
          { q: "Questão 1 (EM13LP01):", detail: "Interpretação de texto jornalístico contemporâneo." },
          { q: "Questão 2 (EM13LP12):", detail: "Identificação de recursos coesivos interparágrafos." },
          { q: "Questão 3 (EM13LP45):", detail: "Análise crítica de figuras de linguagem em charges." },
        ],
        highlight: "📄 Exportação instantânea em PDF diagramado com folha de respostas.",
      },
    },
    {
      num: "3",
      icon: PenTool,
      title: "Correção de Redação ENEM em Segundos",
      desc: "O aluno envia o texto e nossa IA avalia cada uma das 5 competências oficiais do ENEM (0 a 200 pontos), entregando uma devolutiva pedagógica humana e formativa.",
      badge: "MÓDULO: REDAÇÃO CORRIGIDA",
      mockupData: {
        title: "Relatório de Correção ENEM",
        headerPill: "Nota Final: 920 / 1000",
        items: [
          { comp: "Competência 1 (Gramática):", score: "160 pts", obs: "Desvios pontuais de concordância." },
          { comp: "Competência 2 (Repertório):", score: "200 pts", obs: "Excelente citação sociológica legitimada." },
          { comp: "Competência 5 (Intervenção):", score: "200 pts", obs: "5 elementos completos (Agente, Ação, Modo, Efeito e Detalhe)." },
        ],
        highlight: "⚡ Correção detalhada entregue ao estudante em menos de 10 segundos.",
      },
    },
    {
      num: "4",
      icon: BookOpen,
      title: "Diário de Notas e Boletim Automatizado",
      desc: "Importe a lista de alunos via Excel em 1 clique. As notas de atividades, simulados e redações são integradas automaticamente com cálculo de médias e faltas.",
      badge: "MÓDULO: DIÁRIO PEDAGÓGICO",
      mockupData: {
        title: "Diário de Classe & Notas Bimestrais",
        headerPill: "34 Alunos Sincronizados",
        items: [
          { student: "Ana Clara Silva", n1: "9.0", n2: "8.5", final: "8.8", status: "Aprovada" },
          { student: "Gabriel Mendonça", n1: "7.5", n2: "8.0", final: "7.8", status: "Aprovado" },
          { student: "Larissa Pinheiro", n1: "9.5", n2: "9.5", final: "9.5", status: "Aprovada" },
        ],
        highlight: "📊 Boletins individuais prontos para impressão ou envio digital aos pais.",
      },
    },
  ];

  return (
    <section id="jornada" className="py-24 bg-[#101942] text-white relative overflow-hidden">
      {/* Glow radial sutil */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#f60c49]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#f60c49] mb-3">
            <span className="w-6 h-0.5 bg-[#f60c49]"></span>
            COMO FUNCIONA O HUB
            <span className="w-6 h-0.5 bg-[#f60c49]"></span>
          </div>
          <h2 className="font-head text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Do planejamento à nota final: tudo em um só lugar.
          </h2>
<p className="mt-4 text-base sm:text-lg text-white/70">
             Chega de usar 5 aplicativos diferentes. O Gestão Docente unifica toda a sua rotina letiva em 4 etapas simples e integradas.
           </p>
        </div>

        {/* Layout Interativo Stepper + Mockup Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Coluna Esquerda: Stepper Interativo */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 border text-left ${
                    isActive
                      ? "bg-white/10 border-[#f60c49] shadow-lg shadow-[#f60c49]/10"
                      : "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-head font-extrabold text-sm transition-colors ${
                        isActive
                          ? "bg-[#f60c49] text-white"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-head font-bold text-base sm:text-lg text-white">
                        {step.title}
                      </h4>
                    </div>
                  </div>

                  {isActive && (
                    <div className="mt-3 pl-13 text-xs sm:text-sm text-white/80 leading-relaxed animate-card-in">
                      {step.desc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Coluna Direita: Stage Visual Mockup */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#dce0f0] overflow-hidden text-[#101942]">
              {/* Barra do macOS */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#f7f8fc] border-b border-[#dce0f0]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="px-3 py-1 bg-white border border-[#dce0f0] rounded-md text-[11px] font-bold text-[#f60c49]">
                  {steps[activeStep].badge}
                </div>
                <div className="w-10" />
              </div>

              {/* Conteúdo Dinâmico da Etapa */}
              <div className="p-6 space-y-4 min-h-[380px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#dce0f0] mb-4">
                    <h3 className="font-head font-bold text-lg text-[#101942]">
                      {steps[activeStep].mockupData.title}
                    </h3>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#fff2f6] text-[#d40840] border border-[#fde4ec]">
                      {steps[activeStep].mockupData.headerPill}
                    </span>
                  </div>

                  {/* Renderização contextual conforme etapa */}
                  {activeStep === 0 && (
                    <div className="space-y-2.5 text-xs animate-card-in">
                      {steps[0].mockupData.items.map((it, i) => (
                        <div key={i} className="p-3 rounded-xl bg-[#f7f8fc] border border-[#dce0f0] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#101942] block">{it.day}</span>
                            <span className="text-[11px] text-[#6070a0]">{it.time}</span>
                          </div>
                          <span className="font-semibold text-[#f60c49] bg-[#fff2f6] px-2.5 py-1 rounded-md border border-[#fde4ec]">
                            {it.topic}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="space-y-2.5 text-xs animate-card-in">
                      {steps[1].mockupData.items.map((it, i) => (
                        <div key={i} className="p-3 rounded-xl bg-[#f7f8fc] border border-[#dce0f0]">
                          <span className="font-bold text-[#f60c49] block mb-0.5">{it.q}</span>
                          <span className="text-[#101942]">{it.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="space-y-2 text-xs animate-card-in">
                      {steps[2].mockupData.items.map((it, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-[#f7f8fc] border border-[#dce0f0] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-[#101942] block">{it.comp}</span>
                            <span className="text-[11px] text-[#6070a0]">{it.obs}</span>
                          </div>
                          <span className="font-extrabold text-[#22c55e] bg-[#eef0f8] px-2.5 py-1 rounded-md">
                            {it.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="space-y-2 text-xs animate-card-in">
                      <div className="grid grid-cols-5 font-bold text-[#6070a0] px-2 pb-1 border-b border-[#dce0f0] text-[11px]">
                        <span className="col-span-2">Aluno</span>
                        <span>N1</span>
                        <span>N2</span>
                        <span className="text-right">Média</span>
                      </div>
                      {steps[3].mockupData.items.map((it, i) => (
                        <div key={i} className="grid grid-cols-5 items-center p-2 rounded-lg bg-[#f7f8fc] border border-[#dce0f0] text-xs">
                          <span className="col-span-2 font-bold text-[#101942]">{it.student}</span>
                          <span className="text-[#6070a0]">{it.n1}</span>
                          <span className="text-[#6070a0]">{it.n2}</span>
                          <span className="text-right font-extrabold text-[#f60c49]">{it.final}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Highlight inferior */}
                <div className="pt-4 border-t border-[#dce0f0] flex items-center justify-between text-xs">
                  <span className="text-[#6070a0] font-medium">{steps[activeStep].mockupData.highlight}</span>
                  <button
                    onClick={() => onOpenAuth("cadastro")}
                    className="btn-brand-primary py-2 px-4 text-xs flex items-center gap-1.5"
                  >
                    <span>Testar Grátis</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
