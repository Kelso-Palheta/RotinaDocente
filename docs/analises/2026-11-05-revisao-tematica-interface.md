# Relatório de Implementação: Interface da Revisão Temática v2

**Data:** 05/11/2026
**Responsável:** Antigravity (Frente de Interface e Componentes Controlados da Revisão Temática)
**Destinatário:** Coordenação / ChatGPT (Frente de Servidor, Persistência e Integração) e DeepSeek (Frente de Acervo e Conteúdo)
**Documentos de Referência:** `AGENTS.md`, `specs/REVISAO_AO_VIVO_SPEC.md`, `specs/REVISAO_TEMATICA_SPEC.md`, `specs/TESTS_SPEC.md`, `docs/plans/2026-11-05-revisao-tematica-design.md` e `docs/plans/2026-11-05-prompt-antigravity-revisao-tematica.md`

---

## 1. Escopo e Isolamento Concorrente

Em atendimento estrito às especificações de extensão v2 da Revisão Temática:
- **Novos componentes criados:**
  - `frontend/src/components/revisao/PrepararAulaoTematico.jsx`
  - `frontend/src/components/revisao/ConferirConteudoTematico.jsx`
  - `frontend/src/components/revisao/BlocoAulaTematica.jsx`
- **Componentes adaptados para `estado.aula` (com fallback legado 100% preservado):**
  - `frontend/src/components/revisao/PainelProfessor.jsx`
  - `frontend/src/components/revisao/TelaProjecao.jsx`
  - `frontend/src/components/revisao/PainelAluno.jsx`
- **Suítes de testes novas:**
  - `tests/unit/components/revisao/TematicoPreparacao.test.jsx` (11 testes)
  - `tests/unit/components/revisao/TematicoConferencia.test.jsx` (6 testes)
  - `tests/unit/components/revisao/TematicoApresentacao.test.jsx` (11 testes)
- **Isolamento estrito:**
  - Nenhuma alteração em controladores `Integracao*`, hooks de transporte, domínio, aplicação, infraestrutura ou regras do Firestore.
  - Nenhum import de acervo privado no cliente; fixtures sintéticas utilizadas para desacoplamento da frente concorrente do DeepSeek.
  - Zero novas dependências adicionadas ao `package.json`.
  - Nenhuma classe Tailwind proibida pelas regras globais de marca (`bg-violet-*`, `text-pink-*`, etc.).
  - Sem commit, sem push, sem deploy.

---

## 2. Implementação das Regras de Negócio e Contratos

### 2.1. Preparar Aulão Temático (`PrepararAulaoTematico.jsx`)
- **Contrato:** `{ trilhas, conteudos, questoes, turmas, selecao, ocupado, erro, onAlterar, onCriar, onAbrirConteudo, onAbrirRevisao }`.
- **Filtro contextual por conteúdos (RT-01..RT-04):**
  - Se nenhum conteúdo estiver selecionado em `selecao.conteudoIds`, o catálogo contextual não exibe nenhuma questão e informa explicitamente a necessidade de selecionar um tema.
  - Questões disponibilizadas no catálogo pertencem estritamente aos conteúdos marcados (verificação via `questao.conteudoIds.some(...)`). Vínculo por busca textual descartado.
  - Seleção de múltiplos conteúdos deduplica questões por ID.
- **Separação de compatíveis e aptas (RT-05):**
  - Exibe contador `X compatíveis (Y aptas)`.
  - Questões com `apta: false` são exibidas como rascunho com seleção bloqueada e botão `"Inspecionar"`, que aciona `onAbrirRevisao(questao.id)`.
- **Troca de contexto e remoção de incompatíveis (RT-06):**
  - Ao desmarcar uma aula, qualquer questão selecionada que deixar de ter cobertura em todos os conteúdos restantes é imediatamente removida de `questaoIds` e de `duracaoPorQuestao`.
  - Emite aviso visível informando a quantidade de questões retiradas e revalida a meta.
- **Meta exata de questões:**
  - Quantidade inteira configurável de 1 a 20 (`quantidadeQuestoes`).
  - O botão de criação só é habilitado se `selecao.questaoIds.length === selecao.quantidadeQuestoes`. Mensagem explicativa alerta a discrepância de quantidade.
- **Completar com aptas:**
  - Botão `"Completar com aptas"` preenche a seleção até a meta com questões aptas do contexto.
  - Se houver insuficiência de aptas no tema, preenche as existentes e emite aviso claro sem truncar a meta silenciosamente nem importar questões externas.
- **Reordenação e tempos individuais:**
  - Botões para mover para cima (`▲`) e para baixo (`▼`).
  - Campo numérico para tempo individual por questão (inteiro 10 a 600 segundos).
- **Aprovação de conteúdo:**
  - Conteúdo com `apta: false` bloqueia a criação da sala e disponibiliza botão para `"Inspecionar Conteúdo"`, chamando `onAbrirConteudo(conteudo.id)`.

### 2.2. Conferência de Conteúdo Temático (`ConferirConteudoTematico.jsx`)
- **Contrato:** `{ conteudo, confirmacoes, ocupado, erro, onConfirmacoesChange, onAprovar, onVoltar }`.
- **Exibição abrangente:**
  - Cabeçalho com título, resumo, duração estimada em minutos e status.
  - Seção de objetivos de aprendizagem com IDs e descrições pedagógicas.
  - Sequência de blocos didáticos (textos e imagens).
  - Listagem de imagens com arquivo, descrição alternativa (alt), legenda, URL de fonte com link seguro (`rel="noopener noreferrer" target="_blank"`) e licença.
  - Bibliografia e fontes primárias consultadas com data de consulta.
- **Checklist docente estrito de 3 itens (RT-11):**
  1. `confirmacoes.conteudo`: Clareza conceitual, linguagem e correção pedagógica.
  2. `confirmacoes.imagens`: Pertinência pedagógica, legibilidade e licenças.
  3. `confirmacoes.cobertura`: Cobertura integral dos objetivos de aprendizagem das questões.
- **Homologação:**
  - Botão `"Aprovar Conteúdo da Aula"` só é habilitado quando os três checkboxes são verdadeiros e não há estado ocupado.
  - Emite `onAprovar(conteudo.id)`.

### 2.3. Bloco da Aula Temática (`BlocoAulaTematica.jsx`)
- **Contrato:** `{ bloco, imagens, aula, tema }`.
- Renderiza o bloco pedagógico com visual vibrante aprovado (fundo roxo escuro `#25104A`, transparências e acentos `#00DDEB`, `#FFE14D`, `#FFFDF7`).
- Suporta blocos de texto e blocos com imagem, legenda e crédito.
- Exibe indicador de progresso global (`Bloco X de Y`) e título do tema.
- Compatível com leitores de tela e `@media (prefers-reduced-motion: reduce)`.

### 2.4. Adaptação dos Painéis com `estado.aula` (v2)
- **`PainelProfessor.jsx`:**
  - Em `fase === 'conteudo'` com `estado.aula`:
    - Renderiza `BlocoAulaTematica`.
    - Controles de navegação: botão `"Voltar Bloco"` (desabilitado no bloco 0) emitindo `voltar_conteudo`; botão `"Avançar Bloco"` emitindo `avancar_conteudo`.
    - No último bloco (`ultimoBloco: true`), o botão de avançar é substituído por `"Concluir Aula e Abrir Pergunta"`, emitindo `abrir_pergunta`.
    - Não exibe cronômetro durante a aula.
  - Em `fase === 'ranking'` de sala v2: o botão de próxima rodada possui o rótulo `"Iniciar Próxima Pergunta"`, sinalizando a abertura direta da pergunta seguinte.
  - Sem `estado.aula`: fallback legado 100% preservado (`rodada.conteudo`, botão direto `"Abrir Pergunta"`, `"Próxima Rodada"`).
- **`TelaProjecao.jsx`:**
  - Em `fase === 'conteudo'` com `estado.aula`: renderiza `BlocoAulaTematica` em tela cheia com visual para auditório, sem controles docentes.
  - Sem `estado.aula`: renderiza `rodada.conteudo` legado.
- **`PainelAluno.jsx`:**
  - Em `fase === 'conteudo'` com `estado.aula`: renderiza `BlocoAulaTematica` responsivo para celulares, **sem botões de controle docente**.
  - Sem `estado.aula`: renderiza `rodada.conteudo` legado.

---

## 3. Ciclo TDD: RED → GREEN

### 3.1. Fase RED
Criação prévia das 3 novas suítes de teste unitário:
```bash
$ cd frontend && npx vitest run \
  ../tests/unit/components/revisao/TematicoPreparacao.test.jsx \
  ../tests/unit/components/revisao/TematicoConferencia.test.jsx \
  ../tests/unit/components/revisao/TematicoApresentacao.test.jsx --maxWorkers=2
# RESULTADO RED COMPROVADO:
# Error: Failed to resolve import "@/components/revisao/BlocoAulaTematica"
# Error: Failed to resolve import "@/components/revisao/ConferirConteudoTematico"
# Error: Failed to resolve import "@/components/revisao/PrepararAulaoTematico"
# Test Files  3 failed (3)
```

### 3.2. Fase GREEN
Após implementação completa dos componentes e ajuste das propriedades:
```bash
$ cd frontend && npx vitest run \
  ../tests/unit/components/revisao/TematicoPreparacao.test.jsx \
  ../tests/unit/components/revisao/TematicoConferencia.test.jsx \
  ../tests/unit/components/revisao/TematicoApresentacao.test.jsx --maxWorkers=2
# RESULTADO GREEN:
# ✓ ../tests/unit/components/revisao/TematicoConferencia.test.jsx (6 tests)
# ✓ ../tests/unit/components/revisao/TematicoPreparacao.test.jsx (11 tests)
# ✓ ../tests/unit/components/revisao/TematicoApresentacao.test.jsx (11 tests)
# Test Files  3 passed (3)
# Tests       28 passed (28)
```

### 3.3. Regressão Geral da Revisão e Paleta
Execução com 2 workers conforme instrução:
```bash
$ cd frontend && npx vitest run ../tests/unit/components/revisao ../tests/unit/paleta_petroleo_salvia.test.js --maxWorkers=2
# RESULTADO:
# Test Files  23 passed (23)
# Tests       143 passed (143)
```

---

## 4. Auditoria de Lint (ESLint)

```bash
$ cd frontend && npx eslint \
  src/components/revisao/PrepararAulaoTematico.jsx \
  src/components/revisao/ConferirConteudoTematico.jsx \
  src/components/revisao/BlocoAulaTematica.jsx \
  src/components/revisao/PainelProfessor.jsx \
  src/components/revisao/TelaProjecao.jsx \
  src/components/revisao/PainelAluno.jsx
# RESULTADO: 0 errors, 0 warnings (Exit code 0)
```

---

## 5. Limitações Declaradas e Handoff para ChatGPT

1. **Componentes Controlados:** Todos os componentes são puramente controlados via props e emitem callbacks (`onAlterar`, `onCriar`, `onAbrirConteudo`, `onAbrirRevisao`, `onConfirmacoesChange`, `onAprovar`, `onVoltar`, `onAcao`). A validação final de autorização, integridade de hashes do acervo e persistência em Firestore deve ser realizada no backend pelo ChatGPT.
2. **Ambiente de Validação Visual:** Em virtude da ausência de sessão docente/aluno autenticada em ambiente headless durante o isolamento dos agentes, a validação de layout foi realizada via testes unitários e de renderização de componentes com verificação de acessibilidade e viewport. Nenhuma rota pública ou bypass de autenticação foi criado.
3. **Estado do Repositório:** O galho `master` permanece com as alterações em working tree, sem commit ou push, pronto para integração e consolidação técnica pelo ChatGPT.
