"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  Trash2,
  Check,
  Sparkles,
  BookOpen,
  FileSpreadsheet,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { AlunoInclusivo } from "@/dominio/adaptacoes/AlunoInclusivo";
import { CATEGORIAS_MAP, CATEGORIAS_DEFICIENCIA } from "@/dominio/adaptacoes/CategoriasDeficiencia";
import {
  parsePlanilhaAlunos,
  gerarArquivoModeloExcel,
} from "@/dominio/adaptacoes/ImportadorAlunosLote";
import { montarListaBancoAlunos } from "@/dominio/adaptacoes/ListaBancoComDiario";

export function ModalAlunoPEI({
  isOpen,
  onClose,
  repository,
  userId = "usuario_atual",
  onSelectAluno,
  abaInicial = "lista",
  alunosDiario = [],
}) {
  const [alunos, setAlunos] = useState([]);
  const [modoVisao, setModoVisao] = useState("lista"); // 'lista' | 'criacao' | 'importacao'
  const [salvando, setSalvando] = useState(false);

  // Formulário de novo aluno manual
  const [nome, setNome] = useState("");
  const [turmaNome, setTurmaNome] = useState("");
  const [necessidades, setNecessidades] = useState([]);
  const [nivelSuporte, setNivelSuporte] = useState(1);
  const [hiperfoco, setHiperfoco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");

  // Estado de Importação em Lote (RN-41)
  const [processandoArquivo, setProcessandoArquivo] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState(null);
  const [erroImportacao, setErroImportacao] = useState("");
  const [sucessoImportacao, setSucessoImportacao] = useState("");
  const [dragAtivo, setDragAtivo] = useState(false);
  const fileInputRef = useRef(null);

  const carregarAlunos = async () => {
    if (!repository) return;
    try {
      const lista = await repository.listarAlunos(userId);
      setAlunos(lista);
    } catch (err) {
      console.warn("Erro ao listar alunos PEI:", err);
    }
  };

  const [contextoAnterior, setContextoAnterior] = useState({ isOpen: false, abaInicial, userId, repository });
  if (contextoAnterior.isOpen !== isOpen || contextoAnterior.abaInicial !== abaInicial ||
      contextoAnterior.userId !== userId || contextoAnterior.repository !== repository) {
    const mudouConta = contextoAnterior.userId !== userId || contextoAnterior.repository !== repository;
    setContextoAnterior({ isOpen, abaInicial, userId, repository });
    if (mudouConta) {
      setAlunos([]);
      setNome("");
      setTurmaNome("");
      setNecessidades([]);
      setNivelSuporte(1);
      setHiperfoco("");
      setObservacoes("");
    }
    if (isOpen) {
      setModoVisao(abaInicial === "importacao" ? "importacao" : "lista");
      setErro("");
      setErroImportacao("");
      setSucessoImportacao("");
      setResultadoImportacao(null);
    }
  }

  useEffect(() => {
    if (!isOpen || !repository) return;
    let ativo = true;
    repository.listarAlunos(userId).then(lista => {
      if (ativo) setAlunos(lista);
    }).catch(err => {
      if (ativo) console.warn("Erro ao listar alunos PEI:", err);
    });
    return () => { ativo = false; };
  }, [isOpen, userId, repository]);

  const alunosVisiveis = montarListaBancoAlunos(alunos, alunosDiario);

  if (!isOpen) return null;

  // Cadastro Manual
  const handleSalvarManual = async (e) => {
    e.preventDefault();
    setErro("");

    try {
      const alunoEntidade = new AlunoInclusivo({
        nome,
        turmaNome,
        necessidades,
        nivelSuporte,
        hiperfoco,
        observacoes,
      });

      setSalvando(true);
      const salvo = await repository.salvarAluno(userId, alunoEntidade);
      await carregarAlunos();

      // Limpa form
      setNome("");
      setTurmaNome("");
      setNecessidades([]);
      setNivelSuporte(1);
      setHiperfoco("");
      setObservacoes("");
      setModoVisao("lista");

      if (onSelectAluno) {
        onSelectAluno(salvo);
      }
    } catch (err) {
      setErro(err.message || "Falha ao salvar aluno.");
    } finally {
      setSalvando(false);
    }
  };

  const handleRemover = async (alunoId, e) => {
    e.stopPropagation();
    if (window.confirm("Deseja remover este perfil de estudante?")) {
      await repository.removerAluno(userId, alunoId);
      await carregarAlunos();
    }
  };

  const toggleNecessidadeForm = (id) => {
    setNecessidades((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Download do Modelo Excel
  const handleBaixarModelo = () => {
    try {
      const bytes = gerarArquivoModeloExcel();
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Modelo_Estudantes_PEI_RotinaDocente.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erro ao baixar modelo de planilha:", err);
      alert("Falha ao gerar o modelo de planilha.");
    }
  };

  // Processamento do Arquivo Importado
  const handleArquivoImportado = async (file) => {
    if (!file) return;
    setProcessandoArquivo(true);
    setErroImportacao("");
    setSucessoImportacao("");

    try {
      const resultado = await parsePlanilhaAlunos(file);
      if (!resultado.alunos || resultado.alunos.length === 0) {
        throw new Error(
          "Nenhum estudante com deficiência reconhecida foi identificado. Verifique se a planilha possui as colunas Nome, Turma e Deficiência."
        );
      }
      setResultadoImportacao(resultado);
    } catch (err) {
      setErroImportacao(err.message || "Erro ao ler a planilha.");
      setResultadoImportacao(null);
    } finally {
      setProcessandoArquivo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Confirmar e Salvar Lote
  const handleConfirmarImportacaoLote = async () => {
    if (!resultadoImportacao || !resultadoImportacao.alunos.length) return;
    setSalvando(true);
    setErroImportacao("");

    try {
      await repository.salvarAlunosLote(userId, resultadoImportacao.alunos);
      setSucessoImportacao(
        `${resultadoImportacao.alunos.length} estudante(s) importado(s) e salvos no Banco PEI com sucesso!`
      );
      await carregarAlunos();
      setTimeout(() => {
        setModoVisao("lista");
        setResultadoImportacao(null);
        setSucessoImportacao("");
      }, 1400);
    } catch (err) {
      setErroImportacao(err.message || "Falha ao salvar os estudantes no banco de dados.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25104a]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#e2d9f7] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-5 border-b border-[#e2d9f7] flex items-center justify-between bg-gradient-to-r from-[#f3edff] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6315d9] text-white flex items-center justify-center shadow-xs">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#25104a]">
                Banco de Estudantes Inclusivos (PEI Rápido)
              </h3>
              <p className="text-xs text-[#5b4b86]">
                Salve perfis e reutilize suas necessidades DUA em qualquer atividade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5b4b86] hover:text-[#25104a] hover:bg-[#F3EDFF] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner LGPD */}
        <div className="px-5 py-2.5 bg-[#F3EDFF]/80 border-b border-[#E7DBFD] flex items-center gap-2 text-xs text-[#25104A]">
          <ShieldCheck size={16} className="text-[#6315D9] flex-shrink-0" />
          <span>
            <strong>Privacidade & LGPD (RN-33):</strong> Seus dados são salvos apenas no seu ambiente. Recomendamos o uso de iniciais ou apelido do aluno (ex: L.S. ou Lucas).
          </span>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* ======================================================== */}
          {/* 1. VISÃO LISTA DE ALUNOS                                */}
          {/* ======================================================== */}
          {modoVisao === "lista" && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <span className="text-xs font-bold text-[#5b4b86] uppercase tracking-wider">
                  {alunosVisiveis.length} Estudante(s) Cadastrado(s)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-abrir-importacao"
                    type="button"
                    onClick={() => {
                      setModoVisao("importacao");
                      setResultadoImportacao(null);
                      setErroImportacao("");
                      setSucessoImportacao("");
                    }}
                    className="px-3 py-1.5 bg-[#f3edff] hover:bg-white border border-[#e2d9f7] hover:border-[#6315d9]/40 text-[#25104a] text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all"
                    title="Importar lista de estudantes via planilha Excel (.xlsx) ou CSV"
                  >
                    <FileSpreadsheet size={15} className="text-[#6315d9]" />
                    Importar Planilha (Excel/CSV)
                  </button>
                  <button
                    id="btn-novo-estudante"
                    type="button"
                    onClick={() => setModoVisao("criacao")}
                    className="px-3.5 py-1.5 bg-[#6315d9] hover:bg-[#5411b8] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <UserPlus size={15} />
                    Cadastrar Estudante
                  </button>
                </div>
              </div>

              {alunosVisiveis.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#e2d9f7] rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f3edff] text-[#6e5f94] flex items-center justify-center mx-auto">
                    <Users size={24} />
                  </div>
                  <p className="text-sm font-bold text-[#25104a]">Nenhum perfil de aluno salvo ainda</p>
                  <p className="text-xs text-[#5b4b86] max-w-sm mx-auto">
                    Cadastre os estudantes individualmente ou envie uma planilha com a lista da turma para importar todos de uma vez.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setModoVisao("importacao")}
                      className="px-3.5 py-2 bg-white border border-[#e2d9f7] hover:border-[#6315d9]/50 text-[#25104a] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
                    >
                      <FileSpreadsheet size={15} className="text-[#6315d9]" />
                      Importar Planilha Excel/CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoVisao("criacao")}
                      className="px-4 py-2 bg-[#6315d9] hover:bg-[#5411b8] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                    >
                      + Cadastrar Aluno
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alunosVisiveis.map((a) => (
                    <div
                      key={a.chave || a.id}
                      onClick={() => {
                        if (onSelectAluno) onSelectAluno(a);
                        onClose();
                      }}
                      className="p-4 rounded-2xl border border-[#e2d9f7] hover:border-[#6315d9]/50 hover:bg-[#f3edff]/50 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#25104a] group-hover:text-[#5411b8] transition-colors">
                            {a.nome}
                          </h4>
                          {a.origem === "diario" && (
                            <span className="text-[10px] font-bold text-[#6315d9] bg-[#f3edff] px-2 py-0.5 rounded-md border border-[#e7dbfd]">
                              Diário
                            </span>
                          )}
                          {a.turmaNome && (
                            <span className="text-[10px] font-semibold text-[#5b4b86] bg-[#f3edff] px-2 py-0.5 rounded-md border border-[#e2d9f7]">
                              {a.turmaNome}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-[#5411b8] bg-[#f3edff] px-2 py-0.5 rounded-md border border-[#e7dbfd]">
                            Nível {a.nivelSuporte || 1}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(a.necessidades || []).map((nid) => (
                            <span
                              key={nid}
                              className="text-[10px] bg-[#F3EDFF] text-[#4A3B7C] font-medium px-2 py-0.5 rounded-md"
                            >
                              {CATEGORIAS_MAP[nid]?.nome || nid}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleRemover(a.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-[#6315D9] hover:bg-white opacity-0 group-hover:opacity-100 transition-all"
                          title="Remover perfil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. VISÃO IMPORTAÇÃO EM LOTE VIA PLANILHA (RN-41)        */}
          {/* ======================================================== */}
          {modoVisao === "importacao" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2d9f7]">
                <button
                  type="button"
                  onClick={() => {
                    setModoVisao("lista");
                    setResultadoImportacao(null);
                    setErroImportacao("");
                    setSucessoImportacao("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5b4b86] hover:text-[#25104a]"
                >
                  <ArrowLeft size={14} />
                  Voltar para Lista
                </button>
                <button
                  type="button"
                  onClick={handleBaixarModelo}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5411b8] hover:text-[#084c47] bg-[#f3edff] px-3 py-1.5 rounded-xl border border-[#e7dbfd] transition-all"
                  title="Baixar planilha de exemplo com as colunas corretas preenchidas"
                >
                  <Download size={14} />
                  Baixar Planilha Modelo (.xlsx)
                </button>
              </div>

              {/* Banner de Instruções */}
              <div className="p-3.5 rounded-2xl bg-[#f3edff] border border-[#e2d9f7] text-xs text-[#475569] space-y-1.5">
                <p className="font-bold text-[#25104a] flex items-center gap-1.5">
                  <FileSpreadsheet size={15} className="text-[#6315d9]" />
                  Instruções para Importação em Lote:
                </p>
                <p>
                  Sua planilha deve conter ao menos as colunas: <strong>Nome</strong>, <strong>Turma</strong> e <strong>Deficiência</strong> (ou Necessidade).
                </p>
                <p className="text-[11px] text-[#5b4b86]">
                  • <em>Exemplos aceitos:</em> &quot;Autismo&quot;, &quot;TEA&quot;, &quot;TDAH&quot;, &quot;Deficiência Intelectual&quot;, &quot;Baixa Visão&quot;, &quot;Surdez&quot;, &quot;Dislexia&quot;.
                  <br />
                  • <em>Comorbidades:</em> Você pode colocar mais de uma deficiência separando por vírgula ou &quot;e&quot; (ex: <strong>Autismo e TDAH</strong>).
                </p>
              </div>

              {/* Mensagem de Erro de Importação */}
              {erroImportacao && (
                <div className="p-3 rounded-2xl bg-[#F3EDFF] border border-[#E2D9F7] text-[#5411B8] text-xs flex items-center gap-2 font-medium">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{erroImportacao}</span>
                </div>
              )}

              {/* Mensagem de Sucesso */}
              {sucessoImportacao && (
                <div className="p-3.5 rounded-2xl bg-[#F3EDFF] border border-[#E2D9F7] text-[#25104A] text-xs flex items-center gap-2 font-bold animate-fadeIn">
                  <CheckCircle2 size={18} className="flex-shrink-0 text-[#6315D9]" />
                  <span>{sucessoImportacao}</span>
                </div>
              )}

              {/* Seletor / Dropzone */}
              {!resultadoImportacao && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleArquivoImportado(e.target.files[0]);
                      }
                    }}
                  />

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
                        handleArquivoImportado(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-8 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer space-y-3 ${
                      dragAtivo
                        ? "border-[#6315d9] bg-[#f3edff]"
                        : "border-[#e2d9f7] bg-[#f3edff] hover:bg-[#f3edff] hover:border-[#a9c9bc]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#f3edff] text-[#6315d9] flex items-center justify-center mx-auto shadow-xs">
                      {processandoArquivo ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <Upload size={24} />
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-[#25104a]">
                        {processandoArquivo
                          ? "Lendo e validando estudantes da planilha..."
                          : "Clique para selecionar ou arraste o arquivo aqui"}
                      </p>
                      <p className="text-xs text-[#5b4b86]">
                        Formatos aceitos: Planilhas Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) ou texto delimitado (<strong>.csv</strong>)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pré-visualização dos Alunos Encontrados */}
              {resultadoImportacao && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between bg-[#F3EDFF]/80 border border-[#E2D9F7]/80 p-3 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#6315D9]" />
                      <span className="text-xs font-bold text-[#160932]">
                        {resultadoImportacao.alunos.length} Estudante(s) pronto(s) para importação
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResultadoImportacao(null)}
                      className="text-[11px] font-semibold text-[#5411B8] hover:text-[#25104A] underline"
                    >
                      Trocar arquivo
                    </button>
                  </div>

                  {/* Avisos de linhas ignoradas */}
                  {resultadoImportacao.avisos && resultadoImportacao.avisos.length > 0 && (
                    <div className="p-3 bg-[#F3EDFF] border border-[#E2D9F7] rounded-xl text-[#25104A] text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <AlertCircle size={14} className="text-[#6315D9]" />
                        Observações sobre o arquivo ({resultadoImportacao.avisos.length}):
                      </p>
                      <ul className="list-disc list-inside text-[11px] text-[#25104A] space-y-0.5 max-h-24 overflow-y-auto">
                        {resultadoImportacao.avisos.map((aviso, idx) => (
                          <li key={idx}>{aviso}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lista de Alunos Identificados */}
                  <div className="max-h-60 overflow-y-auto space-y-2 border border-[#e2d9f7] rounded-2xl p-2 bg-[#f3edff]">
                    {resultadoImportacao.alunos.map((aluno, i) => (
                      <div
                        key={i}
                        className="p-3 bg-white border border-[#e2d9f7] rounded-xl flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#25104a] truncate">
                              {aluno.nome}
                            </span>
                            {aluno.turmaNome && (
                              <span className="text-[10px] font-semibold text-[#5b4b86] bg-[#f3edff] px-2 py-0.5 rounded border border-[#e2d9f7]">
                                {aluno.turmaNome}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-[#5411b8] bg-[#f3edff] px-1.5 py-0.5 rounded">
                              Nível {aluno.nivelSuporte}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {aluno.necessidades.map((nId) => (
                              <span
                                key={nId}
                                className="text-[10px] bg-[#F3EDFF] text-[#4A3B7C] px-2 py-0.5 rounded font-medium"
                              >
                                {CATEGORIAS_MAP[nId]?.nome || nId}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Ações de Confirmação */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e2d9f7]">
                    <button
                      type="button"
                      onClick={() => setResultadoImportacao(null)}
                      className="px-4 py-2 border border-[#e2d9f7] rounded-xl text-xs font-bold text-[#5b4b86] hover:bg-[#F3EDFF] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      id="btn-confirmar-salvar-lote"
                      onClick={handleConfirmarImportacaoLote}
                      disabled={salvando}
                      className="px-5 py-2 bg-[#6315D9] hover:bg-[#5411B8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {salvando ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Salvando no Banco PEI...
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          Confirmar e Salvar {resultadoImportacao.alunos.length} Alunos
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. VISÃO FORMULÁRIO MANUAL DE NOVO ALUNO                 */}
          {/* ======================================================== */}
          {modoVisao === "criacao" && (
            <form onSubmit={handleSalvarManual} className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-[#e2d9f7]">
                <button
                  type="button"
                  onClick={() => setModoVisao("lista")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5b4b86] hover:text-[#25104a]"
                >
                  <ArrowLeft size={14} />
                  Voltar para Lista
                </button>
                <span className="text-xs font-bold text-[#6315d9]">Novo Perfil Inclusivo</span>
              </div>

              {erro && (
                <div className="p-3 bg-[#F3EDFF] border border-[#E2D9F7] text-[#5411B8] text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{erro}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#25104a] block mb-1">
                    Nome do Aluno / Iniciais *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Lucas S. ou L.S."
                    className="w-full bg-[#f3edff] border border-[#e2d9f7] focus:bg-white focus:border-[#6315d9] rounded-xl px-3 py-2 text-xs text-[#25104a] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#25104a] block mb-1">
                    Turma / Ano Escolar
                  </label>
                  <input
                    type="text"
                    value={turmaNome}
                    onChange={(e) => setTurmaNome(e.target.value)}
                    placeholder="Ex: 6º Ano A, 1º Ano EM..."
                    className="w-full bg-[#f3edff] border border-[#e2d9f7] focus:bg-white focus:border-[#6315d9] rounded-xl px-3 py-2 text-xs text-[#25104a] outline-none"
                  />
                </div>
              </div>

              {/* Necessidades DUA */}
              <div>
                <label className="text-xs font-bold text-[#25104a] block mb-1">
                  Necessidades Específicas / Deficiências * (Selecione 1 ou mais)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 border border-[#e2d9f7] rounded-xl bg-[#f3edff]">
                  {CATEGORIAS_DEFICIENCIA.map((c) => {
                    const sel = necessidades.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleNecessidadeForm(c.id)}
                        className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center justify-between ${
                          sel
                            ? "bg-[#f3edff] border-[#6315d9] text-[#5411b8] font-bold"
                            : "bg-[#f3edff] border-[#e2d9f7] text-[#5b4b86]"
                        }`}
                      >
                        <span className="truncate">{c.nome}</span>
                        {sel && <Check size={14} className="flex-shrink-0 text-[#6315d9]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nível de Suporte */}
              <div>
                <label className="text-xs font-bold text-[#25104a] block mb-1">
                  Nível de Suporte (DSM-5 / CID-11)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNivelSuporte(n)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        nivelSuporte === n
                          ? "bg-[#f3edff] border-[#6315d9] text-[#5411b8]"
                          : "bg-[#f3edff] border-[#e2d9f7] text-[#5b4b86]"
                      }`}
                    >
                      Nível {n} ({n === 1 ? "Leve" : n === 2 ? "Moderado" : "Intenso"})
                    </button>
                  ))}
                </div>
              </div>

              {/* Hiperfoco */}
              <div>
                <label className="text-xs font-bold text-[#25104a] block mb-1">
                  Âncora de Engajamento / Hiperfoco (Opcional)
                </label>
                <input
                  type="text"
                  value={hiperfoco}
                  onChange={(e) => setHiperfoco(e.target.value)}
                  placeholder="Ex: Trens, Astronomia, Futebol, Robôs..."
                  className="w-full bg-[#f3edff] border border-[#e2d9f7] focus:bg-white focus:border-[#6315d9] rounded-xl px-3 py-2 text-xs text-[#25104a] outline-none"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-bold text-[#25104a] block mb-1">
                  Observações Pedagógicas do PEI (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Utilizar apoios visuais e pausas após 20 minutos de foco..."
                  className="w-full bg-[#f3edff] border border-[#e2d9f7] focus:bg-white focus:border-[#6315d9] rounded-xl px-3 py-2 text-xs text-[#25104a] outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModoVisao("lista")}
                  className="px-4 py-2 border border-[#e2d9f7] rounded-xl text-xs font-bold text-[#5b4b86] hover:bg-[#F3EDFF]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-[#6315d9] hover:bg-[#5411b8] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  {salvando ? "Salvando..." : "Salvar Perfil"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
