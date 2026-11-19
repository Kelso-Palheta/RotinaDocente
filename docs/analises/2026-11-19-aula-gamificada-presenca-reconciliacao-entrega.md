# Relatório de Entrega — Reconciliação de Presença e Republicação (`REV-DIS-08` e `REV-DIS-09`)

**Data:** 2026-11-19
**Revisão atendida:** `docs/analises/2026-11-19-aula-gamificada-presenca-republicacao-revisao.md`

---

## 1. Correções Realizadas

### `REV-DIS-08` — Reconciliação entre resumo e detalhe do Portal do Aluno
- **`frontend/src/aplicacao/aula-gamificada/AulaGamificadaService.js` (`finalizarAvaliacao`)**:
  - Antes de iniciar qualquer escrita transacional, lê todas as entregas (`entregas/ag_{codigo}_{turmaId}_{alunoId}`) e resumos do Portal (`aulaGamificadaPortal/{alunoId}/avaliacoes/{codigo}`).
  - Na republicação (`publicarPortal: true`), quando um aluno previamente publicado passa a ficar sem nota (`notaFinal: null`), atualiza o resumo existente no Portal com `notaFinal: null`, `ativo: false`, `situacao`, `ausenciaConfirmada`, `presencaStatus`, `justificativaAusencia` e a nova `versaoPublicada` (sem criar resumo espúrio para quem nunca teve nota e sem alterar a versão publicada quando o docente apenas edita presença antes de republicar).
- **`frontend/src/components/aula-gamificada/AcessoAlunoView.jsx`**: exibe `"Sem nota (ausência confirmada)"` no cartão de `Minhas Avaliações (Portal)` quando `notaFinal === null` e `ausenciaConfirmada === true`.

### `REV-DIS-09` — Reconciliação de entregas, pendências e Diário
- **`AulaGamificadaService.js` (`confirmar_presenca`, `finalizarAvaliacao`, `sincronizarDiario`)**:
  - `confirmar_presenca` lê `avaliacao/estado` antes das escritas e, quando altera a presença em sala já finalizada/publicada/sincronizada, sinaliza `pendenciasAtualizacao` (`presencaAlterada: true`, `portalPendente`, `diarioPendente`, `entregaPendente`) de forma acumulativa (não perdida ao trocar representante ou fazer outra edição).
  - `finalizarAvaliacao` invalida entregas anteriores de alunos que passaram a ficar sem nota (`status: 'invalidada_sem_nota'`, `notaFinal: null`, `notaRevisada: null`, preservando `notaAnteriorInvalidada`, `origemColetiva` e `motivoInvalidacao`), impedindo sincronização regular com nota obsoleta e sem converter ausência em zero.
  - `sincronizarDiario` detecta divergência quando o Diário ainda possui nota anterior na coluna da atividade para um aluno agora sem nota (`tipo: 'divergencia_diario_sem_nota'`), mantém `diarioPendente: true` e `status: 'pendente'` até confirmação explícita (`reconciliarAusentes: true` + `confirmarSobrescrita: true`), removendo somente a coluna daquela atividade sem tocar notas alheias e suportando também retorno à presença (`ausência → presença`).

---

## 2. Validação Automatizada (após a última edição)

- **Regressões obrigatórias preservadas (`2/2`):**
  - `tests/regression/aula_gamificada_presenca_republicacao.test.js`: **2/2 aprovados** (`REV-DIS-08` e `REV-DIS-09`).
- **Novo teste de integração completo (`1/1`):**
  - `tests/integration/aula_gamificada_presenca_reconciliacao.test.js`: **1/1 aprovado** (nota já sincronizada no Diário, sinalização preservada após troca de representante, versão anterior mantida até republicar, republicação idempotente, divergência explícita no Diário, preservação de notas alheias e retorno à presença).
- **Suíte completa (`npm --prefix frontend test`):**
  - **381 arquivos aprovados, 4 ignorados (emuladores Firebase opcionais) de 385** — **1.743 testes aprovados, 10 ignorados, 0 falhas**.
- **ESLint (`npm --prefix frontend run lint`):** **0 erros** (`18 warnings` pré-existentes).
- **Build (`npm --prefix frontend run build`):** **aprovado** (`next build`, 42 páginas estáticas).

---

## 3. Evidências Visuais (Portal Resumo + Detalhe após Republicação)

Em `docs/evidencias/2026-11-19-aula-gamificada-presenca-reconciliacao/`:
- `01-portal-resumo-detalhe-republicado-desktop.png` (`1440×900`)
- `02-portal-resumo-detalhe-republicado-mobile.png` (`390×844`)
