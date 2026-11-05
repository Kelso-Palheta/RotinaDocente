"use client";

import { useState } from "react";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingTicker } from "./LandingTicker";
import { LandingProblems } from "./LandingProblems";
import { LandingJourney } from "./LandingJourney";
import { LandingModules } from "./LandingModules";
import { LandingCalculator } from "./LandingCalculator";
import { LandingStats } from "./LandingStats";
import { LandingPricing } from "./LandingPricing";
import { LandingFAQ } from "./LandingFAQ";
import { LandingFooter } from "./LandingFooter";
import { AuthModal } from "./AuthModal";

export default function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("cadastro");

  const handleOpenAuth = (mode = "cadastro") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#25104a] font-sans antialiased selection:bg-[#6315d9] selection:text-white">
      {/* Header Fixo */}
      <LandingHeader onOpenAuth={handleOpenAuth} />

      {/* Seção Hero de Alto Impacto */}
      <LandingHero onOpenAuth={handleOpenAuth} />

      {/* Ticker / Marquee Infinito */}
      <LandingTicker />

      {/* Dores & Problemas Reais do Professor */}
      <LandingProblems />

      {/* Jornada Pedagógica Interativa (Navy #25104a) */}
      <LandingJourney onOpenAuth={handleOpenAuth} />

      {/* Showcase dos 4 Módulos Centrais */}
      <LandingModules onOpenAuth={handleOpenAuth} />

      {/* Calculadora Interativa de Tempo Recuperado */}
      <LandingCalculator onOpenAuth={handleOpenAuth} />

      {/* Prova Social & Números */}
      <LandingStats />

      {/* Planos e Tabela de Preços */}
      <LandingPricing onOpenAuth={handleOpenAuth} />

      {/* FAQ / Dúvidas Frequentes */}
      <LandingFAQ />

      {/* Rodapé e CTA Final */}
      <LandingFooter onOpenAuth={handleOpenAuth} />

      {/* Modal de Autenticação Unificado */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
        key={authMode}
      />
    </div>
  );
}
