"use client";

import React, { useState } from "react";
import {
  FileText,
  UserCheck,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit3,
  Printer,
  BookmarkPlus,
  BookmarkCheck,
  FolderOpen,
  Sparkles,
  Plus,
  BookOpen,
  Eye,
  Type,
  Maximize2,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  CheckCircle2,
  X,
} from "lucide-react";
import { CATEGORIAS_MAP } from "@/dominio/adaptacoes/CategoriasDeficiencia";

export function PainelMontadorProvas({
  prova,
  onAtualizarProva,
  onMoverQuestao,
  onRemoverQuestao,
  onSalvarProva,
  onCarregarProva,
  onExcluirProva,
  provasSalvas = [],
  alunosPEI = [],
  onNavegarParaBanco,
}) {
  const [modalProvasAberto, setModalProvasAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [salvoFeedback, setSalvoFeedback] = useState(false);
  const [modoImpressao, setModoImpressao] = useState(false);

  // Configurações de acessibilidade para visualização/impressão
  const [tamanhoFonte, setTamanhoFonte] = useState("16px");
  const [espacamentoDuplo, setEspacamentoDuplo] = useState(false);
  const [altoContraste, setAltoContraste] = useState(false);
  const [abaExibicao, setAbaExibicao] = useState("aluno"); // 'aluno' | 'mediacao'

  // Questão sendo editada localmente na prova
  const [editandoIdx, setEditandoIdx] = useState(null);
  const [textoEditado, setTextoEditado] = useState("");

  const questoes = prova.questoes || [];

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      await onSalvarProva(prova);
      setSalvoFeedback(true);
      setTimeout(() => setSalvoFeedback(false), 3000);
    } catch (err) {
      alert("Erro ao salvar prova: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleSelecionarAluno = (alunoId) => {
    if (!alunoId) {
      onAtualizarProva({
        ...prova,
        alunoId: "",
        alunoNome: "",
        necessidades: [],
        nivelSuporte: 1,
      });
      return;
    }
    const aluno = alunosPEI.find((a) => a.id === alunoId);
    if (aluno) {
      onAtualizarProva({
        ...prova,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        necessidades: aluno.necessidades || [],
        nivelSuporte: aluno.nivelSuporte || 1,
      });
    }
  };

  const handleIniciarEdicao = (index, questao) => {
    setEditandoIdx(index);
    setTextoEditado(questao.enunciado || "");
  };

  const handleSalvarEdicaoLocal = (index) => {
    const novas = [...questoes];
    novas[index] = { ...novas[index], enunciado: textoEditado.trim() };
    onAtualizarProva({ ...prova, questoes: novas });
    setEditandoIdx(null);
  };

  // Se modo impressão/visualização acessível ativo
  if (modoImpressao) {
    return (
      <div className="space-y-6">
        {/* Barra superior de controle de impressão */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-[#dce0f0] rounded-3xl shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModoImpressao(false)}
              className="px-3.5 py-2 text-xs font-bold text-[#6070a0] hover:text-[#101942] rounded-xl hover:bg-[#f8f9fd] transition-colors"
            >
              ← Voltar à Edição
            </button>
            <div className="h-4 w-px bg-gray-200" />
            {/* Abas Caderno do Estudante / Guia de Mediação */}
            <div className="flex bg-[#f8f9fd] p-1 rounded-2xl border border-[#dce0f0]">
              <button
                type="button"
                onClick={() => setAbaExibicao("aluno")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  abaExibicao === "aluno"
                    ? "bg-white text-[#101942] shadow-xs"
                    : "text-[#6070a0]"
                }`}
              >
                Caderno do Estudante
              </button>
              <button
                type="button"
                onClick={() => setAbaExibicao("mediacao")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  abaExibicao === "mediacao"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-[#6070a0]"
                }`}
              >
                Guia de Mediação
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Controles de Acessibilidade */}
            <div className="flex items-center gap-1.5 bg-[#f8f9fd] p-1 rounded-2xl border border-[#dce0f0] text-xs font-bold text-[#6070a0]">
              <span className="px-2">Fonte:</span>
              {["14px", "16px", "18px", "22px"].map((tam) => (
                <button
                  key={tam}
                  type="button"
                  onClick={() => setTamanhoFonte(tam)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    tamanhoFonte === tam ? "bg-white text-[#101942] shadow-xs" : "hover:text-[#101942]"
                  }`}
                >
                  {tam.replace("px", "")}pt
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setEspacamentoDuplo((p) => !p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                espacamentoDuplo
                  ? "bg-pink-50 border-[#f60c49] text-[#f60c49]"
                  : "bg-white border-[#dce0f0] text-[#6070a0]"
              }`}
            >
              Espaçamento 1.5
            </button>

            <button
              type="button"
              onClick={() => setAltoContraste((p) => !p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                altoContraste
                  ? "bg-gray-900 border-gray-900 text-yellow-300"
                  : "bg-white border-[#dce0f0] text-[#6070a0]"
              }`}
            >
              Alto Contraste
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-linear-to-r from-[#f60c49] to-[#d40840] text-white rounded-xl text-xs font-black shadow-md shadow-[#f60c49]/20 flex items-center gap-1.5"
            >
              <Printer size={15} /> Imprimir / Salvar PDF
            </button>
          </div>
        </div>

        {/* Folha de Prova Formatada para Impressão */}
        <div
          id="area-impressao-prova"
          className={`p-8 md:p-12 rounded-3xl border transition-all shadow-md ${
            altoContraste
              ? "bg-black text-yellow-300 border-yellow-500"
              : "bg-white text-[#101942] border-[#dce0f0]"
          }`}
          style={{
            fontSize: tamanhoFonte,
            lineHeight: espacamentoDuplo ? "2" : "1.6",
          }}
        >
          {abaExibicao === "aluno" ? (
            <div className="space-y-8">
              {/* Cabeçalho da Prova */}
              <div className={`pb-6 border-b-2 ${altoContraste ? "border-yellow-500" : "border-[#101942]"} space-y-3`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                    {prova.titulo || "Avaliação Adaptada"}
                  </h1>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-800 print:border print:border-gray-400">
                    {prova.disciplina || "Geral"} {prova.anoEscolar ? `• ${prova.anoEscolar}` : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold pt-2">
                  <div className="p-2 border border-dashed rounded-lg">
                    Estudante: <span className="font-medium">{prova.alunoNome || "___________________________________________"}</span>
                  </div>
                  <div className="p-2 border border-dashed rounded-lg flex justify-between">
                    <span>Data: ____/____/________</span>
                    <span>Turma: _________</span>
                  </div>
                </div>

                {prova.instrucoes && (
                  <div className="p-3 bg-gray-50 border rounded-xl text-xs leading-relaxed italic print:bg-transparent">
                    <strong>Orientações:</strong> {prova.instrucoes}
                  </div>
                )}
              </div>

              {/* Lista de Questões Formatadas */}
              <div className="space-y-8">
                {questoes.map((q, idx) => (
                  <div key={q.id || idx} className="space-y-4 break-inside-avoid">
                    <div className="flex items-start gap-2">
                      <span className="font-black text-base">Questão {idx + 1}.</span>
                      <p className="font-bold flex-1 text-left">{q.enunciado}</p>
                    </div>

                    {q.apoioVisualDescricao && (
                      <div className="p-3 rounded-xl border border-dashed text-xs bg-gray-50 print:bg-transparent">
                        <strong>[Apoio Visual]:</strong> {q.apoioVisualDescricao}
                      </div>
                    )}

                    {Array.isArray(q.alternativas) && q.alternativas.length > 0 && (
                      <div className="space-y-2.5 pl-6">
                        {q.alternativas.map((alt, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5" />
                            <span className="text-sm font-medium">{alt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {q.tipo === "discursiva" && (
                      <div className="border border-dashed border-gray-300 rounded-xl h-24 mt-2 print:border-gray-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Guia de Mediação Pedagógica */
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black text-indigo-900">
                  Guia de Mediação Docente e Apoio AEE
                </h2>
                <p className="text-xs text-[#6070a0]">
                  Orientações para o professor regente e mediador durante a aplicação desta prova
                </p>
              </div>

              <div className="space-y-4">
                {questoes.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-2">
                    <h3 className="text-xs font-black text-indigo-950">
                      Questão {idx + 1}: {q.enunciado?.slice(0, 80)}...
                    </h3>
                    {q.scaffolding ? (
                      <p className="text-xs text-indigo-900">
                        <strong>Estratégia de Mediação / Scaffolding:</strong> {q.scaffolding}
                      </p>
                    ) : (
                      <p className="text-xs text-[#6070a0] italic">
                        Mediação padrão: leia o enunciado com entonação clara e permita o tempo necessário para resposta.
                      </p>
                    )}
                    {q.gabarito && (
                      <p className="text-xs font-bold text-emerald-800">
                        Gabarito Oficial: {q.gabarito}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Montador */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-[#dce0f0] rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-base font-black text-[#101942]">
              Montador de Provas e Avaliações Adaptadas
            </h2>
            <p className="text-xs text-[#6070a0]">
              Personalize a sequência, ajuste enunciados e vincule a um estudante PEI
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalProvasAberto(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-[#f8f9fd] text-[#101942] border border-[#dce0f0] rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FolderOpen size={15} className="text-[#6070a0]" />
            Provas Salvas ({provasSalvas.length})
          </button>

          <button
            type="button"
            disabled={salvando}
            onClick={handleSalvar}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
              salvoFeedback
                ? "bg-emerald-600 text-white"
                : "bg-linear-to-r from-[#f60c49] to-[#d40840] text-white hover:opacity-95 shadow-[#f60c49]/20"
            }`}
          >
            {salvoFeedback ? (
              <>
                <CheckCircle2 size={16} /> Salvo com Sucesso!
              </>
            ) : (
              <>
                <BookmarkPlus size={16} /> {salvando ? "Salvando..." : "Salvar Prova"}
              </>
            )}
          </button>

          {questoes.length > 0 && (
            <button
              type="button"
              onClick={() => setModoImpressao(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Printer size={16} />
              Visualizar & Imprimir
            </button>
          )}
        </div>
      </div>

      {/* Bloco 1: Metadados da Prova e Vinculação ao Aluno PEI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Dados da Prova */}
        <div className="lg:col-span-2 p-6 bg-white border border-[#dce0f0] rounded-3xl shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#6070a0] flex items-center gap-2">
            <FileText size={16} className="text-[#f60c49]" /> Identificação da Avaliação
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Título da Prova / Avaliação
              </label>
              <input
                type="text"
                value={prova.titulo || ""}
                onChange={(e) => onAtualizarProva({ ...prova, titulo: e.target.value })}
                placeholder="Ex: Avaliação Diagnóstica de Ciências - 1º Bimestre"
                className="w-full px-3.5 py-2.5 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl text-xs font-bold text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Ano Escolar
              </label>
              <select
                value={prova.anoEscolar || "8º Ano"}
                onChange={(e) => onAtualizarProva({ ...prova, anoEscolar: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
              >
                <option value="6º Ano">6º Ano</option>
                <option value="7º Ano">7º Ano</option>
                <option value="8º Ano">8º Ano</option>
                <option value="9º Ano">9º Ano</option>
                <option value="1º Ano EM">1º Ano EM</option>
                <option value="2º Ano EM">2º Ano EM</option>
                <option value="3º Ano EM">3º Ano EM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#101942] mb-1">
              Instruções Gerais ao Estudante
            </label>
            <textarea
              rows={2}
              value={prova.instrucoes || ""}
              onChange={(e) => onAtualizarProva({ ...prova, instruções: e.target.value, instrucoes: e.target.value })}
              placeholder="Ex: Leia com tranquilidade. Use os apoios visuais para ajudar na compreensão..."
              className="w-full px-3.5 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
            />
          </div>
        </div>

        {/* Card: Vincular Aluno PEI */}
        <div className="p-6 bg-linear-to-br from-indigo-50/50 to-white border border-indigo-100 rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-900 flex items-center gap-2">
              <UserCheck size={16} className="text-indigo-600" />
              Estudante Vinculado
            </h3>
            {prova.alunoNome && (
              <button
                type="button"
                onClick={() => handleSelecionarAluno("")}
                className="text-[11px] font-bold text-red-500 hover:underline"
              >
                Desvincular
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#101942] mb-1.5">
              Selecionar do Banco de Alunos PEI:
            </label>
            <select
              value={prova.alunoId || ""}
              onChange={(e) => handleSelecionarAluno(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-indigo-200 rounded-2xl text-xs font-bold text-[#101942] focus:outline-hidden focus:border-indigo-500 shadow-xs"
            >
              <option value="">-- Prova Geral ou Avulsa --</option>
              {alunosPEI.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome} ({aluno.turmaNome || "Sem Turma"})
                </option>
              ))}
            </select>
          </div>

          {prova.alunoNome ? (
            <div className="p-3 bg-white border border-indigo-100 rounded-2xl space-y-2">
              <p className="text-xs font-black text-indigo-950">
                {prova.alunoNome}
              </p>
              <div className="flex flex-wrap gap-1">
                {(prova.necessidades || []).map((nec) => {
                  const cat = CATEGORIAS_MAP[nec];
                  return (
                    <span
                      key={nec}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold"
                    >
                      {cat ? cat.nome : nec}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-[#6070a0] leading-tight">
              Você pode aplicar esta prova para toda a turma ou vinculá-la a um aluno com PEI para gerar o cabeçalho adaptado.
            </p>
          )}
        </div>
      </div>

      {/* Bloco 2: Lista de Questões com Reordenação e Edição */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-[#101942]">
              Questões da Prova ({questoes.length})
            </h3>
            <span className="text-xs text-[#6070a0]">
              Reordene, edite ou remova itens livremente
            </span>
          </div>

          <button
            type="button"
            onClick={onNavegarParaBanco}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus size={14} /> Adicionar Mais Questões do Banco
          </button>
        </div>

        {questoes.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-[#dce0f0] rounded-3xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f8f9fd] flex items-center justify-center text-[#6070a0]">
              <BookOpen size={24} />
            </div>
            <h4 className="text-sm font-bold text-[#101942]">
              Nenhuma questão adicionada à prova ainda
            </h4>
            <p className="text-xs text-[#6070a0] max-w-sm mx-auto">
              Acesse o Banco de Questões e clique em "+ Adicionar à Prova" nas questões desejadas.
            </p>
            <button
              type="button"
              onClick={onNavegarParaBanco}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-linear-to-r from-[#f60c49] to-[#d40840] text-white rounded-2xl text-xs font-black shadow-md shadow-[#f60c49]/20"
            >
              <BookOpen size={15} /> Explorar Banco de Questões
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {questoes.map((q, idx) => {
              const estaEditando = editandoIdx === idx;
              return (
                <div
                  key={q.id || idx}
                  className="bg-white border border-[#dce0f0] rounded-3xl p-5 shadow-xs transition-all hover:border-gray-300 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-[#101942] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#f8f9fd] border text-[#6070a0]">
                        {q.disciplina || "Geral"}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700">
                        {q.tipo === "multipla_escolha" ? "Múltipla Escolha" : q.tipo}
                      </span>
                    </div>

                    {/* Ações de Reordenação e Edição */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => onMoverQuestao(idx, idx - 1)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          idx === 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#6070a0] hover:text-[#101942] hover:bg-[#f8f9fd]"
                        }`}
                        title="Subir posição"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === questoes.length - 1}
                        onClick={() => onMoverQuestao(idx, idx + 1)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          idx === questoes.length - 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-[#6070a0] hover:text-[#101942] hover:bg-[#f8f9fd]"
                        }`}
                        title="Descer posição"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (estaEditando) {
                            handleSalvarEdicaoLocal(idx);
                          } else {
                            handleIniciarEdicao(idx, q);
                          }
                        }}
                        className="p-1.5 rounded-lg text-[#6070a0] hover:text-[#101942] hover:bg-[#f8f9fd] transition-colors"
                        title={estaEditando ? "Concluir edição" : "Editar enunciado"}
                      >
                        {estaEditando ? <CheckCircle2 size={16} className="text-green-600" /> : <Edit3 size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoverQuestao(q.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remover da prova"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Enunciado (com opção de edição inline) */}
                  {estaEditando ? (
                    <div className="space-y-2">
                      <textarea
                        rows={3}
                        value={textoEditado}
                        onChange={(e) => setTextoEditado(e.target.value)}
                        className="w-full p-3 bg-[#f8f9fd] border border-[#f60c49] rounded-2xl text-xs font-bold text-[#101942] focus:outline-hidden"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditandoIdx(null)}
                          className="px-3 py-1 text-xs text-[#6070a0]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSalvarEdicaoLocal(idx)}
                          className="px-3.5 py-1 bg-green-600 text-white rounded-xl text-xs font-bold"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-[#101942] leading-relaxed">
                      {q.enunciado}
                    </p>
                  )}

                  {/* Apoio Visual */}
                  {q.apoioVisualDescricao && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 font-medium">
                      <strong>Apoio Visual:</strong> {q.apoioVisualDescricao}
                    </div>
                  )}

                  {/* Alternativas */}
                  {Array.isArray(q.alternativas) && q.alternativas.length > 0 && (
                    <div className="space-y-1 pl-2">
                      {q.alternativas.map((alt, i) => (
                        <div key={i} className="text-[11px] text-[#6070a0]">
                          <span className="font-bold text-[#101942]">{alt.slice(0, 3)}</span> {alt.slice(3)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Provas Salvas */}
      {modalProvasAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-[#dce0f0] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#dce0f0]">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="text-indigo-600" size={20} />
                <h3 className="text-sm font-black text-[#101942]">Provas Montadas Salvas</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalProvasAberto(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3">
              {provasSalvas.length === 0 ? (
                <p className="text-xs text-center py-8 text-[#6070a0]">
                  Nenhuma avaliação montada salva ainda.
                </p>
              ) : (
                provasSalvas.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-[#f8f9fd] border border-[#dce0f0] rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-black text-[#101942]">{p.titulo}</h4>
                      <p className="text-[11px] text-[#6070a0]">
                        {p.disciplina} • {p.questoes?.length || 0} questões • Aluno: {p.alunoNome || "Geral"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onCarregarProva(p);
                          setModalProvasAberto(false);
                        }}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
                      >
                        Carregar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Deseja realmente remover esta prova salva?")) {
                            onExcluirProva(p.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
