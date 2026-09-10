"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { X, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export function AuthModal({ isOpen, onClose, initialMode = "cadastro" }) {
  const { loginGoogle, loginEmail, cadastrarEmail, recuperarSenha } = useAuth();
  const [modo, setModo] = useState(initialMode); // "login" | "cadastro" | "recuperar"
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");
    setSucesso("");
    setLoading(true);
    try {
      if (modo === "login") {
        await loginEmail(email, senha); window.location.href = "/";
        onClose();
      } else if (modo === "cadastro") {
        await cadastrarEmail(email, senha, { nome }); window.location.href = "/";
        onClose();
      } else {
        await recuperarSenha(email);
        setSucesso("Email de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.");
        setEmail("");
      }
    } catch (err) {
      const map = {
        "auth/invalid-credential": "Email ou senha inválidos.",
        "auth/email-already-in-use": "Este email já está cadastrado.",
        "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
        "auth/invalid-email": "Formato de email inválido.",
        "auth/user-not-found": "Nenhum usuário encontrado com este email.",
      };
      setErro(map[err.code] || err.message || "Erro ao processar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErro("");
      await loginGoogle(); window.location.href = "/";
      onClose();
    } catch (err) {
      if (err.code === "auth/operation-not-allowed") {
        setErro("Login com Google desativado no Firebase Console.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setErro("O popup foi fechado antes de concluir o login.");
      } else {
        setErro(`Erro Google: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#101942]/70 backdrop-blur-md animate-card-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#dce0f0] overflow-hidden">
        {/* Header decorativo */}
        <div className="p-6 pb-4 bg-gradient-to-b from-[#fff2f6] to-white border-b border-[#fde4ec]/60 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#6070a0] hover:text-[#101942] hover:bg-[#101942]/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fde4ec] text-[#d40840]">
              <Sparkles className="w-3.5 h-3.5 text-[#f60c49]" />
              {modo === "cadastro" ? "15 Créditos Grátis" : "Hub Educacional"}
            </span>
          </div>

<h3 className="font-head text-2xl font-extrabold text-[#101942]">
             {modo === "cadastro"
               ? "Crie sua conta no Gestão Docente"
               : modo === "login"
               ? "Bem-vindo de volta ao Gestão Docente"
               : "Recuperar sua senha"}
           </h3>
          <p className="text-xs text-[#6070a0] mt-1">
            {modo === "cadastro"
              ? "Sem necessidade de cartão de crédito. Comece a usar em menos de 1 minuto."
              : modo === "login"
              ? "Acesse seus diários, turmas, atividades e correções."
              : "Informe seu email para enviarmos as instruções de redefinição."}
          </p>
        </div>

        <div className="p-6 space-y-4">
          {modo !== "recuperar" && (
            <>
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm text-[#101942] bg-white border border-[#dce0f0] shadow-sm hover:bg-[#eef0f8]/50 hover:border-[#6070a0]/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[#dce0f0]" />
                <span className="text-xs font-semibold text-[#9098c0] uppercase tracking-wider">ou com email</span>
                <div className="flex-1 h-px bg-[#dce0f0]" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {modo === "cadastro" && (
              <div>
                <label className="block text-xs font-bold text-[#101942] mb-1">
                  Seu nome completo
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Profa. Mariana Silva"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#dce0f0] bg-[#eef0f8]/30 text-[#101942] placeholder-[#9098c0] focus:outline-none focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Email institucional ou pessoal
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@escola.com.br"
                required
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#dce0f0] bg-[#eef0f8]/30 text-[#101942] placeholder-[#9098c0] focus:outline-none focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all"
              />
            </div>

            {modo !== "recuperar" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-[#101942]">
                    Senha
                  </label>
                  {modo === "login" && (
                    <button
                      type="button"
                      onClick={() => { setModo("recuperar"); setErro(""); setSucesso(""); }}
                      className="text-xs font-semibold text-[#f60c49] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required={modo !== "recuperar"}
                  minLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-[#dce0f0] bg-[#eef0f8]/30 text-[#101942] placeholder-[#9098c0] focus:outline-none focus:ring-2 focus:ring-[#f60c49]/30 focus:border-[#f60c49] transition-all"
                />
              </div>
            )}

            {erro && (
              <p className="text-xs text-[#d40840] font-medium bg-[#fff2f6] border border-[#fde4ec] px-3 py-2 rounded-xl">
                {erro}
              </p>
            )}

            {sucesso && (
              <div className="flex items-start gap-2 text-xs text-[#101942] font-medium bg-[#eef0f8] border border-[#dce0f0] px-3 py-2.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                <span>{sucesso}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-brand-primary py-3 px-5 text-sm flex items-center justify-center gap-2 group disabled:opacity-60"
            >
              {loading ? (
                <span>Processando...</span>
              ) : (
                <>
                  <span>
                    {modo === "login"
                      ? "Acessar Plataforma"
                      : modo === "cadastro"
                      ? "Criar Minha Conta Gratuita"
                      : "Enviar Link de Recuperação"}
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Modo */}
          <div className="pt-2 text-center text-xs text-[#6070a0]">
            {modo === "recuperar" ? (
              <button
                type="button"
                onClick={() => { setModo("login"); setErro(""); setSucesso(""); }}
                className="font-bold text-[#f60c49] hover:underline"
              >
                ← Voltar para o Login
              </button>
            ) : (
              <p>
                {modo === "login" ? "Ainda não tem conta?" : "Já possui cadastro?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setModo(modo === "login" ? "cadastro" : "login");
                    setErro("");
                    setSucesso("");
                  }}
                  className="font-bold text-[#f60c49] hover:underline"
                >
                  {modo === "login" ? "Cadastre-se grátis" : "Fazer login"}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
