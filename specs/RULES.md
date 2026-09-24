# ⚖️ Regras Invariantes de Negócio (RULES) — Gestão Docente

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
   - Quando o usuário estiver autenticado no sistema Gestão Docente, a grade horária é sincronizada na coleção Firestore `horario_escolar`, com id de documento indexado pelo `userId`.
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
   - O professor pode selecionar 1 ou múltiplas categorias de necessidades (ex: `tea`, `di`, `tdah`, `baixa_visao`, `cegueira`, `surdez`, `motora`, `dislexia`, `discalculia`, `ah_sd`).
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

