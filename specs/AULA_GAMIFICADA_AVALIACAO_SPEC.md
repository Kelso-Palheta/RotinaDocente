# Aula Gamificada — avaliação, histórico e geração por jogo

Proposta de implementação de 18/11/2026, baseada na solicitação do usuário. Executar conforme AGENTS.md, regras de notas e contratos existentes da Aula Gamificada. Leitura inicial obrigatória de `PRD.md`, `RULES.md`, `TESTS_SPEC.md`, `AULA_GAMIFICADA_SPEC.md` e `AULA_GAMIFICADA_HEROIS_TABULEIRO_SPEC.md`.

## Fluxo docente

1. Em Preparar Sala, escolher finalidade `revisao` (padrão compatível com salas antigas) ou `avaliativa`. A seleção deve explicar o resultado e estar visível na sala docente e discente.
2. Em avaliativa, informar título da atividade, disciplina/conteúdo, turma(s), contexto de ano letivo/bimestre e valor máximo. Usar anos e turmas do Diário, incluindo legado identificado, sem inferir ano a partir da data de execução. Preservar a seleção de várias turmas, com vínculos avaliativos separados por turma/bimestre.
3. Selecionar critério de Heróis `primeira_tentativa` (padrão proposto, apresentado explicitamente no formulário) ou `melhor_tentativa`. As duas tentativas do jogo continuam funcionando. O professor pode escolher o critério ao preparar a atividade.
4. Criar sala congela finalidade, destinatários, questões, critérios e valor. Registrar atividade de origem gamificada com vínculo estável sala/turma. Repetição de criação não duplica atividade. Preservar contratos e fluxos existentes do módulo de Atividades.
5. Antes de começar, mostrar resumo com turma, período, critério e valor. Depois de começar, a configuração avaliativa permanece na versão congelada para manter o histórico reproduzível.
6. Ao encerrar, exibir relatório e notas calculadas para conferência. Professor pode revisar nota individual dentro da escala, com justificativa e auditoria, e confirmar a finalização.
7. Botão explícito para sincronizar as notas conferidas com o Diário. Apresentar prévia por turma/bimestre, atividade/coluna e aluno. Confirmar publicação no Portal separadamente conforme fluxo vigente.

Salas antigas e de revisão continuam legíveis com placar. Podem receber relatório descritivo conforme os registros disponíveis. Avaliação formal começa com a configuração explícita antes do início; não atribuir retroativamente critérios a partidas antigas.

## Critérios pedagógicos

Nota = valor máximo × aproveitamento individual, arredondada a duas casas somente no resultado final. Questões têm peso igual nesta versão; fácil/médio/difícil são filtros e metadados, sem pesos ocultos.

- Quiz, Equipes e Tabuleiro: acertos individuais divididos pelas questões que o participante estava autorizado a responder e que foram efetivamente abertas. No Tabuleiro, considerar somente turnos da sua equipe, usando a composição congelada. Posição, casas e pontuação coletiva ficam registrados como indicadores do jogo.
- Heróis: considerar primeira tentativa ou melhor tentativa conforme configuração congelada. Recuperar todas as tentativas confirmadas dos registros, sem contar reenvios idempotentes. Exibir primeira resposta, tentativas e resultado final.
- Associação: proporção de pares corretos por desafio.
- Ordenação: proporção de posições corretas por desafio.
- Memória: proporção de pares encontrados até o prazo/encerramento da rodada.

Calcular aproveitamento a partir das evidências e gabaritos congelados, evitando usar pontos de jogo previamente arredondados como única fonte. Preservar respostas e recibos originais.

Distinguir `nao_participou`, `sem_oportunidade`, `pendente` e nota zero. Sem oportunidade ou partida sem questões efetivamente abertas não produz divisão por zero nem nota automática. Quem participou tem questões elegíveis não respondidas identificadas no relatório; resultado deve explicitar o denominador. Zero para ausência total exige decisão docente registrada. Encerramento antecipado não cria questões ficticiamente realizadas.

## Relatórios e histórico

Histórico docente paginado, substituindo a dependência da lista atual das 30 salas mais recentes. Filtrar por ano, turma, bimestre, aluno, disciplina, conteúdo, finalidade e data. Reabrir registros antigos e relatórios encerrados sem reiniciar sala.

Relatório individual inclui identificação, contexto, jogo, datas, questões elegíveis/respondidas, acertos/erros/parciais, não respondidas, tentativas, feedback, aproveitamento, nota calculada, nota revisada/justificativa e estado de sincronização. Relatório da turma inclui participantes/ausentes, oportunidades e distribuição dos resultados. Informar limitações de dados em partidas antigas.

PDF e CSV devem refletir o mesmo recorte e critérios da tela, com nomes longos e paginação legíveis. Neutralizar fórmulas em células CSV. Portal do aluno mostra somente seus resultados e devolutivas disponibilizados pelo docente, com histórico de avaliações. Usar os controles de autorização por professor, vínculo, turma e aluno existentes.

## Persistência e integração com notas

Servidor é autoridade para calcular, finalizar e sincronizar. Reutilizar camadas atuais de Aula Gamificada, persistência do Diário e representações de atividade/entrega quando compatíveis. Identificar origem `aula_gamificada` e IDs estáveis, sem associar por nomes/títulos.

A atividade avaliativa deve ser reconhecida no módulo de Atividades com acesso ao relatório e estado real de correção/sincronização. Não expor um formulário de entrega convencional para uma partida já respondida. Não executar a correção IA novamente para avaliar respostas já validadas pelo jogo.

Reutilizar `anoLetivoTurma`, critérios vigentes e regras de sincronização. A nota do game pertence a uma coluna de atividade, com valor máximo conferido. Simulado e recuperação seguem seus fluxos próprios. Não publicar nem sobrescrever notas existentes sem revisão de conflito e confirmação explícita. Detectar incompatibilidade de escala/coluna e orientar ajuste no formulário/prévia.

Finalização/sincronização precisam de requestId, revisão esperada e transações/reconciliação. Reenvios não duplicam atividade, entrega, coluna ou nota. Se uma etapa falhar após a outra ter sido gravada, registrar pendência recuperável e permitir repetir apenas o restante. Preservar isolamento por turma/bimestre/aluno e versão do Diário, incluindo concorrência de outro dispositivo.

Relatórios encerrados guardam versão de critérios, evidências e auditoria. Mudança posterior do banco/roster não modifica avaliação histórica. Revisar nota gera nova versão e mantém a anterior. Remoção de vínculo restringe acesso discente conforme regra vigente, preservando o registro docente autorizado.

## Contratos a acrescentar

Preservar os endpoints atuais. Propor extensões documentadas no mesmo prefixo `/api/aula-gamificada`, com DTO docente separado do discente:

- `POST /salas` recebe opcionalmente `finalidade` e `avaliacao`, validados no servidor.
- `GET /avaliacoes/contexto` docente fornece anos/turmas/bimestres/colunas disponíveis sem alterar silenciosamente o DTO anterior de catálogo.
- `GET /avaliacoes` docente lista histórico com filtros e cursor estável, sem truncamento oculto em 30 itens.
- `GET /salas/{codigo}/relatorio` retorna recorte autorizado por papel, disponível após encerramento/conforme estado de publicação.
- `POST /salas/{codigo}/avaliacao/finalizar` e `/sincronizar` aceitam requestId, revisão esperada e seleção explícita do recorte.
- `GET /avaliacoes/minhas` discente lista somente avaliações disponibilizadas ao aluno autenticado.

Antes do código, registrar os DTOs concretos e sua relação com a infraestrutura real do Diário/Atividades; evitar decisões de persistência fundamentadas só em mocks. Toda consulta e exportação deve ser autenticada, sem confiar em professorId/alunoId recebidos como autorização.

## Geração com IA — correção de entendimento

Hoje o seletor exibe três tipos de questão compartilhados pelos sete jogos. Acrescentar o campo `Jogo` com todas as modalidades, preservando as APIs/callbacks existentes e o reaproveitamento do banco:

- Quiz, Equipes, Heróis e Tabuleiro usam múltipla escolha.
- Memória e Associação usam pares.
- Ordenação usa sequência ordenada.

Selecionar jogo apresenta apenas tipos compatíveis e explica a correspondência. Atalho Gerar IA no cartão deve manter a modalidade escolhida, além do tipo. Enviar `modalidade` para a API que já aceita esse parâmetro opcional, validando compatibilidade antes de consumir IA. Continuar suportando disciplina/ano/conteúdo, anexos e quantidades por dificuldade. Não duplicar perguntas de múltipla escolha só para mudá-las de jogo.

## Testes e aceite

TDD com novos testes conforme AGENTS.md; manter testes existentes. Cobrir:
- Seleção dos sete jogos e três tipos corretos; geração incompatível bloqueada antes da IA; atalhos preservam jogo.
- Sala revisão/legada e avaliativa, congelamento, várias turmas e identificação de período.
- Nota individual dos sete jogos, parciais, Heróis primeira/melhor tentativa, Tabuleiro com oportunidades diferentes, prazo, reenvio, ausentes e sem oportunidade.
- Histórico com mais de 30 salas, filtros e exportações, Portal e isolamento entre contas/alunos.
- Integração real das representações com Atividades/Diário, prévia, escala, coluna estável, conflito, repetição e falha parcial recuperável.
- Auditoria de revisão/finalização, alteração posterior do banco e encerramento antecipado.

Entregar relatório, testes focados e suíte completa, lint, build e capturas reais desktop/celular com dados sintéticos. Executar cenários ponta a ponta com adaptadores compatíveis com as transações reais. Informar precisamente o que depender de validação com credenciais externas. Entregar sem commit/push até revisão técnica neste chat.

## Complemento solicitado — fluxo guiado a partir do cartão do jogo

Ao clicar em Gerar IA no cartão de uma modalidade, abrir o gerador com aquele jogo já selecionado e os tipos compatíveis. A seleção acompanha todo o percurso. Mudança de modalidade é explícita, sem trocar silenciosamente questões ou configuração avaliativa.

Fluxo guiado: escolher jogo → informar tema/material e dificuldade → gerar → revisar questões/gabaritos → salvar e aprovar as selecionadas → continuar para Preparar Sala. A última ação abre a preparação com modalidade preservada e IDs das questões aprovadas já selecionados. O professor pode ajustar quantidade, turmas, tempo e finalidade avaliativa, e complementar a seleção pelo banco. Criar sala continua sendo confirmação explícita após a prévia.

Oferecer ação clara de continuidade no resultado da geração. Aprovação exige ação docente informada após exibir enunciado, alternativas, gabarito e explicação, conforme o fluxo atual. Se algumas questões falharem ao salvar/aprovar, indicar o estado de cada item e permitir repetir só o restante, mantendo IDs/requestIds e evitando nova geração/cobrança de IA. Nenhuma questão pendente entra silenciosamente na sala.

Preservar também o caminho Preparar Sala → escolher questões já revisadas do banco. Proteger rascunhos ao navegar entre as etapas, com isolamento por UID. Chaves, material anexado e gabaritos não devem ser colocados na URL. Testar atalhos dos sete jogos, manutenção do contexto, pré-seleção de questões aprovadas, falha parcial e troca de conta.
