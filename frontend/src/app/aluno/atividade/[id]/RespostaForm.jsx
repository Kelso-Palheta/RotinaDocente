import { useState } from 'react';
import DOMPurify from 'dompurify';
import { BotaoLeitorVoz } from '@/components/acessibilidade/BotaoLeitorVoz';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

const safeSanitize = (html) => {
  if (typeof window !== 'undefined') return DOMPurify.sanitize(html);
  return html;
};

function DicaScaffolding({ dica }) {
  const [aberta, setAberta] = useState(false);
  if (!dica) return null;

  return (
    <div className="mt-3 mb-2">
      <button
        type="button"
        onClick={() => setAberta(!aberta)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#F3F8F5] text-[#123C3A] border border-[#D5E3DC] hover:bg-[#DAEBE5] transition-all"
      >
        <Lightbulb size={13} className="text-[#0F766E]" />
        <span>{aberta ? 'Ocultar dica pedagógica' : '💡 Precisa de uma dica de apoio?'}</span>
        {aberta ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {aberta && (
        <div className="mt-2 p-3 bg-[#F3F8F5]/60 border border-[#D5E3DC] rounded-xl text-xs text-[#123C3A] leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in duration-200">
          <div>
            <strong className="font-bold text-[#0B2B2A]">Dica: </strong>
            <span>{dica}</span>
          </div>
          <BotaoLeitorVoz texto={dica} label="Ouvir dica" className="self-start sm:self-auto" />
        </div>
      )}
    </div>
  );
}

function QuestaoDiscursiva({ numero, questao, resposta, onChange }) {
  return (
    <div className="mb-6 p-4 rounded-2xl bg-white border border-[#d5e3dc] shadow-2xs">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="w-6 h-6 rounded-full bg-[#123c3a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{numero}</span>
        <span className="text-[10px] font-extrabold text-[#4f6b63] uppercase tracking-wider">Discursiva</span>
        <BotaoLeitorVoz
          texto={questao.enunciado}
          label="Ouvir Enunciado"
        />
        <span className="text-xs text-slate-400 font-mono font-semibold ml-auto">{questao.notaMaxima?.toFixed(1)?.replace('.', ',') || '0,0'} pts</span>
      </div>

      <p className="text-sm text-[#123C3A] leading-relaxed mb-3 whitespace-pre-wrap">{questao.enunciado}</p>

      {questao.apoioVisualDescricao && (
        <div className="bg-[#f3f7f5] border border-[#d5e3dc] rounded-xl p-2.5 mb-3 text-xs text-[#123c3a] flex items-center justify-between gap-2">
          <span>👁 <strong>Apoio visual:</strong> {questao.apoioVisualDescricao}</span>
          <BotaoLeitorVoz texto={questao.apoioVisualDescricao} label="Ouvir apoio" />
        </div>
      )}

      {questao.imagens?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {questao.imagens.map((img, i) => (
            <img key={i} src={img.url || img.base64} alt={questao.apoioVisualDescricao || `Imagem ${i + 1}`} className="max-h-48 rounded-lg border border-[#D5E3DC] object-contain" />
          ))}
        </div>
      )}

      {questao.scaffolding && <DicaScaffolding dica={questao.scaffolding} />}

      <textarea
        value={resposta}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escreva sua resposta aqui..."
        rows={5}
        maxLength={5000}
        className="w-full bg-[#f3f7f5] border border-[#d5e3dc] rounded-xl px-4 py-3 text-sm text-[#123C3A] placeholder-[#566F65] outline-none focus:bg-white focus:ring-1 focus:ring-[#0f766e] transition-all resize-y mt-2"
      />
      <div className="flex justify-end mt-1">
        <span className="text-xs text-slate-400 font-mono">{resposta.length}/5000</span>
      </div>
    </div>
  );
}

function QuestaoObjetiva({ numero, questao, resposta, onChange }) {
  return (
    <div className="mb-6 p-4 rounded-2xl bg-white border border-[#d5e3dc] shadow-2xs">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="w-6 h-6 rounded-full bg-[#123c3a] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{numero}</span>
        <span className="text-[10px] font-extrabold text-[#4f6b63] uppercase tracking-wider">Objetiva</span>
        <BotaoLeitorVoz
          texto={questao.enunciado}
          label="Ouvir Enunciado"
        />
        <span className="text-xs text-slate-400 font-mono font-semibold ml-auto">{questao.notaMaxima?.toFixed(1)?.replace('.', ',') || '0,0'} pts</span>
      </div>

      <p className="text-sm text-[#123C3A] leading-relaxed mb-3 whitespace-pre-wrap">{questao.enunciado}</p>

      {questao.apoioVisualDescricao && (
        <div className="bg-[#f3f7f5] border border-[#d5e3dc] rounded-xl p-2.5 mb-3 text-xs text-[#123c3a] flex items-center justify-between gap-2">
          <span>👁 <strong>Apoio visual:</strong> {questao.apoioVisualDescricao}</span>
          <BotaoLeitorVoz texto={questao.apoioVisualDescricao} label="Ouvir apoio" />
        </div>
      )}

      {questao.imagens?.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {questao.imagens.map((img, i) => (
            <img key={i} src={img.url || img.base64} alt={questao.apoioVisualDescricao || `Imagem ${i + 1}`} className="max-h-48 rounded-lg border border-[#D5E3DC] object-contain" />
          ))}
        </div>
      )}

      {questao.scaffolding && <DicaScaffolding dica={questao.scaffolding} />}

      <div className="space-y-2 mt-2">
        {(questao.alternativas || []).map((alt) => (
          <label
            key={alt.id}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              resposta === alt.id
                ? 'bg-[#f3f8f5] border-[#0f766e]'
                : 'bg-white border-[#D5E3DC] hover:border-[#0f766e]/40 hover:bg-[#f3f7f5]'
            }`}
          >
            <input
              type="radio"
              name={`questao-${questao.id}`}
              value={alt.id}
              checked={resposta === alt.id}
              onChange={() => onChange(alt.id)}
              className="mt-0.5 w-4 h-4 accent-[#0f766e] flex-shrink-0"
            />
            <span className="text-sm text-[#123C3A]">
              <span className="font-bold text-[#0f766e] mr-1">{alt.id})</span>
              {alt.texto}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

function TextoApoio({ texto }) {
  return (
    <div className="mb-5 bg-[#F3F8F5] border border-[#D5E3DC] rounded-xl p-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Texto de apoio</p>
      <div className="prose prose-sm max-w-none text-[#35594D]"
        dangerouslySetInnerHTML={{ __html: safeSanitize(texto.html) }} />
    </div>
  );
}

export const RespostaForm = ({ atividade, onSubmit, loading, textos = [] }) => {
  const questoes = atividade?.questoes?.length > 0
    ? atividade.questoes
    : [{ id: 'legacy', tipo: 'discursiva', enunciado: atividade?.enunciado || '', notaMaxima: atividade?.notaMaxima || 10, imagens: [] }];

  const textosPor = {};
  textos.forEach(t => {
    const key = t.aposQuestao != null ? t.aposQuestao : 'inicio';
    (textosPor[key] = textosPor[key] || []).push(t);
  });

  const [respostas, setRespostas] = useState({});

  const handleChange = (questaoId, tipo, resposta) => {
    setRespostas(prev => ({ ...prev, [questaoId]: { tipo, resposta } }));
  };

  const totalRespondidas = questoes.filter(q => {
    const r = respostas[q.id]?.resposta;
    return q.tipo === 'discursiva' ? r?.trim().length >= 5 : !!r;
  }).length;

  const podeEnviar = !loading && totalRespondidas === questoes.length;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!podeEnviar) return;
    if (questoes.length === 1 && questoes[0].id === 'legacy') {
      onSubmit(respostas['legacy']?.resposta || '', null);
    } else {
      onSubmit(null, respostas);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-card-in">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">{questoes.length} questão(ões) — {totalRespondidas}/{questoes.length} respondidas</p>
      </div>

      {(textosPor['inicio'] || []).map(t => <TextoApoio key={t.id} texto={t} />)}

      {questoes.map((q, i) => (
        <div key={q.id}>
          {q.tipo === 'objetiva'
            ? <QuestaoObjetiva numero={i + 1} questao={q} resposta={respostas[q.id]?.resposta || ''} onChange={(r) => handleChange(q.id, 'objetiva', r)} />
            : <QuestaoDiscursiva numero={i + 1} questao={q} resposta={respostas[q.id]?.resposta || ''} onChange={(r) => handleChange(q.id, 'discursiva', r)} />
          }
          {(textosPor[i] || []).map(t => <TextoApoio key={t.id} texto={t} />)}
        </div>
      ))}

      <button
        type="submit"
        disabled={!podeEnviar}
        className="w-full py-3 bg-[#0F766E] hover:bg-[#0B5F59] disabled:bg-[#D5E3DC] disabled:text-slate-400 disabled:cursor-not-allowed rounded-xl text-white text-sm font-semibold transition-all"
      >
        {loading
          ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Enviando...</span>
          : `Enviar Respostas (${totalRespondidas}/${questoes.length})`
        }
      </button>
    </form>
  );
};
