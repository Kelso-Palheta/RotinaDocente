'use client';
import { useEffect, useRef } from 'react';
/** Diálogo nativo mantém foco dentro da prévia, sem ações de gravação. */
export function DialogoAnalytics({ rotulo, onFechar, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (typeof el.showModal === 'function') el.showModal();
    else el.setAttribute('open', '');
    el.focus();
    return () => {
      if (el.open && typeof el.close === 'function') el.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      tabIndex={-1}
      aria-label={rotulo}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        onFechar();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onFechar();
        }
      }}
      className="fixed inset-0 m-auto p-5 bg-white border rounded-xl max-w-3xl w-[calc(100%_-_2rem)] max-h-[90vh] overflow-auto backdrop:bg-slate-900/40"
    >
      {children}
    </dialog>
  );
}
