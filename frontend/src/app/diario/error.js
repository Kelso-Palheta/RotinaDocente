"use client";

export default function DiarioError({ error, reset }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center max-w-sm animate-card-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#F3EDFF] border border-[#E7DBFD] flex items-center justify-center">
          <svg className="w-8 h-8 text-[#6315D9]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 className="text-lg font-bold text-[#25104A] mb-2">Algo deu errado</h1>
        <p className="text-sm text-slate-400 mb-6">Suas alterações foram salvas. Tente recarregar.</p>
        <button onClick={reset} className="px-6 py-2.5 bg-[#6315D9] hover:bg-[#5411B8] rounded-xl text-white text-sm font-semibold transition-all">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
