import localFont from "next/font/local";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const manrope = localFont({
  src: "./fontes/manrope.woff2",
  variable: "--font-manrope",
  weight: "400 800",
  display: "swap",
});

const inter = localFont({
  src: "./fontes/inter.woff2",
  variable: "--font-inter",
  weight: "400 700",
  display: "swap",
});

export const metadata = {
  title: "Rotina Docente — Toda a sua rotina letiva em 1 clique",
  description: "Plataforma inteligente de gestão e automação pedagógica para professores: diário de notas, calendário letivo com Smart Shift, gerador de atividades BNCC, corretor de redações ENEM e agentes de IA.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${manrope.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
