"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Menu, X, Sparkles } from "lucide-react";

export function LandingHeader({ onOpenAuth }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-[#e2d9f7] py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo SimuladoApp.Edu */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-[#25104a] flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
            </svg>
          </div>
          <span className="font-head text-xl font-extrabold text-[#25104a] tracking-tight">
            Rotina<span className="text-[#6315d9]">Docente</span>
          </span>
        </a>

        {/* Links de navegação desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#25104a]/80">
          <a href="#problemas" className="hover:text-[#6315d9] transition-colors">
            Por que usar
          </a>
          <a href="#jornada" className="hover:text-[#6315d9] transition-colors">
            Como funciona
          </a>
          <a href="#modulos" className="hover:text-[#6315d9] transition-colors">
            Módulos
          </a>
          <a href="#calculadora" className="hover:text-[#6315d9] transition-colors">
            Economia de Tempo
          </a>
          <a href="#precos" className="hover:text-[#6315d9] transition-colors">
            Planos
          </a>
          <a href="#faq" className="hover:text-[#6315d9] transition-colors">
            Dúvidas
          </a>
        </nav>

        {/* Ações / Login & Cadastro */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => onOpenAuth("login")}
            className="text-sm font-bold text-[#25104a] hover:text-[#6315d9] transition-colors px-3 py-2"
          >
            Entrar
          </button>
          <button
            onClick={() => onOpenAuth("cadastro")}
            className="btn-brand-primary text-sm py-2.5 px-5 flex items-center gap-2 group"
          >
            <span>Experimentar Grátis</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Menu Hamburguer Mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#25104a] hover:bg-[#f3edff] rounded-xl transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Drawer Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#e2d9f7] px-6 py-6 space-y-4 shadow-xl animate-card-in">
          <nav className="flex flex-col gap-3 text-base font-semibold text-[#25104a]">
            <a
              href="#problemas"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#6315d9]"
            >
              Por que usar
            </a>
            <a
              href="#jornada"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#6315d9]"
            >
              Como funciona
            </a>
            <a
              href="#modulos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#6315d9]"
            >
              Módulos do Hub
            </a>
            <a
              href="#calculadora"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#6315d9]"
            >
              Economia de Tempo
            </a>
            <a
              href="#precos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#6315d9]"
            >
              Planos & Preços
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2 hover:text-[#6315d9]"
            >
              Dúvidas
            </a>
          </nav>

          <div className="pt-4 border-t border-[#e2d9f7] flex flex-col gap-3">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth("login");
              }}
              className="w-full btn-brand-ghost py-3 text-sm font-bold justify-center flex"
            >
              Fazer Login
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth("cadastro");
              }}
              className="w-full btn-brand-primary py-3 text-sm font-bold justify-center flex items-center gap-2"
            >
              <span>Começar Gratuitamente</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
