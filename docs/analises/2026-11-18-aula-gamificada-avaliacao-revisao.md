# Revisão independente — avaliação gamificada

Data: 18/11/2026. **Entrega não aprovada para publicação.**

Escopo: avaliação/histórico/Portal e geração guiada por jogo. Não incluir as alterações locais de `components/revisao/*`, `lib/auth-context.js` ou capturas antigas nesta entrega.

## Evidência executada

- Suíte focada existente: **29 arquivos, 138 testes aprovados** (`npm test -- aula-gamificada aula_gamificada --maxWorkers=4`, antes das regressões abaixo).
- Revisão adicionou `tests/regression/aula_gamificada_avaliacao_revisao.test.js`: **7 testes falhando pelos defeitos descritos abaixo**, sem modificar testes anteriores.
- O adaptador das regressões impede leitura após escrita e só confirma gravações ao terminar a transação. O adaptador dos dois testes integrados da entrega não reproduz essas restrições do Firestore e aplica gravações imediatamente.
- Não executei nova suíte completa/lint/build após comprovar bloqueios. Os resultados declarados no relatório da entrega não substituem a validação da versão corrigida.

## Correções obrigatórias

### REV-AV-01 — bloqueador: comandos de todas as salas quebrados

`AulaGamificadaService.js:680–681`: `comandar` grava a sala e depois lê o índice docente. `FirestoreRevisaoStore` rejeita qualquer leitura depois da primeira escrita. Isso afeta inclusive iniciar uma sala de revisão, além dos comandos avaliativos. Ler o índice antes de qualquer escrita, incluindo consolidação da Memória. Preservar projeção, revisão e idempotência.

### REV-AV-02 — bloqueador: finalização com resultado não funciona no Firestore

`AulaGamificadaService.js:1146–1171`: grava entregas e só depois lê atividades. Com ao menos uma nota numérica, a operação falha e a transação é revertida. Ler todas as atividades antes das gravações. Cobrir várias turmas, publicação, reenvio e atomicidade.

### REV-AV-03/04 — alto: faltam condições de finalização e sincronização

`finalizarAvaliacao` aceita uma sala em `pergunta`, publica notas parciais e marca a avaliação como finalizada. `sincronizarDiario` aceita avaliação ainda não finalizada. Exigir partida encerrada e conferência/finalização anteriores à sincronização; rejeitar estados inválidos no servidor, não apenas esconder botões. Revisão formal deve respeitar finalidade e versão. Se houver revisão posterior, atualizar explicitamente estados pendentes de entrega/Portal/Diário, preservando versões e auditoria.

### REV-AV-05 — alto: associação por título e escala incompatível

`sincronizarDiario:1295` reutiliza o sincronizador geral que contém fallback por título. Reprodução: avaliação “Prova 1”, máximo 10, encontra coluna anterior “Prova 1”, máximo 2, e grava **10 naquela coluna de 2 pontos**, sem vínculo explícito.

Para jogos, resolver coluna somente por ID estável ou seleção explícita validada. Não mudar o comportamento legado do sincronizador geral inadvertidamente. Validar ano, turma, bimestre, existência da coluna escolhida e escala. Exibir prévia real com aluno, coluna, nota atual/nova e máximo; hoje a interface só mostra contagens. Confirmar contra a versão do Diário usada na prévia, recusando confirmação desatualizada. Tratar origens legadas do Diário e registrar pendências em vez de declarar sucesso com zero lançamentos.

### REV-AV-06 — alto: inventa oportunidade em sala nunca iniciada

`avaliacao.js:rodadasAbertasDaSala` usa somente fase e número da rodada. Encerrar uma sala que estava em espera deixa `rodada=1`, e o cálculo registra uma questão elegível sem que tenha sido aberta. Usar evidência de início/abertura; preservar tratamento explícito de registros antigos sem metadados, sem inferência silenciosa. Não gerar zero para quem não teve oportunidade.

### REV-AV-07 — alto: entrada inválida vira nota zero

`revisarNotaAvaliacao:1063`: o arredondador converte valor não finito em zero antes da validação; `notaRevisada:'invalida'` é aceita e auditada como 0. Validar tipo, presença, finitude e intervalo antes do arredondamento. Cobrir também null, vazio e ausência. Validar máximo positivo após arredondamento.

### REV-AV-08 — alto: ano letivo não chega à preparação real

`catalogo()` remove `ano`/`anoLetivo` das turmas. `HubDocente` entrega essas turmas reduzidas a `PrepararSala`, que calcula os anos a partir delas. `obterContextoAvaliacao` foi criado, mas não é chamado por nenhum desses componentes. Assim, turmas de 2026 aparecem como legado e o servidor rejeita criar avaliação com ano divergente. Conectar o contexto real, incluindo colunas/limites, com isolamento por UID e proteção contra resposta atrasada. Testar o percurso catálogo → preparação → criação com ano real e legado, sem usar fixtures de turmas mais completas que a resposta real.

### REV-AV-09 — médio: histórico incompleto e paginação instável

`listarAvaliacoes` consulta apenas o novo índice docente; salas existentes antes desta entrega não têm esse índice e desaparecem do histórico. Faltam filtros de aluno e data no servidor e de ano/conteúdo/aluno/data na interface. O cursor é um offset: nova sala entre páginas pode repetir/omitir registros. Usar cursor estável e estratégia compatível para salas antigas, sem migrar dados destrutivamente. Exportações devem seguir o recorte aplicado.

### REV-AV-10 — médio: faltam devolutivas e relatórios utilizáveis pelo aluno

O relatório calcula frações, mas os detalhes não trazem enunciado, resposta correta e explicação congelados. A seção “Minhas Avaliações” mostra somente título/nota, sem ação para abrir resultado individual ou feedback. `EntregaDrawer` e `RespostaForm` reconhecem a origem, mas conferir o acesso efetivo ao relatório no percurso de Atividades, sem liberar formulário/correção convencional.

Concluir relatório individual/turma, distribuição, detalhes e devolutivas; permitir ao aluno abrir apenas seu resultado publicado. PDF e CSV devem preservar contexto, critérios, recorte e revisão/justificativa. Hoje o PDF contém uma linha resumida por aluno; não cumpre o relatório individual especificado. Testar isolamento, vínculo removido/revogado, nomes longos e paginação.

### REV-AV-11 — médio: fluxo guiado perde rascunhos/recuperação parcial

`HubDocente` desmonta `GeradorIAQuestoes` ao trocar de aba; rascunhos ficam no estado local. Continuar para preparar sala ou visitar banco descarta questões ainda pendentes. Preservar o estado por UID e limpar somente por decisão explícita/troca de conta.

Em `handleSalvarRascunho`, se salvar funcionar e aprovar falhar, o ID/revision retornados pelo salvamento não são preservados antes do erro. Se a aprovação for confirmada no servidor e a resposta se perder, nova tentativa gera outro requestId de aprovação e pode ficar presa em conflito de revisão. Guardar progresso e IDs/requestIds por etapa, repetir apenas a pendência e reconciliar resultado confirmado. Adicionar testes de falha parcial e resposta perdida, mantendo seleção das aprovadas e os sete atalhos por jogo.

## Retorno esperado

Corrigir todos os itens; preservar os sete testes de regressão novos e os testes existentes. Acrescentar cobertura dos itens 08–11 por caminhos reais. Executar regressões, suíte completa, lint e build; entregar relatório atualizado e capturas desktop/celular da preparação com ano real, geração guiada, revisão/sincronização e resultado publicado do aluno. Não é necessário remover as advertências preexistentes de imagens para afirmar lint sem erros. **Sem commit/push até nova revisão neste chat.**
