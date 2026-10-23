# Importação de Notas do Simulado — Implementation Plan

**Goal:** Preencher a coluna Simulado da turma/bimestre selecionados a partir de imagens ou PDF, com conferência prévia.

**Architecture:** Extração visual compartilhada já existente → IA BYOK retorna nomes/notas → domínio puro normaliza e valida correspondências → prévia → atualização imutável única, revalidada contra o estado atual. Não altera atividades, total calculado ou notas já lançadas (incluindo zero).

**Tech Stack:** React/Next.js, PDF.js, gateway BYOK existente, Vitest/Testing Library.

## 1. Domínio e regressões
- Criar `frontend/src/dominio/diario/importacaoSimulado.js` e `tests/unit/importacao_simulado.test.js`.
- Testar antes de implementar: acentos/espaços, homônimos, desconhecidos, duplicatas em arquivos diferentes, vírgula decimal, zero, notas inválidas/fora da escala, notas existentes.
- Aplicar mudanças apenas no simulado de alunos conhecidos no bimestre selecionado. Revalidar contra notas lançadas após a prévia; preservar demais turmas/bimestres/atividades.

## 2. Extração BYOK
- Criar `frontend/src/utils/diario/importarSimuladoIA.js` e `tests/integration/importar_simulado_ia.test.js`.
- PDF/imagem usa o extrator compartilhado; a IA estrutura nome/nota sem inventar valores, converter escala nem usar colunas de atividades/total. Seleção explícita do bimestre no prompt.
- Validar resposta JSON, arquivos suportados, chave, texto vazio, limite de payload e erros do provedor. Múltiplos arquivos são consolidados antes da prévia.

## 3. Prévia e aplicação
- Criar `ImportarSimuladoModal.jsx` e testes de interface.
- Integrar botão `Importar Simulado` em `TurmaView`; ligar callback de lote via `useNotas`/página do Diário.
- Mostrar turma, bimestre, escala, aluno extraído/encontrado, nota, situação. Permitir revisar nome e nota; confirmar somente linhas válidas e vazias. Nenhuma mudança antes da confirmação.

## 4. Verificação
- Executar testes novos (Red → Green), suíte completa, lint dos arquivos alterados, build e revisão do diff.
- Manter as implementações anteriores ainda não commitadas. Não fazer commit/push sem solicitação.
