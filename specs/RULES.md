# ⚖️ Regras Invariantes de Negócio (RULES) — Rotina Docente

Este documento define as regras de negócio inegociáveis do sistema. Qualquer código que viole estas regras será rejeitado pela suíte de testes.

---

## 1. Regras do Diário Pedagógico (Gestão de Notas)
1. **RN-01 (Cálculo da Média Bimestral):**
   - A média final de um aluno no bimestre é a soma ponderada de:
      - **Nota do Simulado Convertida** (conforme peso de lançamento vs. peso final configurado).
      - **Nota das Atividades Convertida** (soma das atividades proporcional ao peso de atividades configurado).
2. **RN-02 (Arredondamento Padrão):**
   - Todas as notas finais devem ser arredondadas com 2 casas decimais (`round2`).
3. **RN-03 (Status de Aprovação):**
   - Média $\ge$ `mediaAprovacao` (padrão 5.0) $\rightarrow$ **Aprovado** (`good`).
   - `mediaRecuperacao` $\le$ Média $<$ `mediaAprovacao` $\rightarrow$ **Em Recuperação** (`warn`).
   - Média $<$ `mediaRecuperacao` $\rightarrow$ **Risco de Reprovação** (`bad`).
4. **RN-04 (Blindagem de Sobrecarga de Atividades):**
   - Se a soma dos valores máximos das atividades exceder o peso total configurado para atividades, o sistema deve emitir um alerta visual de extrapolação.

---

## 2. Regras da Correção de Redação ENEM
1. **RN-05 (Grade Oficial ENEM):**
   - A pontuação total varia de 0 a 1000 pontos, dividida estritamente em 5 competências (C1, C2, C3, C4, C5).
   - Cada competência admite pontuações em múltiplos de 40 pontos: `0, 40, 80, 120, 160, 200`.
2. **RN-06 (Modelo de IA Exclusivo):**
   - O endpoint de IA deve obrigatoriamente acionar o modelo `sabiazinho-4`. É terminantemente proibido utilizar aliases como `Sabia-4`.
3. **RN-07 (Devolutiva Pedagógica):**
   - Toda correção deve conter justificativa textual por competência e sugestões práticas de reescrita/melhoria.
4. **RN-47 (Transcrição de Redação Manuscrita via Visão de IA):**
   - A extração de texto de **fotografia/imagem de redação manuscrita** é feita exclusivamente por modelo de visão (rota `POST /api/extrair` → `extractTextOnly`), com a chave BYOK do professor enviada nos headers `x-user-ai-*`.
   - O OCR local (Tesseract.js) fica reservado a **texto impresso/digital** (imagens de texto mecânico e PDFs escaneados de material impresso); é proibido usá-lo como extrator primário de manuscrito, pois não reconhece caligrafia e produz texto ilegível.
   - **PDF escaneado sem camada de texto** enviado na tela de redação segue o mesmo caminho da visão de IA: cada página é renderizada e transcrita individualmente (limite de 10 páginas por arquivo, com erro claro acima disso); PDF com camada de texto digital continua sendo lido localmente, sem exigir chave de IA.
   - A transcrição é de **fidelidade total**: não corrige ortografia, gramática ou pontuação do aluno, ignora a numeração de linhas da margem e retorna apenas o texto transcrito.
   - Sem chave de IA configurada a extração é recusada com erro `AI_KEY_REQUIRED` (orientando a conectar a chave); o texto extraído sempre passa pela etapa **"Revisar Texto Extraído"** para revisão/edição do professor antes da correção.
   - A transcrição usa o **modelo configurado pelo professor** (ou o default do provedor) — nunca um modelo fixo hardcoded. No Gemini, falha de modelo (404 modelo aposentado, 503, 429) aciona a **cascata nativa de fallback** até um modelo disponível da chave, preservando a imagem no payload. Com chave presente, o **erro real do provedor** é propagado à interface; a mensagem `AI_KEY_REQUIRED` nunca pode ser usada como fallback genérico de erro de chamada.
5. **RN-49 (Feedback de Correção Completo — tokens, notas e renderização):**
   - O limite de geração (`maxTokens`) é definido pela profundidade: **basic = 3000**, **analyzed = 6000**, **deep = 9000** — nunca um valor fixo de 4000, que cortava a análise profunda (mín. 1200 palavras).
   - O bloco JSON de notas é o **primeiro bloco da resposta** da IA (o prompt instrui "INICIE a sua resposta EXATAMENTE com este bloco JSON"), garantindo que os cards de nota sobrevivam mesmo em resposta longa.
   - O `callAI` detecta truncamento por token (`finish_reason: "length"` OpenAI-compat, `stop_reason: "max_tokens"` Anthropic, `finishReason: "MAX_TOKENS"` Gemini nativo) e **repete uma única vez com o dobro dos tokens** (máx. 16000), sem repetir em resposta completa.
   - A extração de notas vive em `lib/redacao/scores.js` (`extractScore`), lendo o JSON no início ou no fim da resposta mesmo com fence não fechado (regex por campo).
   - O feedback é renderizado com **markdown estruturado** (headings, listas, tabelas, negrito) por `renderFeedbackText` de `lib/redacao/renderFeedback.jsx`, compartilhado entre a tela do professor e a do aluno; `cleanFeedbackText` remove o JSON (fence no início/fim ou JSON solto com c1–c5) preservando o markdown. Exibir markdown bruto na tela é proibido.
6. **RN-50 (Padrão Visual do Módulo de Redação):**
   - Todo componente do módulo de redação (fluxo de correção, tela de resultado, visão do aluno, desempenho, critérios e listas) deve usar os tokens oficiais de marca: acento primário **pink `#f60c49`** (`--pink`, `--pink-dark`, `--pink-light`, `--pink-soft`) e superfícies/textos **navy `#101942`** (`--navy`), com as classes utilitárias `btn-brand-primary`, `btn-brand-navy` e `btn-brand-ghost` nos botões.
   - É **proibido** o uso da paleta violeta/índigo (`violet-*`, `indigo-*`) como cor de acento no módulo — é uma paleta desconexa do design do projeto. Neutros slate, cores semânticas de status (verde/vermelho/âmbar) e as cores de dados das 5 competências (C1–C5) são permitidas.
   - Títulos usam a fonte de títulos (Manrope via seletores `h1–h4`/`.font-head`) e o corpo a fonte de texto (Inter); `font-mono` é permitido apenas para códigos, logins e números tabulares. Proibido sobrescrever `font-family` de outra forma (ex.: `font-serif` em campos de texto).

---

## 3. Regras do Calendário Pedagógico
1. **RN-08 (Alocação Temporal):**
   - Nenhuma aula pode ser agendada fora dos horários configurados na Grade Semanal da turma.
2. **RN-09 (Remanejamento e Associação):**
   - Ao desassociar ou remover um tópico de uma aula, o tópico deve retornar imediatamente à lista de tópicos disponíveis para reagendamento.
3. **RN-10 (Transição de Status da Aula):**
   - Uma aula agendada pode transitar entre os status: `AGENDADA`, `CONCLUIDA`, `PARCIAL` e `NAO_REALIZADA`.
4. **RN-11 (Remanejamento Automático em Cascata - Smart Shift):**
   - Se uma aula que possui tópicos associados for cancelada (`NAO_REALIZADA`), seus tópicos devem ser transferidos para a próxima aula ativa disponível no cronograma (`AGENDADA`), e os tópicos das aulas subsequentes devem ser deslocados em cascata (+1 slot) sem sobrescrita destrutiva.
5. **RN-12 (Bloqueio de Dias Não Letivos & Feriados):**
   - Dias registrados como Feriado ou Recesso Escolar não comportam aulas ativas. Ao registrar um feriado em data que possua aulas com tópicos, o sistema deve acionar automaticamente o Smart Shift para transferir o conteúdo para o próximo dia letivo subsequente.
6. **RN-19 (Auto-Agendamento com Ponto de Partida Flexível):**
   - O auto-agendamento de planejamento permite selecionar uma `dataInicio` (ex: hoje, início do bimestre ou data personalizada).
   - Apenas slots $\ge \text{dataInicio}$ com status `AGENDADA` e sem bloqueio de feriado/recesso são preenchidos sequencialmente com os tópicos não concluídos. Aulas anteriores a `dataInicio` ou marcadas como `CONCLUIDA` são estritamente preservadas.
7. **RN-20 (Decisão Pedagógica de Remanejamento vs Pulo de Conteúdo):**
   - Ao alterar o status de uma aula com tópico para `PARCIAL` ou `NAO_REALIZADA`, o sistema deve solicitar a decisão do professor:
      - **Smart Shift:** Desloca o tópico da aula em cascata para a próxima aula letiva disponível.
      - **Pular Conteúdo:** Mantém o cronograma das aulas subsequentes inalterado; o tópico não lecionado retorna ao banco de pendentes.

---

## 4. Regras dos Agentes Pedagógicos

1. **RN-13 (Modelo Exclusivo de IA):**
   - Agentes pedagógicos devem utilizar exclusivamente o modelo `sabiazinho-4` via Maritalk API. É terminantemente proibido usar qualquer outro modelo ou alias.
2. **RN-14 (Identidade Pedagógica Imutável):**
   - Cada agente possui um `systemPrompt` pedagógico fixo com nome, segmento escolar e metodologia. Os prompts residem **apenas no servidor** (rota API) e nunca são expostos ao cliente.
3. **RN-15 (Histórico de Sessão por Agente):**
   - O histórico de mensagens é armazenado em `localStorage` com a chave `agente_history_{agentId}` e só é apagado sob demanda explícita do usuário (ação "Limpar histórico").
4. **RN-16 (Segmentos Suportados no MVP):**
   - O MVP suporta exatamente dois segmentos de agente: `ensino-medio` (Ensino Médio — 1º ao 3º EM) e `fundamental-2` (Ensino Fundamental II — 6º ao 9º ano).

---

## 5. Regras do Dashboard Analytics Pedagógico

1. **RN-17 (Agregação de Métricas Analíticas):**
   - A média da turma em um bimestre é calculada como a soma das médias finais dos alunos válidos dividida pelo total de alunos com nota lançada no período.
   - Um aluno é considerado "avaliado" se possuir nota de simulado ou em pelo menos uma atividade no bimestre correspondente (`temNota`).
   - Se a turma ou bimestre não possuir notas lançadas, a média analítica deve retornar `null` (ou `0` com indicador visual de dados pendentes), sem gerar erros de divisão por zero (`NaN`).

2. **RN-18 (Faixas de Desempenho e Alertas Pedagógicos):**
   - A categorização das notas dos alunos nas métricas e distribuições analíticas segue estritamente:
      - **Excelente:** Média $\ge 8.0$ (`excelente`)
      - **Adequado / Aprovado:** $5.0 \le \text{Média} < 8.0$ (ou conforme `mediaAprovacao` configurada) (`aprovado`)
      - **Em Recuperação / Atenção:** $4.0 \le \text{Média} < 5.0$ (ou conforme `mediaRecuperacao`) (`recuperacao`)
      - **Crítico / Risco Alto:** Média $< 4.0$ (`critico`)
   - O radar de alunos em risco lista prioritariamente estudantes classificados como `critico` e `recuperacao`, ordenados crescentemente pela média para intervenção imediata do professor.

---

## 6. Regras de Planos e Entitlements de Módulos

1. **RN-21 (Acesso Gratuito Universal ao Diário):**
   - O módulo **Diário Pedagógico** (`diario-planejamento`) e a visualização de notas no **Portal do Aluno** são 100% gratuitos e irrestritos para todos os usuários cadastrados.

2. **RN-22 (Matriz de Entitlements de Assinaturas):**
   - **Plano Professor Geral:** Acesso a `diario-planejamento`, `calendario-pedagogico`, `gerador-atividades`, `agente-linguagens` e `analytics-pedagogico`. Módulo `redacao-corretor` é bloqueado com cadeado.
   - **Plano Especialista Redação:** Acesso a `diario-planejamento` e `redacao-corretor`. Demais módulos de IA/calendário permanecem bloqueados.
   - **Plano Hub Completo Pro:** Acesso irrestrito a todos os 6 módulos do Hub.
   - **Plano Combo Total:** Acesso a todos os módulos do Hub + chave de integração com a plataforma básica do SimuladoApp (Django).

---

## 7. Regras do Horário Escolar

1. **RN-23 (Slots de Horários e Impedimento de Intervalo):**
   - A grade suporta os turnos pré-configurados: `manha`, `tarde`, `noite` e `integral`.
   - Nenhum conteúdo de aula pode ser atribuído a slots classificados como intervalo/recreio (`isBreak: true`).
   - A chave canônica de cada slot é composta por `${dayId}_${slotId}` (ex: `seg_m1`).

2. **RN-24 (Persistência Híbrida Firestore com Fallback LocalStorage):**
   - Quando o usuário estiver autenticado no sistema Rotina Docente, a grade horária é sincronizada na coleção Firestore `horario_escolar`, com id de documento indexado pelo `userId`.
   - Caso o usuário não esteja autenticado ou a conexão com o Firestore falhe, a aplicação deve persistir no `localStorage` com a chave canônica `meu_horario_escolar_data_v1`.

3. **RN-25 (Validação Estrutural de Backup e Restore JSON):**
   - A exportação em JSON gera um payload completo com metadata, turno, configurações e o mapa de aulas.
   - O processo de restauração (importação) deve obrigatoriamente validar a integridade do JSON, rejeitando payloads corrompidos e sanitizando chaves de horários inexistentes no turno configurado.

4. **RN-26 (Internacionalização Nativa pt-BR / es-Latam):**
   - Todos os textos, nomes de turnos, dias da semana, botões e mensagens do módulo devem utilizar chaves de tradução.
   - O sistema deve suportar alternância dinâmica entre Português (`pt-BR`) e Espanhol América Latina (`es-Latam`), com `pt-BR` como idioma padrão.

---

## 8. Regras de Inteligência Artificial & BYOK (Bring Your Own Key)

1. **RN-27 (BYOK Estrito e Obrigatório):**
   - Todos os módulos e recursos que consomem inteligência artificial (correção de redação, agentes pedagógicos, gerador de atividades, importação inteligente) operam estritamente sob o modelo BYOK (*Bring Your Own Key*).
   - O professor deve conectar sua própria chave de API dos provedores suportados: `gemini` (Google Gemini), `openai` (OpenAI), `anthropic` (Anthropic), `maritaca` (Maritaca AI) ou `openrouter` (OpenRouter).

2. **RN-28 (Persistência Híbrida de Credenciais de IA):**
   - A configuração de IA do professor é persistida no perfil do usuário no Firestore (`professores/{userId}.ai_config`) e armazenada em cache no `localStorage` com a chave canônica `rotina_docente_user_ai_config`.
   - Se o Firestore estiver indisponível ou em sessões locais, o `localStorage` atua como fonte síncrona.

3. **RN-29 (Bloqueio sem Fallback Central):**
   - É expressamente vedado o uso de chaves centrais ou compartilhadas da plataforma para subsidiar chamadas de professores.
   - Qualquer requisição a endpoints de IA desprovida de chave válida do professor deve ser rejeitada com código HTTP 400 e payload `{ error: 'AI_KEY_REQUIRED', message: 'Você precisa conectar sua chave de IA para utilizar este recurso.' }`.
   - A interface do usuário deve bloquear o acionamento e direcionar o professor imediatamente ao modal de conexão de IA.

4. **RN-30 (Segurança, Isolamento e Mascaramento de Chaves):**
   - As chaves de API nunca devem ser exibidas em texto plano na interface após salvas; o sistema deve apresentar uma versão mascarada (ex: `AQ...` para chaves Gemini recentes, `sk-...` para OpenAI/Anthropic/OpenRouter, ou `AIza...` para chaves Google legadas, seguido dos últimos 4 caracteres).
   - As novas chaves emitidas pelo Google AI Studio para a API do Gemini utilizam o prefixo `AQ` (com suporte retroativo a `AIzaSy`).
   - O professor pode testar a validade da chave em tempo real através do endpoint `POST /api/ai/test` e pode remover/desconectar sua chave a qualquer momento.
   - Para chaves gratuitas do Google AI Studio, o modelo ativo recomendado é `gemini-3.6-flash` (substituindo `gemini-1.5-flash` e `gemini-2.5-flash` descontinuados para novas contas). O sistema implementa autocura e descoberta dinâmica (`ModelService.ListModels` e extração de recomendação) para mitigar erros 404 de modelos obsoletos.

---

## 9. Regras de Atividades Adaptadas & Educação Inclusiva (DUA/PEI)

1. **RN-31 (Não-Empobrecimento Curricular e Preservação da BNCC):**
   - A adaptação de uma atividade jamais deve significar exclusão do conteúdo curricular ou rebaixamento do objetivo pedagógico.
   - A atividade adaptada deve preservar a mesma competência ou habilidade da BNCC da atividade regular, alterando as formas de representação, linguagem, mediação e expressão para superar as barreiras de acesso.

2. **RN-32 (Harmonização Sinérgica em Múltipla Deficiência):**
   - O professor pode selecionar 1 ou múltiplas categorias de necessidades (ex: `tea`, `di`, `tdah`, `baixa_visao`, `cegueira`, `surdez`, `motora`, `dislexia`, `discalculia`, `ah_sd`, `epilepsia`, `ansiedade`, `toc`, `conduta`, `outras_condicoes`).
   - O catálogo oficial é composto por 15 categorias DUA. As 5 categorias ampliadas (`epilepsia`, `ansiedade`, `toc`, `conduta`, `outras_condicoes`) foram incorporadas para cobrir integralmente a lista de estudantes PCD das redes públicas (CIDs G40, F40/F41/6B04, F42, F91 e condições de saúde como hidrocefalia e síndromes genéticas), mantendo a mesma estrutura de `diretrizesDUA` das categorias base.
   - Quando duas ou mais categorias forem selecionadas simultaneamente, o motor de adaptação deve harmonizar as diretrizes sem contradição:
     - *Exemplo (TEA + DI):* Linguagem literal e previsibilidade (TEA) somada à Leitura Fácil e ancoragem concreta (DI).
     - *Exemplo (Baixa Visão + Motora):* Fonte ampliada e alto contraste (Baixa Visão) combinada com respostas que dispensam escrita cursiva fina (Motora).
     - *Exemplo (Cegueira + Apoio Visual):* Todo suporte visual deve vir obrigatoriamente acompanhado de audiodescrição semântica estruturada para leitor de tela ou conversão tátil.

3. **RN-33 (Perfis de Alunos e PEI Rápido com Privacidade):**
   - Os perfis de estudantes inclusivos são armazenados no Firestore (`professores/{userId}/alunos_adaptados/{alunoId}`) com fallback em `localStorage`.
   - Cada perfil armazena: `nome`, `turma`, `necessidades` (array de IDs), `nivelSuporte` (1 a 3), `hiperfoco` (opcional), `observacoes`.
   - Em conformidade com a LGPD e a LBI, os dados de necessidades são tratados como sensíveis, restritos ao professor autenticado e nunca utilizados para alimentar modelos públicos de IA.

4. **RN-34 (Bimodalidade Operacional):**
   - O sistema deve suportar dois canais complementares de entrega:
     - **Canal Físico/AEE (Módulo Independente):** Geração de folha de atividade com diagramação acessível, opções de tipografia ampliada (14pt, 18pt, 24pt), contraste e espaçamento para impressão limpa.
     - **Canal Digital (Módulo Atividades):** Vínculo da versão adaptada à atividade digital já criada, permitindo que alunos com deficiência recebam a versão adaptada no portal online.

5. **RN-35 (Obrigatoriedade do Guia de Mediação Pedagógica):**
   - Toda atividade adaptada gerada deve ser acompanhada obrigatoriamente do **Guia de Mediação para o Professor/AEE**, contendo:
     - Objetivo pedagógico da adaptação.
     - Materiais concretos ou complementares sugeridos.
     - Tempo estimado e sugestão de pausas.
     - Roteiro de intervenção diante de frustração ou bloqueio do estudante.

6. **RN-36 (Acessibilidade Gráfica e Tipográfica):**
   - Textos adaptados para estudantes com dislexia e baixa visão devem utilizar alinhamento à esquerda (não justificado), entrelinhas de no mínimo 1.5 e fontes sem serifa de alta legibilidade.

7. **RN-37 (Composição de Atividades e Provas Completas com Múltiplas Questões):**
   - O professor pode configurar a quantidade exata de questões da atividade/prova adaptada (ex: 1 a 10 questões, ou todas as questões da prova original colada).
   - O gerador DUA deve estruturar cada questão com numeração sequencial, enunciado direto sem ambiguidade, apoio visual/audiodescrição descrita, alternativas com distratores calibrados e scaffolding (dica de apoio).

8. **RN-38 (Banco de Atividades Adaptadas e Reaproveitamento por Perfil DUA):**
   - Toda atividade gerada pode ser salva no repositório persistente do professor (`professores/{userId}/atividades_adaptadas`).
   - As atividades são indexadas pelas categorias de deficiência (`necessidades`), disciplina e ano escolar.
   - O professor pode reaproveitar uma atividade completa para outro estudante com as mesmas necessidades pedagógicas (associando o novo nome do estudante) ou selecionar questões específicas para compor uma nova prova adaptada.

9. **RN-39 (Geração de Apoio Visual e Imagens Pedagógicas Acessíveis via BYOK):**
   - O professor pode solicitar a geração da imagem/ilustração pedagógica de uma questão adaptada individualmente ou em lote para toda a atividade.
   - O gerador de imagens utiliza a chave do próprio professor (BYOK), suportando a cota gratuita do Google AI Studio (`gemini-3.1-flash-image`, `gemini-2.5-flash-image`, `imagen-3.0-generate-002`) e OpenAI (`dall-e-3`).
   - O prompt da imagem é estruturado com foco na acessibilidade cognitiva DUA: traços limpos, estilo didático/esquemático, cores harmoniosas ou alto contraste, evitando ruídos visuais decorativos que possam gerar sobrecarga sensorial em estudantes neurodivergentes.
   - O prompt refinado incorpora a **disciplina** e as **necessidades do estudante**: diretrizes visuais específicas por categoria (ex.: `baixa_visao`/`cegueira` → alto contraste extremo e contornos espessos; `tea` → fundo organizado sem estampas ambíguas; `tdah` → um único objeto central em destaque e distratores eliminados; `di` → cena concreta do cotidiano com poucos elementos), além do contexto disciplinar.
   - A geração via BYOK recebe a **audiodescrição em PT-BR** (`apoioVisualDescricao`) e, quando existente, o **prompt detalhado em inglês** (`apoioVisualPromptIngles`), combinados como texto base para maior fidelidade do resultado ao texto da questão.
   - O fallback gratuito (Pollinations) monta o prompt e a URL por funções de domínio (`montarPromptFallback`/`montarUrlPollinations`) e **só publica a URL após validar o carregamento** da imagem; falha de carregamento (erro ou timeout) interrompe a publicação e sinaliza erro ao professor.
   - Toda imagem renderizada possui tratamento `onError`: em falha de carregamento (inclusive URL persistida em atividade salva), a imagem é substituída por um card de erro com a audiodescrição e ação de **Tentar novamente** — nunca um ícone de imagem quebrada.
   - Quando o professor **não possui chave BYOK**, a geração gratuita usa o **proxy do servidor** (`POST /api/adaptacoes/imagem-fallback`) com a chave própria do projeto (`POLLINATIONS_API_KEY`), selecionando o modelo **Flux** do Pollinations — nunca os modelos degradados atribuídos a requisições anônimas (`sana`/`zimage`). Sem chave do servidor, a rota cai para o endpoint legado do Pollinations, mantendo a validação de carregamento no cliente.
   - A rota de fallback não exige chave do professor, valida `prompt` obrigatório e com tamanho máximo razoável, propaga falha total dos serviços como `502` e usa `maxDuration` compatível com o tempo de geração das imagens.
   - Enquanto as ilustrações forem geradas **sem chave BYOK**, exibe-se um aviso na barra do gerador convidando o professor a **conectar a chave gratuita do Google AI Studio (Gemini)** — com ação direta que abre o modal de conexão — pois o modelo de imagem do Gemini (cota gratuita) entrega qualidade superior ao serviço padrão.
   - As imagens geradas são codificadas em base64 e associadas ao campo `imagemUrl` da questão, sendo salvas com a atividade e impressas no Caderno do Estudante e no PDF.

10. **RN-40 (Ingestão de Conteúdo Original via Documentos PDF e Word DOCX/DOC):**
    - O elaborador de atividades adaptadas permite a entrada do conteúdo a ser adaptado tanto por digitação/colagem de texto livre quanto por upload de arquivos `.pdf`, `.docx`, `.doc` ou `.txt`.
    - O extrator de documentos processa o arquivo, extrai a estrutura textual completa (títulos, enunciados, textos de apoio e questões) e popula o campo de conteúdo da atividade (`conteudoBase`).
    - O sistema valida formatos suportados (`.pdf`, `.docx`, `.doc`, `.txt`) e limites razoáveis de tamanho (até 15MB).
    - O professor pode revisar, editar ou complementar o texto extraído no editor antes de acionar a IA DUA para a geração das questões adaptadas.
    - O componente visual fornece feedback em tempo real com indicador de progresso na extração, card com metadados do documento anexado (nome, tamanho e formato) e botão para remoção/substituição do arquivo.

11. **RN-41 (Importação em Lote de Estudantes PEI via Planilha Excel, CSV ou Lista):**
    - O sistema permite o cadastro em massa de estudantes inclusivos através do envio de arquivos nos formatos Excel (`.xlsx`, `.xls`), valores separados por vírgula (`.csv`) ou listas tabulares/texto (`.txt`).
    - O motor de ingestão mapeia de forma inteligente e tolerante as colunas de Nome, Turma/Ano Escolar e Deficiências/Necessidades, além de campos opcionais como Nível de Suporte (1 a 3), Hiperfoco e Observações pedagógicas.
    - Reconhecimento automático e normalização de termos comuns da comunidade escolar para as categorias oficiais DUA (ex: "Autismo/Asperger" -> `tea`, "Deficiência Intelectual" -> `di`, "Hiperatividade" -> `tdah`, "Baixa Visão" -> `baixa_visao`, "Surdo" -> `surdez`, etc.), com suporte nativo a múltiplas necessidades concomitantes por estudante.
    - O professor tem acesso a uma pré-visualização interativa com a contagem de estudantes identificados e badges das necessidades antes de confirmar a persistência no Banco PEI (`professores/{userId}/alunos_adaptados`).
    - O sistema oferece download de modelo de planilha de exemplo para facilitar o preenchimento sem erros.

12. **RN-42 (Banco de Questões Adaptadas Individuais e Montador de Provas Ajustáveis):**
    - O módulo de adaptações possui banco atômico de questões individuais (`QuestaoAdaptada`), permitindo cadastro manual e salvamento (individual ou em lote) das questões geradas pela IA.
    - Cada questão armazena: enunciado, tipo de questão, alternativas (se aplicável), gabarito, apoio visual/audiodescrição, scaffolding/dicas, disciplina, ano escolar, habilidade BNCC e necessidades DUA atendidas.
    - O Montador de Provas permite selecionar questões do banco, reordenar a sequência livremente, personalizar enunciados, definir instruções e vincular a prova a um estudante PEI específico para impressão acessível e geração de guia de mediação.

13. **RN-43 (Configuração de Necessidades Específicas no Diário Pedagógico):**
    - O aluno cadastrado no Diário Pedagógico pode armazenar o campo opcional `necessidades` (array de IDs do catálogo oficial DUA), gravado junto do próprio aluno dentro da turma (`professores/{userId}/turmas/data`), de forma independente do Banco PEI.
    - O professor pode definir as necessidades no cadastro manual do aluno e editá-las a qualquer momento pela tabela de notas da turma; as categorias devem ser exibidas como badges de identificação rápida ao lado do nome do aluno.
    - Todo valor gravado deve ser sanitizado contra o catálogo oficial (`CATEGORIAS_MAP`): IDs desconhecidos são descartados, duplicatas removidas e arrays vazios não são persistidos (compatibilidade com dados legados).
    - As importações em lote preservam as necessidades quando presentes nos registros de origem.
    - Os dados de necessidades são tratados como sensíveis (LGPD/LBI): restritos ao professor autenticado, exibidos apenas nas telas do Diário e nunca enviados a modelos públicos de IA nem ao Portal do Aluno.

14. **RN-44 (Extração Robusta de JSON nas Respostas de IA):**
    - Todo consumo de resposta textual de modelos de IA (geração e correção de questões, correção de redação, importação inteligente de alunos e geração de atividades adaptadas) deve passar por um extrator único (`extrairJsonIA`) que, em cascata: remove blocos markdown (```` ```json ````), extrai o objeto JSON de texto acompanhado de prosa, decodifica strings JSON aninhadas (double-stringified) e repara aspas escapadas (`\"`) remanescentes.
    - A ordem das tentativas deve preservar o parse direto em primeiro lugar, para que `\"` legítimos dentro de valores de um JSON válido não sejam corrompidos.
    - O extrator nunca deve propagar um erro cru de `JSON.parse` (ex.: `Unexpected token '\'`) ao usuário; ao falhar todas as tentativas, lança erro claro no padrão `IA não retornou JSON válido`.

---

## 10. Regras do Portal do Aluno (Login e Identidade)
15. **RN-45 (Login Canônico do Aluno com Exceção de Homônimos):**
    - O login canônico do aluno é **1º nome real + DDMM** (`gerarLoginAluno`): nome em minúsculas, sem acentos, descartando preposições (`de, da, do, dos, das, e, d`) e anexando os 4 dígitos dia+mês de nascimento (ex: `maria1503`).
    - **Exceção de homônimos:** quando 2 ou mais alunos da **mesma turma** resultariam no mesmo login canônico (mesmo 1º nome + mesmo DDMM — ex: dois Pedros nascidos em 11/11), **todos os membros do grupo** passam a usar **1º + 2º nome + DDMM** (`gerarLoginDoisNomes`, ex: `pedrohenrique1111`). A resolução é determinística e pura (sem I/O), calculada sobre a lista de alunos da turma.
    - **Unicidade global na publicação:** antes de gravar `alunoLogin/{sha256(login)}`, a publicação de notas verifica o documento candidato: inexistente ou com `nome` equivalente ao do aluno $\rightarrow$ grava; existente com `nome` divergente (outro estudante de outra turma/perfil) $\rightarrow$ escala para 2 nomes; se mesmo a chave de 2 nomes colidir com `nome` divergente $\rightarrow$ o aluno é reportado como erro de publicação (colisão irreconcetável) para resolução manual, nunca sobrescrevendo a identidade de outro estudante.
    - **Exibidor canônico:** a tabela do Diário exibe o **login armazenado** no Firestore (busca por `nome`), priorizando o candidato igual ao login canônico e depois o candidato com sufixo numérico; apenas para alunos ainda não publicados exibe o login canônico calculado. O exibidor nunca pode sugerir um formato divergente do que a rota de login aceita.
    - **Chaves alinhadas:** todas as fontes que geram login para o mesmo aluno (publicação de notas, vínculo de redação, sincronização de atividades, re-homologação de correções e exibição) devem produzir o mesmo login canônico resolvido, de modo que `sha256(login)` da sessão do aluno seja a mesma chave de `professores/{uid}/correcoes/{key}` usada pelo boletim.
    - **Rota de login:** `POST /api/aluno/login` aceita o login exato normalizado (minúsculas, sem acentos) com fallback legado em maiúsculas; `404` somente quando nenhum dos candidatos localizar o documento.





---

## 11. Regras do Perfil Inclusivo do Aluno (Diário ↔ Adaptações)
16. **RN-46 (Perfil Inclusivo no Cadastro do Diário e Ponte para Atividades Adaptadas):**
    - O aluno do Diário pode armazenar os campos opcionais `nivelSuporte` (apenas 1, 2 ou 3), `hiperfoco` e `observacoes`, gravados junto do próprio aluno dentro da turma (`professores/{userId}/turmas/data`), com normalização idêntica na criação (`criarAlunoDiario`) e na atualização (`atualizarAlunoDiario`): nível fora de 1–3 ou texto vazio/apenas espaços resulta em **omissão do campo** — dados legados continuam válidos e as leituras usam default nível 1 e textos vazios (nenhuma migração de dados).
    - O professor define os 3 campos no cadastro manual do aluno e pode editá-los a qualquer momento pela tabela de notas, junto ao editor existente de necessidades (mesmo padrão da RN-43).
    - O form de Atividades Adaptadas oferece o botão **"Carregar do Diário"** no card de Perfil Inclusivo: lista as turmas do professor autenticado (mesma fonte do Diário) e, ao selecionar um aluno, preenche identificação, necessidades (sanitizadas), nível de suporte, hiperfoco e observações através da função pura `paraPerfilInclusivo`, exibindo o vínculo ativo ("Diário: {nome}") com a ação Desvincular, que restaura o estado vazio default do form.
    - A ponte é de **leitura única** no momento do carregar: não existe sincronização automática ou bidirecional entre Diário e Banco PEI; alterações posteriores em uma fonte não propagam para a outra.
    - Entradas do doc de turmas sem `nome` válido são ignoradas pelo seletor (nunca propagando erro bruto ao usuário); falha de leitura do Firestore exibe mensagem com "Tentar novamente" sob ação do usuário, sem loop automático.
    - Dados sensíveis (LGPD/LBI): `nivelSuporte`, `hiperfoco` e `observacoes` seguem as mesmas restrições da RN-43 — exibidos apenas nas telas do professor autenticado (Diário e Adaptações), nunca enviados ao Portal do Aluno nem a logs de cliente; encaminhados a modelo de IA somente dentro da geração adaptada iniciada explicitamente pelo professor (chave BYOK dele).
    - **Alunos do Diário no Banco de Alunos cadastrados (lista unificada):** o modal `ModalAlunoPEI` ("banco de alunos cadastrados") exibe a união do Banco PEI com os alunos do Diário via função pura `montarListaBancoAlunos(banco, diario)`: entradas do Diário recebem `origem: 'diario'`, `chave` estável para React key e os campos do perfil inclusivo via `paraPerfilInclusivo`; a deduplicação é por `nome|turma` normalizados (minúsculas/trim) e **o registro do Banco PEI vence** (mantém `id` real para vínculo); entradas sem `nome` válido são descartadas nunca propagando erro.
    - Ao selecionar uma entrada `origem: 'diario'` na lista do banco, o form preenche os mesmos campos do fluxo "Carregar do Diário" e ativa o vínculo "Diário: {nome}" (estado `estudanteDiario`); entradas `origem: 'banco'` mantêm o fluxo `estudantePEI` atual. Os alunos do Diário são carregados pela página (mesma leitura da RN-46) ao abrir o modal do banco; falha de leitura silenciosamente deixa a lista só com o Banco PEI (sem loop automático; retry fica sob "Tentar novamente" do seletor Diário).

---

## 12. Regras de Robustez da Resposta de Geração Adaptada (Tolerância a Tipos Inválidos da IA)
17. **RN-48 (Normalização da Resposta de Geração Adaptada — defesa em profundidade):**
    - A rota `POST /api/adaptacoes/gerar` **nunca** retorna a resposta bruta da IA: tanto o sucesso quanto o fallback de parse passam pela função pura `normalizarRespostaGeracao` (domínio) antes do `NextResponse.json`.
    - `normalizarRespostaGeracao` coerça tipos estruturais sem descartar informações desconhecidas (spread do objeto original preservado):
      - `atividadeAdaptada`, `guiaMediacao` e `aluno`: objeto puro (`null`/array/primitivo → `{}`).
      - `atividadeAdaptada.questoes`: array de objetos (`Array` → filtrada; objeto único/mapeado → `Object.values`; `null`/outro → `[]`); cada questão ganha `alternativas` como array de textos (string única → `[string]`; contéudo não textual → serializado) e campos textuais (`enunciado`, `tipo`, `apoioVisualDescricao`, `apoioVisualPromptIngles`, `dicaScaffolding`) convertidos por `textoSeguro`.
      - `diretrizesHarmonizadas` e `guiaMediacao.passoAPassoProfessor`: arrays (string não vazia → `[string]`; `null` → `[]`); `aluno.necessidades`: array de strings.
      - Campos textuais renderizados pela UI (`titulo`, `disciplina`, `anoEscolar`, `instrucoesAluno`, `objetivoPedagogicoInalterado`, `tempoEstimado`, `antecipacaoComportamental`, `criteriosAvaliacaoFlexibilizada`): apenas primitivos são aceitos como-is; objetos/arrays aninhados são serializados via `textoSeguro` (o React **não** renderiza objetos como filhos e derrubaria a página).
    - O `VisualizadorAtividadeAdaptada` normaliza a resposta **na entrada** (mesma função pura, antes do destructure) para que também dados legados carregados do banco não derrubem a renderização: nenhuma combinação de `null`/tipo errado na resposta pode lançar exceção de cliente (tela preta de erro global do Next).
    - Ausência de campo continua valendo default da UI (`titulo` → "Atividade Adaptada", listas vazias etc.); a normalização nunca propaga erro bruto da IA ao usuário nem altera a forma feliz canônica.
    - Mantém-se o fallback estruturado atual (status 200 com atividade mínima) quando o parse do JSON da IA falha.
    - **Imports e símbolos de render:** todo símbolo usado na renderização (ícones, componentes) deve estar importado no arquivo — um `ReferenceError` de render (caso real: `<BookOpen>` usado no visualizador sem import desde `32fa329`) é da mesma classe de defeito (tela preta global do Next logo após a geração) e é coberto pelo caso feliz da UT-40; a auditoria de símbolos usados × importados em `src/` não pode reintroduzir esse padrão.
