"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { api } from "@/lib/api-client";

import { mesmaSessaoDjango } from "@/dominio/auth/sessaoDjango";

const AuthContext = createContext(null);

const MODULOS_PADRAO = [
  "diario-planejamento",
  "calendario-pedagogico",
  "gerador-atividades",
  "redacao-corretor",
  "agente-linguagens",
  "analytics-pedagogico",
  "horario-escolar-inteligente",
];

async function buscarPerfilDjango() {
  try {
    const [perfilDjango, saldoDjango] = await Promise.all([
      api.auth.perfil().catch(() => null),
      api.auth.saldoCreditos().catch(() => null),
    ]);
    return { perfilDjango, saldoDjango };
  } catch (error) {
    console.warn("Aviso ao carregar dados do Django:", error);
    return { perfilDjango: null, saldoDjango: null };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [creditos, setCreditos] = useState({
    tipo_plano: "gratuito",
    saldo_disponivel: 0,
    creditos_mensais_total: 0,
    creditos_utilizados_mes: 0,
    creditos_avulsos_extras: 0,
  });
  const [loading, setLoading] = useState(true);

  const montadoRef = useRef(false);
  const sessaoRef = useRef(0);

  const aplicarPerfilDjango = useCallback((dados, sessao, tokens) => {
    if (!montadoRef.current || sessao !== sessaoRef.current || !mesmaSessaoDjango(tokens, api.getTokens())) return;
    const { perfilDjango, saldoDjango } = dados;
    if (perfilDjango) {
      setUser({
        uid: String(perfilDjango.id),
        email: perfilDjango.email,
        displayName: perfilDjango.nome_completo || perfilDjango.email.split("@")[0],
        isDjango: true,
      });
      setPerfil(prev => ({
        ...prev,
        id: perfilDjango.id,
        nome: perfilDjango.nome_completo || perfilDjango.email.split("@")[0],
        email: perfilDjango.email,
        escola: perfilDjango.escola,
        disciplina_principal: perfilDjango.disciplina_principal,
        plano: perfilDjango.plano || perfilDjango.assinatura?.tipo_plano || (perfilDjango.email === "kelsopalhetadev@gmail.com" ? "combo_total" : "gratuito"),
        isAdmin: perfilDjango.email === "kelsopalhetadev@gmail.com" || perfilDjango.is_superuser || false,
        modulos_permitidos: MODULOS_PADRAO,
      }));
    }
    if (saldoDjango) setCreditos(saldoDjango);
  }, []);

  const recarregarPerfil = useCallback(async () => {
    const tokens = api.getTokens();
    if (!tokens.access) return;
    const sessao = sessaoRef.current;
    const dados = await buscarPerfilDjango();
    aplicarPerfilDjango(dados, sessao, tokens);
  }, [aplicarPerfilDjango]);

  useEffect(() => {
    montadoRef.current = true;
    const sessaoInicial = ++sessaoRef.current;
    const tokens = api.getTokens();
    let assinaturaAtiva = true;
    if (tokens.access) {
      buscarPerfilDjango().then(dados => {
        aplicarPerfilDjango(dados, sessaoInicial, tokens);
      }).finally(() => {
        if (montadoRef.current && sessaoInicial === sessaoRef.current) setLoading(false);
      });
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!assinaturaAtiva) return;
      // Firebase sem usuário não encerra uma restauração Django ainda em curso.
      if (!firebaseUser && api.getTokens().access) return;
      const sessao = ++sessaoRef.current;
      const ativa = () => montadoRef.current && sessao === sessaoRef.current;
      if (!ativa()) return;
      setUser(firebaseUser);
      setPerfil(null);
      try {
        if (firebaseUser) {
          const ref = doc(db, "professores", firebaseUser.uid);
          const snap = await getDoc(ref);
          if (!ativa()) return;
          if (snap.exists()) {
            const data = { ...snap.data() };
            if (data.email === "kelsopalhetadev@gmail.com" || firebaseUser.email === "kelsopalhetadev@gmail.com") {
              data.plano = "combo_total";
              data.isAdmin = true;
            }
            setPerfil(data);
          } else {
            const isVip = firebaseUser.email === "kelsopalhetadev@gmail.com";
            const novo = {
              nome: firebaseUser.displayName || "",
              email: firebaseUser.email,
              modulos_permitidos: MODULOS_PADRAO,
              plano: isVip ? "combo_total" : "gratuito",
              isAdmin: isVip,
            };
            await setDoc(ref, novo);
            if (ativa()) setPerfil(novo);
          }
        }
      } catch (error) {
        if (ativa()) console.warn("Aviso ao carregar perfil Firebase:", error);
      } finally {
        if (ativa()) setLoading(false);
      }
    });

    return () => {
      assinaturaAtiva = false;
      montadoRef.current = false;
      sessaoRef.current += 1;
      unsub();
    };
  }, [aplicarPerfilDjango]);

  const loginDjango = async (email, password) => {
    sessaoRef.current += 1;
    setLoading(true);
    try {
      await api.auth.login(email, password);
      await recarregarPerfil();
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch {}
    } catch (error) {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (fbErr) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const cadastrarDjango = async (dados) => {
    sessaoRef.current += 1;
    setLoading(true);
    try {
      await api.auth.registro({
        email: dados.email,
        password: dados.password,
        nome_completo: dados.nome,
        escola: dados.escola || "",
        disciplina_principal: dados.disciplina || "",
      });
      await recarregarPerfil();
      try {
        const cred = await createUserWithEmailAndPassword(auth, dados.email, dados.password);
        const novo = {
          nome: dados.nome || dados.email.split("@")[0],
          email: dados.email,
          modulos_permitidos: MODULOS_PADRAO,
          plano: "gratuito",
        };
        await setDoc(doc(db, "professores", cred.user.uid), novo);
      } catch {}
    } catch (error) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, dados.email, dados.password);
        const novo = {
          nome: dados.nome || dados.email.split("@")[0],
          email: dados.email,
          modulos_permitidos: MODULOS_PADRAO,
          plano: "gratuito",
        };
        await setDoc(doc(db, "professores", cred.user.uid), novo);
      } catch (fbErr) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const loginGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro no Google Login:", error);
      throw error;
    }
  };

  const loginEmail = (email, password) => loginDjango(email, password);

  const cadastrarEmail = async (email, password, extra = {}) =>
    cadastrarDjango({ email, password, ...extra });

  const recuperarSenha = (email) => sendPasswordResetEmail(auth, email);

  const logout = () => {
    sessaoRef.current += 1;
    api.clearTokens();
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.warn("Erro ao limpar storage:", e);
      }
    }
    setUser(null);
    setPerfil(null);
    setLoading(false);
    setCreditos({
      tipo_plano: "gratuito",
      saldo_disponivel: 0,
      creditos_mensais_total: 0,
      creditos_utilizados_mes: 0,
      creditos_avulsos_extras: 0,
    });
    return signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        perfil,
        creditos,
        loading,
        loginGoogle,
        loginEmail,
        cadastrarEmail,
        recuperarSenha,
        recarregarPerfil,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve estar dentro de AuthProvider");
  return ctx;
}

export function useOptionalAuth() {
  const ctx = useContext(AuthContext);
  return ctx || {};
}

