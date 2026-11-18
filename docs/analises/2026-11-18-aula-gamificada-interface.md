# Análise e Entrega de Interface — Aula Gamificada

Data: 18/11/2026 (2ª etapa: correções da revisão independente)
Responsável: Antigravity (seção “Antigravity — experiência e cinco jogos” de `docs/plans/2026-11-18-aula-gamificada.md`)
Especificações de referência: `specs/AULA_GAMIFICADA_SPEC.md`, `specs/PALETA_ARTE_EM_JOGO_SPEC.md` e `docs/analises/2026-11-18-aula-gamificada-revisao-interface.md`

---

## 1. Escopo entregue e fronteira de arquivos

### Arquivos exclusivos da interface
- **Rotas Next.js 16 (App Router, `await params`):**
  - `frontend/src/app/aula-gamificada/page.js`
  - `frontend/src/app/aula-gamificada/sala/[codigo]/page.js`
  - `frontend/src/app/aula-gamificada/projecao/[codigo]/page.js`
  - `frontend/src/app/aluno/aula-gamificada/page.js`
  - `frontend/src/app/aluno/aula-gamificada/[codigo]/page.js`
- **Componentes e cliente HTTP em `frontend/src/components/aula-gamificada/`:**
  - `api.js` — Cliente HTTP sob `/api/aula-gamificada/*` (Bearer docente nas rotas docentes; headers BYOK via `getClientAIHeaders()` **exclusivamente** em `POST /gerar`; sessão `same-origin` sem Bearer/UID nas rotas discentes; propagação estruturada `{error, message}` + `status`; sem gravação de chaves).
  - `constantes.js` — Catálogo das 5 modalidades, compatibilidade de tipos, `gerarIdOpacoCarta()`, `resolverRequestIdOperacao()`, normalização de ranking com empates e `normalizarEstadoSala()`.
  - `RenderTextoSeguro.jsx` — Renderização segura de texto e fórmulas simples entre `$...$` via nós React (`<sup>`, `<sub>`), sem `dangerouslySetInnerHTML` e sem renderizar HTML bruto da IA.
  - `useSalaGamificada.js` — Polling sequencial sem sobreposição, cancelamento via `AbortController` no unmount, recuo exponencial em falhas, isolamento por contexto/conta (`contextoUid`), idempotência de comandos, reconstrução limpa de cartas de Memória e cronômetro monotônico sincronizado com `servidorAgora`/`prazo`.
  - `AcessoAulaGamificada.jsx` — Entrada independente no Hub docente e no Portal do Aluno.
  - `HubDocente.jsx`, `CatalogoModalidades.jsx`, `BancoQuestoes.jsx`, `FormularioQuestao.jsx`, `GeradorIAQuestoes.jsx`, `PrepararSala.jsx`.
  - `SalaDocenteView.jsx` (painel docente + telão/projeção).
  - `AcessoAlunoView.jsx` e `SalaAlunoView.jsx`.
  - `jogos/JogoQuiz.jsx`, `jogos/JogoMemoria.jsx`, `jogos/JogoAssociacao.jsx`, `jogos/JogoOrdenacao.jsx`.
- **Testes automatizados em `tests/unit/components/aula-gamificada/`:**
  - `ApiCliente.test.js`
  - `BancoERevisao.test.jsx`
  - `GeradorIA.test.jsx`
  - `PrepararSala.test.jsx`
  - `CincoJogosAluno.test.jsx`
  - `SalaDocenteProjecao.test.jsx`
  - `PollingEReconexao.test.jsx`
  - `IntegracaoFormatoServidor.test.jsx`
  - `RevisaoIndependenteInterface.test.jsx` (4 regressões da revisão — preservadas integralmente)
  - `CorrecoesRevisaoInterface.test.jsx` (6 novos testes cobrindo as correções da 2ª etapa)

### Entradas mínimas em arquivos compartilhados autorizados
- `frontend/src/config/modules.js`: export nomeado `AULA_GAMIFICADA_MODULE` **sem alterar** `PLATFORM_MODULES` (preserva `HUB-ORDEM-01`).
- `frontend/src/components/Dashboard.js`: `<AcessoAulaGamificada />` ao lado de `<AcessoRevisao />`.
- `frontend/src/app/aluno/notas/page.js`: `<AcessoAulaGamificada aluno />` ao lado de `<AcessoRevisao aluno />`.

### Preservação estrita
- Nenhum arquivo de propriedade do DeepSeek (`dominio/aula-gamificada`, `aplicacao/aula-gamificada`, `infraestrutura/aula-gamificada`, `app/api/aula-gamificada`) foi modificado.
- Alterações pendentes em `frontend/src/lib/auth-context.js` e `frontend/src/components/revisao/*` foram preservadas.
- Todos os testes pré-existentes do repositório e as 4 regressões em `RevisaoIndependenteInterface.test.jsx` foram preservados intactos. Em `PrepararSala.test.jsx` (arquivo novo desta entrega), apenas acrescentou-se uma segunda equipe (`Equipe Beta`) mantendo integralmente todas as asserções originais para refletir a regra de mínimo de duas equipes exigida pelo servidor e pelo item 5 da revisão.

---

## 2. Correções aplicadas da revisão independente (18/11/2026)

Todos os 8 itens de `docs/analises/2026-11-18-aula-gamificada-revisao-interface.md` foram corrigidos:

1. **Gabarito de ordenação preservado ao editar (`FormularioQuestao.jsx`):** `inicializarEstado` agora ordena `itens` seguindo `questaoInicial.respostaCorreta` via `ordenarItensPeloGabarito`, preservando IDs, texto e metadados de cada item ao abrir e salvar sem alteração.
2. **Idempotência real em repetições (`constantes.js`, `BancoQuestoes.jsx`, `GeradorIAQuestoes.jsx`, `PrepararSala.jsx`, `useSalaGamificada.js`, `JogoMemoria.jsx`):** criado `resolverRequestIdOperacao`, vinculando o `requestId` à assinatura do payload pendente. Reenvios após falha transitória com payload idêntico reutilizam o mesmo `requestId`; editar o payload gera novo `requestId`; sucesso limpa a operação pendente. Em `GeradorIAQuestoes`, editar um rascunho **após** salvamento confirmado agora envia `expectedRevision` da revisão salva e um novo `requestId` (em vez de reutilizar a criação original), sem rechamar `/gerar`.
3. **Respondentes separados de presença (`constantes.js`, `SalaDocenteView.jsx`):** `normalizarEstadoSala` nunca mais mapeia `participantes` inteiros como `respondentes`. Apenas participantes com evidência explícita do servidor (`bruto.respondentes`, `respondeu: true`, `rodadaRespondida === rodada`, `progresso.respondeu`, `progresso.completo` ou `progresso.paresEncontrados > 0`) entram em `respondentes`; `presentes` (`entrouEmMs != null`) fica separado. Em `SalaDocenteView`, quando há votos em `distribuicao` mas o servidor ainda não expõe lista nominal de respondentes da rodada, a tela informa o total de respostas recebidas separadamente da lista de presentes.
4. **Isolamento imediato por conta/UID e contexto (`HubDocente.jsx`, `useSalaGamificada.js`, `SalaDocenteView.jsx`, `AcessoAlunoView.jsx`, `GeradorIAQuestoes.jsx`):** `HubDocente` isola toda a árvore autenticada em `HubDocenteAutenticado` com `key={uid}`, ocultando/desmontando imediatamente catálogo, aba ativa, editor aberto e rascunhos da conta anterior na troca de UID, além de abortar pedidos antigos e conferir `catalogo.donoUid === uid`. `useSalaGamificada` isola estado por `${papel}:${codigo}:${contextoUid}` e descarta respostas/comandos tardios após troca de sala/conta ou unmount.
5. **Equipes com roster do servidor, preservação de turma e mínimo de 2 equipes (`PrepararSala.jsx`):** consome `turma.alunos[].id` (`participanteId` estável calculado pelo servidor), preserva turma de cada estudante deduplicando apenas por `${turma.id}::${participanteId}` (mantendo distintos homônimos ou mesmo `alunoId` local em turmas diferentes), poda participantes quando uma turma é desmarcada e impede envio com menos de 2 equipes (`Cadastre pelo menos duas equipes para este modo.`).
6. **Memória com faces autorizadas pelo servidor (`constantes.js`, `useSalaGamificada.js`, `JogoMemoria.jsx`):** suporta `rodada.questao.cartas` como lista de IDs opacos, buscando faces exclusivamente em `rodada.faces`, `eu.recibo.facesVisiveis` e `eu.recibo.facesEncontradas` (suportando texto e imagem com `alt`). Cartas ocultas nunca recebem texto/imagem. Ao virar nova carta, a reconstrução a partir dos IDs base + `cartasVisiveis`/`cartasEncontradas` do recibo mais recente fecha pares errados imediatamente sem preservar flags antigas.
7. **IDs opacos em pares manuais (`FormularioQuestao.jsx`, `constantes.js`):** substituído o padrão previsível `esq_N_par-X` / `dir_N_par-X` por `gerarIdOpacoCarta()` com IDs independentes para esquerda e direita, preservando o mapeamento correto em `respostaCorreta`.
8. **Proteção de contexto em geração e extração assíncronas (`GeradorIAQuestoes.jsx`):** campos do formulário ficam desabilitados durante extração ou geração, com controle de versão monotônica, `AbortController` no unmount/nova chamada e revalidação de `uid` antes de aplicar resultados. Selecionar novo arquivo limpa imediatamente `textoMaterial` e `textoConfirmado`, impedindo que falha no novo anexo reaproveite o texto do arquivo anterior.

---

## 3. Contratos adicionais coordenados com o servidor (DeepSeek)

- **Roster de turmas no `GET /catalogo`:** já alinhado ao formato entregue pelo DeepSeek (`turmas[].alunos: [{ id: <participanteId SHA-256>, alunoId, nome }]`). A interface envia `alunos[].id` em `equipes[].participanteIds` e exibe `(turmaNome)` quando múltiplas turmas estão selecionadas.
- **Memória (`rodada.questao.cartas` + `rodada.faces` + `eu.recibo`):** já alinhado ao formato entregue pelo DeepSeek (`cartas` apenas com IDs; `faces`, `cartasVisiveis`, `cartasEncontradas`, `facesVisiveis`, `facesEncontradas`).
- **Pendência residual no servidor para lista nominal de respondentes (docente):** o servidor atualmente projeta `participantes` com `entrouEmMs` e `progresso` (Memória), além de `distribuicao` (Quiz/Equipes), mas ainda não expõe `respondeu: true` / `rodadaRespondida` por participante em Quiz/Associação/Ordenação/Equipes nem lista pública `respondentes` (sem alternativa). A interface já aceita ambos os formatos (`participantes[].respondeu`, `participantes[].rodadaRespondida`, `participantes[].progresso.respondeu` ou `estado.respondentes`) e, na ausência desses campos, exibe apenas o total anônimo e o roster de presentes separadamente.

---

## 4. Validações executadas após as correções

- **Testes automatizados (Vitest):**
  - Comando: `cd frontend && ./node_modules/.bin/vitest run ../tests/unit/components/aula-gamificada/ ../tests/unit/hub_ordem_modulos.test.js ../tests/unit/paleta_arte_em_jogo.test.js ../tests/unit/aula_gamificada_*.test.js ../tests/integration/aula_gamificada_*.test.js ../tests/contract/aula_gamificada_*.test.js`
  - Resultado: **21/21 arquivos aprovados, 123/123 testes GREEN** (33 testes da interface incluindo as 4 regressões de `RevisaoIndependenteInterface.test.jsx` e os 6 novos testes de `CorrecoesRevisaoInterface.test.jsx`, 64 testes do servidor do DeepSeek, 1 teste de `hub_ordem_modulos.test.js` e 25 testes de `paleta_arte_em_jogo.test.js`).
- **ESLint:** 0 erros e 0 avisos nos arquivos de `src/app/aula-gamificada`, `src/app/aluno/aula-gamificada`, `src/components/aula-gamificada`, `src/config/modules.js`, `src/components/Dashboard.js` e `src/app/aluno/notas/page.js`.
- **Build (`next build`):** compilação e geração das 42 rotas aprovadas sem erros.

---

## 5. Evidências visuais (fixture sintético)

As 17 capturas desktop e celular em `docs/evidencias/2026-11-18-aula-gamificada/` permanecem claramente identificadas como **capturas de fixture sintético** (sem comprovar integração autenticada com Firestore/Firebase real, etapa reservada à revisão integrada do ChatGPT).
