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



