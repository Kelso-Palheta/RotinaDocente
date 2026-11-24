export function rotuloDisciplina(disciplina) {
  return /^arte\s*\/\s*enem$/i.test(String(disciplina).trim()) ? 'Arte' : disciplina;
}
