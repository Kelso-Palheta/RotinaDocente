"use client";

import { useState } from 'react';
import { extractTextFromPDF } from '@/utils/atividades/pdfExtractor';
import { imageToBase64 } from '@/utils/atividades/storageUtils';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { cleanPdfText } from '@/utils/atividades/textUtils';
import { sugerirRubrica, gerarQuestoesComIA } from '@/utils/atividades/correcaoIA';

const BIMESTRES = [1, 2, 3, 4];
const genId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const genAtvId = () => `atv_${genId()}`;
const genQId = () => `q_${genId()}`;

const novaQuestao = (tipo = 'discursiva') => ({
  id: genQId(),
  tipo,
  enunciado: '',
  notaMaxima: 2,
  rubrica: '',
  alternativas: [{ id: 'A', texto: '' }, { id: 'B', texto: '' }, { id: 'C', texto: '' }, { id: 'D', texto: '' }, { id: 'E', texto: '' }],
  gabarito: 'A',
  imagensLocais: []
});

function QuestaoEditor({ questao, index, total, onChange, onRemove, materialTexto }) {
  const update = (field, value) => onChange({ ...questao, [field]: value });
  const [sugerindo, setSugerindo] = useState(false);

  const handleSugerirRubrica = async () => {
    if (!questao.enunciado.trim()) {
      alert('Preencha o enunciado da questão antes de sugerir a rubrica.');
      return;
    }
    setSugerindo(true);
    try {
      const rubrica = await sugerirRubrica(questao, materialTexto || '');
      update('rubrica', rubrica);
    } catch (err) {
      alert('Erro ao gerar rubrica: ' + err.message);
    } finally {
      setSugerindo(false);
    }
  };

  const handleEnunciadoPaste = (e) => {
    const plain = e.clipboardData?.getData('text/plain');
    if (!plain) return;
    e.preventDefault();
    const cleaned = cleanPdfText(plain);
    const { selectionStart: start, selectionEnd: end } = e.target;
    update('enunciado', questao.enunciado.slice(0, start) + cleaned + questao.enunciado.slice(end));
    requestAnimationFrame(() => {
      e.target.setSelectionRange(start + cleaned.length, start + cleaned.length);
    });
  };

  const updateAlternativa = (altId, texto) => {
    onChange({ ...questao, alternativas: questao.alternativas.map(a => a.id === altId ? { ...a, texto } : a) });
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    const novas = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    onChange({ ...questao, imagensLocais: [...questao.imagensLocais, ...novas] });
    e.target.value = '';
  };

  const removeImagem = (i) => {
    onChange({ ...questao, imagensLocais: questao.imagensLocais.filter((_, idx) => idx !== i) });
  };

  const removeImagemSalva = (i) => {
    onChange({ ...questao, imagens: (questao.imagens || []).filter((_, idx) => idx !== i) });
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 mb-4 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{index + 1}</span>

        <div className="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-semibold">
          {['discursiva', 'objetiva'].map(tipo => (
            <button
              key={tipo}
              type="button"
              onClick={() => update('tipo', tipo)}
              className={`px-3 py-1.5 capitalize transition-colors ${questao.tipo === tipo ? 'bg-violet-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
            >
              {tipo}
            </button>
          ))}
        </div>

        <input
          type="number"
          value={questao.notaMaxima}
          onChange={(e) => update('notaMaxima', e.target.value === '' ? '' : Number(e.target.value))}
          min="0.25" max="10" step="0.25"
          title="Nota máxima desta questão"
          className="w-20 ml-auto bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 text-center outline-none focus:ring-1 focus:ring-violet-400/50"
          placeholder="pts"
        />
        <span className="text-xs text-slate-400">pts</span>

        {total > 1 && (
          <button type="button" onClick={onRemove} className="text-slate-400 hover:text-red-500 transition-colors ml-1 text-lg leading-none">&times;</button>
        )}
      </div>

      <textarea
        value={questao.enunciado}
        onChange={(e) => update('enunciado', e.target.value)}
        onPaste={handleEnunciadoPaste}
        placeholder="Enunciado da questão..."
        rows={3}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all resize-y mb-3"
      />

      <div className="mb-3">
        {((questao.imagens || []).length > 0 || questao.imagensLocais.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {(questao.imagens || []).map((img, i) => (
              <div key={`s-${i}`} className="relative group">
                <img src={img.base64} alt="" className="h-20 w-auto rounded-lg border border-slate-200 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImagemSalva(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center leading-none"
                >&times;</button>
              </div>
            ))}
            {questao.imagensLocais.map((img, i) => (
              <div key={`n-${i}`} className="relative group">
                <img src={img.preview} alt="" className="h-20 w-auto rounded-lg border border-slate-200 object-cover opacity-75" />
                <button
                  type="button"
                  onClick={() => removeImagem(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center leading-none"
                >&times;</button>
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-500 cursor-pointer transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <span>Adicionar imagem</span>
          <input type="file" accept="image/*" multiple onChange={handleImageAdd} className="hidden" />
        </label>
      </div>

      {questao.tipo === 'discursiva' && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-amber-600">
              Rubrica de correção <span className="text-slate-400 font-normal">(confidencial — só você e a IA verão)</span>
            </label>
            <button
              type="button"
              onClick={handleSugerirRubrica}
              disabled={sugerindo}
              className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 disabled:bg-slate-100 border border-violet-200 disabled:border-slate-200 rounded-lg text-[11px] font-semibold text-violet-600 disabled:text-slate-400 transition-all"
            >
              {sugerindo ? (
                <>
                  <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Gerando...
                </>
              ) : (
                <>✦ Sugerir com IA</>
              )}
            </button>
          </div>
          <textarea
            value={questao.rubrica}
            onChange={(e) => update('rubrica', e.target.value)}
            placeholder="Critérios de correção, pontos por seção, o que esperar na resposta ideal... ou clique em &quot;Sugerir com IA&quot; acima."
            rows={3}
            className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-amber-400/50 transition-all resize-y"
          />
        </div>
      )}

      {questao.tipo === 'objetiva' && (
        <div>
          <label className="block text-xs font-semibold text-slate-900 mb-2">Alternativas</label>
          <div className="space-y-2">
            {questao.alternativas.map((alt) => (
              <div key={alt.id} className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`gabarito-${questao.id}`}
                    checked={questao.gabarito === alt.id}
                    onChange={() => update('gabarito', alt.id)}
                    className="w-4 h-4 accent-violet-500"
                  />
                  <span className="text-xs font-bold text-violet-500 w-4">{alt.id}</span>
                </label>
                <input
                  type="text"
                  value={alt.texto}
                  onChange={(e) => updateAlternativa(alt.id, e.target.value)}
                  placeholder={`Alternativa ${alt.id}`}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all"
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">🔒 Selecione o gabarito (rádio) — não será exibido ao aluno</p>
        </div>
      )}
    </div>
  );
}

export const AtividadeForm = ({ turmas, onCreate, onUpdate, onClose, initialData }) => {
  const isEdit = !!initialData;
  const [titulo, setTitulo] = useState(initialData?.titulo || '');
  const [bimestre, setBimestre] = useState(initialData?.bimestre || 1);
  const [turmaIds, setTurmaIds] = useState(initialData?.turmaIds || []);
  const [dataEntrega, setDataEntrega] = useState(() => {
    if (initialData?.dataEntrega?.toDate) return initialData.dataEntrega.toDate().toISOString().slice(0, 16);
    if (initialData?.dataEntrega instanceof Date) return initialData.dataEntrega.toISOString().slice(0, 16);
    if (typeof initialData?.dataEntrega === 'string') return new Date(initialData.dataEntrega).toISOString().slice(0, 16);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(23, 59, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [questoes, setQuestoes] = useState(() =>
    initialData?.questoes?.length > 0
      ? initialData.questoes.map(q => ({ ...q, imagensLocais: [] }))
      : []
  );
  const [textosBase, setTextosBase] = useState(() => {
    if (initialData?.textosBase?.length > 0) return initialData.textosBase;
    if (initialData?.textoBase?.trim()) return [{ id: genId(), html: initialData.textoBase }];
    return [];
  });
  const addTextoBase    = () => setTextosBase(prev => [...prev, { id: genId(), html: '', aposQuestao: null }]);
  const removeTextoBase = (id) => setTextosBase(prev => prev.filter(t => t.id !== id));
  const updateTextoBase = (id, field, val) => setTextosBase(prev => prev.map(t => t.id === id ? { ...t, [field]: val } : t));
  const [materiais, setMateriais] = useState(() =>
    initialData?.materiais?.length > 0
      ? initialData.materiais
      : (initialData?.materialApoio?.textoExtraido
        ? [{ id: genId(), tipo: 'pdf', nome: initialData.materialApoio.nome || 'Material', textoExtraido: initialData.materialApoio.textoExtraido }]
        : [])
  );
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');

  const materialTotal = materiais.map(m => m.textoExtraido || m.texto || '').filter(Boolean).join('\n\n');

  const notaTotalMaxima = questoes.reduce((sum, q) => sum + (Number(q.notaMaxima) || 0), 0);

  const [gerandoQuestoes, setGerandoQuestoes] = useState(false);
  const [gerarPopup, setGerarPopup] = useState(null); 

  const toggleTurma = (id) => setTurmaIds(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);

  const addMaterialTexto = () => setMateriais(prev => [...prev, { id: genId(), tipo: 'texto', nome: 'Texto colado', texto: '' }]);

  const addMaterialPDF = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.multiple = true;
    input.onchange = async (e) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        const id = genId();
        setMateriais(prev => [...prev, { id, tipo: 'pdf', nome: file.name, textoExtraido: '', _extracting: true }]);
        try {
          const texto = await extractTextFromPDF(file);
          setMateriais(prev => prev.map(m => m.id === id ? { ...m, textoExtraido: texto, _extracting: false } : m));
        } catch (err) {
          setMateriais(prev => prev.filter(m => m.id !== id));
          setErro('Erro ao extrair PDF: ' + err.message);
        }
      }
    };
    input.click();
  };

  const updateMaterial = (id, field, val) => setMateriais(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  const removeMaterial = (id) => setMateriais(prev => prev.filter(m => m.id !== id));

  const abrirGerarPopup = (tipo) => {
    if (!materialTotal.trim()) {
      setErro('Adicione um PDF ou cole um texto no material de apoio antes de gerar.');
      return;
    }
    setGerarPopup({
      tipo,
      dificuldade: 'medio',
      incluirTextoApoio: tipo === 'objetiva',
      tema: '',
      pontuacao: ''
    });
  };

  const handleGerarQuestao = async () => {
    if (!gerarPopup) return;
    if (!materialTotal.trim()) {
      setErro('Adicione um PDF ou cole o material de apoio antes de gerar.');
      return;
    }
    if (!gerarPopup.pontuacao || isNaN(parseFloat(gerarPopup.pontuacao.replace(',', '.')))) {
      setErro('Informe uma pontuação válida para a questão (ex: 2.5).');
      return;
    }

    setGerandoQuestoes(true);
    const pontuacao = parseFloat(gerarPopup.pontuacao.replace(',', '.'));
    const popupAtual = gerarPopup;
    setGerarPopup(null);
    setErro('');
    try {
      const geradas = await gerarQuestoesComIA({
        materialTexto: materialTotal,
        qtdQuestoes: 1,
        incluirObjetivas: popupAtual.tipo === 'objetiva',
        dificuldade: popupAtual.dificuldade,
        incluirTextoApoio: popupAtual.incluirTextoApoio,
        tema: popupAtual.tema || ''
      });
      geradas.forEach(q => {
        addQuestao(q.tipo, {
          enunciado: q.enunciado,
          rubrica: q.rubrica,
          notaMaxima: pontuacao,
          alternativas: q.alternativas,
          gabarito: q.gabarito,
          textoApoio: q.textoApoio || ''
        });
      });
      if (popupAtual.incluirTextoApoio) {
        geradas.forEach(q => {
          if (q.textoApoio?.trim()) {
            // Se questoes.length == 0, null = Início da Atividade
            // Se questoes.length > 0, questoes.length - 1 = Após a última questão ANTES dessa nova
            setTextosBase(prev => [...prev, { 
              id: genId(), 
              html: q.textoApoio.trim(), 
              aposQuestao: questoes.length > 0 ? questoes.length - 1 : null 
            }]);
          }
        });
      }
    } catch (err) {
      setErro(err.message || 'Erro ao gerar questão com IA.');
    } finally {
      setGerandoQuestoes(false);
    }
  };

  const updateQuestao = (index, novaQ) => {
    setQuestoes(prev => prev.map((q, i) => i === index ? novaQ : q));
  };

  const addQuestao = (tipo, initialData) => setQuestoes(prev => [...prev, { ...novaQuestao(tipo), ...(initialData || {}) }]);

  const removeQuestao = (index) => setQuestoes(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    if (!titulo.trim()) { setErro('Título obrigatório.'); return; }
    if (turmaIds.length === 0) { setErro('Selecione ao menos uma turma.'); return; }
    if (!dataEntrega) { setErro('Data de entrega obrigatória.'); return; }
    if (questoes.length === 0) { setErro('Adicione ao menos uma questão.'); return; }

    for (let i = 0; i < questoes.length; i++) {
      const q = questoes[i];
      if (!q.enunciado.trim()) { setErro(`Questão ${i + 1}: enunciado obrigatório.`); return; }
      if (q.tipo === 'objetiva') {
        const preenchidas = q.alternativas.filter(a => a.texto.trim()).length;
        if (preenchidas < 2) { setErro(`Questão ${i + 1}: preencha ao menos 2 alternativas.`); return; }
      }
    }

    setSaving(true);
    try {
      const atvId = initialData?.id || genAtvId();

      const questoesFinais = await Promise.all(questoes.map(async (q) => {
        const imagens = [...(q.imagens || [])];

        if (q.imagensLocais?.length > 0) {
          for (const { file } of q.imagensLocais) {
            const base64 = await imageToBase64(file);
            imagens.push({ base64 });
          }
        }

        const { imagensLocais: _, ...questaoFinal } = q;
        return { ...questaoFinal, imagens };
      }));

      const materiaisFinais = materiais
        .map(({ _extracting, ...m }) => m)
        .filter(m => (m.textoExtraido || m.texto || '').trim());

      const materialApoio = materiaisFinais.length > 0
        ? { nome: materiaisFinais[0].nome, textoExtraido: materiaisFinais.map(m => m.textoExtraido || m.texto || '').join('\n\n') }
        : null;

      const alunosPorTurma = {};
      for (const tid of turmaIds) {
        const turma = turmas.find(t => t.id === tid);
        if (turma) alunosPorTurma[tid] = turma.alunos || [];
      }

      await onSave({
        id: atvId,
        titulo: titulo.trim(),
        bimestre,
        turmaIds,
        notaMaxima: Math.round(notaTotalMaxima * 100) / 100,
        dataEntrega: new Date(dataEntrega),
        textosBase: textosBase.filter(t => t.html.trim() && t.html !== '<p></p>'),
        questoes: questoesFinais,
        materiais: materiaisFinais,
        materialApoio,
        alunosPorTurma
      });

      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao salvar atividade.');
    } finally {
      setSaving(false);
    }
  };
  const renderTextos = (aposIndex) => {
    const texts = textosBase.filter(t => t.aposQuestao === aposIndex);
    if (texts.length === 0) return null;
    return (
      <div className="space-y-3 mb-4 mt-2">
        {texts.map((t, idx) => (
          <div key={t.id} className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {texts.length > 1 ? `Texto ${idx + 1}` : 'Texto de apoio'}
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={t.aposQuestao ?? ''}
                  onChange={(e) => updateTextoBase(t.id, 'aposQuestao', e.target.value === '' ? null : Number(e.target.value))}
                  className="text-[11px] bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-900 outline-none focus:ring-1 focus:ring-violet-400/50"
                >
                  <option value="">Antes de todas</option>
                  {questoes.map((_, qi) => (
                    <option key={qi} value={qi}>Antes da questão {qi + 2}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeTextoBase(t.id)}
                  className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Excluir
                </button>
              </div>
            </div>
            <RichTextEditor
              value={t.html}
              onChange={(html) => updateTextoBase(t.id, 'html', html)}
              placeholder="Cole aqui o texto base, trecho do livro ou contextualização..."
              rows={4}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg border border-slate-200 max-h-[92vh] overflow-y-auto animate-card-in">
        <div className="sticky top-0 z-10 bg-white p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Editar Atividade' : 'Nova Atividade'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Título *</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120}
                placeholder="Ex: Redação — A Amazônia no Século XXI"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Bimestre *</label>
                <div className="grid grid-cols-4 gap-1">
                  {BIMESTRES.map(b => (
                    <button key={b} type="button" onClick={() => setBimestre(b)}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${bimestre === b ? 'bg-violet-500 text-white border-violet-400/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-200 border-slate-200'}`}>
                      {b}º
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Data de entrega *</label>
                <input type="datetime-local" value={dataEntrega} onChange={(e) => setDataEntrega(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 outline-none focus:bg-white focus:ring-1 focus:ring-violet-400/50 transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">Turmas *</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-28 overflow-y-auto space-y-0.5">
                {turmas.length === 0 && <p className="text-xs text-slate-400 p-2">Nenhuma turma.</p>}
                {turmas.map(t => (
                  <label key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white cursor-pointer transition-colors">
                    <input type="checkbox" checked={turmaIds.includes(t.id)} onChange={() => toggleTurma(t.id)}
                      className="w-4 h-4 rounded accent-violet-500" />
                    <span className="text-sm text-slate-900">{t.nome}</span>
                    <span className="text-xs text-slate-400">({t.alunos.length} alunos)</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="border border-dashed border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-900">Material de apoio para a IA</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {materialTotal
                    ? `~${Math.round(materialTotal.length / 1000)}k caracteres disponíveis`
                    : 'Anexe PDFs ou cole textos — a IA usará como base para gerar questões'}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button type="button" onClick={addMaterialTexto}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs text-slate-400 hover:text-slate-900 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>
                  Colar texto
                </button>
                <button type="button" onClick={addMaterialPDF}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-lg text-xs text-slate-400 hover:text-slate-900 transition-all">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  PDF
                </button>
              </div>
            </div>

            {materiais.length > 0 && (
              <div className="space-y-2">
                {materiais.map((mat, i) => (
                  <div key={mat.id} className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {mat._extracting ? (
                          <svg className="animate-spin w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        ) : (
                          <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                        <span className="text-xs font-medium text-slate-900">{mat.nome}</span>
                        {(mat.textoExtraido || mat.texto) && !mat._extracting && (
                          <span className="text-[10px] text-slate-400">({Math.round((mat.textoExtraido || mat.texto || '').length / 1000)}k chars)</span>
                        )}
                      </div>
                      <button type="button" onClick={() => removeMaterial(mat.id)}
                        className="text-slate-400 hover:text-red-500 text-xs transition-colors">&times;</button>
                    </div>
                    {mat.tipo === 'texto' && !mat._extracting && (
                      <textarea
                        value={mat.texto || ''}
                        onChange={(e) => updateMaterial(mat.id, 'texto', e.target.value)}
                        placeholder="Cole aqui o conteúdo do livro, artigo, ou qualquer texto de apoio..."
                        rows={4}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-violet-400/50 resize-y"
                      />
                    )}
                    {mat.tipo === 'pdf' && mat.textoExtraido && !mat._extracting && (
                      <p className="text-xs text-slate-400 leading-relaxed max-h-24 overflow-y-auto whitespace-pre-wrap bg-slate-50 rounded-lg p-2">{mat.textoExtraido.slice(0, 500)}{mat.textoExtraido.length > 500 ? '…' : ''}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {materiais.length === 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={addMaterialTexto}
                  className="flex-1 py-3 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors text-center">
                  Colar texto de apoio
                </button>
                <button type="button" onClick={addMaterialPDF}
                  className="flex-1 py-3 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors text-center">
                  Carregar PDF
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-semibold text-slate-900">Questões *</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Nota total: <span className="font-bold text-violet-500">{notaTotalMaxima.toFixed(1).replace('.', ',')} pts</span></p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={() => abrirGerarPopup('discursiva')} disabled={gerandoQuestoes}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:bg-slate-100 border border-amber-200 disabled:border-slate-200 text-amber-600 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1">
                  {gerandoQuestoes ? (
                    <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Gerando...</>
                  ) : (
                    <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> IA Discursiva</>
                  )}
                </button>
                <button type="button" onClick={() => abrirGerarPopup('objetiva')} disabled={gerandoQuestoes}
                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 disabled:bg-slate-100 border border-amber-200 disabled:border-slate-200 text-amber-600 disabled:text-slate-400 rounded-lg text-xs font-semibold transition-all flex items-center gap-1">
                  {gerandoQuestoes ? null : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                  )}
                  IA Objetiva
                </button>
                <span className="text-slate-300 mx-0.5 self-center">|</span>
                <button type="button" onClick={() => addQuestao('discursiva')}
                  className="px-2.5 py-1.5 bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-600 rounded-lg text-xs font-semibold transition-all">
                  + Discursiva
                </button>
                <button type="button" onClick={() => addQuestao('objetiva')}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold transition-all">
                  + Objetiva
                </button>
              </div>

              {gerarPopup && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2 animate-card-in">
                  <p className="text-xs font-semibold text-amber-700 mb-3">
                    Configurar geração — {gerarPopup.tipo === 'discursiva' ? 'Discursiva' : 'Objetiva'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-900 mb-1">Tema da questão</label>
                      <input
                        type="text"
                        value={gerarPopup.tema || ''}
                        onChange={(e) => setGerarPopup(p => ({ ...p, tema: e.target.value }))}
                        placeholder="Ex: Revolução Industrial..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-amber-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-900 mb-1">Pontuação da questão *</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={gerarPopup.pontuacao || ''}
                        onChange={(e) => setGerarPopup(p => ({ ...p, pontuacao: e.target.value }))}
                        placeholder="Ex: 2.5"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-1 focus:ring-amber-400/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-900 mb-1">Dificuldade</label>
                      <div className="flex gap-1">
                        {[
                          { v: 'facil', l: 'Fácil' },
                          { v: 'medio', l: 'Médio' },
                          { v: 'dificil', l: 'Difícil' }
                        ].map(({ v, l }) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setGerarPopup(p => ({ ...p, dificuldade: v }))}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              gerarPopup.dificuldade === v
                                ? 'bg-amber-500 text-white border-amber-400'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    {gerarPopup.tipo === 'discursiva' && (
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={gerarPopup.incluirTextoApoio}
                            onChange={(e) => setGerarPopup(p => ({ ...p, incluirTextoApoio: e.target.checked }))}
                            className="w-4 h-4 rounded accent-amber-500"
                          />
                          <span className="text-xs text-slate-900 font-medium">Incluir texto de apoio</span>
                        </label>
                      </div>
                    )}
                    {gerarPopup.tipo === 'objetiva' && (
                      <div className="flex items-end">
                        <p className="text-[10px] text-slate-400">Texto de apoio sempre incluso em objetivas</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGerarPopup(null)}
                      className="flex-1 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-500 font-medium transition-all hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleGerarQuestao}
                      disabled={gerandoQuestoes}
                      className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 text-white rounded-lg text-xs font-semibold transition-all"
                    >
                      Gerar Questão
                    </button>
                  </div>
                </div>
              )}
            </div>

            {questoes.length === 0 && (
              <div className="py-10 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1">
                <p className="text-sm text-slate-400 font-medium">Nenhuma questão adicionada</p>
                <p className="text-xs text-slate-300">Use os botões acima para criar questões</p>
              </div>
            )}
            {questoes.map((q, i) => (
              <div key={q.id} className="contents">
                {renderTextos(i === 0 ? null : i - 1)}
                <QuestaoEditor
                  questao={q}
                  index={i}
                  total={questoes.length}
                  onChange={(novaQ) => updateQuestao(i, novaQ)}
                  onRemove={() => removeQuestao(i)}
                  materialTexto={materialTotal}
                />
                {i === questoes.length - 1 && renderTextos(i)}
              </div>
            ))}

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => { addTextoBase(); }}
                className="flex-1 py-3 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors text-center">
                + Adicionar texto de apoio
              </button>
            </div>
          </div>

          {erro && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-500">{erro}</p>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-200 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 bg-violet-500 hover:bg-violet-400 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl text-white text-sm font-semibold transition-all btn-3d-primary">
              {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Criar Atividade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
