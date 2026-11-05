"use client";

import { Star, Quote, CheckCircle2 } from "lucide-react";

export function LandingStats() {
  const testimonials = [
    {
      name: "Prof. Marcos Andrade",
      role: "Professor de Língua Portuguesa e Redação",
      school: "Colégio Santa Cecília • São Paulo/SP",
      text: "Eu gastava quase todo o meu domingo corrigindo 140 redações. Com o Rotina Docente, a IA faz a primeira triagem por competência com uma precisão incrível. Economizo mais de 10 horas semanais.",
      stars: 5,
    },
    {
      name: "Profa. Cláudia Vasconcelos",
      role: "Professora de História e Coordenadora",
      school: "Escola Estadual Tiradentes • Belo Horizonte/MG",
      text: "A importação das planilhas para o Diário Pedagógico é mágica. As notas de atividades e simulados já caem calculadas. Nunca mais tive dor de cabeça no fechamento de bimestre.",
      stars: 5,
    },
    {
      name: "Prof. Roberto Meireles",
      role: "Professor de Física e Matemática",
      school: "Curso Pré-Vestibular Aprovados • Curitiba/PR",
      text: "O Gerador de Atividades BNCC com gabarito comentado me permite criar simulados contextualizados em 2 minutos. Meus alunos adoram a agilidade do feedback.",
      stars: 5,
    },
  ];

  return (
    <section className="py-24 bg-white border-t border-[#e2d9f7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Números de Impacto (.stats-grid) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center border-b border-[#e2d9f7] pb-16">
          <div className="space-y-2">
            <div className="font-head text-5xl sm:text-6xl font-extrabold text-[#25104a] tracking-tight">
              +45<span className="text-[#6315d9]">k</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#5b4b86]">
              Questões e redações corrigidas por IA
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-head text-5xl sm:text-6xl font-extrabold text-[#25104a] tracking-tight">
              15<span className="text-[#6315d9]">min</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#5b4b86]">
              Tempo médio para fechar uma turma inteira
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-head text-5xl sm:text-6xl font-extrabold text-[#25104a] tracking-tight">
              99.2<span className="text-[#6315d9]">%</span>
            </div>
            <p className="text-sm sm:text-base font-semibold text-[#5b4b86]">
              Índice de satisfação de professores
            </p>
          </div>
        </div>

        {/* Depoimentos de Professores */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#6315d9] mb-3">
              <span className="w-6 h-0.5 bg-[#6315d9]"></span>
              QUEM USA RECOMENDA
              <span className="w-6 h-0.5 bg-[#6315d9]"></span>
            </div>
            <h3 className="font-head text-3xl font-extrabold text-[#25104a] tracking-tight">
              O que dizem os professores que resgataram seus fins de semana
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-8 rounded-2xl bg-[#f3edff] border border-[#e2d9f7] flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group"
              >
                <div className="space-y-4">
                  <div className="flex gap-1 text-[#6315d9]">
                    {[...Array(t.stars)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#6315d9]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#25104a]/90 leading-relaxed italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#e2d9f7]/60">
                  <h4 className="font-head font-bold text-sm text-[#25104a]">{t.name}</h4>
                  <p className="text-xs text-[#6315d9] font-semibold">{t.role}</p>
                  <p className="text-[11px] text-[#6e5f94] mt-0.5">{t.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
