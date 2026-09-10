"use client";

import { BookOpen, PenTool, ClipboardList, Calendar, Check, ArrowRight, Sparkles, FileSpreadsheet, Layers, Award, Clock, Cpu } from "lucide-react";

export function LandingModules({ onOpenAuth }) {
  return (
    <section id="modulos" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#f60c49] mb-3">
            <span className="w-6 h-0.5 bg-[#f60c49]"></span>
            ECOSSISTEMA COMPLETO
            <span className="w-6 h-0.5 bg-[#f60c49]"></span>
          </div>
          <h2 className="font-head text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#101942] tracking-tight">
            Ferramentas especializadas para cada etapa do seu trabalho.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#6070a0]">
            Projetadas especificamente para a realidade das escolas brasileiras, com suporte integral à BNCC e matriz do ENEM.
          </p>
        </div>

        {/* Módulo 1: Diário Pedagógico */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#fff2f6] text-[#f60c49] flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#eef0f8] text-[#101942]">
              GESTÃO DE TURMAS & NOTAS
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#101942] leading-tight">
              Diário Pedagógico: Chega de perder horas calculando médias no Excel.
            </h3>
            <p className="text-base text-[#6070a0] leading-relaxed">
              Importe listas de turmas a partir de qualquer planilha. O Gestão Docente calcula automaticamente médias ponderadas, contabiliza faltas e gera relatórios individuais de desempenho por aluno.
            </p>
            <ul className="space-y-3 text-sm text-[#101942] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Importação instantânea via XLSX ou Google Sheets
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Cálculo automático de médias bimestrais e recuperação
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
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
              <ArrowRight className="w-4 h-4 text-[#f60c49]" />
            </button>
          </div>

          <div className="lg:col-span-6 bg-[#f7f8fc] p-6 rounded-3xl border border-[#dce0f0] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#dce0f0] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#dce0f0]">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#22c55e]" />
                  <span className="font-bold text-sm text-[#101942]">Planilha_Notas_3Ano_B.xlsx</span>
                </div>
                <span className="text-xs font-extrabold text-[#22c55e] bg-[#eef0f8] px-2 py-1 rounded-md">
                  Importada com Sucesso
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#eef0f8]/50">
                  <span className="font-semibold text-[#101942]">Total de Alunos Vinculados:</span>
                  <span className="font-bold text-[#101942]">34 alunos</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#eef0f8]/50">
                  <span className="font-semibold text-[#101942]">Taxa de Rendimento da Turma:</span>
                  <span className="font-bold text-[#22c55e]">89% de aproveitamento</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#fff2f6] border border-[#fde4ec]">
                  <span className="font-semibold text-[#d40840]">Alunos em Recuperação Preventiva:</span>
                  <span className="font-bold text-[#d40840]">3 alunos (detectados pela IA)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 2: Redação ENEM (Invertido) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#fff2f6] text-[#f60c49] flex items-center justify-center">
              <PenTool className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#fff2f6] text-[#d40840]">
              AVALIAÇÃO OFICIAL POR COMPETÊNCIA
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#101942] leading-tight">
              Redação Corrigida ENEM: Devolutiva rica e nota de 0 a 1000 em segundos.
            </h3>
            <p className="text-base text-[#6070a0] leading-relaxed">
              O aluno digita ou envia foto do texto. A IA processa cada critério oficial do Inep: Norma culta (C1), tema e repertório (C2), projeto de texto (C3), coesão (C4) e proposta de intervenção completa com 5 elementos (C5).
            </p>
            <ul className="space-y-3 text-sm text-[#101942] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Critérios oficiais e calibrados para o padrão do ENEM
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Feedback pedagógico detalhado com pontos fortes e a melhorar
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
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
              <ArrowRight className="w-4 h-4 text-[#f60c49]" />
            </button>
          </div>

          <div className="lg:col-span-6 lg:order-1 bg-[#f7f8fc] p-6 rounded-3xl border border-[#dce0f0] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#dce0f0] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#dce0f0]">
                <span className="font-bold text-sm text-[#101942]">Diagnóstico de Redação #482</span>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#f60c49] text-white">
                  960 / 1000
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#eef0f8]/60 flex justify-between items-center">
                  <span className="font-medium text-[#101942]">C1 - Norma Culta:</span>
                  <span className="font-bold text-[#101942]">200 / 200</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#eef0f8]/60 flex justify-between items-center">
                  <span className="font-medium text-[#101942]">C2 - Compreensão do Tema:</span>
                  <span className="font-bold text-[#101942]">200 / 200</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#fff2f6] border border-[#fde4ec] flex justify-between items-center">
                  <span className="font-medium text-[#d40840]">C3 - Argumentação / Projeto:</span>
                  <span className="font-bold text-[#d40840]">160 / 200</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#eef0f8]/60 flex justify-between items-center">
                  <span className="font-medium text-[#101942]">C5 - Proposta de Intervenção:</span>
                  <span className="font-bold text-[#101942]">200 / 200</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 3: Gerador de Atividades */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#fff2f6] text-[#f60c49] flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#eef0f8] text-[#101942]">
              QUESTÕES BNCC & SIMULADOS
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#101942] leading-tight">
              Gerador de Atividades: Listas temáticas com gabarito em 30 segundos.
            </h3>
            <p className="text-base text-[#6070a0] leading-relaxed">
              Informe o tema, ano/série e nível de dificuldade. O gerador cria questões inéditas e contextualizadas, com 4 alternativas, distratores pedagógicos e justificativa comentada da alternativa correta.
            </p>
            <ul className="space-y-3 text-sm text-[#101942] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Questões inéditas alinhadas às habilidades da BNCC
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Gabarito comentado para facilitar a correção em sala
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
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
              <ArrowRight className="w-4 h-4 text-[#f60c49]" />
            </button>
          </div>

          <div className="lg:col-span-6 bg-[#f7f8fc] p-6 rounded-3xl border border-[#dce0f0] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#dce0f0] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#dce0f0]">
                <span className="font-bold text-sm text-[#101942]">Simulado: Funções Sintáticas do Pronome</span>
                <span className="text-xs font-bold text-[#f60c49]">Nível: Médio</span>
              </div>
              <div className="p-3 rounded-lg bg-[#f7f8fc] border border-[#dce0f0] text-xs space-y-2">
                <p className="font-bold text-[#101942]">Questão 1 (Contextualizada):</p>
                <p className="text-[#6070a0]">No trecho &quot;Entregaram-lhe o documento lacrado&quot;, o pronome exerce a função sintática de:</p>
                <div className="space-y-1 pt-1">
                  <div className="p-1.5 rounded bg-white border border-[#dce0f0] text-[#6070a0]">A) Sujeito paciente</div>
                  <div className="p-1.5 rounded bg-[#fff2f6] border border-[#f60c49] font-bold text-[#d40840]">B) Objeto indireto (Correta)</div>
                  <div className="p-1.5 rounded bg-white border border-[#dce0f0] text-[#6070a0]">C) Adjunto adnominal</div>
                  <div className="p-1.5 rounded bg-white border border-[#dce0f0] text-[#6070a0]">D) Complemento nominal</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 4: Calendário Pedagógico (Invertido) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 lg:order-2 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#fff2f6] text-[#f60c49] flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#eef0f8] text-[#101942]">
              ORGANIZAÇÃO DA ROTINA LETIVA
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#101942] leading-tight">
              Calendário Pedagógico: Grade horária e remanejamento automático.
            </h3>
            <p className="text-base text-[#6070a0] leading-relaxed">
              Configure sua rotina semanal de aulas uma única vez. Ao importar o plano de ensino anual, o sistema encaixa os conteúdos nas datas certas e permite trocar ou adiar aulas por arrastar e soltar.
            </p>
            <ul className="space-y-3 text-sm text-[#101942] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Geração automática de todos os slots de aula do ano letivo
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Drag-and-drop intuitivo para associar múltiplos tópicos a uma aula
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
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
              <ArrowRight className="w-4 h-4 text-[#f60c49]" />
            </button>
          </div>

          <div className="lg:col-span-6 lg:order-1 bg-[#f7f8fc] p-6 rounded-3xl border border-[#dce0f0] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#dce0f0] space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[#dce0f0]">
                <span className="font-bold text-sm text-[#101942]">Visão Mensal — Agosto de 2026</span>
                <span className="text-xs font-bold text-[#22c55e] bg-[#eef0f8] px-2 py-1 rounded-md">
                  100% dos Tópicos Alocados
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-[#fff2f6] rounded-xl border border-[#fde4ec]">
                  <span className="font-bold text-[#d40840] block">Qui, 13 de Agosto</span>
                  <span className="text-[11px] text-[#6070a0] block">07:30 - 09:10 (2 Aulas)</span>
                  <span className="font-bold text-[#101942] mt-1 block">Literatura Modernista</span>
                </div>
                <div className="p-3 bg-[#f7f8fc] rounded-xl border border-[#dce0f0]">
                  <span className="font-bold text-[#101942] block">Sex, 14 de Agosto</span>
                  <span className="text-[11px] text-[#6070a0] block">09:30 - 10:20 (1 Aula)</span>
                  <span className="font-bold text-[#6070a0] mt-1 block">Análise de Poemas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Módulo 5: Horário Escolar Inteligente */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="w-12 h-12 rounded-xl bg-[#fff2f6] text-[#f60c49] flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#eef0f8] text-[#101942]">
              ALOCAÇÃO COMBINATÓRIA & SALAS TEMÁTICAS
            </div>
            <h3 className="font-head text-2xl sm:text-3xl font-extrabold text-[#101942] leading-tight">
              Horário Escolar Inteligente: Grade perfeita gerada por IA e Backtracking em segundos.
            </h3>
            <p className="text-base text-[#6070a0] leading-relaxed">
              Otimize 45 tempos semanais para turmas de Tempo Integral. Alocação automática por salas temáticas da BNCC, respeito absoluto ao dia de planejamento dos professores e zero conflitos de choque de horários.
            </p>
            <ul className="space-y-3 text-sm text-[#101942] font-semibold">
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Motor combinatório assíncrono com Celery e Redis
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                Assistente pedagógico com IA Sabiazinho-4 da Maritaca AI
              </li>
              <li className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#fff2f6] text-[#f60c49] flex items-center justify-center shrink-0">
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
              <ArrowRight className="w-4 h-4 text-[#f60c49]" />
            </button>
          </div>

          <div className="lg:col-span-6 bg-[#f7f8fc] p-6 rounded-3xl border border-[#dce0f0] shadow-md">
            <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#dce0f0] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#dce0f0]">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#f60c49]" />
                  <span className="font-bold text-sm text-[#101942]">Quadro Geral — 10 Turmas</span>
                </div>
                <span className="text-xs font-extrabold text-[#22c55e] bg-[#eef0f8] px-2 py-1 rounded-md">
                  Score: 98.5 pts
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#eef0f8]/50">
                  <span className="font-semibold text-[#101942]">Conflitos de Professor / Sala:</span>
                  <span className="font-bold text-[#22c55e]">0 colisões (100% Blindado)</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#eef0f8]/50">
                  <span className="font-semibold text-[#101942]">Salas Temáticas BNCC:</span>
                  <span className="font-bold text-[#101942]">16 salas alocadas por área</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-[#fff2f6] border border-[#fde4ec]">
                  <span className="font-semibold text-[#d40840]">Aulas Práticas Geminadas:</span>
                  <span className="font-bold text-[#d40840]">100% de conformidade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
