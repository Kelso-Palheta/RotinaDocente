"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  Lightbulb,
  Image as ImageIcon,
} from "lucide-react";
import { CATEGORIAS_DEFICIENCIA } from "@/dominio/adaptacoes/CategoriasDeficiencia";

export function ModalNovaQuestao({
  isOpen,
  onClose,
  onSalvar,
  questaoParaEditar = null,
}) {
  const [enunciado, setEnunciado] = useState("");
  const [tipo, setTipo] = useState("multipla_escolha");
  const [alternativas, setAlternativas] = useState(["", "", "", ""]);
  const [gabarito, setGabarito] = useState("");
  const [apoioVisualDescricao, setApoioVisualDescricao] = useState("");
  const [scaffolding, setScaffolding] = useState("");
  const [disciplina, setDisciplina] = useState("Língua Portuguesa");
  const [anoEscolar, setAnoEscolar] = useState("8º Ano");
  const [tema, setTema] = useState("");
  const [habilidadeBNCC, setHabilidadeBNCC] = useState("");
  const [necessidades, setNecessidades] = useState([]);
  const [nivelSuporte, setNivelSuporte] = useState(1);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (isOpen) {
      setErro("");
      if (questaoParaEditar) {
        setEnunciado(questaoParaEditar.enunciado || "");
        setTipo(questaoParaEditar.tipo || "multipla_escolha");
        setAlternativas(
          Array.isArray(questaoParaEditar.alternativas) && questaoParaEditar.alternativas.length > 0
            ? [...questaoParaEditar.alternativas]
            : ["", "", "", ""]
        );
        setGabarito(questaoParaEditar.gabarito || "");
        setApoioVisualDescricao(questaoParaEditar.apoioVisualDescricao || "");
        setScaffolding(questaoParaEditar.scaffolding || "");
        setDisciplina(questaoParaEditar.disciplina || "Língua Portuguesa");
        setAnoEscolar(questaoParaEditar.anoEscolar || "8º Ano");
        setTema(questaoParaEditar.tema || "");
        setHabilidadeBNCC(questaoParaEditar.habilidadeBNCC || "");
        setNecessidades(questaoParaEditar.necessidades || []);
        setNivelSuporte(questaoParaEditar.nivelSuporte || 1);
      } else {
        setEnunciado("");
        setTipo("multipla_escolha");
        setAlternativas(["", "", "", ""]);
        setGabarito("");
        setApoioVisualDescricao("");
        setScaffolding("");
        setDisciplina("Língua Portuguesa");
        setAnoEscolar("8º Ano");
        setTema("");
        setHabilidadeBNCC("");
        setNecessidades([]);
        setNivelSuporte(1);
      }
    }
  }, [isOpen, questaoParaEditar]);

  if (!isOpen) return null;

  const handleToggleNecessidade = (id) => {
    setNecessidades((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAlterarAlternativa = (index, valor) => {
    setAlternativas((prev) => {
      const copy = [...prev];
      copy[index] = valor;
      return copy;
    });
  };

  const handleAdicionarAlternativa = () => {
    setAlternativas((prev) => [...prev, ""]);
  };

  const handleRemoverAlternativa = (index) => {
    setAlternativas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!enunciado.trim()) {
      setErro("O enunciado da questão é obrigatório.");
      return;
    }

    const questaoFormatada = {
      id: questaoParaEditar?.id || undefined,
      enunciado: enunciado.trim(),
      tipo,
      alternativas: tipo === "multipla_escolha" ? alternativas.filter((a) => a.trim().length > 0) : [],
      gabarito: gabarito.trim(),
      apoioVisualDescricao: apoioVisualDescricao.trim(),
      scaffolding: scaffolding.trim(),
      disciplina,
      anoEscolar,
      tema: tema.trim(),
      habilidadeBNCC: habilidadeBNCC.trim(),
      necessidades,
      nivelSuporte: Number(nivelSuporte) || 1,
      origem: questaoParaEditar?.origem || "manual",
      updatedAt: new Date().toISOString(),
    };

    onSalvar(questaoFormatada);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-[#dce0f0] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-[#dce0f0] bg-linear-to-r from-pink-50/50 via-white to-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#f60c49] to-[#d40840] flex items-center justify-center text-white shadow-md shadow-[#f60c49]/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#101942]">
                {questaoParaEditar ? "Editar Questão Adaptada" : "Cadastrar Nova Questão"}
              </h2>
              <p className="text-xs text-[#6070a0]">
                Item atômico com adaptações DUA para o Banco de Questões
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6070a0] hover:text-[#101942] hover:bg-[#f8f9fd] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {erro && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {erro}
            </div>
          )}

          {/* Dados Contextuais: Disciplina, Ano, BNCC */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Disciplina
              </label>
              <select
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
              >
                <option value="Língua Portuguesa">Língua Portuguesa</option>
                <option value="Matemática">Matemática</option>
                <option value="Ciências">Ciências</option>
                <option value="História">História</option>
                <option value="Geografia">Geografia</option>
                <option value="Artes">Artes</option>
                <option value="Inglês">Inglês</option>
                <option value="Educação Física">Educação Física</option>
                <option value="Biologia">Biologia</option>
                <option value="Física">Física</option>
                <option value="Química">Química</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Ano Escolar
              </label>
              <select
                value={anoEscolar}
                onChange={(e) => setAnoEscolar(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
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

            <div>
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Habilidade BNCC / Tema
              </label>
              <input
                type="text"
                placeholder="Ex: EF08CI05 ou Ciclo da Água"
                value={habilidadeBNCC || tema}
                onChange={(e) => {
                  setHabilidadeBNCC(e.target.value);
                  setTema(e.target.value);
                }}
                className="w-full px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
              />
            </div>
          </div>

          {/* Tipo de Questão */}
          <div>
            <label className="block text-xs font-bold text-[#101942] mb-1">
              Tipo de Questão
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "multipla_escolha", label: "Múltipla Escolha" },
                { id: "verdadeiro_falso", label: "Verdadeiro ou Falso" },
                { id: "associacao", label: "Associação / Colunas" },
                { id: "discursiva", label: "Discursiva / Aberta" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTipo(item.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                    tipo === item.id
                      ? "bg-pink-50 border-[#f60c49] text-[#f60c49] shadow-xs"
                      : "bg-[#f8f9fd] border-[#dce0f0] text-[#6070a0] hover:text-[#101942]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enunciado */}
          <div>
            <label className="block text-xs font-bold text-[#101942] mb-1">
              Enunciado da Questão <span className="text-[#f60c49]">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Digite o enunciado adaptado com linguagem direta e clara..."
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
            />
          </div>

          {/* Alternativas se for Múltipla Escolha */}
          {tipo === "multipla_escolha" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#101942]">
                  Alternativas (com opções enxutas e claras)
                </label>
                <button
                  type="button"
                  onClick={handleAdicionarAlternativa}
                  className="text-xs font-bold text-[#f60c49] hover:text-[#d40840] flex items-center gap-1"
                >
                  <Plus size={14} /> Adicionar Opção
                </button>
              </div>
              <div className="space-y-1.5">
                {alternativas.map((alt, idx) => {
                  const letra = String.fromCharCode(65 + idx);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-xs font-black text-[#6070a0] text-center">
                        ({letra})
                      </span>
                      <input
                        type="text"
                        placeholder={`Texto da alternativa ${letra}`}
                        value={alt}
                        onChange={(e) => handleAlterarAlternativa(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
                      />
                      {alternativas.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoverAlternativa(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gabarito e Apoio Visual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Gabarito / Resposta Esperada
              </label>
              <input
                type="text"
                placeholder="Ex: (B) ou Resposta correta sintetizada"
                value={gabarito}
                onChange={(e) => setGabarito(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#101942] mb-1">
                Apoio Visual / Audiodescrição
              </label>
              <input
                type="text"
                placeholder="Ex: Ilustração de uma planta com raízes identificadas"
                value={apoioVisualDescricao}
                onChange={(e) => setApoioVisualDescricao(e.target.value)}
                className="w-full px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
              />
            </div>
          </div>

          {/* Scaffolding / Dica Mediadora */}
          <div>
            <label className="block text-xs font-bold text-[#101942] mb-1">
              Scaffolding / Dica de Apoio Docente
            </label>
            <input
              type="text"
              placeholder="Ex: Chame atenção para a primeira coluna antes de relacionar os conceitos"
              value={scaffolding}
              onChange={(e) => setScaffolding(e.target.value)}
              className="w-full px-3 py-2 bg-[#f8f9fd] border border-[#dce0f0] rounded-xl text-xs font-medium text-[#101942] focus:outline-hidden focus:border-[#f60c49]"
            />
          </div>

          {/* Necessidades DUA atendidas */}
          <div>
            <label className="block text-xs font-bold text-[#101942] mb-1.5">
              Necessidades Específicas / Adaptações DUA que esta questão atende:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIAS_DEFICIENCIA.map((cat) => {
                const ativo = necessidades.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleToggleNecessidade(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                      ativo
                        ? "bg-[#101942] border-[#101942] text-white shadow-xs"
                        : "bg-[#f8f9fd] border-[#dce0f0] text-[#6070a0] hover:border-gray-400"
                    }`}
                  >
                    {cat.nome}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rodapé com botões de ação */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#dce0f0]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#6070a0] hover:text-[#101942] rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-linear-to-r from-[#f60c49] to-[#d40840] text-white text-xs font-black rounded-xl shadow-md shadow-[#f60c49]/20 hover:opacity-95 transition-opacity"
            >
              {questaoParaEditar ? "Salvar Alterações" : "Salvar no Banco"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
