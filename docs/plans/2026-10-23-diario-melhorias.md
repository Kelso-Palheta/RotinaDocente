# Melhorias do Diário Pedagógico — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aplicar as recomendações aprovadas da auditoria do Diário sem perder notas nem alterar outros módulos.

**Architecture:** Regras puras em domínio; persistência transacional por revisão em infraestrutura; coordenação por hooks; componentes com prévias e estados explícitos. Preservar dados e implementações anteriores da sessão.

**Tech Stack:** Next/React, Firestore, Vitest/Testing Library, jsPDF.

---

### 1. Critérios e lançamento
Files: `frontend/src/dominio/diario/criterios.js`, `frontend/src/utils/diario/calculos.js`, `frontend/src/hooks/diario/useNotas.js`, `frontend/src/components/diario/{TabelaNotas,NumCell}.jsx`.
Criar testes novos de migração/validação/teclado/colagem, executar e observar falha; implementar preservação e validação, busca/filtros, ações textuais e prévia de critérios/colagem; repetir testes. Não alterar testes existentes.

### 2. Frequência, ocorrências e perfil
Files: `frontend/src/components/diario/{TabelaFrequencia,DiarioDeBordo}.jsx`, `frontend/src/dominio/diario/fichaAluno.js`, `frontend/src/lib/diario/fichaAlunoExport.js` e novos componentes de prévia/linha do tempo.
Testar carregamento da chamada, origem do calendário/horário, autorização familiar e paginação antes de implementar. Integrar sugestões sem trocar registros existentes e relatórios familiares com prévia.

### 3. Backup/restauração
Files: `frontend/src/dominio/diario/backupTurmas.js`, `frontend/src/components/diario/Sidebar.jsx`, novo modal de restauração.
Testar validação profunda/compatibilidade e persistência antes de sucesso. Implementar prévia mesclar/substituir com cópia anterior. Manter sidebar compatível com novos controles de ano/arquivo do coordenador.

### 4. Persistência, contexto e segurança
Files: `frontend/src/infraestrutura/diario/DiarioRepository.js`, `frontend/src/hooks/diario/usePersistenciaDiario.js`, `frontend/src/hooks/diario/useTurmas.js`, `frontend/src/app/diario/page.js`.
Testar fila, revisão transacional, conflito, vazio, conta, rascunho e ausência de limpeza automática. Implementar promessa de salvamento, retomada/repetição, histórico/desfazer e seleção de ano/arquivo/promoção.

### 5. Clareza, fechamento e publicação
Files: `frontend/src/components/diario/TurmaView.jsx`, novos componentes de visão geral/fechamento/publicação, `frontend/src/app/api/publicar-notas/route.js`.
Testar prévia, recorte, manutenção dos outros bimestres, resumo/repetição e alertas acionáveis. Implementar seleção de turma/bimestre/ano, diferenças entre salvar/sincronizar/publicar e exportação com alcance.

### 6. Integração e validação
Revisar frentes integradas; executar testes completos `npm --prefix frontend test`, build `npm --prefix frontend run build`, lint dos arquivos alterados e `git diff --check`. Renderizar PDFs e conferir telas essenciais. Atualizar análise, guia e especificações com resultados e limites reais. Commit/push não fazem parte deste novo pedido.
