"use client";

import { createContext, useContext, useEffect, useState } from "react";
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

  const recarregarPerfil = async (djangoUser = null) => {
    try {
      const { access } = api.getTokens();
      if (access) {
        const [perfilDjango, saldoDjango] = await Promise.all([
          api.auth.perfil().catch(() => null),
          api.auth.saldoCreditos().catch(() => null),
        ]);

        if (perfilDjango) {
          setUser({
            uid: String(perfilDjango.id),
            email: perfilDjango.email,
            displayName: perfilDjango.nome_completo || perfilDjango.email.split("@")[0],
            isDjango: true
          });
          setPerfil((prev) => ({
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

        if (saldoDjango) {
          setCreditos(saldoDjango);
        }
      }
    } catch (e) {
      console.warn("Aviso ao carregar dados do Django:", e);
    }
  };

  useEffect(() => {
    const { access } = api.getTokens();
    if (access) {
      recarregarPerfil().finally(() => setLoading(false));
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const ref = doc(db, "professores", firebaseUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          let data = snap.data();
          // 👑 INJEÇÃO VIP PARA O DONO DO SISTEMA NO FIREBASE 👑
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
            isAdmin: isVip
          };
          await setDoc(ref, novo);
          setPerfil(novo);
        }
      } else if (!access) {
        setPerfil(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const loginDjango = async (email, password) => {
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

