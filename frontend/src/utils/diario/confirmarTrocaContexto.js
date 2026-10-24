/** Consulta apenas marcadores de edição; buscas e filtros não bloqueiam a navegação. */
export function confirmarTrocaContexto() {
  if (typeof document === 'undefined') return true;
  if (document.querySelector('[data-diario-salvando="true"]')) return false;
  const pendente = document.querySelector('[data-diario-rascunho="true"], input[aria-invalid="true"]');
  if (!pendente) return true;
  return window.confirm('Há alterações não salvas ou notas inválidas nesta tela. Deseja descartá-las e trocar de contexto?');
}
