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
import {EditorVisualQuestao} from "./EditorVisualQuestao";
import {pendenciasVisuais} from "@/dominio/adaptacoes/qualidadeVisual";
import {aguardarImagens} from "@/aplicacao/adaptacoes/arquivoVisual";
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
  configVisual = {},
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
  const [erroVisual, setErroVisual] = useState("");
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

  const aplicarProva = nova => {
    const contexto = v => JSON.stringify([v.alunoId,v.necessidades,v.nivelSuporte,v.disciplina,v.anoEscolar]);
    onAtualizarProva(contexto(nova)!==contexto(prova)?{...nova,questoes:nova.questoes.map(q=>({...q,visual:{...q.visual,aprovacao:null}}))}:nova);
  };
  const atualizarImagemQuestao = (id,nova) => {
    const documentoId=prova.documentoVisualId||prova.id||'em-construcao';
    onAtualizarProva(atual=>{
      if((atual.documentoVisualId||atual.id||'em-construcao')!==documentoId)return atual;
      return {...atual,questoes:atual.questoes.map(q=>q.id===id?nova:q)};
    });
  };
  const handleSelecionarAluno = (alunoId) => {
    if (!alunoId) {
      aplicarProva({
        ...prova,
        questoes:questoes.map(q=>({...q,visual:{...q.visual,aprovacao:null}})),
        alunoId: "",
        alunoNome: "",
        necessidades: [],
        nivelSuporte: 1,
      });
      return;
    }
    const aluno = alunosPEI.find((a) => a.id === alunoId);
    if (aluno) {
      aplicarProva({
        ...prova,
        questoes:questoes.map(q=>({...q,visual:{...q.visual,aprovacao:null}})),
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
    aplicarProva({ ...prova, questoes: novas });
    setEditandoIdx(null);
  };

  const imprimir = async () => {
    const pendencias=pendenciasVisuais(questoes);
    if(pendencias.length){setErroVisual(pendencias.join(' '));return;}
    try{await aguardarImagens(document.getElementById('area-impressao-prova'));window.print();}catch(e){setErroVisual(e.message);}
  };
  // Se modo impressão/visualização acessível ativo
  if (modoImpressao) {
    return (
      <div className="space-y-6">
        {/* Barra superior de controle de impressão */}
        <div className="no-print flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-[#e2d9f7] rounded-3xl shadow-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModoImpressao(false)}
              className="px-3.5 py-2 text-xs font-bold text-[#5b4b86] hover:text-[#25104a] rounded-xl hover:bg-[#f3edff] transition-colors"
            >
              ← Voltar à Edição
            </button>
            <div className="h-4 w-px bg-[#E2D9F7]" />
            {/* Abas Caderno do Estudante / Guia de Mediação */}
            <div className="flex bg-[#f3edff] p-1 rounded-2xl border border-[#e2d9f7]">
              <button
                type="button"
                onClick={() => setAbaExibicao("aluno")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  abaExibicao === "aluno"
                    ? "bg-white text-[#25104a] shadow-xs"
                    : "text-[#5b4b86]"
                }`}
              >
                Caderno do Estudante
              </button>
              <button
                type="button"
                onClick={() => setAbaExibicao("mediacao")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  abaExibicao === "mediacao"
                    ? "bg-white text-[#25104A] shadow-xs"
                    : "text-[#5b4b86]"
                }`}
              >
                Guia de Mediação
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Controles de Acessibilidade */}
            <div className="flex items-center gap-1.5 bg-[#f3edff] p-1 rounded-2xl border border-[#e2d9f7] text-xs font-bold text-[#5b4b86]">
              <span className="px-2">Fonte:</span>
              {["14px", "16px", "18px", "22px"].map((tam) => (
                <button
                  key={tam}
                  type="button"
                  onClick={() => setTamanhoFonte(tam)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    tamanhoFonte === tam ? "bg-white text-[#25104a] shadow-xs" : "hover:text-[#25104a]"
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
                  ? "bg-[#F3EDFF] border-[#6315d9] text-[#6315d9]"
                  : "bg-white border-[#e2d9f7] text-[#5b4b86]"
              }`}
            >
              Espaçamento 1.5
            </button>

            <button
              type="button"
              onClick={() => setAltoContraste((p) => !p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                altoContraste
                  ? "bg-[#25104A] border-[#25104A] text-[#B9A6EF]"
                  : "bg-white border-[#e2d9f7] text-[#5b4b86]"
              }`}
            >
              Alto Contraste
            </button>

            <button
              type="button"
              onClick={imprimir}
              className="px-4 py-2 bg-linear-to-r from-[#6315d9] to-[#5411b8] text-white rounded-xl text-xs font-black shadow-md shadow-[#6315d9]/20 flex items-center gap-1.5"
            >
              <Printer size={15} /> Imprimir / Salvar PDF
            </button>
          </div>
        </div>

        {erroVisual&&<p role="alert" className="text-[#5411B8] print:hidden">{erroVisual}</p>}
        {/* Folha de Prova Formatada para Impressão */}
        <div
          id="area-impressao-prova"
          className={`p-8 md:p-12 rounded-3xl border transition-all shadow-md ${
            altoContraste
              ? "bg-black text-[#B9A6EF] border-[#6315D9]"
              : "bg-white text-[#25104a] border-[#e2d9f7]"
          }`}
          style={{
            fontSize: tamanhoFonte,
            lineHeight: espacamentoDuplo ? "2" : "1.6",
          }}
        >
          {abaExibicao === "aluno" ? (
            <div className="space-y-8">
              {/* Cabeçalho da Prova */}
              <div className={`pb-6 border-b-2 ${altoContraste ? "border-[#6315D9]" : "border-[#25104a]"} space-y-3`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                    {prova.titulo || "Avaliação Adaptada"}
                  </h1>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F3EDFF] text-[#25104A] print:border print:border-[#6E5F94]">
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
                  <div className="p-3 bg-[#F3EDFF] border rounded-xl text-xs leading-relaxed italic print:bg-transparent">
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

                    {q.imagemUrl && <img src={q.imagemUrl} alt={q.apoioVisualDescricao||"Figura da questão"} className="w-full object-contain" style={{maxWidth:`${q.planoVisual?.larguraCm||10}cm`,maxHeight:'16cm'}}/>}
                    {q.apoioVisualDescricao && (
                      <div className="p-3 rounded-xl border border-dashed text-xs bg-[#F3EDFF] print:bg-transparent">
                        <strong>[Apoio Visual]:</strong> {q.apoioVisualDescricao}
                      </div>
                    )}

                    {Array.isArray(q.alternativas) && q.alternativas.length > 0 && (
                      <div className="space-y-2.5 pl-6">
                        {q.alternativas.map((alt, aIdx) => (
                          <div key={aIdx} className="flex items-start gap-3">
                            <span className="w-5 h-5 rounded-full border-2 border-[#6E5F94] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5" />
                            <span className="text-sm font-medium">{alt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {["discursiva","discursiva_curta"].includes(q.tipo) && (
                      <div className="border border-dashed border-[#B9A6EF] rounded-xl h-24 mt-2 print:border-[#6E5F94]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Guia de Mediação Pedagógica */
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-black text-[#25104A]">
                  Guia de Mediação Docente e Apoio AEE
                </h2>
                <p className="text-xs text-[#5b4b86]">
                  Orientações para o professor regente e mediador durante a aplicação desta prova
                </p>
              </div>

              <div className="space-y-4">
                {questoes.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 bg-[#F3EDFF]/50 border border-[#E7DBFD] rounded-2xl space-y-2">
                    <h3 className="text-xs font-black text-[#25104A]">
                      Questão {idx + 1}: {q.enunciado?.slice(0, 80)}...
                    </h3>
                    {q.scaffolding ? (
                      <p className="text-xs text-[#25104A]">
                        <strong>Estratégia de Mediação / Scaffolding:</strong> {q.scaffolding}
                      </p>
                    ) : (
                      <p className="text-xs text-[#5b4b86] italic">
                        Mediação padrão: leia o enunciado com entonação clara e permita o tempo necessário para resposta.
                      </p>
                    )}
                    {q.gabarito && (
                      <p className="text-xs font-bold text-[#25104A]">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-[#e2d9f7] rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#6315D9] to-[#5411B8] flex items-center justify-center text-white shadow-md shadow-[#6315D9]/10">
            <FileText size={22} />
          </div>
          <div>
            <h2 className="text-base font-black text-[#25104a]">
              Montador de Provas e Avaliações Adaptadas
            </h2>
            <p className="text-xs text-[#5b4b86]">
              Personalize a sequência, ajuste enunciados e vincule a um estudante PEI
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModalProvasAberto(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-[#f3edff] text-[#25104a] border border-[#e2d9f7] rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            <FolderOpen size={15} className="text-[#5b4b86]" />
            Provas Salvas ({provasSalvas.length})
          </button>

          <button
            type="button"
            disabled={salvando}
            onClick={handleSalvar}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${
              salvoFeedback
                ? "bg-[#6315D9] text-white"
                : "bg-linear-to-r from-[#6315d9] to-[#5411b8] text-white hover:opacity-95 shadow-[#6315d9]/20"
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
              className="px-4 py-2.5 bg-[#6315D9] hover:bg-[#5411B8] text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-[#6315D9]/20"
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
        <div className="lg:col-span-2 p-6 bg-white border border-[#e2d9f7] rounded-3xl shadow-xs space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#5b4b86] flex items-center gap-2">
            <FileText size={16} className="text-[#6315d9]" /> Identificação da Avaliação
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-[#25104a] mb-1">
                Título da Prova / Avaliação
              </label>
              <input
                type="text"
                value={prova.titulo || ""}
                onChange={(e) => aplicarProva({ ...prova, titulo: e.target.value })}
                placeholder="Ex: Avaliação Diagnóstica de Ciências - 1º Bimestre"
                className="w-full px-3.5 py-2.5 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl text-xs font-bold text-[#25104a] focus:outline-hidden focus:border-[#6315d9]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#25104a] mb-1">
                Ano Escolar
              </label>
              <select
                value={prova.anoEscolar || "8º Ano"}
                onChange={(e) => aplicarProva({ ...prova, anoEscolar: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl text-xs font-medium text-[#25104a] focus:outline-hidden focus:border-[#6315d9]"
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
            <label className="block text-xs font-bold text-[#25104a] mb-1">
              Instruções Gerais ao Estudante
            </label>
            <textarea
              rows={2}
              value={prova.instrucoes || ""}
              onChange={(e) => aplicarProva({ ...prova, instruções: e.target.value, instrucoes: e.target.value })}
              placeholder="Ex: Leia com tranquilidade. Use os apoios visuais para ajudar na compreensão..."
              className="w-full px-3.5 py-2 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl text-xs font-medium text-[#25104a] focus:outline-hidden focus:border-[#6315d9]"
            />
          </div>
        </div>

        {/* Card: Vincular Aluno PEI */}
        <div className="p-6 bg-linear-to-br from-[#F3EDFF]/50 to-white border border-[#E7DBFD] rounded-3xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#25104A] flex items-center gap-2">
              <UserCheck size={16} className="text-[#6315D9]" />
              Estudante Vinculado
            </h3>
            {prova.alunoNome && (
              <button
                type="button"
                onClick={() => handleSelecionarAluno("")}
                className="text-[11px] font-bold text-[#6315D9] hover:underline"
              >
                Desvincular
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#25104a] mb-1.5">
              Selecionar do Banco de Alunos PEI:
            </label>
            <select
              value={prova.alunoId || ""}
              onChange={(e) => handleSelecionarAluno(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2D9F7] rounded-2xl text-xs font-bold text-[#25104a] focus:outline-hidden focus:border-[#6315D9] shadow-xs"
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
            <div className="p-3 bg-white border border-[#E7DBFD] rounded-2xl space-y-2">
              <p className="text-xs font-black text-[#25104A]">
                {prova.alunoNome}
              </p>
              <div className="flex flex-wrap gap-1">
                {(prova.necessidades || []).map((nec) => {
                  const cat = CATEGORIAS_MAP[nec];
                  return (
                    <span
                      key={nec}
                      className="px-2 py-0.5 rounded-lg bg-[#F3EDFF] text-[#25104A] text-[10px] font-bold"
                    >
                      {cat ? cat.nome : nec}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-[#5b4b86] leading-tight">
              Você pode aplicar esta prova para toda a turma ou vinculá-la a um aluno com PEI para gerar o cabeçalho adaptado.
            </p>
          )}
        </div>
      </div>

      {/* Bloco 2: Lista de Questões com Reordenação e Edição */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-[#25104a]">
              Questões da Prova ({questoes.length})
            </h3>
            <span className="text-xs text-[#5b4b86]">
              Reordene, edite ou remova itens livremente
            </span>
          </div>

          <button
            type="button"
            onClick={onNavegarParaBanco}
            className="px-3.5 py-2 bg-[#F3EDFF] hover:bg-[#E7DBFD] text-[#25104A] border border-[#E2D9F7] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus size={14} /> Adicionar Mais Questões do Banco
          </button>
        </div>

        {questoes.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed border-[#e2d9f7] rounded-3xl space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f3edff] flex items-center justify-center text-[#5b4b86]">
              <BookOpen size={24} />
            </div>
            <h4 className="text-sm font-bold text-[#25104a]">
              Nenhuma questão adicionada à prova ainda
            </h4>
            <p className="text-xs text-[#5b4b86] max-w-sm mx-auto">
              Acesse o Banco de Questões e clique em &quot;+ Adicionar à Prova&quot; nas questões desejadas.
            </p>
            <button
              type="button"
              onClick={onNavegarParaBanco}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-linear-to-r from-[#6315d9] to-[#5411b8] text-white rounded-2xl text-xs font-black shadow-md shadow-[#6315d9]/20"
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
                  className="bg-white border border-[#e2d9f7] rounded-3xl p-5 shadow-xs transition-all hover:border-[#B9A6EF] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-[#25104a] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#f3edff] border text-[#5b4b86]">
                        {q.disciplina || "Geral"}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#F3EDFF] text-[#25104A]">
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
                            ? "text-[#B9A6EF] cursor-not-allowed"
                            : "text-[#5b4b86] hover:text-[#25104a] hover:bg-[#f3edff]"
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
                            ? "text-[#B9A6EF] cursor-not-allowed"
                            : "text-[#5b4b86] hover:text-[#25104a] hover:bg-[#f3edff]"
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
                        className="p-1.5 rounded-lg text-[#5b4b86] hover:text-[#25104a] hover:bg-[#f3edff] transition-colors"
                        title={estaEditando ? "Concluir edição" : "Editar enunciado"}
                      >
                        {estaEditando ? <CheckCircle2 size={16} className="text-[#6315D9]" /> : <Edit3 size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoverQuestao(q.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#6315D9] hover:bg-[#F3EDFF] transition-colors"
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
                        className="w-full p-3 bg-[#f3edff] border border-[#6315d9] rounded-2xl text-xs font-bold text-[#25104a] focus:outline-hidden"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditandoIdx(null)}
                          className="px-3 py-1 text-xs text-[#5b4b86]"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSalvarEdicaoLocal(idx)}
                          className="px-3.5 py-1 bg-[#6315D9] text-white rounded-xl text-xs font-bold"
                        >
                          Confirmar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-[#25104a] leading-relaxed">
                      {q.enunciado}
                    </p>
                  )}

                  {(q.imagemUrl||q.apoioVisualDescricao)&&<EditorVisualQuestao key={`${prova.documentoVisualId||prova.id||"em-construcao"}_${q.id}`} questao={q} {...configVisual} disciplina={prova.disciplina} anoEscolar={prova.anoEscolar} necessidades={prova.necessidades||[]} onChange={nova=>atualizarImagemQuestao(q.id,nova)}/>}
                  {/* Apoio Visual */}
                  {q.apoioVisualDescricao && (
                    <div className="p-2.5 bg-[#F3EDFF]/70 border border-[#E2D9F7]/60 rounded-xl text-[11px] text-[#25104A] font-medium">
                      <strong>Apoio Visual:</strong> {q.apoioVisualDescricao}
                    </div>
                  )}

                  {/* Alternativas */}
                  {Array.isArray(q.alternativas) && q.alternativas.length > 0 && (
                    <div className="space-y-1 pl-2">
                      {q.alternativas.map((alt, i) => (
                        <div key={i} className="text-[11px] text-[#5b4b86]">
                          <span className="font-bold text-[#25104a]">{alt.slice(0, 3)}</span> {alt.slice(3)}
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
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-[#e2d9f7] overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#e2d9f7]">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="text-[#6315D9]" size={20} />
                <h3 className="text-sm font-black text-[#25104a]">Provas Montadas Salvas</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalProvasAberto(false)}
                className="p-1.5 text-gray-400 hover:text-[#4A3B7C]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 max-h-96 overflow-y-auto space-y-3">
              {provasSalvas.length === 0 ? (
                <p className="text-xs text-center py-8 text-[#5b4b86]">
                  Nenhuma avaliação montada salva ainda.
                </p>
              ) : (
                provasSalvas.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-[#f3edff] border border-[#e2d9f7] rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="text-xs font-black text-[#25104a]">{p.titulo}</h4>
                      <p className="text-[11px] text-[#5b4b86]">
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
                        className="px-3 py-1.5 bg-[#6315D9] text-white rounded-xl text-xs font-bold hover:bg-[#5411B8]"
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
                        className="p-1.5 text-gray-400 hover:text-[#6315D9]"
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
