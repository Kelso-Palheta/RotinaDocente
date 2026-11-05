# Revisão ao Vivo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Tornar a revisão gamificada acessível pelo Hub, com conferência docente, sala persistida, projeção e participação autenticada do aluno.

**Architecture:** Domínio puro de transições/projeções; casos de uso sobre uma interface de armazenamento; Firestore Admin transacional e SSE autenticado como adaptadores. Acervo somente servidor. Identidades e notas existentes preservadas.

**Tech Stack:** Next.js/React existentes, Firebase Admin existente, SSE via fetch/ReadableStream; Vitest e ferramentas já disponíveis.

### 1. Viabilidade e contrato
1. Conferir fontes oficiais de duração/streaming e quotas Firestore.
2. Testar leitura/listener no projeto configurado, somente leitura de documento inexistente, sem dados reais.
3. Registrar decisões de transporte, pontuação, limites e armazenamento nas specs antes de src.

### 2. Domínio e aplicação
Arquivos: `dominio/revisao/sala.js`, `aplicacao/revisao/RevisaoService.js`; testes novos `tests/unit/revisao_sala.test.js` e `tests/integration/revisao_servico.test.js`.
1. Escrever cenários falhos de transição, prazo, sanitização, empate e repetição.
2. Implementar funções puras, validar em cada comando e transação.
3. Testar dois controladores sobre armazenamento compartilhado, inclusive revisão antiga e respostas simultâneas.

### 3. Infraestrutura e API
Arquivos: `infraestrutura/revisao/{FirestoreStore,acervoServidor,acessoServidor,httpServidor}.js`, `app/api/revisao/[...partes]/route.js`, `next.config.mjs`.
1. Testar catálogo privado/arquivos inválidos, autorização docente/discente e CSRF antes de implementar.
2. Congelar conteúdo revisado por rodada; implementar recibos e pontos em transação, prazos rechecados antes da escrita.
3. Testar SSE cancelável, reconexão, assinatura liberada e aluno sem dados futuros.
4. Incluir acervo na compilação do servidor, nunca no cliente/public.

### 4. Controladores e entradas
Arquivos novos em `components/revisao/` e `app/{revisao,aluno/revisao}/`; alterações mínimas `components/Dashboard.js` e `app/aluno/notas/page.js`.
1. Testes novos de navegação, preparação/revisão, descarte de resposta/stream antigo e retry imutável.
2. Conectar componentes existentes à API; manter ações bloqueadas durante conexão/envio.
3. Confirmar revisão docente por quatro itens e contexto/hash, sem aprovar fixtures reais automaticamente.

### 5. Integração e entrega
1. Ensaio isolado ponta a ponta e progressivo de concorrência; registrar p95, perda/duplicação e ambiente.
2. Revisão independente, correções e repetição dirigida apenas quando necessária.
3. Suíte completa, lint e build; commit/push após aprovação das verificações, sem nova confirmação.
4. Conferir deployment e acesso ao módulo; registrar limites remanescentes do acervo e da capacidade medida.

Execução nesta conversa conforme pedido do usuário; compartilhar apenas domínios com arquivos exclusivos e contratos definidos. Não solicitar outra escolha de execução nem criar worktree sem necessidade; checkout atual está limpo e será reutilizado.
