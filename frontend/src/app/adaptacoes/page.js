"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { useAIConfig } from "@/hooks/useAIConfig";
import { AlunoAdaptadoRepository } from "@/infraestrutura/adaptacoes/AlunoAdaptadoRepository";
import { AtividadeAdaptadaRepository } from "@/infraestrutura/adaptacoes/AtividadeAdaptadaRepository";
import { QuestaoAdaptadaRepository } from "@/infraestrutura/adaptacoes/QuestaoAdaptadaRepository";
import { ProvaAdaptadaRepository } from "@/infraestrutura/adaptacoes/ProvaAdaptadaRepository";
import { SeletorNecessidades } from "@/components/adaptacoes/SeletorNecessidades";
import { ModalAlunoPEI } from "@/components/adaptacoes/ModalAlunoPEI";
import { ModalBancoAtividades } from "@/components/adaptacoes/ModalBancoAtividades";
import { VisualizadorAtividadeAdaptada } from "@/components/adaptacoes/VisualizadorAtividadeAdaptada";
import { PainelBancoQuestoes } from "@/components/adaptacoes/PainelBancoQuestoes";
import { PainelMontadorProvas } from "@/components/adaptacoes/PainelMontadorProvas";
import { ModalConectarIA } from "@/components/ai/ModalConectarIA";
import { extractTextFromDocument } from "@/utils/atividades/documentExtractor";
import { doc, getDoc } from "firebase/firestore";
import { paraPerfilInclusivo, listarAlunosParaSeletor } from "@/dominio/diario/AlunoDiario";
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
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
  FolderOpen,
  ListOrdered,
  CheckSquare,
  Paperclip,
  Upload,
  FileText,
  X,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";

export default function AdaptacoesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { temChave, provider, getAIHeaders } = useAIConfig();

  const repository = useMemo(() => {
    return new AlunoAdaptadoRepository({ firestoreDb: db });
  }, []);

  const atividadeRepo = useMemo(() => {
    return new AtividadeAdaptadaRepository({ firestoreDb: db });
  }, []);

  const questaoRepo = useMemo(() => {
    return new QuestaoAdaptadaRepository({ firestoreDb: db });
  }, []);

  const provaRepo = useMemo(() => {
    return new ProvaAdaptadaRepository({ firestoreDb: db });
  }, []);

  // Navegação por Abas Principais (RN-42)
  const [abaPrincipal, setAbaPrincipal] = useState("gerador"); // 'gerador' | 'banco_questoes' | 'montador_provas'
  const [questoesBanco, setQuestoesBanco] = useState([]);
  const [provasSalvas, setProvasSalvas] = useState([]);
  const [alunosPEI, setAlunosPEI] = useState([]);
  const [provaEmConstrucao, setProvaEmConstrucao] = useState({
    id: "",
    titulo: "Avaliação Adaptada",
    disciplina: "Língua Portuguesa",
    anoEscolar: "8º Ano",
    instrucoes: "Leia com atenção cada questão. Utilize os apoios visuais quando necessário.",
    questoes: [],
    alunoId: "",
    alunoNome: "",
    necessidades: [],
    nivelSuporte: 1,
  });

  // Modais
  const [modalPEIAberto, setModalPEIAberto] = useState(false);
  const [modalPEIAbaInicial, setModalPEIAbaInicial] = useState("lista");
  const [modalBancoAberto, setModalBancoAberto] = useState(false);
  const [modalIAAberto, setModalIAAberto] = useState(false);

  // Estado do formulário
  const [modo, setModo] = useState("adaptar"); // 'adaptar' | 'criar'
  const [conteudoBase, setConteudoBase] = useState("");
  const [tema, setTema] = useState("");
  const [disciplina, setDisciplina] = useState("Língua Portuguesa");
  const [anoEscolar, setAnoEscolar] = useState("8º Ano");
  const [habilidadeBNCC, setHabilidadeBNCC] = useState("");

  // Configuração de Questões (RN-37)
  const [quantidadeQuestoes, setQuantidadeQuestoes] = useState(5);
  const [adaptarTodasQuestoes, setAdaptarTodasQuestoes] = useState(true);
  const [tiposQuestoes, setTiposQuestoes] = useState([
    "multipla_escolha",
    "associacao",
    "verdadeiro_falso",
  ]);

  // Perfil do estudante selecionado ou avulso
  const [estudantePEI, setEstudantePEI] = useState(null);
  const [estudanteDiario, setEstudanteDiario] = useState(null);
  const [modalDiarioAberto, setModalDiarioAberto] = useState(false);
  const [turmasDiario, setTurmasDiario] = useState(null);
  const [turmaDiarioId, setTurmaDiarioId] = useState("");
  const [carregandoDiario, setCarregandoDiario] = useState(false);
  const [erroDiario, setErroDiario] = useState("");
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
  const [salvoNoBanco, setSalvoNoBanco] = useState(false);

  // Upload e extração de documentos PDF e Word (RN-40)
  const [arquivoAnexado, setArquivoAnexado] = useState(null);
  const [extraindoArquivo, setExtraindoArquivo] = useState(false);
  const [dragAtivo, setDragAtivo] = useState(false);
  const fileInputRef = useRef(null);

  const handleProcessarArquivo = async (file) => {
    if (!file) return;
    setExtraindoArquivo(true);
    setErro("");

    try {
      const resultado = await extractTextFromDocument(file);
      if (!resultado.texto || !resultado.texto.trim()) {
        throw new Error(
          "Nenhum texto pôde ser extraído do documento. Verifique se o arquivo não é uma digitalização/imagem sem texto reconhecível."
        );
      }
      setConteudoBase(resultado.texto);
      setArquivoAnexado({
        nome: resultado.nomeArquivo,
        tamanhoBytes: resultado.tamanhoBytes,
        tipo: resultado.tipo,
        totalCaracteres: resultado.totalCaracteres,
      });
    } catch (err) {
      setErro(err.message || "Erro ao ler o documento anexado.");
    } finally {
      setExtraindoArquivo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoverArquivo = () => {
    setArquivoAnexado(null);
    setConteudoBase("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Toggle de formato de questão
  const handleToggleTipoQuestao = (tipoId) => {
    setTiposQuestoes((prev) =>
      prev.includes(tipoId) ? prev.filter((t) => t !== tipoId) : [...prev, tipoId]
    );
  };

  // Salvar no repositório persistente do professor (RN-38)
  const handleSalvarNoBanco = async (resultadoAtiv) => {
    try {
      const aSalvar = {
        ...resultadoAtiv,
        necessidades: resultadoAtiv.aluno?.necessidades || necessidades,
        alunoNome: resultadoAtiv.aluno?.nome || nomeAluno || estudantePEI?.nome || "Estudante",
        alunoId: estudantePEI?.id || estudanteDiario?.id || "",
        disciplina: resultadoAtiv.disciplina || disciplina,
        anoEscolar: resultadoAtiv.anoEscolar || anoEscolar,
        quantidadeQuestoes: Array.isArray(resultadoAtiv.atividadeAdaptada?.questoes)
          ? resultadoAtiv.atividadeAdaptada.questoes.length
          : quantidadeQuestoes,
      };
      await atividadeRepo.salvarAtividade(user?.uid || "anonimo", aSalvar);
      setSalvoNoBanco(true);
    } catch (err) {
      console.error("Erro ao salvar no banco:", err);
      alert("Erro ao salvar atividade no banco: " + err.message);
    }
  };

  // Carregamento de Questões, Provas e Alunos PEI (RN-42)
  React.useEffect(() => {
    const carregarDados = async () => {
      try {
        const userId = user?.uid || "anonimo";
        const [qList, pList, aList] = await Promise.all([
          questaoRepo.listarQuestoes(userId),
          provaRepo.listarProvas(userId),
          repository.listarAlunos(userId),
        ]);
        setQuestoesBanco(qList);
        setProvasSalvas(pList);
        setAlunosPEI(aList);
      } catch (err) {
        console.warn("[AdaptacoesPage] Erro ao carregar dados do banco:", err);
      }
    };
    carregarDados();
  }, [user?.uid, questaoRepo, provaRepo, repository]);

  // Salvar / atualizar questão no banco
  const handleSalvarQuestaoNoBanco = async (questaoData) => {
    try {
      const userId = user?.uid || "anonimo";
      const salva = await questaoRepo.salvarQuestao(userId, questaoData);
      setQuestoesBanco((prev) => {
        const idx = prev.findIndex((q) => q.id === salva.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = salva;
          return copy;
        }
        return [salva, ...prev];
      });
    } catch (err) {
      console.error("Erro ao salvar questão:", err);
      alert("Erro ao salvar questão: " + err.message);
    }
  };

  // Salvar todas as questões de uma atividade gerada pela IA no banco de questões
  const handleSalvarQuestoesGeradasNoBanco = async (resultadoAtiv) => {
    try {
      const userId = user?.uid || "anonimo";
      const questoes = resultadoAtiv.atividadeAdaptada?.questoes || [];
      const formatadas = questoes.map((q, idx) => ({
        id: `q_ia_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        enunciado: q.enunciado || `Questão ${idx + 1}`,
        tipo: q.alternativas && q.alternativas.length > 0 ? "multipla_escolha" : "discursiva",
        alternativas: q.alternativas || [],
        gabarito: q.gabarito || "",
        apoioVisualDescricao: q.apoioVisualDescricao || "",
        imagemUrl: q.imagemUrl || "",
        scaffolding: q.dicaScaffolding || "",
        disciplina: resultadoAtiv.disciplina || disciplina,
        anoEscolar: resultadoAtiv.anoEscolar || anoEscolar,
        tema: resultadoAtiv.tema || tema,
        habilidadeBNCC: resultadoAtiv.habilidadeBNCC || habilidadeBNCC,
        necessidades: resultadoAtiv.aluno?.necessidades || necessidades,
        nivelSuporte: resultadoAtiv.aluno?.nivelSuporte || nivelSuporte,
        origem: "ia",
      }));

      const salvas = await questaoRepo.salvarQuestoesEmLote(userId, formatadas);
      setQuestoesBanco((prev) => [...salvas, ...prev]);
    } catch (err) {
      console.error("Erro ao salvar lote de questões:", err);
      alert("Erro ao salvar questões no banco: " + err.message);
    }
  };

  // Salvar questão individual a partir do visualizador de atividade
  const handleSalvarQuestaoIndividualDoGerador = async (q, resultadoAtiv) => {
    try {
      const userId = user?.uid || "anonimo";
      const formatada = {
        id: `q_ia_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        enunciado: q.enunciado,
        tipo: q.alternativas && q.alternativas.length > 0 ? "multipla_escolha" : "discursiva",
        alternativas: q.alternativas || [],
        gabarito: q.gabarito || "",
        apoioVisualDescricao: q.apoioVisualDescricao || "",
        imagemUrl: q.imagemUrl || "",
        scaffolding: q.dicaScaffolding || "",
        disciplina: resultadoAtiv.disciplina || disciplina,
        anoEscolar: resultadoAtiv.anoEscolar || anoEscolar,
        tema: resultadoAtiv.tema || tema,
        habilidadeBNCC: resultadoAtiv.habilidadeBNCC || habilidadeBNCC,
        necessidades: resultadoAtiv.aluno?.necessidades || necessidades,
        nivelSuporte: resultadoAtiv.aluno?.nivelSuporte || nivelSuporte,
        origem: "ia",
      };
      const salva = await questaoRepo.salvarQuestao(userId, formatada);
      setQuestoesBanco((prev) => [salva, ...prev]);
    } catch (err) {
      console.error("Erro ao salvar questão individual:", err);
      alert("Erro ao salvar questão no banco: " + err.message);
    }
  };

  // Excluir questão do banco
  const handleExcluirQuestao = async (questaoId) => {
    try {
      const userId = user?.uid || "anonimo";
      await questaoRepo.removerQuestao(userId, questaoId);
      setQuestoesBanco((prev) => prev.filter((q) => q.id !== questaoId));
      setProvaEmConstrucao((prev) => ({
        ...prev,
        questoes: (prev.questoes || []).filter((q) => q.id !== questaoId),
      }));
    } catch (err) {
      console.error("Erro ao excluir questão:", err);
    }
  };

  // Adicionar questão à prova
  const handleAdicionarQuestaoAProva = (questao) => {
    setProvaEmConstrucao((prev) => {
      const jaExiste = (prev.questoes || []).some((q) => q.id === questao.id);
      if (jaExiste) return prev;
      return {
        ...prev,
        disciplina: prev.questoes.length === 0 ? questao.disciplina || prev.disciplina : prev.disciplina,
        anoEscolar: prev.questoes.length === 0 ? questao.anoEscolar || prev.anoEscolar : prev.anoEscolar,
        questoes: [...(prev.questoes || []), questao],
      };
    });
  };

  // Remover questão da prova
  const handleRemoverQuestaoDaProva = (questaoId) => {
    setProvaEmConstrucao((prev) => ({
      ...prev,
      questoes: (prev.questoes || []).filter((q) => q.id !== questaoId),
    }));
  };

  // Mover questão na prova (reordenação)
  const handleMoverQuestaoNaProva = (origemIdx, destinoIdx) => {
    setProvaEmConstrucao((prev) => {
      const lista = [...(prev.questoes || [])];
      if (origemIdx < 0 || origemIdx >= lista.length || destinoIdx < 0 || destinoIdx >= lista.length) {
        return prev;
      }
      const [removida] = lista.splice(origemIdx, 1);
      lista.splice(destinoIdx, 0, removida);
      return { ...prev, questoes: lista };
    });
  };

  // Salvar prova montada
  const handleSalvarProva = async (provaData) => {
    const userId = user?.uid || "anonimo";
    const salva = await provaRepo.salvarProva(userId, provaData);
    setProvasSalvas((prev) => {
      const idx = prev.findIndex((p) => p.id === salva.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = salva;
        return copy;
      }
      return [salva, ...prev];
    });
    setProvaEmConstrucao(salva);
  };

  // Carregar prova salva
  const handleCarregarProva = (provaData) => {
    setProvaEmConstrucao(provaData);
    setAbaPrincipal("montador_provas");
  };

  // Excluir prova salva
  const handleExcluirProva = async (provaId) => {
    const userId = user?.uid || "anonimo";
    await provaRepo.removerProva(userId, provaId);
    setProvasSalvas((prev) => prev.filter((p) => p.id !== provaId));
  };

  // Toggle de categoria no Seletor
  const handleToggleNecessidade = (id) => {
    setNecessidades((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };


  // Quando o professor escolhe um aluno do banco PEI
  const handleSelectAlunoPEI = (aluno) => {
    if (aluno.origem === "diario") {
      setEstudanteDiario({
        id: aluno.id || "",
        nome: aluno.nome || "",
        turmaNome: aluno.turmaNome || "",
      });
      setEstudantePEI(null);
    } else {
      setEstudantePEI(aluno);
      setEstudanteDiario(null);
    }
    setNomeAluno(aluno.nome || "");
    setNecessidades(aluno.necessidades || []);
    setNivelSuporte(aluno.nivelSuporte || 1);
    setHiperfoco(aluno.hiperfoco || "");
    setObservacoes(aluno.observacoes || "");
  };

  const handleLimparAlunoPEI = () => {
    setEstudantePEI(null);
    setEstudanteDiario(null);
    setNomeAluno("");
    setNecessidades([]);
    setNivelSuporte(1);
    setHiperfoco("");
    setObservacoes("");
  };

  // Ponte "Carregar do Diário" (RN-46): leitura única do doc de turmas
  const carregarTurmasDiario = async () => {
    if (!user?.uid) {
      setErroDiario("Faça login para carregar as turmas do Diário.");
      return;
    }
    setCarregandoDiario(true);
    setErroDiario("");
    try {
      const snap = await getDoc(doc(db, "professores", user.uid, "turmas", "data"));
      const turmas = snap.exists() && Array.isArray(snap.data()?.turmas) ? snap.data().turmas : [];
      setTurmasDiario(turmas);
      setTurmaDiarioId((prev) =>
        prev && turmas.some((t) => t.id === prev) ? prev : turmas[0]?.id || ""
      );
    } catch {
      setTurmasDiario(null);
      setErroDiario("Não foi possível carregar as turmas do Diário.");
    } finally {
      setCarregandoDiario(false);
    }
  };

  const handleAbrirDiario = () => {
    setModalDiarioAberto(true);
    if (turmasDiario === null || erroDiario) carregarTurmasDiario();
  };

  // Alunos do Diário unificados à lista do Banco de Alunos (RN-46)
  const alunosDiario = useMemo(
    () => listarAlunosParaSeletor(turmasDiario),
    [turmasDiario]
  );

  const handleAbrirBancoPEI = (aba) => {
    if (aba) setModalPEIAbaInicial(aba);
    setModalPEIAberto(true);
    if (turmasDiario === null && !erroDiario && !carregandoDiario) carregarTurmasDiario();
  };

  const handleSelecionarAlunoDiario = (opcao) => {
    const perfil = paraPerfilInclusivo(opcao.aluno);
    if (!perfil) return;
    setEstudantePEI(null);
    setEstudanteDiario({
      id: opcao.aluno.id || "",
      nome: perfil.nome,
      turmaNome: opcao.turmaNome,
    });
    setNomeAluno(perfil.nome);
    setNecessidades(perfil.necessidades);
    setNivelSuporte(perfil.nivelSuporte);
    setHiperfoco(perfil.hiperfoco);
    setObservacoes(perfil.observacoes);
    setModalDiarioAberto(false);
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

      const qtdFinal =
        modo === "adaptar" && adaptarTodasQuestoes
          ? "todas"
          : Math.max(1, Math.min(15, Number(quantidadeQuestoes) || 5));

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
          quantidadeQuestoes: qtdFinal,
          tiposQuestoes,
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
      setSalvoNoBanco(false);
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
            {/* Botão Banco de Atividades Adaptadas (RN-38) */}
            <button
              id="btn-abrir-banco-atividades"
              type="button"
              onClick={() => setModalBancoAberto(true)}
              className="px-3.5 py-1.5 rounded-xl border border-[#dce0f0] hover:border-[#f60c49]/40 bg-white hover:bg-[#fff2f6] text-xs font-bold text-[#101942] hover:text-[#d40840] transition-all flex items-center gap-1.5 shadow-2xs"
              title="Acessar o Banco de Atividades salvas e reaproveitar para novos alunos"
            >
              <FolderOpen size={15} className="text-[#f60c49]" />
              <span className="hidden sm:inline">Banco de</span> Atividades
            </button>

            {/* Botão Banco de Estudantes PEI */}
            <button
              id="btn-abrir-banco-pei"
              type="button"
              onClick={() => handleAbrirBancoPEI()}
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

      {/* Barra de Abas Principais (RN-42) */}
      <div className="bg-white border-b border-[#dce0f0] sticky top-16 z-30 print:hidden shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2 py-2.5 overflow-x-auto">
          <div className="flex items-center gap-1.5 p-1 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl">
            <button
              type="button"
              id="tab-nav-gerador"
              onClick={() => setAbaPrincipal("gerador")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                abaPrincipal === "gerador"
                  ? "bg-white text-[#f60c49] shadow-xs"
                  : "text-[#6070a0] hover:text-[#101942]"
              }`}
            >
              <Sparkles size={15} />
              Gerador DUA (IA)
            </button>

            <button
              type="button"
              id="tab-nav-banco-questoes"
              onClick={() => setAbaPrincipal("banco_questoes")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                abaPrincipal === "banco_questoes"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-[#6070a0] hover:text-[#101942]"
              }`}
            >
              <BookOpen size={15} />
              Banco de Questões
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-black">
                {questoesBanco.length}
              </span>
            </button>

            <button
              type="button"
              id="tab-nav-montador-provas"
              onClick={() => setAbaPrincipal("montador_provas")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                abaPrincipal === "montador_provas"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-[#6070a0] hover:text-[#101942]"
              }`}
            >
              <FileText size={15} />
              Montador de Provas
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                {(provaEmConstrucao.questoes || []).length}
              </span>
            </button>
          </div>

          {abaPrincipal === "gerador" && (provaEmConstrucao.questoes || []).length > 0 && (
            <button
              type="button"
              onClick={() => setAbaPrincipal("montador_provas")}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
            >
              <span>Ver Prova em Montagem ({provaEmConstrucao.questoes.length})</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {abaPrincipal === "banco_questoes" && (
          <PainelBancoQuestoes
            questoes={questoesBanco}
            questoesNaProva={provaEmConstrucao.questoes || []}
            onAdicionarAProva={handleAdicionarQuestaoAProva}
            onRemoverDaProva={handleRemoverQuestaoDaProva}
            onSalvarQuestao={handleSalvarQuestaoNoBanco}
            onExcluirQuestao={handleExcluirQuestao}
            onNavegarParaMontador={() => setAbaPrincipal("montador_provas")}
          />
        )}

        {abaPrincipal === "montador_provas" && (
          <PainelMontadorProvas
            prova={provaEmConstrucao}
            onAtualizarProva={setProvaEmConstrucao}
            onMoverQuestao={handleMoverQuestaoNaProva}
            onRemoverQuestao={handleRemoverQuestaoDaProva}
            onSalvarProva={handleSalvarProva}
            onCarregarProva={handleCarregarProva}
            onExcluirProva={handleExcluirProva}
            provasSalvas={provasSalvas}
            alunosPEI={alunosPEI}
            onNavegarParaBanco={() => setAbaPrincipal("banco_questoes")}
          />
        )}

        {abaPrincipal === "gerador" && (
          resultado ? (
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

              <VisualizadorAtividadeAdaptada
                resultado={resultado}
                onVoltar={() => setResultado(null)}
                onSalvarNoBanco={handleSalvarNoBanco}
                salvoNoBanco={salvoNoBanco}
                onAbrirBanco={() => setModalBancoAberto(true)}
                onSalvarQuestoesNoBanco={handleSalvarQuestoesGeradasNoBanco}
                onSalvarQuestaoIndividual={handleSalvarQuestaoIndividualDoGerador}
                onConectarIA={() => setModalIAAberto(true)}
              />
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <label className="text-xs font-bold text-[#101942] block">
                        Cole ou anexe a atividade original (textos, enunciados, questões): *
                      </label>

                      {/* Botão de Anexo de Documento (PDF / Word) */}
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          id="upload-documento-atividade"
                          accept=".pdf,.docx,.doc,.txt"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleProcessarArquivo(e.target.files[0]);
                            }
                          }}
                        />
                        <button
                          type="button"
                          id="btn-anexar-documento"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={extraindoArquivo}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#fff2f6] text-[#d40840] hover:bg-[#ffe5ed] border border-[#fde4ec] transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                          title="Importar prova ou lista a partir de arquivo PDF ou Word"
                        >
                          {extraindoArquivo ? (
                            <>
                              <Loader2 size={13} className="animate-spin text-[#d40840]" />
                              Extraindo texto...
                            </>
                          ) : (
                            <>
                              <Paperclip size={13} />
                              Anexar PDF ou Word (.docx)
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Card de Documento Anexado com Sucesso */}
                    {arquivoAnexado && (
                      <div className="mb-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border border-blue-200/80 flex items-center justify-between gap-3 shadow-2xs animate-fadeIn">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-xs flex-shrink-0 ${
                              arquivoAnexado.tipo === "pdf"
                                ? "bg-red-500 text-white"
                                : arquivoAnexado.tipo === "docx" || arquivoAnexado.tipo === "doc"
                                ? "bg-blue-600 text-white"
                                : "bg-purple-600 text-white"
                            }`}
                          >
                            {arquivoAnexado.tipo.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#101942] truncate flex items-center gap-1.5">
                              <span>{arquivoAnexado.nome}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                Extraído com sucesso
                              </span>
                            </p>
                            <p className="text-[11px] text-[#475569] mt-0.5">
                              {(arquivoAnexado.tamanhoBytes / 1024).toFixed(1)} KB •{" "}
                              {arquivoAnexado.totalCaracteres.toLocaleString()} caracteres lidos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 underline px-2 py-1 rounded hover:bg-blue-100/50 transition-colors"
                          >
                            Trocar
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoverArquivo}
                            className="p-1.5 rounded-xl hover:bg-white text-slate-400 hover:text-red-600 transition-colors"
                            title="Remover anexo e limpar texto"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Feedback de Carregamento / Extração */}
                    {extraindoArquivo && (
                      <div className="mb-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5 animate-pulse">
                        <Loader2 size={16} className="animate-spin text-amber-600 flex-shrink-0" />
                        <span className="font-medium">
                          Processando documento e extraindo questões (PDF/Word)... Aguarde um instante.
                        </span>
                      </div>
                    )}

                    {/* Dropzone discreta quando ainda não há arquivo nem texto */}
                    {!arquivoAnexado && !conteudoBase && !extraindoArquivo && (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragAtivo(true);
                        }}
                        onDragLeave={() => setDragAtivo(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragAtivo(false);
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleProcessarArquivo(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`mb-3 p-4 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                          dragAtivo
                            ? "border-[#f60c49] bg-[#fff2f6]"
                            : "border-[#dce0f0] bg-[#fbfbfe] hover:bg-[#f7f8fc] hover:border-[#b4bee0]"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-[#6070a0]">
                          <Upload size={16} className="text-[#f60c49]" />
                          <span>
                            Arraste uma prova/lista em <strong>PDF</strong> ou <strong>Word (.docx)</strong> aqui, ou clique para anexar
                          </span>
                        </div>
                      </div>
                    )}

                    <textarea
                      id="input-conteudo-base"
                      rows={6}
                      required={modo === "adaptar"}
                      value={conteudoBase}
                      onChange={(e) => setConteudoBase(e.target.value)}
                      placeholder="Cole aqui o enunciado original da prova, lista de exercícios ou texto didático, ou anexe seu arquivo PDF/Word no botão acima..."
                      className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-2xl p-4 text-xs sm:text-sm text-[#101942] outline-none resize-y transition-all leading-relaxed"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#6070a0] mt-1.5">
                      <span>
                        {conteudoBase.trim()
                          ? `${conteudoBase.length.toLocaleString()} caracteres no editor • Você pode revisar ou editar o texto antes de enviar para a IA.`
                          : "Suporta arquivos PDF (.pdf), Word (.docx, .doc) e texto (.txt)."}
                      </span>
                      {conteudoBase.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setConteudoBase("");
                            setArquivoAnexado(null);
                          }}
                          className="text-[#d40840] hover:underline self-start sm:self-auto"
                        >
                          Limpar campo
                        </button>
                      )}
                    </div>
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

                {/* Composição da Prova / Quantidade de Questões (RN-37) */}
                <div className="pt-4 border-t border-[#dce0f0] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-[#101942] flex items-center gap-2">
                      <ListOrdered size={16} className="text-[#f60c49]" />
                      Quantidade de Questões da Atividade / Prova Completa (RN-37)
                    </label>
                    <span className="text-[11px] text-[#6070a0]">
                      Monte listas de exercícios ou avaliações completas
                    </span>
                  </div>

                  {modo === "adaptar" ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs font-semibold text-[#101942] cursor-pointer">
                          <input
                            type="radio"
                            name="adaptar_qtd"
                            checked={adaptarTodasQuestoes}
                            onChange={() => setAdaptarTodasQuestoes(true)}
                            className="text-[#f60c49] focus:ring-[#f60c49]"
                          />
                          <span>Adaptar todas as questões do conteúdo original</span>
                        </label>
                        <label className="flex items-center gap-2 text-xs font-semibold text-[#101942] cursor-pointer">
                          <input
                            type="radio"
                            name="adaptar_qtd"
                            checked={!adaptarTodasQuestoes}
                            onChange={() => setAdaptarTodasQuestoes(false)}
                            className="text-[#f60c49] focus:ring-[#f60c49]"
                          />
                          <span>Definir quantidade específica de questões</span>
                        </label>
                      </div>

                      {!adaptarTodasQuestoes && (
                        <div className="flex items-center gap-2 pl-4">
                          {[1, 3, 5, 8, 10].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setQuantidadeQuestoes(num)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                quantidadeQuestoes === num
                                  ? "bg-[#f60c49] text-white shadow-xs"
                                  : "bg-[#f7f8fc] border border-[#dce0f0] text-[#6070a0] hover:text-[#101942]"
                              }`}
                            >
                              {num} {num === 1 ? "questão" : "questões"}
                            </button>
                          ))}
                          <input
                            type="number"
                            min="1"
                            max="15"
                            value={quantidadeQuestoes}
                            onChange={(e) => setQuantidadeQuestoes(Number(e.target.value) || 1)}
                            className="w-16 bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-2 py-1.5 text-xs font-bold text-center text-[#101942] outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {[1, 3, 5, 8, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setQuantidadeQuestoes(num)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            quantidadeQuestoes === num
                              ? "bg-[#f60c49] text-white shadow-xs"
                              : "bg-[#f7f8fc] border border-[#dce0f0] text-[#6070a0] hover:text-[#101942]"
                          }`}
                        >
                          {num} {num === 1 ? "questão" : "questões"}
                        </button>
                      ))}
                      <div className="flex items-center gap-1.5 ml-1">
                        <span className="text-[11px] text-[#6070a0]">Outro:</span>
                        <input
                          type="number"
                          min="1"
                          max="15"
                          value={quantidadeQuestoes}
                          onChange={(e) => setQuantidadeQuestoes(Number(e.target.value) || 1)}
                          className="w-16 bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-2 py-1.5 text-xs font-bold text-center text-[#101942] outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Formatos / Tipos de Questões Aceitos */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-[#101942] block">
                      Formatos Pedagógicos Priorizados (Ação & Expressão DUA):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {[
                        { id: "multipla_escolha", label: "Múltipla Escolha (3 itens)", desc: "Distratores calibrados" },
                        { id: "associacao", label: "Associação / Colunas", desc: "Ligação direta de pares" },
                        { id: "verdadeiro_falso", label: "Verdadeiro ou Falso", desc: "Afirmações curtas (V/F)" },
                        { id: "discursiva_curta", label: "Discursiva com Apoio", desc: "Com início de resposta" },
                      ].map((tipo) => {
                        const ativo = tiposQuestoes.includes(tipo.id);
                        return (
                          <button
                            key={tipo.id}
                            type="button"
                            onClick={() => handleToggleTipoQuestao(tipo.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                              ativo
                                ? "bg-[#fff2f6] border-[#f60c49]/40 text-[#101942]"
                                : "bg-[#f7f8fc] border-[#dce0f0] text-[#6070a0] hover:border-slate-300"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center flex-shrink-0 transition-colors ${
                                ativo ? "bg-[#f60c49] border-[#f60c49] text-white" : "border-[#dce0f0] bg-white"
                              }`}
                            >
                              {ativo && <CheckCircle2 size={12} />}
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold block leading-tight">{tipo.label}</span>
                              <span className="text-[10px] text-[#6070a0] block leading-tight">{tipo.desc}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
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
                  ) : estudanteDiario ? (
                    <div className="flex items-center gap-2 bg-[#fff2f6] border border-[#fde4ec] px-3 py-1.5 rounded-xl">
                      <span className="text-xs font-bold text-[#d40840]">
                        Diário: {estudanteDiario.nome}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        id="btn-importar-alunos-card2"
                        onClick={() => handleAbrirBancoPEI("importacao")}
                        className="px-3 py-1.5 border border-[#dce0f0] hover:border-[#f60c49]/40 bg-[#f7f8fc] hover:bg-white rounded-xl text-xs font-bold text-[#101942] transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Fazer upload de planilha Excel ou CSV com nome dos alunos, turma e deficiências"
                      >
                        <FileSpreadsheet size={14} className="text-[#f60c49]" />
                        Importar Lista (Excel/CSV)
                      </button>
                      <button
                        type="button"
                        id="btn-carregar-banco-pei-card2"
                        onClick={() => handleAbrirBancoPEI("lista")}
                        className="px-3 py-1.5 border border-[#dce0f0] hover:border-[#f60c49]/40 bg-[#f7f8fc] hover:bg-white rounded-xl text-xs font-bold text-[#101942] transition-colors flex items-center gap-1.5 shadow-2xs"
                      >
                        <Users size={14} className="text-[#f60c49]" />
                        Carregar do Banco PEI
                      </button>
                      <button
                        type="button"
                        id="btn-carregar-diario-card2"
                        onClick={handleAbrirDiario}
                        className="px-3 py-1.5 border border-[#dce0f0] hover:border-[#f60c49]/40 bg-[#f7f8fc] hover:bg-white rounded-xl text-xs font-bold text-[#101942] transition-colors flex items-center gap-1.5 shadow-2xs"
                        title="Carregar o perfil inclusivo de um aluno já cadastrado no Diário Pedagógico (RN-46)"
                      >
                        <BookOpen size={14} className="text-[#f60c49]" />
                        Carregar do Diário
                      </button>
                    </div>
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
        ))}
      </main>

      {/* Modal PEI */}
      <ModalAlunoPEI
        isOpen={modalPEIAberto}
        abaInicial={modalPEIAbaInicial}
        onClose={() => setModalPEIAberto(false)}
        repository={repository}
        userId={user?.uid || "anonimo"}
        onSelectAluno={handleSelectAlunoPEI}
        alunosDiario={alunosDiario}
      />

      {/* Seletor "Carregar do Diário" (RN-46) */}
      {modalDiarioAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101942]/40 backdrop-blur-sm"
          onClick={() => setModalDiarioAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Carregar aluno do Diário Pedagógico"
        >
          <div
            className="bg-white rounded-2xl border border-[#dce0f0] shadow-xl p-5 w-full max-w-lg max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-extrabold text-[#101942]">Carregar do Diário</h3>
              <button
                type="button"
                onClick={() => setModalDiarioAberto(false)}
                aria-label="Fechar seletor do Diário"
                className="text-[#6070a0] hover:text-[#d40840] p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-[11px] text-[#6070a0] mb-4 leading-relaxed">
              Selecione a turma e o aluno: necessidades, nível de suporte, âncora de engajamento e
              observações serão preenchidos automaticamente (RN-46).
            </p>

            {carregandoDiario ? (
              <div className="flex items-center gap-2 text-xs text-[#6070a0] py-6 justify-center">
                <Loader2 size={14} className="animate-spin" /> Carregando turmas do Diário...
              </div>
            ) : erroDiario ? (
              <div className="py-6 text-center space-y-3">
                <p className="text-xs text-[#d40840] font-semibold">{erroDiario}</p>
                <button
                  type="button"
                  onClick={carregarTurmasDiario}
                  className="px-4 py-2 btn-brand-primary rounded-xl text-white text-xs font-bold transition-all"
                >
                  Tentar novamente
                </button>
              </div>
            ) : !turmasDiario || turmasDiario.length === 0 ? (
              <p className="text-xs text-[#6070a0] py-6 text-center">
                Nenhuma turma cadastrada no Diário.
              </p>
            ) : (
              <>
                <label
                  htmlFor="select-turma-diario"
                  className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1"
                >
                  Turma
                </label>
                <select
                  id="select-turma-diario"
                  value={turmaDiarioId}
                  onChange={(e) => setTurmaDiarioId(e.target.value)}
                  className="w-full bg-[#f7f8fc] border border-[#dce0f0] rounded-xl px-3 py-2 text-xs text-[#101942] outline-none focus:border-[#f60c49] focus:ring-2 focus:ring-[#f60c49]/25 transition-all mb-3"
                >
                  {turmasDiario.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome || t.id}
                    </option>
                  ))}
                </select>
                {(() => {
                  const opcoes = listarAlunosParaSeletor(turmasDiario).filter(
                    (o) => o.turmaId === turmaDiarioId
                  );
                  if (opcoes.length === 0) {
                    return (
                      <p className="text-xs text-[#6070a0] py-4 text-center">
                        Nenhum aluno nesta turma.
                      </p>
                    );
                  }
                  return (
                    <ul className="overflow-y-auto space-y-1.5 pr-1">
                      {opcoes.map((o) => (
                        <li key={o.aluno.id || o.aluno.nome}>
                          <button
                            type="button"
                            onClick={() => handleSelecionarAlunoDiario(o)}
                            className="w-full text-left px-3 py-2 rounded-xl border border-[#dce0f0] hover:border-[#f60c49] hover:bg-[#fff2f6] transition-all text-xs font-bold text-[#101942] flex items-center justify-between gap-2"
                          >
                            <span>{o.aluno.nome}</span>
                            <span className="text-[10px] font-medium text-[#6070a0]">
                              {Array.isArray(o.aluno.necessidades) && o.aluno.necessidades.length > 0
                                ? `${o.aluno.necessidades.length} necessidade(s)`
                                : "perfil parcial"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal Banco de Atividades Adaptadas (RN-38) */}
      <ModalBancoAtividades
        isOpen={modalBancoAberto}
        onClose={() => setModalBancoAberto(false)}
        repository={atividadeRepo}
        alunoRepository={repository}
        userId={user?.uid || "anonimo"}
        onCarregarAtividade={(ativ) => {
          setResultado(ativ);
          setSalvoNoBanco(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      {/* Modal Conectar IA */}
      <ModalConectarIA
        isOpen={modalIAAberto}
        onClose={() => setModalIAAberto(false)}
      />
    </div>
  );
}
