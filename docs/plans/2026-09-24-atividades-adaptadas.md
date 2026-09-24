# Atividades Adaptadas & Educação Inclusiva (DUA/PEI) Implementation Plan

> **Goal:** Construir o módulo de Elaborador de Atividades Adaptadas com suporte a seleção multi-select de deficiências/neurodiversidades, motor de harmonização DUA, banco de perfis de alunos (PEI rápido), bimodalidade (online e impressão acessível em PDF) e guia de mediação docente.

**Architecture:** Clean Architecture orientada a domínio puro (`dominio/adaptacoes`), aplicação e orquestração de IA (`aplicacao/adaptacoes`), repositório híbrido Firestore/localStorage (`infraestrutura/adaptacoes`) e interface rica em React/Tailwind (`apresentacao/adaptacoes` e rotas `/adaptacoes` e `/atividades`).

**Tech Stack:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, Vitest, Cloud Firestore, Google Gemini / multi-provedor (BYOK).

---

### Task 1: Entidades de Domínio e Validações (`AlunoInclusivo` e `CategoriasDeficiencia`)

**Files:**
- Create: `frontend/src/dominio/adaptacoes/CategoriasDeficiencia.js`
- Create: `frontend/src/dominio/adaptacoes/AlunoInclusivo.js`
- Test: `tests/unit/atividades_adaptadas.test.js`

**Step 1: Escrever teste unitário falhando (Red)**
Testar:
- Lista de 10 categorias suportadas (`tea`, `di`, `tdah`, `baixa_visao`, `cegueira`, `surdez`, `motora`, `dislexia`, `discalculia`, `ah_sd`).
- Criação e validação de `AlunoInclusivo` com suporte a múltiplas deficiências (array não vazio).
- Validação de níveis de suporte (1..3).

**Step 2: Rodar teste e verificar falha (Red)**
Comando: `npm --prefix frontend test`
Esperado: FAIL (módulo ou entidade não encontrada).

**Step 3: Implementar código mínimo de domínio (Green)**
Implementar:
- `CategoriasDeficiencia.js`: catálogo com IDs, nomes, ícones, descrições e diretrizes DUA.
- `AlunoInclusivo.js`: entidade pura com validação de dados, sanitização e método `toJSON()`.

**Step 4: Rodar teste e verificar aprovação (Green)**
Comando: `npm --prefix frontend test`
Esperado: PASS.

**Step 5: Commit**
`git add tests/unit/atividades_adaptadas.test.js frontend/src/dominio/adaptacoes/ && git commit -m "feat(adaptacoes): criar entidade AlunoInclusivo e catalogo de categorias DUA"`

---

### Task 2: Motor de Harmonização Sinérgica para Múltipla Deficiência

**Files:**
- Create: `frontend/src/dominio/adaptacoes/HarmonizadorAdaptacoes.js`
- Modify: `tests/unit/atividades_adaptadas.test.js`

**Step 1: Escrever teste falhando para regras de harmonização (Red)**
Testar:
- Harmonização de comorbidade `tea` + `di` (combinação de linguagem literal com leitura fácil e redução de distratores).
- Harmonização de `baixa_visao` + `motora` (fonte ampliada + opções amplas sem escrita manual).
- Harmonização de `cegueira` + apoios visuais (conversão obrigatória em audiodescrição semântica).

**Step 2: Rodar teste e verificar falha (Red)**
Comando: `npm --prefix frontend test`
Esperado: FAIL.

**Step 3: Implementar `HarmonizadorAdaptacoes.js` (Green)**
Construir regras puras de fusão de diretrizes sem contradições e matriz de sinergia DUA.

**Step 4: Rodar teste e verificar aprovação (Green)**
Comando: `npm --prefix frontend test`
Esperado: PASS.

**Step 5: Commit**
`git add frontend/src/dominio/adaptacoes/HarmonizadorAdaptacoes.js tests/unit/atividades_adaptadas.test.js && git commit -m "feat(adaptacoes): implementar motor de harmonizacao sinergica para multipla deficiencia"`

---

### Task 3: Repositório Híbrido de Perfis de Alunos PEI (`AlunoAdaptadoRepository`)

**Files:**
- Create: `frontend/src/infraestrutura/adaptacoes/AlunoAdaptadoRepository.js`
- Modify: `tests/unit/atividades_adaptadas.test.js`

**Step 1: Escrever teste falhando para persistência híbrida (Red)**
Testar:
- `salvarLocal(aluno)` e `listarLocal()`.
- Sincronização e fallback caso Firestore esteja indisponível.

**Step 2: Rodar teste e verificar falha (Red)**
Comando: `npm --prefix frontend test`
Esperado: FAIL.

**Step 3: Implementar `AlunoAdaptadoRepository.js` (Green)**
Implementar lógica com Firestore (`professores/{userId}/alunos_adaptados`) e cache `rotina_docente_alunos_adaptados_v1`.

**Step 4: Rodar teste e verificar aprovação (Green)**
Comando: `npm --prefix frontend test`
Esperado: PASS.

**Step 5: Commit**
`git add frontend/src/infraestrutura/adaptacoes/AlunoAdaptadoRepository.js tests/unit/atividades_adaptadas.test.js && git commit -m "feat(adaptacoes): criar repositorio hibrido para alunos PEI"`

---

### Task 4: Serviço de Prompt DUA e Endpoint `POST /api/adaptacoes/gerar`

**Files:**
- Create: `frontend/src/aplicacao/adaptacoes/AdaptacaoPromptBuilder.js`
- Create: `frontend/src/app/api/adaptacoes/gerar/route.js`
- Create: `tests/integration/adaptacoes_api.test.js`

**Step 1: Escrever teste de integração falhando (Red)**
Testar payload de geração, validação de BYOK (`x-user-ai-provider`), estrutura do JSON retornado com `atividadeAdaptada` e `guiaMediacao`.

**Step 2: Rodar teste e verificar falha (Red)**
Comando: `npm --prefix frontend test`
Esperado: FAIL (404 route não implementada).

**Step 3: Implementar builder de prompt e rota API (Green)**
Implementar `AdaptacaoPromptBuilder` com regras completas de DUA e a rota Next.js consumindo `callAI` central.

**Step 4: Rodar teste e verificar aprovação (Green)**
Comando: `npm --prefix frontend test`
Esperado: PASS.

**Step 5: Commit**
`git add frontend/src/aplicacao/adaptacoes/ frontend/src/app/api/adaptacoes/ tests/integration/adaptacoes_api.test.js && git commit -m "feat(adaptacoes): implementar gerador DUA e API de adaptacao"`

---

### Task 5: Componentes Visuais & Página do Módulo Independente (`/adaptacoes`)

**Files:**
- Create: `frontend/src/components/adaptacoes/SeletorNecessidades.jsx`
- Create: `frontend/src/components/adaptacoes/ModalAlunoPEI.jsx`
- Create: `frontend/src/components/adaptacoes/VisualizadorAtividadeAdaptada.jsx`
- Create: `frontend/src/app/adaptacoes/page.js`
- Modify: `frontend/src/components/diario/Sidebar.jsx` (adicionar item de menu "Atividades Adaptadas")
- Modify: `frontend/src/config/planos.js` (incluir módulo `atividades-adaptadas`)

**Step 1: Criar componentes modulares e responsivos com suporte a alta acessibilidade.**
**Step 2: Adicionar exportação para impressão limpa (PDF Acessível) com escolha de tamanho de fonte (14pt, 18pt, 24pt) e contraste.**
**Step 3: Integrar botão "Versão Adaptada" na listagem de `/atividades`.**
**Step 4: Executar suíte completa de testes e validação visual.**
**Step 5: Commit e deploy.**
