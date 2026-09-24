"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { useAIConfig } from "@/hooks/useAIConfig";
import { AlunoAdaptadoRepository } from "@/infraestrutura/adaptacoes/AlunoAdaptadoRepository";
import { SeletorNecessidades } from "@/components/adaptacoes/SeletorNecessidades";
import { ModalAlunoPEI } from "@/components/adaptacoes/ModalAlunoPEI";
import { VisualizadorAtividadeAdaptada } from "@/components/adaptacoes/VisualizadorAtividadeAdaptada";
import { ModalConectarIA } from "@/components/ai/ModalConectarIA";
import {
  Sparkles,
  ArrowLeft,
  Users,
  Key,
  BookOpen,
  FileEdit,
  Wand2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Cpu,
  Layers,
  HeartHandshake,
} from "lucide-react";

export default function AdaptacoesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { temChave, provider, getAIHeaders } = useAIConfig();

  const repository = useMemo(() => {
    return new AlunoAdaptadoRepository({ firestoreDb: db });
  }, []);

  // Modais
  const [modalPEIAberto, setModalPEIAberto] = useState(false);
  const [modalIAAberto, setModalIAAberto] = useState(false);

  // Estado do formulário
  const [modo, setModo] = useState("adaptar"); // 'adaptar' | 'criar'
  const [conteudoBase, setConteudoBase] = useState("");
  const [tema, setTema] = useState("");
  const [disciplina, setDisciplina] = useState("Língua Portuguesa");
  const [anoEscolar, setAnoEscolar] = useState("8º Ano");
  const [habilidadeBNCC, setHabilidadeBNCC] = useState("");

  // Perfil do estudante selecionado ou avulso
  const [estudantePEI, setEstudantePEI] = useState(null);
  const [nomeAluno, setNomeAluno] = useState("");
  const [necessidades, setNecessidades] = useState([]);
  const [nivelSuporte, setNivelSuporte] = useState(1);
  const [hiperfoco, setHiperfoco] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Estado de execução
  const [gerando, setGerando] = useState(false);
  const [progressoMsg, setProgressoMsg] = useState("");
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState(null);

  // Toggle de categoria no Seletor
  const handleToggleNecessidade = (id) => {
    setNecessidades((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Quando o professor escolhe um aluno do banco PEI
  const handleSelectAlunoPEI = (aluno) => {
    setEstudantePEI(aluno);
    setNomeAluno(aluno.nome || "");
    setNecessidades(aluno.necessidades || []);
    setNivelSuporte(aluno.nivelSuporte || 1);
    setHiperfoco(aluno.hiperfoco || "");
    setObservacoes(aluno.observacoes || "");
  };

  const handleLimparAlunoPEI = () => {
    setEstudantePEI(null);
    setNomeAluno("");
    setNecessidades([]);
    setNivelSuporte(1);
    setHiperfoco("");
    setObservacoes("");
  };

  // Submissão
  const handleGerar = async (e) => {
    e.preventDefault();
    setErro("");

    if (!temChave) {
      setModalIAAberto(true);
      return;
    }

    if (necessidades.length === 0) {
      setErro("Selecione ao menos 1 necessidade específica ou deficiência para adaptar a atividade.");
      return;
    }

    if (modo === "adaptar" && !conteudoBase.trim()) {
      setErro("Insira ou cole o conteúdo da atividade original que deseja adaptar.");
      return;
    }

    if (modo === "criar" && !tema.trim()) {
      setErro("Informe o tema ou conteúdo para a criação da atividade adaptada.");
      return;
    }

    setGerando(true);
    setProgressoMsg("Harmonizando diretrizes pedagógicas DUA...");

    try {
      const headers = {
        "Content-Type": "application/json",
        ...getAIHeaders(),
      };

      setTimeout(() => {
        setProgressoMsg("Construindo apoios visuais, linguagem acessível e scaffolding...");
      }, 1200);

      setTimeout(() => {
        setProgressoMsg("Estruturando o Guia de Mediação Docente (RN-35)...");
      }, 2500);

      const res = await fetch("/api/adaptacoes/gerar", {
        method: "POST",
        headers,
        body: JSON.stringify({
          modo,
          conteudoBase,
          tema,
          habilidadeBNCC,
          disciplina,
          anoEscolar,
          aluno: {
            nome: nomeAluno || (estudantePEI ? estudantePEI.nome : "Estudante"),
            necessidades,
            nivelSuporte,
            hiperfoco,
            observacoes,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Erro ao gerar adaptação.");
      }

      setResultado(data);
      // Rola para o topo suavemente
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErro(err.message || "Falha na comunicação com o assistente de IA.");
    } finally {
      setGerando(false);
      setProgressoMsg("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-[#101942]">
      {/* Barra Superior / Header */}
      <header className="bg-white border-b border-[#dce0f0] sticky top-0 z-40 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl border border-[#dce0f0] hover:border-[#f60c49]/40 hover:bg-[#fff2f6] text-[#6070a0] hover:text-[#d40840] transition-colors"
              title="Voltar ao Painel Principal"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#fff2f6] border border-[#fde4ec] text-[#f60c49] flex items-center justify-center shadow-xs">
                <HeartHandshake size={20} />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-[#101942] leading-tight">
                  Atividades Adaptadas & Educação Inclusiva
                </h1>
                <p className="text-[11px] text-[#6070a0]">
                  Desenho Universal para a Aprendizagem (DUA) • LBI nº 13.146/2015
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Banco de Estudantes PEI */}
            <button
              id="btn-abrir-banco-pei"
              type="button"
              onClick={() => setModalPEIAberto(true)}
              className="px-3.5 py-1.5 rounded-xl border border-[#dce0f0] hover:border-[#f60c49]/40 bg-white hover:bg-[#fff2f6] text-xs font-bold text-[#101942] hover:text-[#d40840] transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Users size={15} />
              <span className="hidden sm:inline">Banco de Alunos</span> PEI
            </button>

            {/* Status da Chave de IA */}
            <button
              id="btn-conectar-ia"
              type="button"
              onClick={() => setModalIAAberto(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                temChave
                  ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <Cpu size={14} />
              <span className="hidden md:inline">
                {temChave ? `IA Conectada (${provider})` : "Conectar IA (BYOK)"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {resultado ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between print:hidden">
              <button
                id="btn-nova-adaptacao"
                type="button"
                onClick={() => setResultado(null)}
                className="px-4 py-2 border border-[#dce0f0] hover:border-[#f60c49]/40 bg-white text-[#101942] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs"
              >
                ← Fazer Nova Adaptação / Voltar ao Formulário
              </button>
              <span className="text-xs font-semibold text-[#6070a0]">
                Adaptação gerada com sucesso via DUA
              </span>
            </div>

            <VisualizadorAtividadeAdaptada resultado={resultado} onVoltar={() => setResultado(null)} />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Banner Institucional DUA */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-[#101942] to-[#1c2a6b] text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-bold uppercase tracking-wider backdrop-blur-xs">
                  Inclusão Sem Rebaixamento Curricular (RN-31)
                </span>
                <h2 className="text-xl sm:text-2xl font-black leading-snug">
                  Crie atividades que potencializam as habilidades de cada estudante
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  O Desenho Universal para a Aprendizagem (DUA) adapta o formato de apresentação, os meios de expressão e os estímulos de engajamento, mantendo intacto o rigor conceitual exigido pela BNCC.
                </p>
              </div>
              <div className="absolute right-4 bottom-2 text-white/5 font-black text-9xl pointer-events-none select-none">
                DUA
              </div>
            </div>

            {/* Mensagem de Erro se houver */}
            {erro && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2.5 font-medium shadow-2xs animate-fadeIn">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleGerar} className="space-y-8">
              {/* Card 1: Modo de Entrada (Adaptar existente vs Criar do zero) */}
              <div className="p-6 bg-white border border-[#dce0f0] rounded-3xl shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce0f0]">
                  <div>
                    <h3 className="text-base font-bold text-[#101942] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f60c49]"></span>
                      1. Conteúdo da Atividade
                    </h3>
                    <p className="text-xs text-[#6070a0]">
                      Escolha se deseja transformar uma atividade já existente ou criar uma nova do zero
                    </p>
                  </div>

                  {/* Tabs de Modo */}
                  <div className="flex bg-[#f7f8fc] p-1 rounded-2xl border border-[#dce0f0]">
                    <button
                      id="tab-modo-adaptar"
                      type="button"
                      onClick={() => setModo("adaptar")}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        modo === "adaptar"
                          ? "bg-white text-[#d40840] shadow-xs"
                          : "text-[#6070a0] hover:text-[#101942]"
                      }`}
                    >
                      <FileEdit size={14} />
                      Adaptar Existente
                    </button>
                    <button
                      id="tab-modo-criar"
                      type="button"
                      onClick={() => setModo("criar")}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        modo === "criar"
                          ? "bg-white text-[#d40840] shadow-xs"
                          : "text-[#6070a0] hover:text-[#101942]"
                      }`}
                    >
                      <Wand2 size={14} />
                      Criar do Zero
                    </button>
                  </div>
                </div>

                {/* Campos Gerais: Disciplina e Ano */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#101942] block mb-1">
                      Disciplina *
                    </label>
                    <input
                      type="text"
                      required
                      value={disciplina}
                      onChange={(e) => setDisciplina(e.target.value)}
                      placeholder="Ex: Ciências, História, Matemática..."
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3.5 py-2 text-xs text-[#101942] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#101942] block mb-1">
                      Ano / Série Escolar *
                    </label>
                    <input
                      type="text"
                      required
                      value={anoEscolar}
                      onChange={(e) => setAnoEscolar(e.target.value)}
                      placeholder="Ex: 6º Ano, 1º Ano EM..."
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3.5 py-2 text-xs text-[#101942] outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#101942] block mb-1">
                      Habilidade BNCC (Opcional)
                    </label>
                    <input
                      type="text"
                      value={habilidadeBNCC}
                      onChange={(e) => setHabilidadeBNCC(e.target.value)}
                      placeholder="Ex: EF07CI07, EM13LP01..."
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3.5 py-2 text-xs text-[#101942] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Conteúdo específico por Modo */}
                {modo === "adaptar" ? (
                  <div>
                    <label className="text-xs font-bold text-[#101942] block mb-1">
                      Cole aqui a atividade original (textos, enunciados, questões): *
                    </label>
                    <textarea
                      id="input-conteudo-base"
                      rows={5}
                      required={modo === "adaptar"}
                      value={conteudoBase}
                      onChange={(e) => setConteudoBase(e.target.value)}
                      placeholder="Cole aqui o enunciado original da prova, lista de exercícios ou texto didático..."
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-2xl p-4 text-xs sm:text-sm text-[#101942] outline-none resize-y transition-all leading-relaxed"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-[#101942] block mb-1">
                      Tema / Conteúdo Central da Atividade *
                    </label>
                    <textarea
                      id="input-tema"
                      rows={3}
                      required={modo === "criar"}
                      value={tema}
                      onChange={(e) => setTema(e.target.value)}
                      placeholder="Ex: Fontes renováveis de energia, Revolução Industrial, Operações com frações no cotidiano..."
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-2xl p-4 text-xs sm:text-sm text-[#101942] outline-none resize-none transition-all leading-relaxed"
                    />
                  </div>
                )}
              </div>

              {/* Card 2: Perfil do Estudante & Seletor de Necessidades DUA */}
              <div className="p-6 bg-white border border-[#dce0f0] rounded-3xl shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce0f0]">
                  <div>
                    <h3 className="text-base font-bold text-[#101942] flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f60c49]"></span>
                      2. Perfil Inclusivo & Necessidades Específicas
                    </h3>
                    <p className="text-xs text-[#6070a0]">
                      Selecione um estudante cadastrado ou monte a combinação de categorias desejada
                    </p>
                  </div>

                  {estudantePEI ? (
                    <div className="flex items-center gap-2 bg-[#fff2f6] border border-[#fde4ec] px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-bold text-[#d40840]">
                        PEI: {estudantePEI.nome}
                      </span>
                      <button
                        type="button"
                        onClick={handleLimparAlunoPEI}
                        className="text-[11px] text-[#6070a0] hover:text-red-600 underline font-semibold ml-1"
                      >
                        Desvincular
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalPEIAberto(true)}
                      className="px-3 py-1.5 border border-[#dce0f0] hover:border-[#f60c49]/40 bg-[#f7f8fc] hover:bg-white rounded-xl text-xs font-bold text-[#101942] transition-colors flex items-center gap-1.5"
                    >
                      <Users size={14} className="text-[#f60c49]" />
                      Carregar do Banco PEI
                    </button>
                  )}
                </div>

                {/* Nome do Estudante (opcional / pseudônimo) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#101942] block mb-1">
                      Identificação do Estudante (Nome ou Iniciais LGPD)
                    </label>
                    <input
                      id="input-nome-aluno"
                      type="text"
                      value={nomeAluno}
                      onChange={(e) => setNomeAluno(e.target.value)}
                      placeholder="Ex: Lucas S. (ou deixe em branco para Estudante)"
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3.5 py-2 text-xs text-[#101942] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#101942] block mb-1">
                      Observação Pedagógica Pontual (Opcional)
                    </label>
                    <input
                      type="text"
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Ex: Apresenta sensibilidade a ruídos, prefere apoio visual..."
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3.5 py-2 text-xs text-[#101942] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Seletor Multi-Select de Categorias, Nível de Suporte e Hiperfoco */}
                <SeletorNecessidades
                  selecionadas={necessidades}
                  onToggle={handleToggleNecessidade}
                  nivelSuporte={nivelSuporte}
                  onChangeNivelSuporte={setNivelSuporte}
                  hiperfoco={hiperfoco}
                  onChangeHiperfoco={setHiperfoco}
                />
              </div>

              {/* Botão de Disparo */}
              <div className="p-6 bg-white border border-[#dce0f0] rounded-3xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-[#6070a0] flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                  <span>
                    A atividade virá acompanhada automaticamente do{" "}
                    <strong className="text-[#101942]">Guia de Mediação Docente</strong> para sua condução.
                  </span>
                </div>

                <button
                  id="btn-submeter-geracao"
                  type="submit"
                  disabled={gerando}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#f60c49] hover:bg-[#d40840] disabled:bg-[#f60c49]/60 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {gerando ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{progressoMsg || "Processando..."}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Gerar Atividade Adaptada DUA
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Modal PEI */}
      <ModalAlunoPEI
        isOpen={modalPEIAberto}
        onClose={() => setModalPEIAberto(false)}
        repository={repository}
        userId={user?.uid || "anonimo"}
        onSelectAluno={handleSelectAlunoPEI}
      />

      {/* Modal Conectar IA */}
      <ModalConectarIA
        isOpen={modalIAAberto}
        onClose={() => setModalIAAberto(false)}
      />
    </div>
  );
}
