# 🧪 Especificação de Testes (TESTS_SPEC) — SimuladoApp.Edu

Mapeamento formal dos testes obrigatórios por regra de negócio.

---

## 1. Testes Unitários (`tests/unit/`)

### Módulo: Diário & Cálculos (`tests/unit/calculos.test.js`)
- [ ] **UT-01 (RN-01):** Validar cálculo de média com pesos padrão (Simulado 5.0 + Atividades 5.0).
- [ ] **UT-02 (RN-01):** Validar cálculo de média com pesos customizados (Simulado 3.0 + Atividades 7.0).
- [ ] **UT-03 (RN-02):** Validar arredondamento exato com 2 casas decimais (`round2(6.6666)` $\rightarrow$ `6.67`).
- [ ] **UT-04 (RN-03):** Validar categorização de status (`good`, `warn`, `bad`) conforme limites configurados.
- [ ] **UT-05 (RN-04):** Validar detecção de extrapolação de soma máxima de atividades.

### Módulo: Redação ENEM (`tests/unit/redacao_scores.test.js`)
- [ ] **UT-06 (RN-05):** Validar que toda pontuação de competência é múltiplo de 40 no intervalo [0, 200].
- [ ] **UT-07 (RN-05):** Validar cálculo de nota total como somatório estrito de C1..C5 (0 a 1000).

### Módulo: Horário Escolar (`tests/unit/horario_escolar.test.js`)
- [x] **UT-08 (RN-23):** Validar bloqueio de alocação de aula em slot classificado como intervalo (`isBreak: true`).
- [x] **UT-09 (RN-23):** Validar composição e parsing da chave canônica `${dayId}_${slotId}` e integridade dos turnos (`manha`, `tarde`, `noite`, `integral`).
- [x] **UT-10 (RN-24):** Validar persistência híbrida: chave local `meu_horario_escolar_data_v1` e fallback quando Firestore offline/não-autenticado.
- [x] **UT-11 (RN-25):** Validar exportação e importação de JSON com validação de esquema estrutural e sanitização.
- [x] **UT-12 (RN-26):** Validar dicionários i18n (pt-BR e es-Latam) garantindo paridade total de 100% das chaves e fallback para pt-BR.

### Módulo: BYOK & Provedores de IA (`tests/unit/ai_config.test.js`)
- [x] **UT-13 (RN-27):** Validar entidade `AIConfig`, provedores suportados (`gemini`, `openai`, `anthropic`, `maritaca`, `openrouter`) e modelos padrão.
- [x] **UT-14 (RN-28):** Validar persistência híbrida da configuração de IA em `localStorage` e sincronização assíncrona Firestore.
- [x] **UT-15 (RN-29):** Validar bloqueio absoluto de chamadas de IA desprovidas de chave pessoal (rejeição sem fallback da plataforma).
- [x] **UT-16 (RN-30):** Validar mascaramento de chaves na interface (`sk-...ABCD`) e sanitização de payloads.

### Módulo: Atividades Adaptadas & Inclusão (`tests/unit/atividades_adaptadas.test.js`)
- [x] **UT-17 (RN-31 & RN-33):** Validar entidade `AlunoInclusivo` (perfil PEI), obrigatoriedade de ao menos 1 necessidade, validação de níveis de suporte (1..3) e sanitização.
- [x] **UT-18 (RN-32):** Validar motor de harmonização de necessidades múltiplas (detecção de sinergias e regras de não-conflito em comorbidades como TEA + DI, Baixa Visão + Motora, Cegueira + Multimodal).
- [x] **UT-19 (RN-33):** Validar persistência híbrida de alunos PEI (`AlunoAdaptadoRepository`) com fallback local e sincronização segura com Firestore.
- [x] **UT-20 (RN-35 & RN-36):** Validar gerador de prompt especializado DUA, checando a inclusão obrigatória do Guia de Mediação Pedagógica e parâmetros de diagramação acessível.
- [x] **UT-21 (RN-37):** Validar configuração de múltiplas questões no `AdaptacaoPromptBuilder` (montagem de prova/lista completa com 1 a 10 questões, ou todas as questões da prova original).
- [x] **UT-22 (RN-38):** Validar persistência híbrida e filtragem por deficiência no `AtividadeAdaptadaRepository` (salvar, listar por deficiência, reaproveitar e clonar para novo estudante).
- [x] **UT-23 (RN-39):** Validar construtor de prompts de imagens pedagógicas acessíveis e sanitizador de base64.
- [x] **UT-24 (RN-41):** Validar parser e normalizador de planilha em lote de estudantes PEI (Excel, CSV e texto) mapeando nomes, turmas e múltiplas deficiências.
- [x] **UT-25 (RN-42):** Validar entidade `QuestaoAdaptada` (validação de enunciado, tipo suportado, integridade de alternativas e método toJSON).
- [x] **UT-26 (RN-42):** Validar entidade `ProvaAdaptada` (composição, reordenação de questões, vinculação a estudante PEI e validações).
- [x] **UT-27 (RN-42):** Validar `QuestaoAdaptadaRepository` (persistência híbrida Firestore/localStorage, inserção individual e em lote, filtragem por deficiência/disciplina).
- [x] **UT-28 (RN-42):** Validar `ProvaAdaptadaRepository` (persistência híbrida de provas montadas, busca por id, listagem e remoção).

### Módulo: Catálogo Ampliado & Necessidades no Diário (`tests/unit/diario_necessidades.test.js`)
- [x] **UT-29 (RN-32):** Validar o catálogo ampliado com 15 categorias oficiais (10 base + `epilepsia`, `ansiedade`, `toc`, `conduta`, `outras_condicoes`), cada uma com `id`, `nome`, `descricao` e `diretrizesDUA` não vazias, e `CATEGORIAS_MAP` indexando todas.
- [x] **UT-30 (RN-41):** Validar os sinônimos corrigidos do normalizador: `F71 Retardo Moderado` → `di`, `TDH` → `tdah`, `dificuldade com cálculo` → `discalculia`, `Epilepsia/G40/Pré-Epilepsia` → `epilepsia`, `Fobia Social/F41.2/ansiedade` → `ansiedade`, `Obsessivo Compulsivo/F42` → `toc`, `Opositor Desafiador/Hipercinético de conduta/F91` → `conduta`, `Hidrocefalia/Síndromes Edwards e Patau/Q90` → `outras_condicoes`, sem falso-positivo em textos genéricos ("Outra condição não listada" → `[]`).
- [x] **UT-31 (RN-41 & RN-43):** Validar a cobertura integral da Lista de Estudantes PCD 2026 (13 alunos): todo aluno deve mapear ao menos 1 categoria e as condições essenciais (autismo, DI, dislexia, epilepsia, ansiedade, TOC/TOD) devem ser reconhecidas.
- [x] **UT-32 (RN-43):** Validar a entidade `AlunoDiario` do Diário: sanitização de `necessidades` contra `CATEGORIAS_MAP` (descarte de IDs inválidos, remoção de duplicatas, omissão de array vazio), criação de aluno com necessidades e atualização via merge preservando os demais campos.

### Módulo: Extração Robusta de JSON da IA (`tests/unit/extrair_json_ia.test.js`)
- [x] **UT-33 (RN-44):** Validar `extrairJsonIA`: JSON limpo, remoção de fences markdown, prosa antes/depois do JSON, reparo de aspas escapadas nos valores (reprodução do bug `Unexpected token '\'`), JSON totalmente escapado, JSON double-stringified (string contendo JSON), preservação de `\"` legítimo em JSON válido e erro claro `IA não retornou JSON válido` quando não há JSON/resposta vazia; além do fluxo `gerarQuestoesComIA` com fetch mockado retornando JSON escapado e do fluxo `importarViaIA` com resposta escapada.

### Módulo: Login do Portal do Aluno (`tests/unit/login_aluno.test.js`)
- [x] **UT-34 (RN-45):** Validar `gerarLoginAluno` no formato canônico **1º nome + DDMM** (preposições descartadas, acentos removidos, nome único) e `gerarLoginDoisNomes` no formato de exceção **1º + 2º nome + DDMM** (incluindo preposições no meio: `Pedro Vitor Dos Santos Lima` → `pedrovitor1111`), além de `gerarLoginKey` SHA-256 estável.
- [x] **UT-35 (RN-45):** Validar `resolverLoginsAlunos`: turma sem colisão mantém 1º nome; homônimos na mesma turma (mesmo 1º nome + mesmo DDMM) recebem **todos** o formato de 2 nomes; 1º nome igual com DDMM diferente não colide; aluno sem `dataNascimento` recebe `login` vazio; a ordem dos alunos de entrada é preservada na saída.
- [x] **UT-36 (RN-45):** Validar `resolverLoginUnico` (unicidade global com I/O injetado): doc candidato inexistente ou com `nome` equivalente mantém o login; doc existente com `nome` divergente escala de 1 para 2 nomes; colisão também na chave de 2 nomes retorna `conflito` sem login; e `selecionarLoginExibido` priorizando (1) candidato igual ao canônico, (2) candidato com sufixo igual ao DDMM do aluno, (3) candidato com 4 dígitos finais, (4) primeiro candidato.

### Módulo: Perfil Inclusivo no Diário (`tests/unit/aluno_diario_perfil.test.js`)
- [x] **UT-37 (RN-46):** Validar `criarAlunoDiario` com os campos novos: `nivelSuporte` 1/2/3 persistidos; `nivelSuporte` 4, `'abc'` ou `null` omitidos; `hiperfoco`/`observacoes` trimados e omitidos quando vazios ou só espaços; campos legados (`nome`, `dataNascimento`, `necessidades`) inalterados.
- [x] **UT-38 (RN-46):** Validar `atualizarAlunoDiario` no merge: valores válidos persistem; `nivelSuporte` inválido e textos vazios **removem** o campo do aluno; `nome`, `dataNascimento` e `necessidades` são preservados quando não citados no update.
- [x] **UT-39 (RN-46):** Validar a ponte: `paraPerfilInclusivo` (aluno completo → 5 campos; aluno legado sem campos → nível 1 e textos vazios; necessidades inválidas descartadas via `sanitizarNecessidades`) e `listarAlunosParaSeletor` (ignora entradas sem `nome`, preserva turma/aluno válidos).

### Módulo: Lista Unificada Banco PEI + Diário (`tests/unit/lista_banco_diario.test.js`)
- [x] **UT-41 (RN-46):** Validar `montarListaBancoAlunos`: merge preserva a ordem (banco primeiro, depois diário); entrada do Diário ganha `origem: 'diario'`, `chave` estável e perfil via `paraPerfilInclusivo` (necessidades sanitizadas); deduplicação por `nome|turma` normalizados com **Banco PEI vencedor**; homônimos em turmas diferentes permanecem como entradas distintas; entradas sem `nome` (banco ou diário) são descartadas; listas `null`/não-array viram `[]`; `id` real do aluno do Diário é preservado.

### Módulo: Robustez da Resposta de Geração Adaptada (`tests/unit/visualizador_resposta_robusta.test.js`)
- [x] **UT-40 (RN-48):** Validar que o `VisualizadorAtividadeAdaptada` renderiza via `renderToString` **sem lançar exceção** com: (a) `guiaMediacao`, `atividadeAdaptada`, `aluno` e `diretrizesHarmonizadas` todos `null`; (b) `atividadeAdaptada.questoes` como objeto mapeado `{1: {...}}` (não-array); (c) `diretrizesHarmonizadas` como string simples; (d) `enunciado` de questão como objeto aninhado (React não renderiza objetos); além de manter a forma feliz canônica intacta (título e contagem de questões renderizados).

### Módulo: Fidelidade e Robustez das Ilustrações (`tests/unit/imagens_apoio_visual.test.js`)
- [x] **UT-42 (RN-39):** Validar (a) `construirPrompt` incorporando **disciplina** e **necessidades** com diretrizes específicas por categoria (`baixa_visao` → alto contraste extremo/contornos espessos, `tea` → sem estampas ambíguas, `tdah` → objeto central único/distratores eliminados, `di` → cena concreta/poucos elementos) mantendo as diretrizes base DUA; (b) `montarPromptFallback` priorizando `apoioVisualPromptIngles` → `apoioVisualDescricao` → `enunciado` com prefixo educacional em inglês; (c) `montarUrlPollinations` codificando o prompt na URL com dimensões padrão; (d) `carregarImagemComTimeout` resolvendo no load, rejeitando no erro do navegador e rejeitando por timeout com tempo configurável (injetando `criarImagem` para teste determinístico).

---

## 2. Testes de Integração (`tests/integration/`)
- [x] **IT-01 (RN-40):** Testar extração de texto de arquivos DOCX, PDF e TXT e endpoint de upload.
- [ ] **IT-02:** Testar serialização e deserialização do backup em JSON das turmas.
- [x] **IT-03 (RN-24 & RN-25):** Testar sincronização de grade horária e restore via repositório.
- [x] **IT-04 (RN-27 & RN-29):** Testar gateway unificado de IA roteando para Gemini, OpenAI, Anthropic, Maritaca e OpenRouter com headers do usuário e rejeitando ausência de chave.
- [x] **IT-05 (RN-34):** Testar endpoint `POST /api/adaptacoes/gerar` orquestrando conteúdo, perfil multi-select e entrega de atividade adaptada + guia de mediação.
- [x] **IT-06 (RN-37 & RN-38):** Testar endpoint `POST /api/adaptacoes/gerar` aceitando quantidade configurável de questões e suporte a reaproveitamento.
- [x] **IT-07 (RN-39):** Testar endpoint `POST /api/adaptacoes/imagem` gerando imagem via BYOK (Gemini e OpenAI) e tratando erros e ausência de chave.
- [x] **IT-08 (RN-41):** Testar fluxo completo de importação de arquivo de alunos e salvamento em lote no `AlunoAdaptadoRepository`.
- [x] **IT-09 (RN-47):** Testar transcrição de imagem de redação manuscrita via visão de IA (`extractTextFromImageVision` → `POST /api/extrair` com headers BYOK `x-user-ai-*`), recusa sem chave (`AI_KEY_REQUIRED`), texto vazio, propagação de erro da rota e PDF escaneado (páginas renderizadas e transcritas individualmente com limite de 10 páginas) contra PDF com camada de texto digital.
- [x] **IT-10 (RN-47):** Testar que `extractTextOnly` usa o **modelo configurado pelo professor** (Gemini, OpenAI, Anthropic), que modelo Gemini aposentado dispara a **cascata nativa de fallback** até um modelo disponível da chave (com a imagem no payload), que o **erro real do provedor é propagado** (nunca `AI_KEY_REQUIRED` com chave presente) e que provedor sem suporte a visão recebe mensagem clara.
- [x] **IT-11 (RN-48):** Testar que `POST /api/adaptacoes/gerar` **normaliza a resposta bruta da IA** (nulls em `guiaMediacao`/`atividadeAdaptada`/`aluno`/`diretrizesHarmonizadas`, `questoes` como objeto mapeado, `alternativas` como string) retornando status 200 com tipos coerentes (objetos e arrays nos lugares certos), e que a forma feliz canônica passa sem corrupção.
- [x] **IT-12 (RN-49):** Testar que `generateCorrection` pede 3000/6000/9000 tokens para `basic`/`analyzed`/`deep`, que o `MASTER_ENEM_PROMPT` traz o bloco JSON das notas **antes** da ETAPA 1 com instrução de iniciar por ele, que `callAI` repete uma única vez com o dobro de tokens ao detectar truncamento (`finish_reason: "length"`, `stop_reason: "max_tokens"`) sem repetir em resposta completa, que `extractScore` extrai as notas com JSON no início (fence aberto) ou truncado sem fechar o fence, e que `cleanFeedbackText` remove o JSON preservando o markdown (`###`, listas, tabelas `|`, negrito `**`).
- [x] **IT-13 (RN-50):** Testar estaticamente que os arquivos do módulo de redação (`app/redacao/**` + `lib/redacao/renderFeedback.jsx`) não contêm classes `violet-*`/`indigo-*`, que a tela de correção e o renderizador de feedback usam os tokens de marca (`#f60c49`/`btn-brand-*`/`#101942`), mantendo neutros slate e cores semânticas permitidas.



---

## 3. Testes de Contrato / API (`tests/contract/`)
- [ ] **CT-01:** Validar payload de chamada para o modelo `sabiazinho-4`.

---

## 4. Testes End-to-End (`tests/e2e/`)
- [ ] **E2E-01:** Validar carregamento da rota `/meuhorario` (com redirect a partir de `/horario`), renderização da grade, modal de edição e seletor de idioma pt-BR / es-Latam.
