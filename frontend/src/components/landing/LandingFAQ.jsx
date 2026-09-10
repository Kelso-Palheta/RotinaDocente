"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Preciso cadastrar cartão de crédito para testar?",
      a: "Não! Ao se cadastrar, você ganha imediatamente 15 créditos gratuitos por mês para usar em qualquer ferramenta (Diário, Redação ENEM, Atividades e Calendário) sem inserir nenhum dado bancário.",
    },
    {
      q: "Como a IA do Gestão Docente corrige as redações do ENEM?",
      a: "Nossa IA foi calibrada e treinada especificamente na matriz oficial do Inep/ENEM. Ela avalia individualmente as 5 competências (Norma culta, Tema/Repertório, Projeto de texto, Coesão e Proposta de intervenção com os 5 elementos obrigatórios), atribuindo notas de 0 a 200 por competência e gerando uma devolutiva pedagógica detalhada.",
    },
    {
      q: "As questões geradas são realmente alinhadas à BNCC?",
      a: "Sim. Todas as questões geradas pelo nosso módulo de atividades seguem as diretrizes e códigos de habilidades da Base Nacional Comum Curricular (BNCC) e da matriz do SAEB, com 4 alternativas balanceadas e justificativa comentada da alternativa correta.",
    },
    {
      q: "Como funciona a importação de alunos no Diário Pedagógico?",
      a: "Você pode importar qualquer planilha nos formatos XLSX, XLS ou CSV da sua escola ou Google Sheets. O sistema reconhece automaticamente os nomes e números de chamada, criando sua turma em menos de 10 segundos.",
    },
    {
      q: "Os dados dos meus alunos estão seguros de acordo com a LGPD?",
      a: "Totalmente. O Gestão Docente adota criptografia de ponta a ponta e rígidas políticas de privacidade em total conformidade com a Lei Geral de Proteção de Dados (LGPD) e diretrizes de proteção a dados de menores.",
    },
    {
      q: "Posso cancelar minha assinatura Pro quando quiser?",
      a: "Sim, com apenas 1 clique direto no seu painel, sem multas, sem contratos de fidelidade e sem burocracia. Você continuará com acesso até o final do período vigente contratado.",
    },
    {
      q: "O que acontece se meus créditos acabarem?",
      a: "No plano gratuito, seus créditos se renovam automaticamente todo mês. Se precisar de mais correções ou atividades para um período de provas, você pode assinar o plano Pro Ilimitado ou adquirir pacotes avulsos que nunca expiram.",
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white border-t border-[#dce0f0]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#f60c49] mb-3">
            <span className="w-6 h-0.5 bg-[#f60c49]"></span>
            TIRE SUAS DÚVIDAS
            <span className="w-6 h-0.5 bg-[#f60c49]"></span>
          </div>
          <h2 className="font-head text-3xl sm:text-4xl font-extrabold text-[#101942] tracking-tight">
            Perguntas Frequentes
          </h2>
          <p className="mt-3 text-base text-[#6070a0]">
            Tudo o que você precisa saber para começar a transformar sua rotina docente hoje.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[#dce0f0] bg-[#f7f8fc] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-head font-bold text-base sm:text-lg text-[#101942] hover:text-[#f60c49] transition-colors"
                >
                  <span>{faq.q}</span>
                  <div
                    className={`w-8 h-8 rounded-full bg-white border border-[#dce0f0] flex items-center justify-center text-[#101942] shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-[#f60c49] border-[#f60c49]" : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm sm:text-base text-[#6070a0] leading-relaxed border-t border-[#dce0f0]/60 pt-4 bg-white animate-card-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
