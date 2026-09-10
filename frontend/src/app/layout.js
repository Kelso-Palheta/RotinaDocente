import { Manrope, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "Gestão Docente — Toda a sua rotina letiva em 1 clique",
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
