"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Users,
  ShieldCheck,
  Trash2,
  Check,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { AlunoInclusivo } from "@/dominio/adaptacoes/AlunoInclusivo";
import { CATEGORIAS_MAP } from "@/dominio/adaptacoes/CategoriasDeficiencia";

export function ModalAlunoPEI({
  isOpen,
  onClose,
  repository,
  userId = "usuario_atual",
  onSelectAluno,
}) {
  const [alunos, setAlunos] = useState([]);
  const [modoCriacao, setModoCriacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Formulário de novo aluno
  const [nome, setNome] = useState("");
  const [turmaNome, setTurmaNome] = useState("");
  const [necessidades, setNecessidades] = useState([]);
  const [nivelSuporte, setNivelSuporte] = useState(1);
  const [hiperfoco, setHiperfoco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState("");

  const carregarAlunos = async () => {
    if (!repository) return;
    try {
      const lista = await repository.listarAlunos(userId);
      setAlunos(lista);
    } catch (err) {
      console.warn("Erro ao listar alunos PEI:", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarAlunos();
      setModoCriacao(false);
      setErro("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSalvar = async (e) => {
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
      setModoCriacao(false);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101942]/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#dce0f0] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="p-5 border-b border-[#dce0f0] flex items-center justify-between bg-gradient-to-r from-[#fff2f6] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f60c49] text-white flex items-center justify-center shadow-xs">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#101942]">
                Banco de Estudantes Inclusivos (PEI Rápido)
              </h3>
              <p className="text-xs text-[#6070a0]">
                Salve perfis e reutilize suas necessidades DUA em qualquer atividade
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6070a0] hover:text-[#101942] hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Banner LGPD */}
        <div className="px-5 py-2.5 bg-blue-50/80 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-900">
          <ShieldCheck size={16} className="text-blue-600 flex-shrink-0" />
          <span>
            <strong>Privacidade & LGPD (RN-33):</strong> Seus dados são salvos apenas no seu ambiente. Recomendamos o uso de iniciais ou apelido do aluno (ex: L.S. ou Lucas).
          </span>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {!modoCriacao ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#6070a0] uppercase tracking-wider">
                  {alunos.length} Estudante(s) Cadastrado(s)
                </span>
                <button
                  id="btn-novo-estudante"
                  type="button"
                  onClick={() => setModoCriacao(true)}
                  className="px-3.5 py-1.5 bg-[#f60c49] hover:bg-[#d40840] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <UserPlus size={15} />
                  Cadastrar Estudante
                </button>
              </div>

              {alunos.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#dce0f0] rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#f7f8fc] text-[#9098c0] flex items-center justify-center mx-auto">
                    <Users size={24} />
                  </div>
                  <p className="text-sm font-bold text-[#101942]">Nenhum perfil de aluno salvo ainda</p>
                  <p className="text-xs text-[#6070a0] max-w-sm mx-auto">
                    Cadastre os estudantes que você acompanha para adaptar atividades com apenas 1 clique.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModoCriacao(true)}
                    className="px-4 py-2 bg-[#fff2f6] text-[#d40840] hover:bg-[#fde4ec] text-xs font-bold rounded-xl transition-colors"
                  >
                    + Criar primeiro perfil
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alunos.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        if (onSelectAluno) onSelectAluno(a);
                        onClose();
                      }}
                      className="p-4 rounded-2xl border border-[#dce0f0] hover:border-[#f60c49]/50 hover:bg-[#fff5f8]/50 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#101942] group-hover:text-[#d40840] transition-colors">
                            {a.nome}
                          </h4>
                          {a.turmaNome && (
                            <span className="text-[10px] font-semibold text-[#6070a0] bg-[#f7f8fc] px-2 py-0.5 rounded-md border border-[#dce0f0]">
                              {a.turmaNome}
                            </span>
                          )}
                          <span className="text-[10px] font-bold text-[#d40840] bg-[#fff2f6] px-2 py-0.5 rounded-md border border-[#fde4ec]">
                            Nível {a.nivelSuporte || 1}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {(a.necessidades || []).map((nid) => (
                            <span
                              key={nid}
                              className="text-[10px] bg-white border border-[#dce0f0] text-[#6070a0] px-2 py-0.5 rounded-md"
                            >
                              {CATEGORIAS_MAP[nid]?.nome || nid}
                            </span>
                          ))}
                        </div>
                        {a.hiperfoco && (
                          <p className="text-[11px] text-amber-700 pt-0.5 flex items-center gap-1">
                            <Sparkles size={11} />
                            Hiperfoco: {a.hiperfoco}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleRemover(a.id, e)}
                          className="p-2 text-[#9098c0] hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Excluir aluno"
                        >
                          <Trash2 size={16} />
                        </button>
                        <span className="text-xs font-bold text-[#f60c49] opacity-0 group-hover:opacity-100 transition-opacity">
                          Selecionar →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSalvar} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#dce0f0]">
                <h4 className="text-sm font-bold text-[#101942]">Novo Perfil de Estudante</h4>
                <button
                  type="button"
                  onClick={() => setModoCriacao(false)}
                  className="text-xs text-[#6070a0] hover:underline"
                >
                  Voltar à lista
                </button>
              </div>

              {erro && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                  {erro}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#101942] block mb-1">
                    Nome ou Iniciais do Estudante *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Lucas M. ou L.M."
                    className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3 py-2 text-xs text-[#101942] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#101942] block mb-1">
                    Turma / Ano (Opcional)
                  </label>
                  <input
                    type="text"
                    value={turmaNome}
                    onChange={(e) => setTurmaNome(e.target.value)}
                    placeholder="Ex: 8º Ano A"
                    className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3 py-2 text-xs text-[#101942] outline-none"
                  />
                </div>
              </div>

              {/* Necessidades Checkboxes */}
              <div>
                <label className="text-xs font-bold text-[#101942] block mb-1.5">
                  Necessidades Específicas / Deficiências (Selecione 1 ou mais) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.values(CATEGORIAS_MAP).map((c) => {
                    const sel = necessidades.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleNecessidadeForm(c.id)}
                        className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between transition-all ${
                          sel
                            ? "bg-[#fff2f6] border-[#f60c49] text-[#d40840] font-bold"
                            : "bg-[#f7f8fc] border-[#dce0f0] text-[#6070a0]"
                        }`}
                      >
                        <span className="truncate">{c.nome}</span>
                        {sel && <Check size={14} className="flex-shrink-0 text-[#f60c49]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nível de Suporte */}
              <div>
                <label className="text-xs font-bold text-[#101942] block mb-1">
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
                          ? "bg-[#fff2f6] border-[#f60c49] text-[#d40840]"
                          : "bg-[#f7f8fc] border-[#dce0f0] text-[#6070a0]"
                      }`}
                    >
                      Nível {n} ({n === 1 ? "Leve" : n === 2 ? "Moderado" : "Intenso"})
                    </button>
                  ))}
                </div>
              </div>

              {/* Hiperfoco */}
              <div>
                <label className="text-xs font-bold text-[#101942] block mb-1">
                  Âncora de Engajamento / Hiperfoco (Opcional)
                </label>
                <input
                  type="text"
                  value={hiperfoco}
                  onChange={(e) => setHiperfoco(e.target.value)}
                  placeholder="Ex: Trens, Astronomia, Futebol, Robôs..."
                  className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3 py-2 text-xs text-[#101942] outline-none"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="text-xs font-bold text-[#101942] block mb-1">
                  Observações Pedagógicas do PEI (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Utilizar apoios visuais e pausas após 20 minutos de foco..."
                  className="w-full bg-[#f7f8fc] border border-[#dce0f0] focus:bg-white focus:border-[#f60c49] rounded-xl px-3 py-2 text-xs text-[#101942] outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModoCriacao(false)}
                  className="px-4 py-2 border border-[#dce0f0] rounded-xl text-xs font-bold text-[#6070a0] hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2 bg-[#f60c49] hover:bg-[#d40840] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
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
