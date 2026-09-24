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

---

## 2. Testes de Integração (`tests/integration/`)
- [x] **IT-01 (RN-40):** Testar extração de texto de arquivos DOCX, PDF e TXT e endpoint de upload.
- [ ] **IT-02:** Testar serialização e deserialização do backup em JSON das turmas.
- [x] **IT-03 (RN-24 & RN-25):** Testar sincronização de grade horária e restore via repositório.
- [x] **IT-04 (RN-27 & RN-29):** Testar gateway unificado de IA roteando para Gemini, OpenAI, Anthropic, Maritaca e OpenRouter com headers do usuário e rejeitando ausência de chave.
- [x] **IT-05 (RN-34):** Testar endpoint `POST /api/adaptacoes/gerar` orquestrando conteúdo, perfil multi-select e entrega de atividade adaptada + guia de mediação.
- [x] **IT-06 (RN-37 & RN-38):** Testar endpoint `POST /api/adaptacoes/gerar` aceitando quantidade configurável de questões e suporte a reaproveitamento.
- [x] **IT-07 (RN-39):** Testar endpoint `POST /api/adaptacoes/imagem` gerando imagem via BYOK (Gemini e OpenAI) e tratando erros e ausência de chave.

---

## 3. Testes de Contrato / API (`tests/contract/`)
- [ ] **CT-01:** Validar payload de chamada para o modelo `sabiazinho-4`.

---

## 4. Testes End-to-End (`tests/e2e/`)
- [ ] **E2E-01:** Validar carregamento da rota `/meuhorario` (com redirect a partir de `/horario`), renderização da grade, modal de edição e seletor de idioma pt-BR / es-Latam.
