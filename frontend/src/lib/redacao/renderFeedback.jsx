import { AlertCircle, Sparkles } from 'lucide-react';

/**
 * RN-49: Renderização do feedback de correção (markdown simples) compartilhada
 * entre a tela do professor e a tela do aluno.
 */

export function cleanFeedbackText(text) {
  if (!text) return '';
  let cleaned = text.replace(/```json[\s\S]*?```/g, '');

  // JSON sem fence no INÍCIO da resposta (caso o modelo omita as crases)
  const leading = cleaned.trimStart();
  if (leading.startsWith('{')) {
    const end = leading.indexOf('}');
    const block = end !== -1 ? leading.slice(0, end + 1) : '';
    if (/"c1"/.test(block)) {
      cleaned = end !== -1 ? leading.slice(end + 1) : '';
    }
  }

  // JSON sem fence no FIM da resposta (comportamento legado)
  const lastBrace = cleaned.lastIndexOf('{');
  if (lastBrace !== -1) {
    const tail = cleaned.slice(lastBrace);
    if (/"c[1-5]"/.test(tail)) {
      cleaned = cleaned.slice(0, lastBrace);
    }
  }
  return cleaned.trim();
}

export function parseBoldText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-bold text-[#101942] bg-[#fde4ec] px-1 rounded">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export function renderFeedbackText(text) {
  if (!text) return null;
  const cleaned = cleanFeedbackText(text);
  const lines = cleaned.split('\n');

  return (
    <div className="space-y-4 text-slate-600 leading-relaxed text-sm">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;

        // Headers (linhas começando com #)
        if (trimmed.startsWith('#')) {
          const depth = (trimmed.match(/^#+/) || ['#'])[0].length;
          const cleanText = trimmed.replace(/^#+\s*/, '');
          const isAnulacao = cleanText.toLowerCase().includes('anulação') || cleanText.toLowerCase().includes('anulado');

          return (
            <h3
              key={idx}
              className={`font-bold tracking-tight mt-6 mb-3 pb-2 border-b flex items-center gap-2 ${
                depth === 1
                  ? isAnulacao
                    ? 'text-base text-[#d40840] border-[#fde4ec]'
                    : 'text-base text-[#101942] border-[#dce0f0]'
                  : 'text-sm text-slate-800 border-slate-100'
              }`}
            >
              {isAnulacao ? <AlertCircle size={16} className="text-rose-500 animate-bounce" /> : <Sparkles size={15} className="text-[#f60c49]" />}
              {cleanText}
            </h3>
          );
        }

        // Tabelas markdown (linhas começando com |)
        if (trimmed.startsWith('|')) {
          const cells = trimmed
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c) => c.replace(/\*\*/g, '').trim());
          if (cells.every((c) => /^-+$/.test(c) || c === '')) {
            return <div key={idx} className="h-1" />;
          }
          return (
            <div key={idx} className="flex flex-wrap gap-2 text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
              {cells.map((cell, ci) => (
                <span key={ci} className="text-slate-700 font-medium">
                  {cell}
                </span>
              ))}
            </div>
          );
        }

        // Itens de lista
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const cleanText = trimmed.replace(/^[\*\-]\s*/, '');
          const isCheckbox = cleanText.startsWith('[');
          const listText = isCheckbox ? cleanText.replace(/^\[[ xX]\]\s*/, '') : cleanText;
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-2 my-1">
              <span className="text-[#f60c49] mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#f60c49]" />
              <span className="text-slate-600">{parseBoldText(listText)}</span>
            </div>
          );
        }

        // Parágrafos comuns
        return (
          <p key={idx} className="text-slate-600 leading-relaxed">
            {parseBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
