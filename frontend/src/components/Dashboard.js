"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLATFORM_MODULES } from "@/config/modules";
import { verificarPermissaoModulo, PLANOS_CONFIG } from "@/config/planos";
import {
  BookOpen,
  PenTool,
  MessageSquare,
  ClipboardList,
  Lock,
  LogOut,
  X,
  User,
  Calendar,
  BarChart3,
  ArrowRight,
  Sparkles,
  Clock,
  Key,
  CheckCircle2,
  AlertCircle,
  Cpu,
} from "lucide-react";
import { ProfileModal } from "@/components/diario/ProfileModal";
import { ModalConectarIA } from "@/components/ai/ModalConectarIA";
import { useAIConfig } from "@/hooks/useAIConfig";
import { AIProviders } from "@/dominio/ai/AIProviders";

const ICON_MAP = {
  BookOpen,
  PenTool,
  MessageSquare,
  ClipboardList,
  Calendar,
  BarChart3,
  Clock,
};

function Toast({ message, onClose }) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce"
      style={{ animationDuration: "0.4s" }}
    >
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl bg-[#101942] text-white border border-white/10">
        <Lock size={16} className="text-[#f60c49]" />
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, perfil, creditos, logout } = useAuth();
  const router = useRouter();
  const [toast, setToast] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const { config, temChave } = useAIConfig();

  const planoAtivoId = perfil?.plano || creditos?.tipo_plano || "gratuito";
  const planoInfo = PLANOS_CONFIG[planoAtivoId] || PLANOS_CONFIG.gratuito;

  const handleCardClick = (mod) => {
    const temAcesso = verificarPermissaoModulo(perfil, mod.id);
    if (temAcesso) {
      router.push(mod.path);
    } else {
      setToast(
        `O módulo "${mod.nome}" não faz parte do seu plano atual. Faça upgrade para desbloquear.`
      );
    }
  };

  const provAtivo = config?.provider ? AIProviders[config.provider] : null;

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#101942] font-sans flex flex-col selection:bg-[#f60c49] selection:text-white">
      {/* Header Superior Navy */}
      <header className="bg-[#101942] text-white border-b border-white/10 px-4 sm:px-8 py-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Logo Gestão Docente */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f60c49] flex items-center justify-center text-white shadow-md">
              <svg
                width="22"
                height="22"
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
            <div>
              <h1 className="font-head text-xl font-extrabold tracking-tight text-white leading-none">
                Gestão<span className="text-[#f60c49]">Docente</span>
              </h1>
              <p className="text-xs text-white/60 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                Olá, {perfil?.nome || "Professor(a)"}
              </p>
            </div>
          </div>

          {/* Ações de Usuário & Botão Conectar IA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Botão Conectar IA / Status da Chave */}
            <button
              onClick={() => setShowAIModal(true)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                temChave
                  ? "bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30 hover:bg-[#22c55e]/25"
                  : "bg-[#f60c49] text-white hover:bg-[#d40840] shadow-md hover:shadow-lg animate-pulse"
              }`}
              title="Configurar Chave de Inteligência Artificial"
            >
              <Key size={15} />
              <span className="hidden sm:inline">
                {temChave ? `IA: ${provAtivo?.nome || "Conectada"}` : "Conectar IA"}
              </span>
              <span className="sm:hidden">
                {temChave ? "IA Ativa" : "Conectar IA"}
              </span>
            </button>

            <button
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 text-white border border-white/15 hover:bg-white/15 transition-all"
            >
              <User size={15} className="text-[#f60c49]" />
              <span className="hidden sm:inline">Perfil</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/10 text-white border border-white/15 hover:bg-[#d40840] hover:border-[#d40840] transition-all"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Hub */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {/* Banner de Boas-Vindas com Status de IA & Plano */}
        <div className="bg-gradient-to-r from-[#101942] via-[#1a255a] to-[#101942] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-[#101942]/20 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f60c49] text-white">
              <Sparkles size={12} />
              <span>Painel do Docente</span>
            </div>
            <h2 className="font-head text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Seu Hub Pedagógico com Inteligência Artificial
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Toda a sua rotina letiva em 1 clique. Planeje aulas, gere atividades e corrija redações com a sua própria API de IA de preferência.
            </p>

            {/* Aviso de Chave BYOK */}
            <div className="pt-1">
              {temChave ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 text-xs text-[#4ade80] font-semibold">
                  <CheckCircle2 size={14} />
                  <span>
                    Chave própria conectada: <strong className="text-white">{provAtivo?.nome}</strong> ({config?.getMaskedKey()})
                  </span>
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="ml-2 text-white/80 hover:text-white underline text-[11px]"
                  >
                    Gerenciar
                  </button>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#f60c49]/20 border border-[#f60c49]/40 text-xs text-white font-semibold">
                  <AlertCircle size={15} className="text-[#f60c49]" />
                  <span>
                    Nenhuma chave de IA conectada.
                  </span>
                  <button
                    onClick={() => setShowAIModal(true)}
                    className="ml-2 px-2.5 py-1 rounded-lg bg-[#f60c49] hover:bg-[#d40840] text-white font-extrabold text-[11px] shadow-sm transition-all cursor-pointer"
                  >
                    Conectar agora
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative z-10 shrink-0 w-full md:w-auto">
            <div className="px-5 py-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-2.5 min-w-[240px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-white/60 font-bold uppercase tracking-wider">
                  Plano Ativo
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#f60c49]/20 text-[#f60c49] border border-[#f60c49]/30">
                  {planoInfo.tag}
                </span>
              </div>

              <div className="pt-1">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="text-white/80">Provedor de IA</span>
                  <span className="text-white font-extrabold text-sm">
                    {temChave ? provAtivo?.nome : "Desconectado"}
                  </span>
                </div>

                <div className="text-[11px] text-white/60">
                  {temChave ? (
                    <span className="flex items-center gap-1 text-[#4ade80]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]"></span>
                      Operando com cota própria
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      Requer chave para recursos IA
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Módulos */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-head text-base font-bold text-[#101942] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-4 bg-[#f60c49] rounded-full"></span>
              Ferramentas Disponíveis
            </h3>
            <span className="text-xs font-semibold text-[#6070a0]">
              {PLATFORM_MODULES.length} módulos ativos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_MODULES.map((mod) => {
              const temAcesso = verificarPermissaoModulo(perfil, mod.id);
              const Icon = ICON_MAP[mod.icon] || BookOpen;

              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => handleCardClick(mod)}
                  className={`p-6 rounded-3xl text-left bg-white border border-[#dce0f0] shadow-sm transition-all duration-300 relative group flex flex-col justify-between min-h-[200px] ${
                    temAcesso
                      ? "hover:shadow-xl hover:border-[#f60c49]/40 hover:-translate-y-1 cursor-pointer"
                      : "opacity-50 cursor-not-allowed bg-[#f7f8fc]"
                  }`}
                >
                  {/* Badge de Cadeado */}
                  {!temAcesso && (
                    <div className="absolute top-4 right-4 p-2 rounded-xl bg-[#eef0f8] text-[#6070a0]">
                      <Lock size={16} />
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Ícone com Fundo Rosa Suave */}
                    <div className="w-12 h-12 rounded-2xl bg-[#fff2f6] border border-[#fde4ec] text-[#f60c49] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <Icon size={24} />
                    </div>

                    {/* Título e Descrição */}
                    <div>
                      <h4 className="font-head font-bold text-lg text-[#101942] group-hover:text-[#f60c49] transition-colors">
                        {mod.nome}
                      </h4>
                      <p className="text-xs text-[#6070a0] mt-1.5 leading-relaxed">
                        {mod.descricao}
                      </p>
                    </div>
                  </div>

                  {/* Ação Inferior */}
                  {temAcesso && (
                    <div className="pt-4 border-t border-[#dce0f0]/60 flex items-center justify-between text-xs font-bold text-[#f60c49]">
                      <span>Abrir ferramenta</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Modal de Perfil */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onOpenAIModal={() => {
            setShowProfile(false);
            setShowAIModal(true);
          }}
        />
      )}

      {/* Modal de Conectar Chave de IA (BYOK) */}
      <ModalConectarIA
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
      />
    </div>
  );
}
