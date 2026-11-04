# Paleta petróleo e sálvia — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Recolorir toda a interface própria, preservando estrutura/fontes e as cores das notas.

**Architecture:** Centralizar papéis de marca em tokens CSS e manter aliases antigos quando necessário. Migrar somente valores/referências de cores fixas em todos os módulos, separando usos de marca de usos de nota; não refatorar componentes nem lógica.

**Tech Stack:** Next.js/React, CSS/Tailwind, Vitest; mesmas dependências e versões já instaladas.

---

Design: `docs/plans/2026-11-04-paleta-petroleo-salvia-design.md`. Contrato: `specs/PALETA_PETROLEO_SALVIA_SPEC.md`. Inventário inicial de caminhos: `docs/plans/2026-11-04-paleta-petroleo-salvia-inventario.md`.

## Task 1 — Base isolada e teste de contrato

**Arquivos:** ler `AGENTS.md`, `frontend/AGENTS.md`, `specs/RULES.md`, `specs/PRD.md`, `specs/TESTS_SPEC.md`; criar `tests/unit/paleta_petroleo_salvia.test.js`.

1. Conferir `git status` e base publicada. Usar checkout isolado a partir de `17ade59`, sem levar mudanças não aprovadas do logout. Não limpar/resetar checkout existente.
2. Escrever teste novo que leia o contrato CSS de marca, confira primária/fundo/apoio aprovados e calcule contraste sobre pares efetivamente usados. Não duplicar a implementação do helper de notas nem alterar testes antigos.
3. Executar `cd frontend && npx vitest run --dir ../tests ../tests/unit/paleta_petroleo_salvia.test.js`: esperado RED para a paleta antiga. Guardar saída e declarar falha real, não erro de import/configuração.

## Task 2 — Tokens e identidade central

**Arquivos:** `frontend/src/app/globals.css`; trecho RN-50 de `specs/RULES.md` no checkout limpo; spec visual exclusiva se houver complemento.

1. Aplicar tokens de papel do design. Aliases possíveis: `--pink` → primária `#0F766E`, `--pink-dark` → `#0B5F59`, `--pink-light` → `#DAEBE5`, `--pink-soft` → `#F3F8F5`, `--navy`/`--ink`/foreground → `#123C3A`, `--bg-soft` → `#F3F7F5`, `--gray` → `#4F6B63`, `--gray-light` → `#566F65`, `--border` → `#D5E3DC`. Preservar branco onde é superfície/texto de contraste; tokens com nomes legados não preservam a marca antiga.
2. Converter RGB decorativo nas mesmas posições/opacidades: `246,12,73` → `15,118,110`; `16,25,66` → `18,60,58`; `220,224,240` → `213,227,220`. Avaliar usos, não substituir em dados/figuras/notas.
3. Atualizar comentário de marca para Rotina Docente e RN-50 para a identidade aprovada, mantendo a tipografia e exceção de notas.
4. Rodar o teste novo: esperado GREEN e contraste adequado. Revisar valores reais e estados, não apenas ausência de cores antigas.

## Task 3 — Valores fixos em todos os módulos

**Arquivos:** caminhos reais do inventário, prioritariamente `frontend/src/components/landing/`, `frontend/src/components/Dashboard.js`, `frontend/src/app/`, `frontend/src/components/diario/`, `aluno/`, `atividades/`, `adaptacoes/`, `agentes/`, `calendario/`, `analytics/`, `redacao/`, `ai/`, `acessibilidade/`, `frontend/src/apresentacao/horario/` e exportadores de `frontend/src/lib/`.

1. Classificar cada literal, classe e gradiente em marca, nota ou conteúdo/dado; registrar exceções. Buscar também variações que não aparecem no padrão inicial dos 97 arquivos.
2. Migrar a identidade decorativa da landing, autenticação e Hub. Não mudar grade de cards, ícones, texto, funções, links, tamanhos ou preços.
3. Migrar cada módulo em sequência, incluindo estados de hover/foco/seleção e modais. Manter cores numéricas/pedagógicas e legendas das notas. Em Horário, não alterar cores personalizadas salvas por professores.
4. Em `frontend/src/data/agentes/agentesConfig.js`, mudar somente cores decorativas dos agentes; nomes, prompts/chips e provedor continuam.
5. Em exportadores alterados, mudar somente valores de marca; não mexer em métricas, quebras, fontes, paginação ou dados. Não recolorir conteúdo raster didático.
6. Revisar diff por módulo: qualquer mudança de comportamento, classe de tamanho/posição, condição, handler, hook, API ou dado está fora do escopo.

## Task 4 — Verificar, evidenciar, entregar

1. Executar `cd frontend && npx vitest run --dir ../tests ../tests/unit/paleta_petroleo_salvia.test.js ../tests/unit/nota_bimestral_cores.test.js ../tests/integration/boletim_faixa_bimestral.test.js ../tests/unit/components/analytics/AnalyticsMediaCor.test.jsx`. Esperado: todos aprovados sem editar testes recebidos.
2. Executar suíte com `npm test`, lint dos arquivos alterados e `NODE_USE_SYSTEM_CA=1 npm run build`. Nenhum build concorrente.
3. Capturar antes/depois em 390/1440 com mesmo conteúdo e estrutura; cumprir PV-08. Testar botões, campos, erro, loading, hover e seleção. Não considerar cores de notas antigas como resíduo de marca a eliminar.
4. Registrar alterações, exceções, validação e limitações em `docs/analises/2026-11-04-paleta-petroleo-salvia.md`.
5. Entregar diff para revisão neste chat, sem commit/push/deploy pelo executor. Publicação automática ocorre aqui depois da revisão e validação do escopo aprovado; não esconder testes vermelhos nem publicar pendências do logout.
