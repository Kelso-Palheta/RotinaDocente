# Relatório de Entrega — Correções de Disputas e Semântica Audiovisual (`REV-DIS-01..07` e `REV-IM-12..14`)

**Data:** 2026-11-19
**Revisão atendida:** `docs/analises/2026-11-19-aula-gamificada-disputas-revisao.md`

---

## 1. Correções Implementadas

### `REV-DIS-01` — Identificação estável do representante e presença
- **`frontend/src/dominio/aula-gamificada/sala.js` (`validarEquipes`, `ehRepresentanteEquipe`, `projetarEstado`)**:
  - Passou a exigir/emitir `representanteParticipanteId` (SHA-256 de turma + aluno) e rejeitar com HTTP `422` qualquer `representanteAlunoId` local ambíguo entre turmas distintas.
- **`frontend/src/aplicacao/aula-gamificada/AulaGamificadaService.js` (`responder`, `comandar`)**:
  - `responder` lê `todosPart` antes de qualquer escrita na transação e valida autorização exclusivamente por `ehRepresentanteEquipe` (priorizando `representanteParticipanteId` e bloqueando homônimos de outras turmas com `403`).
  - `alterar_representante` e `confirmar_presenca` aceitam `participante.id` estável, rejeitam `alunoId` ambíguo entre turmas (`422`) e registram `auditoriaRepresentantes` e `auditoriaPresencas`.
- **`frontend/src/components/aula-gamificada/PrepararSala.jsx`**: seletor de representante usa `participanteId` estável e exibe a turma quando há múltiplas turmas.

### `REV-DIS-02` e `REV-DIS-03` — Pontos compartilhados ocultos antes da revelação e computados uma vez por grupo/rodada
- **`AulaGamificadaService.js` (`responder`, `projetar`)**:
  - No modo `compartilhada`, `atualizarPontosParticipantes` não replica `pontosRodada` para cada integrante; a pontuação de equipe é derivada das evidências únicas em `respostas` (`eq_<equipeId>`), excluindo a rodada atual quando `revelado === false`.
- **`frontend/src/dominio/aula-gamificada/pontuacao.js` (`calcularRanking`)**:
  - No modo `compartilhada`, soma cada evidência de grupo/rodada uma única vez (`1000` pts para grupo de 1, 2 ou N integrantes), preservando acumulados, parciais, tentativas e idempotência.

### `REV-DIS-04` — Ranking coletivo para todos os formatos em grupo
- **`pontuacao.js`**, **`sala.js`**, **`constantes.js` (`normalizarEstadoSala`)**, **`SalaDocenteView.jsx`** e **`SalaAlunoView.jsx`**:
  - Derivam o ranking coletivo por `formatoParticipacao === 'grupos'` (além de `equipes` e `tabuleiro`), separando soma individual (`grupos/individual`) e evidência única (`grupos/compartilhada`) e preservando o desempate de casas/pontos do Tabuleiro.

### `REV-DIS-05` — Ausência expressamente registrada prevalece sobre login anterior
- **`frontend/src/dominio/aula-gamificada/avaliacao.js` (`gerarRelatorioSala`)**:
  - `p.presenteConfirmado === false` gera `ausenciaConfirmada: true` e `presencaStatus: 'ausente_confirmado'`, prevalecendo sobre `entrouEmMs`. Ausentes confirmados ficam com `notaFinal: null` (não recebem nota coletiva nem zero automático mesmo com `zerarAusentes: true`) no relatório, na publicação do portal e na sincronização com o Diário.

### `REV-DIS-06` — Nova disputa em grupos impede grupo vazio e exige cobertura do roster
- **`AulaGamificadaService.js` (`criarSala`)** e **`sala.js` (`validarEquipes`)**:
  - `formatoParticipacao === 'grupos'` exige `exigirMembros: true` e `exigirCobertura: true` tanto em `compartilhada` quanto em `individual`, rejeitando grupos vazios ou alunos não alocados com HTTP `422`.

### `REV-DIS-07` — Controles docentes de presença/representante e identificação coletiva nos relatórios
- **`frontend/src/components/aula-gamificada/ControlesGrupoDocente.jsx`** + **`SalaDocenteView.jsx`** + **`api.js`** + **`useSalaGamificada.js`**:
  - Painel docente acessível com seleção estável de representante por grupo (`alterar_representante`) e confirmação de presença em lote (`confirmar_presenca` com `substituir: true`), mantendo tentativas, cronômetro e placar intactos.
- **`RelatorioAvaliacao.jsx`**, **`avaliacao.js` (`gerarCsvRelatorio`)**, **`AulaGamificadaService.js` (`publicarAvaliacao`)** e **`AcessoAlunoView.jsx`**:
  - Exibem no relatório visual, CSV, PDF e Portal do Aluno: formato de participação, modo do grupo, critério coletivo, grupo, presença, representante/autoria e contagem separada de pessoas presentes vs. respostas únicas de grupos.

### `REV-IM-12`, `REV-IM-13` e `REV-IM-14` — Semântica audiovisual completa
- **`ProvedorAudiovisualSala.jsx`**, **`catalogoCenas.js`** e **`motorAudioJogo.js`**:
  - `derivarContextoAudiovisual` diferencia explicitamente: `parcial` (pontuação parcial > 0 sem acerto integral), `sem_resposta` (aluno sem recibo na revelação) e `revelacao_neutra` (telão/docente na revelação coletiva), todos mapeados no catálogo dos 7 jogos e com sequências Web Audio dedicadas.

---

## 2. Validação Automatizada

- **Regressões obrigatórias preservadas (`9/9`):**
  - `tests/regression/aula_gamificada_disputas_revisao.test.js`: **6/6 aprovados** (`REV-DIS-01` a `REV-DIS-06`).
  - `tests/regression/aula_gamificada_imersao_semantica.test.jsx`: **3/3 aprovados** (`REV-IM-12` a `REV-IM-14`).
  - `tests/regression/aula_gamificada_imersao_revisao.test.jsx`: **11/11 aprovados**.
- **Novos testes de integração e UI (`7/7`):**
  - `tests/integration/aula_gamificada_disputas_revisao_completo.test.js`: **3/3 aprovados** (homônimos entre turmas, ocultação/idempotência pré-revelação, ausência confirmada até Diário e Portal).
  - `tests/unit/components/aula-gamificada/DisputasControlesERelatorio.test.jsx`: **4/4 aprovados** (`ControlesGrupoDocente`, `normalizarEstadoSala`, `RelatorioAvaliacao`/`gerarCsvRelatorio`, `PalcoCenaConectado`).
- **Suíte completa (`npm --prefix frontend test`):**
  - **379 arquivos aprovados, 4 ignorados (emuladores Firebase opcionais) de 383** — **1.740 testes aprovados, 10 ignorados, 0 falhas**.
- **ESLint (`npm --prefix frontend run lint`):** **0 erros** (`18 warnings` pré-existentes).
- **Build (`npm --prefix frontend run build`):** **aprovado** (`next build`, 42 páginas estáticas).

---

## 3. Capturas Reais (Desktop `1440×900` e Celular `390×844`)

Em `docs/evidencias/2026-11-19-aula-gamificada-disputas-revisao/`:
- `01-ranking-coletivo-desktop.png` e `02-ranking-coletivo-mobile.png` — Quiz em grupos com ranking coletivo (`Grupo Sol: 1000 pts`, `Grupo Lua: 0 pts`).
- `03-resultado-parcial-aluno-desktop.png` e `04-resultado-parcial-aluno-mobile.png` — Associação com resultado parcial (`pontuacao: 500`, reação neutra `parcial`).
- `05-docente-presenca-representante-desktop.png` e `06-docente-presenca-representante-mobile.png` — Controles docentes de troca de representante e confirmação de presença com IDs estáveis.
- `07-telao-revelacao-neutra-desktop.png` — Telão/projeção em revelação coletiva neutra (`revelacao_neutra`).
