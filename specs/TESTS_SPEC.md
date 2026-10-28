# 🧪 Especificação de Testes (TESTS_SPEC) — SimuladoApp.Edu

Mapeamento formal dos testes obrigatórios por regra de negócio.

---

## 1. Testes Unitários (`tests/unit/`)

### Módulo: Diário & Cálculos (`tests/unit/calculos.test.js`)
- [x] **UT-01 (RN-01):** Validar cálculo de média com pesos padrão (Simulado 5.0 + Atividades 5.0).
- [x] **UT-02 (RN-01):** Validar cálculo de média com pesos customizados (Simulado 3.0 + Atividades 7.0).
- [x] **UT-03 (RN-02):** Validar arredondamento exato com 2 casas decimais (`round2(6.6666)` $\rightarrow$ `6.67`).
- [x] **UT-04 (RN-03):** Validar categorização de status (`good`, `warn`, `bad`) conforme limites configurados.
- [x] **UT-05 (RN-04):** Validar detecção de extrapolação de soma máxima de atividades.

### Módulo: Redação ENEM (`tests/unit/enem_score.test.js`)
- [x] **UT-06 (RN-05):** Validar que toda pontuação de competência é múltiplo de 40 no intervalo [0, 200].
- [x] **UT-07 (RN-05):** Validar cálculo de nota total como somatório estrito de C1..C5 (0 a 1000).

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
- [x] **UT-43 (RN-39):** Validar `montarUrlPollinationsFlux`: monta a URL `gen.pollinations.ai/image` com `model=flux`, dimensões e a chave codificada quando `apiKey` é informada; retorna `null` quando a chave está ausente ou só contém espaços (sinalizando ao chamador o uso do endpoint legado).

### Módulo: Integração Meu Horário ↔ Calendário (`tests/unit/grade_calendario_sync.test.js`)
- [x] **UT-25 (RN-51):** Validar conversão pura da grade `schedule` (`${dayId}_${slotId}`) para slots semanais do Calendário Pedagógico, ignorando intervalos (`isBreak: true`).
- [x] **Evolução RN-51:** Carregar horários reais por turma; distinguir nomes semelhantes (ex.: 10/101); seleção manual para nomes diferentes; manter múltiplos blocos no mesmo dia e ignorar intervalos; não importar dados demonstrativos como cadastro real.
- [x] **Evolução RN-51 — integração/interface:** Exibir prévia antes de aplicar; preservar aulas realizadas e conteúdos; detectar conflitos; repetir importação sem duplicar; tratar ausência de grade e erro de leitura sem alterar o calendário.

### Módulo: Evolução Longitudinal de Redação ENEM (`tests/unit/redacao_evolucao.test.js`)
- [x] **UT-26 (RN-52):** Validar cálculo de médias por competência (C1..C5), identificação da competência alvo (menor pontuação média) e detecção de tendência longitudinal.

### Módulo: Leitor Imersivo Acessível TTS (`tests/unit/leitor_imersivo_tts.test.js`)
- [x] **UT-27 (RN-53):** Validar higienização fonética de texto (remoção de markdown, HTML e caracteres especiais) e validação de taxa de fala entre 0.75 e 1.25.

### Módulo: Frequência Escolar & Infrequência LDB (`tests/unit/frequencia_escolar.test.js`)
- [x] **UT-28 (RN-54):** Validar cálculo percentual de frequência, classificação legal de risco conforme Art. 24 da LDB (`regular`, `alerta`, `critico`) e marcação em lote.

### Módulo: Telemetria Local de IA & BYOK (`tests/unit/telemetria_ia.test.js`)
- [x] **UT-29 (RN-55):** Validar registro incremental de chamadas de IA e estimativa acumulada de tokens por provedor e módulo em localStorage.

### Módulo: Consolidação de Frequência Escolar (`tests/unit/frequencia_escolar.test.js`)
- [x] **UT-30 (RN-56):** Validar consolidação do histórico diário de chamadas por aluno, contagem de faltas e classificação jurídica de risco LDB.

### Módulo: Ficha Individual do Aluno 360º (`tests/unit/ficha_aluno_360.test.js`)
- [x] **UT-31 (RN-57):** Validar consolidação holística do aluno 360º unindo desempenho acadêmico bimestral, apuração de frequência LDB Art. 24, perfil DUA/necessidades e diagnóstico de redação ENEM.

### Módulo: Diário de Bordo & Ocorrências Pedagógicas (`tests/unit/ocorrencias_pedagogicas.test.js`)
- [x] **UT-32 (RN-58):** Validar criação, validação de tipos, sanitização de datas, filtragem multifatorial e remoção imutável de ocorrências pedagógicas.

### Módulo: Publicação de Atividades Adaptadas Online (`tests/unit/publicador_atividade_adaptada.test.js`)
- [x] **UT-33 (RN-59):** Validar conversão canônica de atividade adaptada DUA para atividade online com anonimização de gabarito, isolamento por aluno e filtragem de visibilidade no Portal do Aluno.

### Módulo: Integração Atividades da Turma, Filtro de Necessidades e Sigilo LGPD (`tests/unit/atividades_turma_sigilo.test.js`)
- [x] **UT-34 (RN-60):** Validar extração formatada de texto de atividades da turma (título, instruções, questões objetivas e discursivas) para injeção no gerador adaptado DUA.
- [x] **UT-35 (RN-61):** Validar filtragem de alunos com necessidades/CID no Diário com alternância por toggle e destaque de badges.
- [x] **UT-36 (RN-62):** Validar sigilo de dados sensíveis na consolidação 360º (ocultação de CID no relatório familiar vs exibição no dossiê técnico do conselho de classe).





---

## 2. Testes de Integração (`tests/integration/`)
- [x] **Extração visual compartilhada (RN-40):** PDF digital sem IA; PDF misto preserva ordem e usa visão apenas nas páginas necessárias; limite de páginas antes da visão; chave ausente, imagem ilegível, erro do provedor e tamanho excessivo; importação de nomes recebe texto real; Gemini usa prompt de documento sem alterar prompt de redação e rejeita transcrição truncada. Uploads dos dois geradores preenchem texto revisável. Portal usa as cores bimestrais e distingue nota ausente/null de zero.
- [x] **Cores bimestrais (RN-18):** Validar limites 0, 4,99, 5, 7,99, 8 e 10, aprovação configurável e ausência de nota; conferir renderização dos quatro bimestres do Mapa Anual com vermelho, azul e verde, sem alterar critérios anuais.
- [x] **IT-15 (RN-27, RN-44):** Correção de atividades via gateway real com HTTP externo simulado: Gemini/modelo BYOK, JSON explícito, modelo efetivo no resultado, fallback com texto/imagens preservados, descarte de `thought`, repetição única em truncamento e erro claro sem resposta final. Testes em `correcao_atividades_gemini.test.js`.
- [x] **IT-01 (RN-40):** Testar extração de texto de arquivos DOCX, PDF e TXT e endpoint de upload.
- [x] **IT-02:** Testar serialização e deserialização do backup em JSON das turmas.
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
- [x] **IT-14 (RN-39):** Testar `POST /api/adaptacoes/imagem-fallback`: (a) com `POLLINATIONS_API_KEY` no ambiente chama `gen.pollinations.ai/image` com `model=flux` e devolve `imagemUrl` como data URL base64 a partir do binário; (b) sem chave do servidor usa o endpoint legado `image.pollinations.ai` e devolve a URL validada; (c) falha total de ambos os serviços responde `502` com mensagem de erro; (d) `prompt` ausente/vazio responde `400`.



---

## 3. Testes de Contrato / API (`tests/contract/`)
- [x] **CT-01 (RN-06 & RN-27):** Validar payload de chamada para o modelo `sabiazinho-4` na Maritaca AI via contrato HTTP estrito.

---

## 4. Testes End-to-End (`tests/e2e/`)
- [x] **E2E-01:** Validar carregamento da rota `/meuhorario` (com redirect a partir de `/horario`), renderização da grade, modal de edição e seletor de idioma pt-BR / es-Latam.

### Importação de Simulado (RN-63)
- [x] Upload visível: botão abre seletor de arquivos; nomes selecionados aparecem; leitura exige seleção e bloqueia nova seleção durante a extração.
- [x] Domínio: correspondência exata normalizada; homônimos/desconhecidos; duplicatas entre arquivos; zero/vírgula; valores ausentes/inválidos/fora da escala; não sobrescrever notas existentes; atualização imutável somente no campo/bimestre/turma; revalidação contra estado atualizado.
- [x] Integração: PDF/imagem usa extrator compartilhado e headers BYOK; prompt seleciona simulado e bimestre; JSON estrito, múltiplos arquivos, chave ausente, resposta vazia e erros.
- [x] Interface: prévia antes de aplicar, revisão dos registros, bloqueio de pendências e confirmação apenas das linhas válidas sem sobrescrever notas.

### Sincronização Isolada de Atividades (RN-64)
- [x] Domínio: atividade compartilhada em duas turmas; alunos com IDs iguais entre turmas; turma/bimestre/atividade/aluno filtrados; revisada zero; somente corrigidas; bimestre divergente e aluno inexistente; preservação imutável de notas fora do escopo; modo global.
- [x] Persistência: escopo validado antes de consultar; transação revalida documento atual e grava somente quando existem notas aplicáveis; nenhuma gravação na coleção legada users.
- [x] Interface/hooks: filtros de turma e bimestre (string/número), chamadas restritas, modo global explícito, painel e correção em lote somente com entregas do recorte; correção individual não sincroniza outras atividades.

### Correção Manual e Devolutivas (RN-65)
- [x] Domínio: nota zero/vírgula, campos ausentes/inválidos/fora da escala, feedback obrigatório, soma das questões, auditoria e substituição de correção anterior.
- [x] Hook/UI: duas ações explícitas; manual salva nota/feedback sem IA; escopo preservado; editor mantém dados em erro; manual zero não sofre penalização; aluno lê feedback geral/objetivo/discursivo.
- [x] Relatórios: histórico exclui outro aluno/turma/professor; boletim e Ficha 360º recebem devolutivas gerais e por questão; PDF pagina feedback longo sem truncar texto nem sobrepor rodapé.

### Calendário seguro e organização (RN-66 / RN-51)
- [x] Domínio: vários horários/dia, duração por capacidade, concluídos sem repetição, parciais preservadas, pendências, múltiplos feriados, reabertura, progresso por conteúdo e prévia de grade sem perda de vínculos.
- [x] Persistência: turma/ano e legado compatível; gravação atômica/revalidação concorrente; falha sem sucesso; preservação de histórico e outras turmas/anos.
- [x] Interface: áreas, filtros, lista móvel, pesquisa/estados, edição de vinculados, prévia e erro mantêm contexto; justificativa, restante, reposição e intervalo de recesso.
- [x] Horários: origem real, correspondência exata/manual, múltiplos blocos/dia, intervalos ignorados, prévia e atualização sem duplicação.
- [x] Importação/PDF: arquivos e texto, revisão antes de salvar, mesclar/substituir, erros; exportação sem truncar conteúdo e com paginação.

### Aprovação semestral e anual (RN-67)
- [x] Limites 24,99/25 e 49,99/50; semestres independentes; ausência versus zero; etapas incompletas; pesos e recuperação preservados.
- [x] Mapa e Portal distinguem semestre aprovado e ano em andamento; déficit do primeiro semestre identificado corretamente.
- [x] Boletim, Ficha 360º e exportação usam as mesmas situações, sem recuperação anual prematura; PDFs legíveis.
- [x] Publicação envia recuperação individual, preserva zero e exclui dados dos outros alunos; Portal aplica a recuperação publicada. Suíte final: 543 testes em 92 arquivos; build e lint dos arquivos alterados aprovados.

### Evolução segura do Diário (RN-68)
- [x] Migração preserva critérios; escala zero/negativa, não finitos, pesos/limites inválidos e nota parcial/fora de faixa são recusados; cálculo finito e cores/legendas consistentes; teclado e colagem com prévia.
- [x] Carregamento sem limpeza destrutiva; revisões concorrentes, fila/repetição, conta distinta, lista vazia, saída, pendência local, falha sem sucesso e operações com confirmação real de persistência.
- [x] Frequência inicial/existente conserva quantidade e alunos; revisão, calendário/horário, feriado e exceção, falha com rascunho; ocorrências e linha do tempo respeitam privacidade; PDFs paginados.
- [x] Backup profundo/legado/versão/duplicação/notas/configuração, mesclar/substituir, cópia anterior e persistência aguardada antes de sucesso.
- [x] Publicação por bimestre preserva demais períodos, exige prévia, conta aptos/pendentes, mantém resumo e repete somente falhas; conferência e visão geral indicam alcance correto.
- [x] Ano/arquivo/cópia de alunos não misturam notas; histórico/desfazer preserva alterações posteriores e registra autoria; filtros e ações textuais navegáveis.

Validação RN-68: **646 testes / 117 arquivos aprovados**, build de produção aprovado e lint dos arquivos alterados sem erros (dois avisos preexistentes de imagens). Testes anteriores preservados.


### Gerador seguro (RN-69)
- Acesso: token não emitido, revogado, legado sem sessão, aluno exclusivo e turma divergentes; token aleatório válido; resposta pública sem turma/rubrica/material privado; entrega válida, reenvio concorrente e preservação de correção.
- Editor: gravação pendente/erro, ID estável, prazo local e inválido, gabarito vazio, escala inválida, contexto inicial, geração com escala e extração pendente.
- Correção: imagens base64 encaminhadas; similaridade sem gravação de penalidade; troca de atividade sem dados antigos; erro visível; página com sincronização/publicação explícitas e autoria manual.
- Ciclo: criação com falha/retomada, reconciliação de acessos, edição estrutural bloqueada com entregas, arquivamento preserva registros, persistência compartilhada com Diário e callbacks aguardados.
- Suíte anterior integral preservada; executar todos os testes, build e lint antes da conclusão.


Validação RN-69 (24/10/2026): **690 testes / 131 arquivos aprovados** na suíte completa, mais **5 testes reais no emulador Firestore** (`tests/regression/atividades_firestore_emulador.mjs`). Build aprovado; lint sem erros e com dois avisos preexistentes de imagens. Red/green de acesso entre professores documentado em `docs/analises/evidencias-atividades/`. Testes anteriores preservados.


### RN-70 — Conflito falso após publicação
- Comparar mapas aninhados com chaves em ordens distintas; não equiparar notas diferentes, zero/null/ausente nem arrays reordenados.
- Simular ordenação dos campos no retorno do Firestore: salvar nota e depois registrar publicação sem conflito.
- Cache pendente equivalente à nuvem não entra em conflito por ordem de campos; conflito antigo equivalente pode repetir salvamento.
- Revisão/conteúdo/existência/origem diferentes continuam bloqueando gravação e preservando rascunho/nuvem.
- Aviso de sessão anterior ignora somente diferença de ordem; diferença real continua visível.

Validação RN-70: **704/704 testes em 134 arquivos**, build aprovado, lint dos arquivos alterados sem erros ou avisos. Comparação e recuperação testadas com dados sintéticos; nenhum registro de produção alterado.


### RN-71 — Cabeçalho compacto
- Preservar quatro faixas e contagens de uma turma sintética com 35 alunos; títulos e ações continuam acessíveis.
- Navegação e importação funcionam depois da reorganização; não testar nomes de classes CSS como contrato.
- Conferir layout renderizado no desktop e celular: altura reduzida no desktop, rótulos sem quebra interna, ausência de sobreposição/rolagem horizontal.

## RN-72 — Imagens adaptadas v2

- Domínio: dados exatos e limites; invalidação de aprovação por mudança; versão e imagem ausente; distribuição; soma exata e dicas preservadas.
- API v2: edição recebe pixels originais; Google BYOK e timeout; imagem inválida/pequena rejeitada; verificação não aprova; nenhuma troca de provedor em erro. Legado continua compatível.
- UI: imagem gerada/regerada chega ao salvamento; original/resultado/histórico; aprovação e alteração; estado por questão; erro/cancelamento/lote; impressão com recurso carregado e plano/figura coerentes.
- Persistência: upload autenticado/isolado, referência estável, erro preserva rascunho; bancos/provas mantêm metadados visuais. Extratores de PDF/listas/notas permanecem compatíveis.

- Acrescentadas regressões de UID/documento/clonagem, edições concorrentes e reordenação, assinatura semântica após Firestore, restauração do plano SVG e troca de referência. A primeira suíte completa desta implementação passou com 752 testes/150 arquivos; repetir após revisão final e registrar resultado no plano.

- Verificação final de entrega: **753 testes em 151 arquivos**, build de produção aprovado após cache limpo, lint zero erros (três avisos de img), prévia sintética em computador/celular aprovada. Bucket/regras, geração com chave real e impressão física continuam pendentes de homologação externa.

## RN-73 — regressões de Redação
- Negar redação alheia mesmo do mesmo professor; vínculo removido, rascunho e arquivado negados; permitir legítima e legado identificado, projection explícita.
- Validar notas completas/parciais/anulação, ausência vs zero, total inconsistente, imagem na API, PDF misto.
- Abertura não grava turmas nem migra/apaga histórico; duas redações sobrevivem; arquivamento preserva vínculos; filtros/contagens iguais.
- Revisão manual sem IA, rascunho por conta, reenvio somente salvamento após erro, revisão/publicação explícita, versões, evolução e PDF coerentes.

## RN-74 — Meu Horário sem Gerador Mágico
- Tela não apresenta botão/modal de geração; cadastro manual abre normalmente. Preservar controles de importação/configuração, rota, idiomas, persistência e integração existentes.

## RN-75 — Portal do Aluno: estados, nota ausente e devolutiva
- [x] **UT-44 (RN-75):** `interpretarDataEntrega` aceita Timestamp, `{seconds}`, `{_seconds}`, número e ISO; descarta data ausente/inválida e não devolve a data atual.
- [x] **UT-45 (RN-75):** `ConfirmacaoView` exibe a data serializada da entrega e, sem data válida, declara indisponibilidade em vez de “enviada agora”.
- [x] **UT-46 (RN-75):** `FeedbackView` apresenta resposta marcada e “Correta/Incorreta” para `objetiva` e `multipla_escolha`, incluindo grafias alternativas, sem alterar o caso discursivo.
- [x] **UT-47 (RN-75):** `BimestreCard` mostra `0,00` apenas para zero lançado; critério ausente aparece como traço com “Ainda não publicado”, preservando total, cores e fórmula.
- [x] **UT-48 (RN-75):** `GET /api/aluno/boletim` sinaliza `falhas` por seção (`notas`, `atividades`, `entregas`, `tokens`) e mantém as demais seções e o HTTP 200.
- [x] **UT-49 (RN-75):** A instrução de acesso usa primeiro nome + DDMM e trata o segundo nome como exceção de colisão.

Validação RN-75 (27/10/2026): **828 testes em 174 arquivos** aprovados — 806 preexistentes preservados e 22 novos. Build de produção aprovado (exit 0); lint dos arquivos alterados sem novos problemas (1 erro preexistente em `frontend/src/app/aluno/page.js:24`, confirmado no HEAD). Nenhum teste ou evidência histórica foi alterado.

## RN-76 — Meu Horário Escolar: conta isolada e estado de salvamento
- [x] **UT-50 (RN-76):** Conta B, sem documento na nuvem, não recebe a grade da conta A; a chave base não contém aulas de conta autenticada.
- [x] **UT-51 (RN-76):** `salvarGrade` informa `estado` `nuvem`, `local`, `pendente` e `falha` conforme nuvem/local; falha local e de nuvem não viram sucesso.
- [x] **UT-52 (RN-76):** `carregarGrade` informa origem `nuvem`, `local` e `padrao`; conta nova sem documento começa vazia, sem grade de demonstração.
- [x] **UT-53 (RN-76):** Rascunho legado é detectado, não aplicado automaticamente e só migra com confirmação explícita; descartar impede nova oferta.
- [x] **UT-54 (RN-76):** `mapearEstadoSync` traduz persistência em estado de tela e o cabeçalho exibe o rótulo correspondente.
- [x] **UT-55 (RN-76):** Ao trocar de conta, a grade anterior não permanece editável durante o carregamento.

Validação RN-76 (27/10/2026): **851 testes em 177 arquivos** aprovados — 828 preexistentes preservados e 23 novos. Build de produção exit 0; lint dos arquivos alterados sem problemas. Nenhum teste ou evidência histórica foi alterado; a chave base deixou de conter aulas de conta autenticada.

## RN-77 — Correção de atividades: orçamento de payload com imagem
- [x] **UT-56 (RN-77):** `validarPayloadIA` aceita requisição com imagem de ~300 KB e recusa total acima de 4 MB, imagem acima de 1,6 MB, mais de 4 imagens e texto acima de 60.000 caracteres, nomeando o campo e o valor.
- [x] **UT-57 (RN-77):** `selecionarImagensCorrecao` mantém imagem que já cabe, reduz a excedente usando o redutor injetado e omite a que não cabe nem reduzida, respeitando o orçamento e o máximo de 4 imagens.
- [x] **UT-58 (RN-77):** `truncarResposta` corta em 20.000 caracteres com marcação, sinaliza `respostaTruncada` e não altera texto curto.
- [x] **UT-59 (RN-77):** `corrigirAtividade` conclui correção com imagem realista (~300 KB de base64), preserva a leitura da imagem e agrega `avisos` quando alguma imagem é omitida.
- [x] **UT-60 (RN-77):** `POST /api/maritaca` aceita imagem de ~300 KB (HTTP 200) e recusa imagem de 8 MB com HTTP 400 nomeando imagem e limite, sem chamar o provedor.

Validação RN-77 (27/10/2026): **866 testes em 178 arquivos** aprovados — 851 preexistentes preservados e 15 novos. Build de produção exit 0; lint dos arquivos alterados sem problemas. Nenhum teste ou evidência histórica foi alterado. O teto único de 50 KB foi substituído por orçamento por campo (4 MB total, 1,6 MB por imagem, 4 imagens, 60.000 caracteres de texto), com redução da cópia enviada, degradação declarada sem imagem e truncamento explícito de resposta longa.

## RN-78 — Alerta de similaridade acionável
- [x] **UT-61 (RN-78):** normalização ignora acento/pontuação e shingles de 3 palavras detectam resposta copiada; o mesmo vocabulário em ordem diferente e respostas diferentes com vocabulário comum não formam grupo.
- [x] **UT-62 (RN-78):** `detectarRespostasSimilares` devolve grupos com alunos, trechos e similaridade de cada par, mantém `clusters`/`penalizados` compatíveis e não altera nem grava nota.
- [x] **UT-63 (RN-78):** o alerta usa plural correto, abre o painel com nomes, percentuais e trechos, e o botão de revisão abre a entrega do aluno sem alterar nota.

Validação RN-78 (27/10/2026): **875 testes em 180 arquivos** aprovados — 866 preexistentes preservados e 9 novos. Build de produção exit 0; lint dos arquivos alterados sem problemas. Nenhum teste ou evidência histórica foi alterado. A comparação passou de Jaccard de palavras únicas para shingles de 3 palavras normalizadas, o alerta abriu painel com nomes/trechos/pares e as contagens passaram a respeitar plural.

## RN-79 / RN-80 — Regressões adicionais
- Analytics: mínimos 7/5, limites 5/8, zero/ausência/parcial, taxa de atenção reconciliada, pesos por matrícula, escalas heterogêneas, semestre incompleto/25 e ano/50/recuperação; dataset e PDF iguais, mais de 12 alertas e nomes longos.
- Leitor: cache de outra conta ignorado, nuvem vazia, erro com cache próprio, resposta atrasada após troca e retry; acesso negado sem consulta.
- UI: filtros ano/arquivo/turma, seleção removida, radar sem avaliados, busca/paginação e navegação contextual, prévia/PDF.
- Horário: conclusão tardia de A não permite gravar A em B; retry usa contexto atual; pendência sobrevive recarga; legado preservado com nuvem vazia; somenteReal ignora rascunho.
- Portal: após resposta parcial, conservar nota/entrega/token anteriores; vazio confirmado limpa só seção bem-sucedida; falhas.tokens visível; avisos de correção legada preservados.

Validação RN-79/RN-80 (27/10/2026): **902 testes em 198 arquivos** aprovados (875 preservados e 27 novos); lint dos arquivos alterados sem erros/avisos; build de produção aprovado com certificados do sistema (`NODE_USE_SYSTEM_CA=1`). Rodada simultânea anterior foi interrompida após timeouts; os dois casos passaram isoladamente e as suítes completas posteriores passaram sem alterar testes/limites. Prévia sintética 1440/390 px, foco/Escape e relatório PDF de 42 matrículas/3 páginas conferidos. Nenhum dado real foi escrito.

## RN-81 — Recuperação semestral (cobertura parcial; revisão independente pendente)
Criar arquivos novos; não editar nem remover testes preexistentes. Os itens abaixo são requisitos de testes, não evidência de aprovação.

- [x] **R81-01 — Pontos:** uma atividade de 10; duas de 4+6 com notas 3+5 resultam em 8; três parcelas; zero corrigido; centésimos sem erro de ponto flutuante. Rejeitar NaN/infinito/negativo, nota acima da parcela, máximo nulo/zero e orçamento acima de 10. Total máximo abaixo de 10 impede finalizar, sem reescalonar.
- [x] **R81-02 — Completude:** ausência, entrega não corrigida, erro ou nota vazia deixam aluno pendente. Revisada válida prevalece sobre final; revisão inválida bloqueia, sem retornar silenciosamente à nota antiga. Recorte de alunos e adaptações individuais não mistura conjuntos nem conta duas entregas da mesma atividade.
- [x] **R81-03 — Escopo:** mesmo nome em turmas/contas distintas, IDs de aluno distintos, semestre oposto, ano diferente e legado explícito. Servidor deriva contexto autorizado, recusa adulteração de semestre/destinatário e mantém gabarito/rubrica privados. Destinatário não selecionado não acessa por URL/token nem recebe atividade na listagem.
- [x] **R81-04 — Preservação:** simular lançamento em rec1/rec2; alterar somente campo alvo, sem mutar entrada. Preservar bimestres, critérios, recuperações manuais, outros alunos/semestres/turmas. Ação regular global e por bimestre ignora recuperação. Repetição não duplica nota/histórico; substituição diferente exige decisão explícita.
- [ ] **R81-05 — Persistência (parcial):** teste de integração de versão concorrente, prévia desatualizada, falha/retry, troca de conta/contexto e recarga após sucesso. Conferência perdida não escreve. Documento canônico usa revisão válida e não sobrescreve alteração concorrente. Composição/escala/destinatários com entrega ficam protegidos também no caminho de gravação, não apenas na tela.
- [ ] **R81-06 — Resultados (parcial):** fórmula existente preservada; recuperação inferior não piora resultado; semestre incompleto permanece em andamento; limites 25/50, zero e ausência distintos. Mapa, Portal, Analytics, Ficha/PDF usam os mesmos resultados publicados e não acrescentam recuperação diretamente ao total.
- [ ] **R81-07 — Interface (parcial):** criar conjunto com 10 ou 4+6, impedir excedente e finalização incompleta, corrigir IA/manual, prévia, confirmar apenas turma/semestre atual, mostrar erro e repetir. Conferir 390/1440 px, teclado, foco e rótulos; não confundir com sincronização regular.
- [ ] **R81-08 — Histórico/feedback (parcial):** Portal e relatório individual apresentam atividade, semestre, parcelas e devolutiva autorizados, inclusive histórico arquivado conforme contrato existente. Correção não publica boletim automaticamente; publicação parcial preserva outro semestre e dados dos colegas. Backups antigos continuam válidos e novos metadados sobrevivem ao exportar/restaurar.

Evidência de 27/10/2026 (não substitui revisão independente):

- R81-01/02/04: `tests/unit/recuperacao_semestral.test.js` e `tests/unit/sincronizacao_regular_exclui_recuperacao.test.js` (25 testes) — centésimos, 4+6=8, zero válido, pendências, exclusão da sincronização global e recortada.
- R81-03/07 (acesso): `tests/integration/recuperacao_semestral_acesso.test.js` (6) — destinatário, colega bloqueado, token revogado, adulteração de bimestre/finalidade/conjunto/semestre, projeção sem rubrica/gabarito/colegas.
- R81-04/05 (lançamento): `tests/integration/recuperacao_semestral_lancamento.test.js` (9) — prévia sem gravar, rec1/rec2, conflito de Diário, entrega alterada, repetição idempotente, seleção vazia explícita, substituição manual confirmada e preservação de bimestres.
- R81-06/08 (Portal/relatório): `tests/integration/recuperacao_semestral_portal_relatorio.test.js` (6) — filtro por destinatário, fórmula 25/50 e ficha individual.
- R81-08 (backup): `tests/integration/recuperacao_semestral_backup.test.js` (6) — proveniência preservada, backup antigo sem histórico, mesclagem/substituição.
- R81-07 (UI): `tests/unit/components/atividades/AtividadeFormRecuperacao.test.jsx` (3) — sem bimestre falso, limite de pontos e payload por destinatário; `tests/unit/components/atividades/RecuperacaoSemestral.test.jsx` (3) — criação do conjunto, bloqueio até fechar 10 pontos e conferência que não grava antes do lançamento.

Total da RN-81: **58 testes novos**; suíte completa de 27/10/2026: **960 testes em 206 arquivos** aprovados; lint do escopo sem erros (2 avisos preexistentes de `<img>` em `AtividadeForm.jsx`); build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`.

Pendências reais: troca de conta/contexto durante promessa e recarga após sucesso (R81-05); Analytics e exportação PDF (R81-06); homologação visual 390/1440 px, teclado, foco e leitor de tela (R81-07); publicação no Portal e devolutiva em relatório exportado (R81-08). Nenhuma pendência acima foi marcada como aprovada.

### Revisão independente de `7e7b3d0` — 27/10/2026

A execução repetiu os **960 testes/206 arquivos aprovados**, porém os sete testes novos `REV-R81-01..07` reproduziram falhas de ano, snapshot de parcelas, idempotência após edição manual, validação de semestre/destinatários, abertura de correção e estado local ao trocar conta. Os aceites R81-03/04 não estão integralmente atendidos apesar das marcações da entrega inicial. Detalhes e limites da reprodução: `docs/analises/2026-10-27-revisao-recuperacao-semestral.md`.

Novos arquivos: `tests/integration/recuperacao_semestral_revisao.test.js` (5 falhas) e `tests/unit/components/atividades/RecuperacaoSemestralRevisao.test.jsx` (2 falhas). Código de produção e testes preexistentes preservados. Lint de produção: 0 erros e 2 avisos. Build da revisão: exit 1 na resolução de fontes Google/Turbopack; causa não atribuída à implementação. Não liberar publicação antes das correções e nova validação.

#### Correções da revisão — 27/10/2026

- Os sete testes da revisão passaram sem alteração: `recuperacao_semestral_revisao.test.js` (5) e `RecuperacaoSemestralRevisao.test.jsx` (2).
- Novos testes: `tests/integration/recuperacao_semestral_correcoes.test.js` (7, REV-R81-08..14) cobrem ano derivado/legado, ano divergente, composição canônica, destinatários, escala, histórico cumulativo e repetição idempotente; `tests/unit/recuperacao_adaptada_periodo.test.js` (5, REV-R81-15/16) cobre recuperação adaptada no Portal e rótulo de período em devolutivas; `tests/integration/recuperacao_conjuntos_seguros.test.js` (5, REV-R81-17..20) cobre criação/edição transacional, locks de unicidade e versão concorrente.
- Evidência final desta rodada: **984 testes em 211 arquivos** aprovados; lint dos arquivos alterados sem erros (2 avisos preexistentes de `<img>` em `AtividadeForm.jsx`); build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`. Nenhuma fonte Google ou configuração de build foi alterada.
- Riscos residuais declarados: a unicidade de conjuntos legados sem lock é conferida antes da transação (a transação garante apenas locks novos); a composição em `firebase-atividades` usa re-leitura de versão + bloqueio após entregas, não `runTransaction`, porque o mock de `atividades_ciclo_seguro.test.js` não suporta a assinatura; entregas antigas sem `turmaId`/contexto são tratadas como legado.
- Continua pendente e não aprovado: R81-05 (homologação de concorrência real e recarga em sessão autenticada), R81-06 (Analytics e PDF real), R81-07 (390/1440 px, teclado, foco e leitor de tela) e R81-08 (publicação funcional no Portal). Nova revisão independente é necessária antes de liberar.

### Segunda revisão independente — 28/10/2026

Commit `51abb4f`: **984 testes/211 arquivos aprovados**, build de produção exit 0 e lint do escopo sem erros (2 avisos de imagem). Os sete testes da primeira revisão passaram. Porém, o arquivo novo `tests/integration/recuperacao_concorrencia_revisao.test.js` reproduziu **4 falhas** (`REV2-R81-01..04`): orçamento consumido concorrentemente, parcela nova após entrega, destinatários editados após entrega e cancelamento antigo removendo reserva de conjunto novo. Esses aceites de R81-05 continuam reprovados. Relatório/prompt: `docs/analises/2026-10-28-segunda-revisao-recuperacao-semestral.md`. Nenhum teste anterior ou código de produção foi alterado nesta revisão; não publicar antes de corrigir e validar novamente.

#### Correções da segunda revisão — 28/10/2026

- Os quatro testes de reprodução `REV2-R81-01..04` passaram **sem edição**: orçamento concorrente, parcela após entrega, destinatários após entrega e cancelamento que preserva a reserva do conjunto novo.
- Novos testes, sem alterar os anteriores:
  - `tests/integration/recuperacao_congelamento_ordem.test.js` (4): entrega antes da edição, edição antes da entrega, entrega injetada entre leitura e commit (retry otimista) e edição concorrente da mesma escala recusada por `RECUPERACAO_CONJUNTO_OBSOLETO`.
  - `tests/integration/recuperacao_locks_contexto.test.js` (6): remoção de destinatário sem apagar lock alheio, mudança de contexto movendo reservas, contexto após entrega recusado, contexto com atividades recusado, lock alheio na chave antiga preservado e cancelamento após migração.
  - `tests/integration/recuperacao_congelamento_entrega.test.js` (4): entrega marca `congelado` no conjunto na mesma transação, entrega regular não toca no conjunto, conjunto cancelado recusa entrega e aluno removido do conjunto não entrega.
- A rota de entrega grava o marcador; a criação/edição transacional lê o mesmo documento. A consulta de entregas legadas fora da transação cobre apenas dados anteriores ao marcador; não é usada como única barreira.
- Evidência final desta rodada: **1002 testes em 215 arquivos** aprovados (`cd frontend && npm test`); lint dos arquivos alterados com exit 0; build de produção exit 0 com `NODE_USE_SYSTEM_CA=1`. Nenhuma fonte Google, configuração de build, cobrança ou dado real foi alterado.
- Riscos residuais: entregas gravadas por versões anteriores durante a janela de implantação dependem da consulta legada; concorrência em Firestore real, homologação visual 390/1440 px, teclado/foco/leitor de tela, PDF real e publicação funcional no Portal continuam pendentes. A publicação permanece retida até nova revisão independente.
