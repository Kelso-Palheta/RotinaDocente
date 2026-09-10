"use client";

import { ArrowRight, ShieldCheck, Heart } from "lucide-react";

export function LandingFooter({ onOpenAuth }) {
  return (
    <footer className="bg-[#101942] text-white pt-20 pb-12 overflow-hidden relative">
      {/* Banner de CTA Final */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#101942] via-[#1c275e] to-[#f60c49]/30 p-10 sm:p-16 border border-white/10 overflow-hidden shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider border border-white/20">
            COMECE EM MENOS DE 1 MINUTO
          </div>

          <h2 className="font-head text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white max-w-2xl mx-auto leading-tight">
            Pronto para transformar sua rotina e ter seus finais de semana de volta?
          </h2>

          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto">
            Junte-se a mais de 1.200 professores que já automatizaram a burocracia escolar.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onOpenAuth("cadastro")}
              className="btn-brand-primary text-base sm:text-lg py-4 px-10 inline-flex items-center gap-3 group shadow-xl shadow-[#f60c49]/30"
            >
              <span>Criar Minha Conta Gratuita</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
            </button>
          </div>

          <p className="text-xs text-white/50">
            15 créditos grátis todo mês • Sem necessidade de cartão de crédito
          </p>
        </div>
      </div>

      {/* Rodapé Institucional */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10 text-sm">
          {/* Coluna 1 - Marca */}
          <div className="space-y-4 md:col-span-1">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f60c49] flex items-center justify-center text-white font-bold">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c0 1.1 2.7 2 6 2s6-.9 6-2v-5" />
                </svg>
              </div>
              <span className="font-head text-lg font-extrabold text-white">
                Gestão<span className="text-[#f60c49]">Docente</span>
              </span>
            </a>
            <p className="text-xs text-white/60 leading-relaxed">
              Toda a sua rotina letiva em 1 clique. O ecossistema inteligente de planejamento, avaliações, redações e gestão pedagógica.
            </p>
          </div>

          {/* Coluna 2 - Recursos */}
          <div className="space-y-3">
            <h4 className="font-head font-bold text-sm text-white uppercase tracking-wider">
              Módulos
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li><a href="#modulos" className="hover:text-white transition-colors">Diário Pedagógico</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">Calendário & Smart Shift</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">Gerador de Atividades BNCC</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">Corretor de Redações ENEM</a></li>
              <li><a href="#modulos" className="hover:text-white transition-colors">Agentes Pedagógicos IA</a></li>
            </ul>
          </div>

          {/* Coluna 3 - Links Rápidos */}
          <div className="space-y-3">
            <h4 className="font-head font-bold text-sm text-white uppercase tracking-wider">
              Navegação
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li><a href="#problemas" className="hover:text-white transition-colors">Por que usar</a></li>
              <li><a href="#jornada" className="hover:text-white transition-colors">Como funciona</a></li>
              <li><a href="#calculadora" className="hover:text-white transition-colors">Calculadora de Tempo</a></li>
              <li><a href="#precos" className="hover:text-white transition-colors">Planos e Preços</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Perguntas Frequentes</a></li>
            </ul>
          </div>

          {/* Coluna 4 - Segurança e Suporte */}
          <div className="space-y-3">
            <h4 className="font-head font-bold text-sm text-white uppercase tracking-wider">
              Segurança & Suporte
            </h4>
            <div className="space-y-2 text-xs text-white/60">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
                Conformidade Total com LGPD Escolar
              </p>
              <p>Suporte: suporte@gestaodocente.com.br</p>
              <p>Ecossistema oficial: gestaodocente.com.br</p>
            </div>
          </div>
        </div>

        {/* Linha de Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <p>© {new Date().getFullYear()} Gestão Docente — Toda a sua rotina letiva em 1 clique. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Desenvolvido com <Heart className="w-3.5 h-3.5 text-[#f60c49] fill-[#f60c49]" /> para os professores brasileiros.
          </p>
        </div>
      </div>
    </footer>
  );
}
