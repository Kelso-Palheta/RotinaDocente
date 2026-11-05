"use client";

export function LandingTicker() {
  const items = [
    "DIÁRIO DE NOTAS AUTOMÁTICO",
    "CORREÇÃO DE REDAÇÃO ENEM COM IA",
    "GERADOR DE ATIVIDADES BNCC",
    "GRADE HORÁRIA INTELIGENTE",
    "DEVOLUTIVAS PEDAGÓGICAS FORMATIVAS",
    "EXPORTAÇÃO DE BOLETINS EM 1 CLIQUE",
    "AGENTES ESPECIALISTAS ENEM",
    "IMPORTAÇÃO INTELIGENTE DE PLANOS",
  ];

  return (
    <div className="border-y border-[#e2d9f7] py-6 overflow-hidden bg-white">
      <div className="flex animate-marquee gap-14 items-center">
        {[...items, ...items].map((text, idx) => (
          <div
            key={idx}
            className="flex items-center gap-14 text-sm sm:text-base font-extrabold text-[#6e5f94] tracking-wider whitespace-nowrap"
          >
            <span className="text-[#25104a]/60 hover:text-[#6315d9] transition-colors">{text}</span>
            <span className="w-2 h-2 rounded-full bg-[#6315d9]/40"></span>
          </div>
        ))}
      </div>
    </div>
  );
}
