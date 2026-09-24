"use client";

import React, { useState } from "react";
import {
  Printer,
  Copy,
  Check,
  Eye,
  Type,
  Maximize2,
  FileText,
  UserCheck,
  Clock,
  Sparkles,
  HelpCircle,
  AlertCircle,
  Lightbulb,
  Layers,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  BookmarkCheck,
  FolderOpen,
  Image as ImageIcon,
  RefreshCw,
  Download,
} from "lucide-react";
import { CATEGORIAS_MAP } from "@/dominio/adaptacoes/CategoriasDeficiencia";
import { useAIConfig } from "@/hooks/useAIConfig";

export function VisualizadorAtividadeAdaptada({
  resultado,
  onVoltar,
  onSalvarNoBanco,
  onAbrirBanco,
  salvoNoBanco = false,
}) {
  const { temChave, getAIHeaders } = useAIConfig();
  const [abaAtiva, setAbaAtiva] = useState("aluno"); // 'aluno' | 'mediacao'
  const [copiado, setCopiado] = useState(false);
  const [salvandoLocal, setSalvandoLocal] = useState(false);

  // Estados de geração de imagens de apoio visual (RN-39)
  const [imagensQuestoes, setImagensQuestoes] = useState({});
  const [gerandoImagemIdx, setGerandoImagemIdx] = useState(null);
  const [gerandoTodas, setGerandoTodas] = useState(false);
  const [erroImagem, setErroImagem] = useState("");

  // Configurações visuais de acessibilidade em tempo real (RN-36)
  const [tamanhoFonte, setTamanhoFonte] = useState("16px");
  const [espacamentoDuplo, setEspacamentoDuplo] = useState(false);
  const [altoContraste, setAltoContraste] = useState(false);
  const [dicasAbertas, setDicasAbertas] = useState({});

  if (!resultado) return null;


  const {
    titulo = "Atividade Adaptada",
    disciplina = "Geral",
    anoEscolar = "",
    aluno = {},
    diretrizesHarmonizadas = [],
    atividadeAdaptada = {},
    guiaMediacao = {},
  } = resultado;

  const toggleDica = (index) => {
    setDicasAbertas((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopiar = async () => {
    try {
      const texto = `=== ${titulo} ===\nDisciplina: ${disciplina} | Ano: ${anoEscolar}\nEstudante: ${aluno.nome || ""}\n\nInstruções: ${atividadeAdaptada.instrucoesAluno || ""}\n\n` +
        (atividadeAdaptada.questoes || [])
          .map(
            (q) =>
              `Questão ${q.numero}: ${q.enunciado}\n` +
              (q.apoioVisualDescricao ? `[Apoio Visual: ${q.apoioVisualDescricao}]\n` : "") +
              (q.alternativas || []).join("\n") +
              "\n"
          )
          .join("\n");

      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (err) {
      console.warn("Falha ao copiar:", err);
    }
  };

  const handleImprimir = () => {
    window.print();
  };

  const handleGerarImagem = async (idx, q) => {
    if (!temChave) {
      alert("Conecte sua chave de IA no botão do topo para gerar ilustrações com o seu modelo.");
      return;
    }

    setErroImagem("");
    setGerandoImagemIdx(idx);

    try {
      const res = await fetch("/api/adaptacoes/imagem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAIHeaders(),
        },
        body: JSON.stringify({
          descricaoApoio: q.apoioVisualDescricao || q.enunciado,
          disciplina,
          necessidades: aluno.necessidades || [],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao gerar imagem.");
      }

      setImagensQuestoes((prev) => ({
        ...prev,
        [idx]: data.imagemUrl,
      }));
      q.imagemUrl = data.imagemUrl;
    } catch (err) {
      console.error("Falha ao gerar imagem:", err);
      setErroImagem(`Erro na questão ${q.numero || idx + 1}: ${err.message}`);
    } finally {
      setGerandoImagemIdx(null);
    }
  };

  const handleGerarTodasImagens = async () => {
    const questoes = atividadeAdaptada.questoes || [];
    setGerandoTodas(true);
    for (let idx = 0; idx < questoes.length; idx++) {
      const q = questoes[idx];
      const temImagem = q.imagemUrl || imagensQuestoes[idx];
      if (!temImagem && (q.apoioVisualDescricao || q.enunciado)) {
        await handleGerarImagem(idx, q);
      }
    }
    setGerandoTodas(false);
  };


  return (
    <div className="space-y-6">
      {/* Barra de Ações & Alternador de Abas */}
      <div className="p-4 bg-white border border-[#dce0f0] rounded-2xl shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        {/* Abas */}
        <div className="flex items-center gap-2 bg-[#f7f8fc] p-1.5 rounded-2xl border border-[#dce0f0] w-full md:w-auto">
          <button
            id="tab-atividade-estudante"
            type="button"
            onClick={() => setAbaAtiva("aluno")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              abaAtiva === "aluno"
                ? "bg-white text-[#d40840] shadow-xs"
                : "text-[#6070a0] hover:text-[#101942]"
            }`}
          >
            <FileText size={16} />
            Caderno do Estudante
          </button>
          <button
            id="tab-guia-mediacao"
            type="button"
            onClick={() => setAbaAtiva("mediacao")}
            className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              abaAtiva === "mediacao"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-[#6070a0] hover:text-[#101942]"
            }`}
          >
            <UserCheck size={16} />
            Guia de Mediação Docente (RN-35)
          </button>
        </div>

        {/* Botões de Ações e Exportação */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {onSalvarNoBanco && (
            <button
              id="btn-salvar-no-banco"
              type="button"
              disabled={salvoNoBanco || salvandoLocal}
              onClick={async () => {
                setSalvandoLocal(true);
                try {
                  await onSalvarNoBanco(resultado);
                } finally {
                  setSalvandoLocal(false);
                }
              }}
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                salvoNoBanco
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-white border-[#dce0f0] hover:border-[#f60c49]/40 text-[#101942] hover:text-[#d40840]"
              }`}
            >
              {salvoNoBanco ? (
                <>
                  <BookmarkCheck size={15} className="text-emerald-600" />
                  Salvo no Banco
                </>
              ) : (
                <>
                  <BookmarkPlus size={15} className="text-[#f60c49]" />
                  {salvandoLocal ? "Salvando..." : "Salvar no Banco"}
                </>
              )}
            </button>
          )}

          {onAbrirBanco && (
            <button
              type="button"
              onClick={onAbrirBanco}
              className="px-3 py-2 border border-[#dce0f0] hover:border-[#f60c49]/40 bg-white text-[#101942] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              title="Abrir Banco de Atividades para reaproveitar para outros alunos"
            >
              <FolderOpen size={15} className="text-[#6070a0]" />
              <span className="hidden sm:inline">Ver no</span> Banco
            </button>
          )}

          <button
            id="btn-copiar-atividade"
            type="button"
            onClick={handleCopiar}
            className="px-3.5 py-2 border border-[#dce0f0] hover:border-[#f60c49]/40 bg-white text-[#101942] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            {copiado ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
            {copiado ? "Copiado!" : "Copiar Texto"}
          </button>
          <button
            id="btn-imprimir-pdf"
            type="button"
            onClick={handleImprimir}
            className="px-4 py-2 bg-[#f60c49] hover:bg-[#d40840] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Printer size={15} />
            Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Barra de Ajustes de Acessibilidade Visual (apenas na aba do aluno) */}
      {abaAtiva === "aluno" && (
        <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/50 border border-[#dce0f0] rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-[#101942] font-bold">
            <Eye size={16} className="text-[#f60c49]" />
            Acessibilidade Visual (RN-36):
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Seletor de Tamanho de Fonte */}
            <div className="flex items-center gap-1 bg-white border border-[#dce0f0] rounded-xl p-1">
              <Type size={14} className="text-[#6070a0] ml-1.5" />
              {[
                { label: "Normal (16px)", val: "16px" },
                { label: "Grande (18px)", val: "18px" },
                { label: "Extra (22px)", val: "22px" },
                { label: "Baixa Visão (26px)", val: "26px" },
              ].map((f) => (
                <button
                  key={f.val}
                  type="button"
                  onClick={() => setTamanhoFonte(f.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    tamanhoFonte === f.val
                      ? "bg-[#f60c49] text-white"
                      : "text-[#6070a0] hover:text-[#101942]"
                  }`}
                >
                  {f.val}
                </button>
              ))}
            </div>

            {/* Espaçamento Duplo */}
            <button
              type="button"
              onClick={() => setEspacamentoDuplo(!espacamentoDuplo)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                espacamentoDuplo
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-[#6070a0] border-[#dce0f0] hover:bg-slate-50"
              }`}
            >
              Espaçamento 2.0 {espacamentoDuplo ? "✓" : ""}
            </button>

            {/* Alto Contraste */}
            <button
              type="button"
              onClick={() => setAltoContraste(!altoContraste)}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                altoContraste
                  ? "bg-black text-yellow-300 border-yellow-400 ring-2 ring-yellow-400"
                  : "bg-white text-[#101942] border-[#dce0f0] hover:bg-slate-50"
              }`}
            >
              Alto Contraste {altoContraste ? "✓" : ""}
            </button>

            {/* Gerador de Imagens Pedagógicas DUA (RN-39) */}
            <button
              id="btn-gerar-todas-imagens"
              type="button"
              disabled={gerandoTodas}
              onClick={handleGerarTodasImagens}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Gerar imagens automáticas para todas as questões que possuem apoio visual"
            >
              <ImageIcon size={14} className="text-indigo-600" />
              <span>{gerandoTodas ? "Gerando Imagens..." : "🎨 Ilustrar Todas com IA"}</span>
            </button>
          </div>
        </div>
      )}

      {erroImagem && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 print:hidden">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{erroImagem}</span>
        </div>
      )}

      {/* ÁREA DA ATIVIDADE DO ESTUDANTE (ABA 1) */}
      {abaAtiva === "aluno" && (
        <div
          id="area-impressao-atividade"
          style={{ fontSize: tamanhoFonte }}
          className={`p-6 sm:p-10 rounded-3xl border transition-all duration-300 shadow-sm ${
            espacamentoDuplo ? "leading-loose" : "leading-relaxed"
          } ${
            altoContraste
              ? "bg-[#000000] text-[#ffea00] border-yellow-400 selection:bg-yellow-400 selection:text-black font-semibold"
              : "bg-white text-[#101942] border-[#dce0f0]"
          }`}
        >
          {/* Cabeçalho do Estudante */}
          <div
            className={`pb-6 mb-8 border-b ${
              altoContraste ? "border-yellow-400/50" : "border-[#dce0f0]"
            } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
          >
            <div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  altoContraste
                    ? "bg-yellow-400 text-black font-black"
                    : "bg-[#fff2f6] text-[#d40840] border border-[#fde4ec]"
                }`}
              >
                {disciplina} • {anoEscolar}
              </span>
              <h1 className="text-xl sm:text-2xl font-black mt-2">{titulo}</h1>
            </div>

            <div
              className={`p-3 rounded-2xl border text-xs min-w-[200px] ${
                altoContraste
                  ? "border-yellow-400 bg-black text-yellow-300"
                  : "bg-[#f7f8fc] border-[#dce0f0] text-[#6070a0]"
              }`}
            >
              <p>
                <strong>Estudante:</strong> {aluno.nome || "___________________"}
              </p>
              <p className="mt-1">
                <strong>Data:</strong> ____/____/________
              </p>
            </div>
          </div>

          {/* Instruções do Aluno */}
          {atividadeAdaptada.instrucoesAluno && (
            <div
              className={`p-4 rounded-2xl mb-8 border ${
                altoContraste
                  ? "bg-black border-yellow-400 text-yellow-300 font-bold"
                  : "bg-blue-50/70 border-blue-200/80 text-blue-950 font-medium"
              }`}
            >
              <p className="text-sm font-bold flex items-center gap-2 mb-1">
                <Sparkles size={16} />
                Como Fazer Esta Atividade:
              </p>
              <p className="text-xs sm:text-sm">{atividadeAdaptada.instrucoesAluno}</p>
            </div>
          )}

          {/* Lista de Questões Adaptadas */}
          <div className="space-y-8">
            {(atividadeAdaptada.questoes || []).map((q, idx) => (
              <div
                key={idx}
                className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                  altoContraste
                    ? "border-yellow-400/70 bg-black"
                    : "border-[#dce0f0] bg-white hover:border-[#f60c49]/30"
                }`}
              >
                {/* Enunciado */}
                <div className="flex items-start gap-3 mb-4">
                  <span
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      altoContraste
                        ? "bg-yellow-400 text-black font-black"
                        : "bg-[#f60c49] text-white shadow-xs"
                    }`}
                  >
                    {q.numero || idx + 1}
                  </span>
                  <div className="space-y-2 flex-1">
                    <p className="font-bold text-base sm:text-lg">{q.enunciado}</p>

                    {/* Apoio Visual & Imagem Gerada (RN-39) */}
                    {(q.imagemUrl || imagensQuestoes[idx]) ? (
                      <div className="my-4 p-3 bg-slate-50/70 border border-[#dce0f0] rounded-2xl space-y-2.5">
                        <div className="relative group max-w-md mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white">
                          <img
                            src={q.imagemUrl || imagensQuestoes[idx]}
                            alt={q.apoioVisualDescricao || `Ilustração da Questão ${q.numero || idx + 1}`}
                            className="w-full max-h-72 object-contain bg-white mx-auto"
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1.5 print:hidden">
                            <button
                              type="button"
                              disabled={gerandoImagemIdx === idx}
                              onClick={() => handleGerarImagem(idx, q)}
                              className="px-2.5 py-1 bg-white/90 hover:bg-white text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 shadow-xs flex items-center gap-1 backdrop-blur-xs transition-all"
                              title="Regerar esta ilustração"
                            >
                              <RefreshCw size={11} className={gerandoImagemIdx === idx ? "animate-spin" : ""} />
                              <span>{gerandoImagemIdx === idx ? "Regerando..." : "Regerar"}</span>
                            </button>
                          </div>
                        </div>

                        {/* Legenda e Audiodescrição para Acessibilidade */}
                        {q.apoioVisualDescricao && (
                          <div className="text-[11px] text-[#6070a0] flex items-start gap-1.5 px-1">
                            <Eye size={13} className="text-[#f60c49] flex-shrink-0 mt-0.5" />
                            <span>
                              <strong className="text-[#101942]">Audiodescrição:</strong> {q.apoioVisualDescricao}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : q.apoioVisualDescricao ? (
                      <div
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm my-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          altoContraste
                            ? "border-yellow-400 bg-black text-yellow-200"
                            : "bg-[#fafbfe] border-indigo-200 text-indigo-950"
                        }`}
                      >
                        <div className="flex items-start gap-2.5 flex-1">
                          <Eye size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-[11px] uppercase tracking-wider text-indigo-700">
                              Apoio Visual / Audiodescrição da Questão:
                            </strong>
                            <span>{q.apoioVisualDescricao}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={gerandoImagemIdx === idx || gerandoTodas}
                          onClick={() => handleGerarImagem(idx, q)}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs flex-shrink-0 print:hidden"
                        >
                          {gerandoImagemIdx === idx ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Gerando Ilustração...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon size={14} />
                              <span>🎨 Gerar Imagem com IA</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Alternativas (se houver) */}
                {Array.isArray(q.alternativas) && q.alternativas.length > 0 && (
                  <div className="space-y-2.5 pl-0 sm:pl-11 mt-4">
                    {q.alternativas.map((alt, aIdx) => (
                      <div
                        key={aIdx}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors cursor-pointer ${
                          altoContraste
                            ? "border-yellow-400 bg-black hover:bg-yellow-400 hover:text-black font-bold"
                            : "border-[#dce0f0] bg-[#fafbfe] hover:bg-[#fff5f8] hover:border-[#f60c49]/40"
                        }`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            altoContraste ? "border-yellow-400" : "border-slate-300 bg-white"
                          }`}
                        >
                          ( )
                        </span>
                        <span className="text-sm font-medium">{alt}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dica de Apoio / Scaffolding Pedagógico */}
                {q.dicaScaffolding && (
                  <div className="mt-4 pt-3 border-t border-slate-100 print:hidden pl-0 sm:pl-11">
                    <button
                      type="button"
                      onClick={() => toggleDica(idx)}
                      className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${
                        altoContraste
                          ? "text-yellow-300 hover:underline"
                          : "text-amber-700 hover:text-amber-800"
                      }`}
                    >
                      <Lightbulb size={14} className="text-amber-500" />
                      {dicasAbertas[idx] ? "Ocultar Dica de Apoio" : "Ver Dica de Apoio (Scaffolding)"}
                      {dicasAbertas[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {dicasAbertas[idx] && (
                      <div
                        className={`mt-2 p-3 rounded-xl text-xs ${
                          altoContraste
                            ? "bg-yellow-400/10 border border-yellow-400 text-yellow-300"
                            : "bg-amber-50 border border-amber-200 text-amber-900"
                        }`}
                      >
                        {q.dicaScaffolding}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ÁREA DO GUIA DE MEDIAÇÃO DOCENTE (ABA 2 - RN-35) */}
      {abaAtiva === "mediacao" && (
        <div className="p-6 sm:p-8 bg-white border border-indigo-200 rounded-3xl shadow-sm space-y-6">
          {/* Header do Guia */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white flex-shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider">
                  Guia Exclusivo do Professor / Mediador
                </span>
                <span className="text-xs text-indigo-700 font-bold">
                  (Em conformidade com RN-35)
                </span>
              </div>
              <h2 className="text-lg font-bold text-indigo-950 mt-1">
                Estratégias de Aplicação & Mediação Pedagógica DUA
              </h2>
              <p className="text-xs text-indigo-800/80">
                Orientações para conduzir a atividade garantindo o engajamento e a aprendizagem sem rebaixamento curricular.
              </p>
            </div>
          </div>

          {/* 1. Objetivo Pedagógico Inalterado (RN-31) */}
          <div className="p-4 bg-[#fff9fa] border border-[#fde4ec] rounded-2xl space-y-1.5">
            <h3 className="text-xs font-bold text-[#d40840] uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={15} />
              1. Objetivo Pedagógico Inalterado (Não Empobrecimento - RN-31)
            </h3>
            <p className="text-sm font-semibold text-[#101942]">
              {guiaMediacao.objetivoPedagogicoInalterado || "O estudante desenvolve o conceito curricular central através de múltiplos formatos de ação e expressão."}
            </p>
          </div>

          {/* 2. Tempo Estimado & Cronograma */}
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-1.5">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
              <Clock size={15} />
              2. Tempo Estimado & Gestão de Pausas
            </h3>
            <p className="text-xs font-medium text-amber-950">
              {guiaMediacao.tempoEstimado || "Recomenda-se bloco de 30 minutos com pausa de 5 minutos após a metade da tarefa."}
            </p>
          </div>

          {/* 3. Passo a Passo para o Professor */}
          {Array.isArray(guiaMediacao.passoAPassoProfessor) && guiaMediacao.passoAPassoProfessor.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-[#101942] uppercase tracking-wider flex items-center gap-2">
                <Layers size={15} className="text-[#f60c49]" />
                3. Roteiro Passo a Passo de Mediação em Sala
              </h3>
              <div className="space-y-2">
                {guiaMediacao.passoAPassoProfessor.map((passo, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3.5 bg-[#f7f8fc] border border-[#dce0f0] rounded-xl flex items-start gap-3 text-xs text-[#101942]"
                  >
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {pIdx + 1}
                    </span>
                    <span className="leading-relaxed">{passo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Antecipação Comportamental & Manejo Sensorial */}
          {guiaMediacao.antecipacaoComportamental && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle size={15} />
                4. Antecipação Comportamental & Regulação Sensorial
              </h3>
              <p className="text-xs text-rose-950 leading-relaxed font-medium">
                {guiaMediacao.antecipacaoComportamental}
              </p>
            </div>
          )}

          {/* 5. Critérios de Avaliação Flexibilizada */}
          {guiaMediacao.criteriosAvaliacaoFlexibilizada && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                <Check size={15} />
                5. Critérios de Avaliação Flexibilizada (Evidências de Aprendizagem)
              </h3>
              <p className="text-xs text-emerald-950 leading-relaxed font-medium">
                {guiaMediacao.criteriosAvaliacaoFlexibilizada}
              </p>
            </div>
          )}

          {/* Diretrizes DUA Aplicadas */}
          {diretrizesHarmonizadas.length > 0 && (
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-[#6070a0] uppercase tracking-wider">
                Diretrizes de Acessibilidade DUA Utilizadas nesta Atividade:
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {diretrizesHarmonizadas.map((d, dIdx) => (
                  <span
                    key={dIdx}
                    className="text-[11px] bg-slate-100 border border-slate-200 text-[#6070a0] px-2.5 py-1 rounded-lg"
                  >
                    • {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
