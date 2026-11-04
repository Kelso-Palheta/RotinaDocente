"use client";

import { BookOpen, PenTool, ClipboardList, Calendar, Check, ArrowRight, Sparkles, FileSpreadsheet, Layers, Award, Clock, Cpu } from "lucide-react";

export function LandingModules({ onOpenAuth }) {
  return (
    <section id="modulos" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#0f766e] mb-3">
            <span className="w-6 h-0.5 bg-[#0f766e]"></span>
            ECOSSISTEMA COMPLETO
            <span className="w-6 h-0.5 bg-[#0f766e]"></span>
          </div>
          <h2 className="font-head text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#123c3a] tracking-tight">
            Ferramentas especializadas para cada etapa do seu trabalho.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4f6b63]">
            Projetadas especificamente para a realidade das escolas brasileiras, com suporte integral à BNCC e matriz do ENEM.
          </p>
        </div>

        {/* Módulo 1: Diário Pedagógico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f3f7f5] text-[#123c3a]">
              GESTÃO DE TURMAS & NOTAS
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#123c3a] leading-tight">
              Diário Pedagógico: Chega de perder horas calculando médias no Excel.
            </h3>
            <p className="text-base text-[#4f6b63] leading-relaxed">
              Importe listas de turmas a partir de qualquer planilha. O Rotina Docente calcula automaticamente médias ponderadas, contabiliza faltas e gera relatórios individuais de desempenho por aluno.
            </p>
            <ul className="space-y-3 text-sm text-[#123c3a] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Importação instantânea via XLSX ou Google Sheets
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Cálculo automático de médias bimestrais e recuperação
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Exportação de boletins individuais e relatórios para a coordenação
              </li>
            </ul>
            <button
              onClick={() => onOpenAuth("cadastro")}
              className="btn-brand-ghost py-3 px-6 text-sm flex items-center gap-2"
            >
              <span>Testar Diário Grátis</span>
              <ArrowRight className="w-4 h-4 text-[#0f766e]" />
            </button>
          </div>

          <div className="lg:col-span-6 bg-[#f3f7f5] p-6 rounded-3xl border border-[#d5e3dc] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#d5e3dc] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#d5e3dc]">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#0F766E]" />
                  <span className="font-bold text-sm text-[#123c3a]">Planilha_Notas_3Ano_B.xlsx</span>
                </div>
                <span className="text-xs font-extrabold text-[#0F766E] bg-[#f3f7f5] px-2 py-1 rounded-md">
                  Importada com Sucesso
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#f3f7f5]/50">
                  <span className="font-semibold text-[#123c3a]">Total de Alunos Vinculados:</span>
                  <span className="font-bold text-[#123c3a]">34 alunos</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#f3f7f5]/50">
                  <span className="font-semibold text-[#123c3a]">Taxa de Rendimento da Turma:</span>
                  <span className="font-bold text-[#0F766E]">89% de aproveitamento</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#f3f8f5] border border-[#daebe5]">
                  <span className="font-semibold text-[#0b5f59]">Alunos em Recuperação Preventiva:</span>
                  <span className="font-bold text-[#0b5f59]">3 alunos (detectados pela IA)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 2: Redação ENEM (Invertido) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center">
              <PenTool className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f3f8f5] text-[#0b5f59]">
              AVALIAÇÃO OFICIAL POR COMPETÊNCIA
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#123c3a] leading-tight">
              Redação Corrigida ENEM: Devolutiva rica e nota de 0 a 1000 em segundos.
            </h3>
            <p className="text-base text-[#4f6b63] leading-relaxed">
              O aluno digita ou envia foto do texto. A IA processa cada critério oficial do Inep: Norma culta (C1), tema e repertório (C2), projeto de texto (C3), coesão (C4) e proposta de intervenção completa com 5 elementos (C5).
            </p>
            <ul className="space-y-3 text-sm text-[#123c3a] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Critérios oficiais e calibrados para o padrão do ENEM
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Feedback pedagógico detalhado com pontos fortes e a melhorar
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Economia de mais de 8 horas por lote de redações corrigidas
              </li>
            </ul>
            <button
              onClick={() => onOpenAuth("cadastro")}
              className="btn-brand-ghost py-3 px-6 text-sm flex items-center gap-2"
            >
              <span>Testar Correção ENEM</span>
              <ArrowRight className="w-4 h-4 text-[#0f766e]" />
            </button>
          </div>

          <div className="lg:col-span-6 lg:order-1 bg-[#f3f7f5] p-6 rounded-3xl border border-[#d5e3dc] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#d5e3dc] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#d5e3dc]">
                <span className="font-bold text-sm text-[#123c3a]">Diagnóstico de Redação #482</span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#0f766e] text-white">
                  960 / 1000
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#f3f7f5]/60 flex justify-between items-center">
                  <span className="font-medium text-[#123c3a]">C1 - Norma Culta:</span>
                  <span className="font-bold text-[#123c3a]">200 / 200</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f3f7f5]/60 flex justify-between items-center">
                  <span className="font-medium text-[#123c3a]">C2 - Compreensão do Tema:</span>
                  <span className="font-bold text-[#123c3a]">200 / 200</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f3f8f5] border border-[#daebe5] flex justify-between items-center">
                  <span className="font-medium text-[#0b5f59]">C3 - Argumentação / Projeto:</span>
                  <span className="font-bold text-[#0b5f59]">160 / 200</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#f3f7f5]/60 flex justify-between items-center">
                  <span className="font-medium text-[#123c3a]">C5 - Proposta de Intervenção:</span>
                  <span className="font-bold text-[#123c3a]">200 / 200</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 3: Gerador de Atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f3f7f5] text-[#123c3a]">
              QUESTÕES BNCC & SIMULADOS
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#123c3a] leading-tight">
              Gerador de Atividades: Listas temáticas com gabarito em 30 segundos.
            </h3>
            <p className="text-base text-[#4f6b63] leading-relaxed">
              Informe o tema, ano/série e nível de dificuldade. O gerador cria questões inéditas e contextualizadas, com 4 alternativas, distratores pedagógicos e justificativa comentada da alternativa correta.
            </p>
            <ul className="space-y-3 text-sm text-[#123c3a] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Questões inéditas alinhadas às habilidades da BNCC
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Gabarito comentado para facilitar a correção em sala
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Pronto para impressão em PDF diagramado e folha de respostas
              </li>
            </ul>
            <button
              onClick={() => onOpenAuth("cadastro")}
              className="btn-brand-ghost py-3 px-6 text-sm flex items-center gap-2"
            >
              <span>Gerar Primeira Atividade</span>
              <ArrowRight className="w-4 h-4 text-[#0f766e]" />
            </button>
          </div>

          <div className="lg:col-span-6 bg-[#f3f7f5] p-6 rounded-3xl border border-[#d5e3dc] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#d5e3dc] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#d5e3dc]">
                <span className="font-bold text-sm text-[#123c3a]">Simulado: Funções Sintáticas do Pronome</span>
                <span className="text-xs font-bold text-[#0f766e]">Nível: Médio</span>
              </div>
              <div className="p-3 rounded-lg bg-[#f3f7f5] border border-[#d5e3dc] text-xs space-y-2">
                <p className="font-bold text-[#123c3a]">Questão 1 (Contextualizada):</p>
                <p className="text-[#4f6b63]">No trecho &quot;Entregaram-lhe o documento lacrado&quot;, o pronome exerce a função sintática de:</p>
                <div className="space-y-1 pt-1">
                  <div className="p-1.5 rounded bg-white border border-[#d5e3dc] text-[#4f6b63]">A) Sujeito paciente</div>
                  <div className="p-1.5 rounded bg-[#f3f8f5] border border-[#0f766e] font-bold text-[#0b5f59]">B) Objeto indireto (Correta)</div>
                  <div className="p-1.5 rounded bg-white border border-[#d5e3dc] text-[#4f6b63]">C) Adjunto adnominal</div>
                  <div className="p-1.5 rounded bg-white border border-[#d5e3dc] text-[#4f6b63]">D) Complemento nominal</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 4: Calendário Pedagógico (Invertido) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f3f7f5] text-[#123c3a]">
              ORGANIZAÇÃO DA ROTINA LETIVA
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#123c3a] leading-tight">
              Calendário Pedagógico: Grade horária e remanejamento automático.
            </h3>
            <p className="text-base text-[#4f6b63] leading-relaxed">
              Configure sua rotina semanal de aulas uma única vez. Ao importar o plano de ensino anual, o sistema encaixa os conteúdos nas datas certas e permite trocar ou adiar aulas por arrastar e soltar.
            </p>
            <ul className="space-y-3 text-sm text-[#123c3a] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Geração automática de todos os slots de aula do ano letivo
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Drag-and-drop intuitivo para associar múltiplos tópicos a uma aula
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Visão mensal clara sem perda de aulas ou conflito de horário
              </li>
            </ul>
            <button
              onClick={() => onOpenAuth("cadastro")}
              className="btn-brand-ghost py-3 px-6 text-sm flex items-center gap-2"
            >
              <span>Ver Grade Inteligente</span>
              <ArrowRight className="w-4 h-4 text-[#0f766e]" />
            </button>
          </div>

          <div className="lg:col-span-6 lg:order-1 bg-[#f3f7f5] p-6 rounded-3xl border border-[#d5e3dc] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#d5e3dc] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#d5e3dc]">
                <span className="font-bold text-sm text-[#123c3a]">Visão Mensal — Agosto de 2026</span>
                <span className="text-xs font-bold text-[#0F766E] bg-[#f3f7f5] px-2 py-1 rounded-md">
                  100% dos Tópicos Alocados
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-[#f3f8f5] rounded-xl border border-[#daebe5]">
                  <span className="font-bold text-[#0b5f59] block">Qui, 13 de Agosto</span>
                  <span className="text-[11px] text-[#4f6b63] block">07:30 - 09:10 (2 Aulas)</span>
                  <span className="font-bold text-[#123c3a] mt-1 block">Literatura Modernista</span>
                </div>
                <div className="p-3 bg-[#f3f7f5] rounded-xl border border-[#d5e3dc]">
                  <span className="font-bold text-[#123c3a] block">Sex, 14 de Agosto</span>
                  <span className="text-[11px] text-[#4f6b63] block">09:30 - 10:20 (1 Aula)</span>
                  <span className="font-bold text-[#4f6b63] mt-1 block">Análise de Poemas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 5: Horário Escolar Inteligente */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#f3f7f5] text-[#123c3a]">
              ALOCAÇÃO COMBINATÓRIA & SALAS TEMÁTICAS
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#123c3a] leading-tight">
              Horário Escolar Inteligente: Grade perfeita gerada por IA e Backtracking em segundos.
            </h3>
            <p className="text-base text-[#4f6b63] leading-relaxed">
              Otimize 45 tempos semanais para turmas de Tempo Integral. Alocação automática por salas temáticas da BNCC, respeito absoluto ao dia de planejamento dos professores e zero conflitos de choque de horários.
            </p>
            <ul className="space-y-3 text-sm text-[#123c3a] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Motor combinatório assíncrono com Celery e Redis
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Assistente pedagógico com IA Sabiazinho-4 da Maritaca AI
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#f3f8f5] text-[#0f766e] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Exportação de relatórios profissionais em Excel multi-aba e PDF
              </li>
            </ul>
            <button
              onClick={() => onOpenAuth("cadastro")}
              className="btn-brand-ghost py-3 px-6 text-sm flex items-center gap-2"
            >
              <span>Conhecer Horário Escolar Inteligente</span>
              <ArrowRight className="w-4 h-4 text-[#0f766e]" />
            </button>
          </div>

          <div className="lg:col-span-6 bg-[#f3f7f5] p-6 rounded-3xl border border-[#d5e3dc] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#d5e3dc] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#d5e3dc]">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0f766e]" />
                  <span className="font-bold text-sm text-[#123c3a]">Quadro Geral — 10 Turmas</span>
                </div>
                <span className="text-xs font-extrabold text-[#0F766E] bg-[#f3f7f5] px-2 py-1 rounded-md">
                  Score: 98.5 pts
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#f3f7f5]/50">
                  <span className="font-semibold text-[#123c3a]">Conflitos de Professor / Sala:</span>
                  <span className="font-bold text-[#0F766E]">0 colisões (100% Blindado)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#f3f7f5]/50">
                  <span className="font-semibold text-[#123c3a]">Salas Temáticas BNCC:</span>
                  <span className="font-bold text-[#123c3a]">16 salas alocadas por área</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#f3f8f5] border border-[#daebe5]">
                  <span className="font-semibold text-[#0b5f59]">Aulas Práticas Geminadas:</span>
                  <span className="font-bold text-[#0b5f59]">100% de conformidade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
