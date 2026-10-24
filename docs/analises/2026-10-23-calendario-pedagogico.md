# Análise do Calendário Pedagógico

Os achados abaixo descrevem o estado anterior à implementação. O andamento e as evidências estão no registro ao final.

Data: 23/10/2026. Escopo: módulo ativo em `frontend/src/app/calendario`, componentes, hook de persistência e motor de agendamento.

## Parecer

O módulo reúne recursos úteis, mas mistura três tarefas: configurar horários, organizar conteúdos e registrar aulas realizadas. A interface não explica suficientemente a diferença entre essas tarefas. Além disso, existem divergências entre o que alguns botões prometem e o que o código faz. Recomendo corrigir a integridade dos agendamentos antes de reorganizar a interface.

Esta auditoria não alterou o funcionamento do projeto nem dados de turmas. As alterações de correção de atividades da tarefa anterior permanecem separadas. Não houve commit ou push nesta auditoria.

## Verificação realizada

- Leitura de PRD, RN-08 a RN-12, RN-19, RN-20, RN-51 e especificação arquitetural do calendário.
- Execução dos quatro arquivos de testes do calendário e integração com Meu Horário: **14 testes aprovados**.
- Execução direta do motor com cenários sintéticos, sem acessar o banco: repetição de conteúdo concluído, pular conteúdo, falta de espaço no fim do período, dois horários no mesmo dia, duração de três aulas e aplicação sequencial de feriados usando o estado inicial.
- Revisão dos componentes e dos caminhos de gravação. Não realizei operações de gravação em uma turma real nem teste visual de uma sessão autenticada. Achados de interface abaixo decorrem do código dos componentes; riscos de persistência estão identificados como leitura do código.
- Os testes atuais verificam operações básicas do motor. Não demonstram segurança de alteração da grade, ausência de repetição de tópicos concluídos, comportamento completo dos feriados persistidos ou clareza dos fluxos da interface.

## O que está bem encaminhado

1. **Organização por turma:** grade, planejamento e feriados usam documentos sob o professor, com identificação da turma.
2. **Visualização mensal e semanal:** os dois modos existem e compartilham os mesmos agendamentos.
3. **Criação manual:** permite criar tópicos sem depender de IA.
4. **Reaproveitamento de planejamento:** existe cópia entre turmas e importação de horários do módulo Meu Horário.
5. **Associação de conteúdo:** permite arrastar tópicos e também selecionar um conteúdo no detalhe da aula.
6. **Status pedagógicos:** distingue agendada, concluída, parcial e não realizada.
7. **Base do agendamento automático:** preserva aulas anteriores à data escolhida, ignora aulas concluídas/canceladas e considera os feriados recebidos no motor. Isso não garante que o conteúdo escolhido para distribuir esteja correto.
8. **Exportação:** existe geração de PDF; sua completude precisa melhorar para comentários/conteúdos extensos.

## Problemas prioritários

### 1. Alterar a grade recria o calendário — alta prioridade

**Evidência por leitura do código:** `frontend/src/hooks/calendario/useCalendarioPedagogico.js:61` exclui os registros antigos da turma e grava novos slots. Não há migração do conteúdo e dos status anteriores. A grade é salva antes da confirmação do lote de aulas, permitindo estado inconsistente se a etapa seguinte falhar.

**Impacto:** uma simples alteração de horário pode remover associações e histórico de execução. A interface não apresenta uma prévia dessa consequência.

**Melhoria:** comparar grade antiga/nova; preservar aulas realizadas e associações; aplicar mudanças a partir de uma data escolhida; mostrar quantas aulas serão criadas, movidas ou removidas antes de confirmar.

### 2. Distribuição repete conteúdo concluído — alta prioridade

**Reproduzido:** com tópico T1 em aula concluída e uma próxima aula vazia, distribuir o plano T1/T2 coloca T1 novamente na aula vazia. O motor preserva a aula concluída, mas reinicia a lista de conteúdos desde o primeiro item.

**Fonte:** `frontend/src/lib/engines/ScheduleGeneratorEngine.js:213` e `:245`.

**Impacto:** a sequência pode voltar ao começo. Também permite redistribuir conteúdos já alocados antes da data inicial.

**Melhoria:** distribuir somente conteúdos elegíveis, considerando conclusões e vínculos existentes. Expor as opções “Preencher aulas vazias” e “Reorganizar aulas futuras”. Hoje existe suporte interno a `apenas_vagas`, mas o modal fixa `substituir` sem oferecer escolha.

### 3. “Pular Tópico” não retorna o conteúdo aos pendentes — alta prioridade

**Reproduzido:** a operação altera apenas o status da aula e mantém o tópico associado. A barra lateral oculta tópicos associados. Portanto, o conteúdo não reaparece nos pendentes como o modal promete e como exige RN-20.

**Fontes:** `frontend/src/lib/engines/ScheduleGeneratorEngine.js:278`; `frontend/src/components/calendario/Sidebar.jsx`.

**Melhoria:** distinguir o registro histórico da aula de um vínculo de agendamento ativo. Usar o nome “Devolver aos pendentes e manter próximas datas”.

### 4. Reagendamento sem espaço não informa a sobra — alta prioridade

**Reproduzido:** sequência T1/T2/T3 em três aulas; cancelar a primeira e reagendar resulta em T1/T1/T2. T3 deixa de aparecer nos agendamentos. O tópico continua no planejamento, mas o motor descarta o conteúdo restante do deslocamento sem retornar um alerta. A promessa do modal de reagendar “sem perder nada” não é garantida.

**Fonte:** `frontend/src/lib/engines/ScheduleGeneratorEngine.js:118` até `:134`.

**Melhoria:** retornar uma lista explícita de conteúdos sem vaga. Oferecer mantê-los pendentes ou criar reposição. Diferenciar conteúdo histórico da aula cancelada e conteúdo efetivamente agendado.

### 5. Feriados são calculados e persistidos por caminhos diferentes — alta prioridade

**Evidência por leitura do código:** a página calcula `aplicarFeriadoNoCalendario`, mas grava usando `cancelarAulaComRemanejamento` com o vetor original de aulas em cada iteração. O hook grava todas as aulas desse vetor. Assim, o último lote pode desfazer mudanças dos anteriores. Motivo do feriado e limpeza do conteúdo calculados no primeiro caminho não são gravados pelo segundo.

**Simulação do mesmo padrão:** cancelar A1 e A2, sempre usando o vetor inicial, termina com A1 novamente agendada.

**Fontes:** `frontend/src/app/calendario/page.js:394` e `:459`; `frontend/src/hooks/calendario/useCalendarioPedagogico.js`, função `cancelarAulaComRemanejamento`.

**Melhoria:** calcular um único resultado final e persistir esse mesmo resultado. Bloquear todas as datas não letivas antes de deslocar conteúdos. Ao remover feriado, explicar se as aulas serão reabertas e se haverá redistribuição.

### 6. Dois horários no mesmo dia são reduzidos a um — alta prioridade

**Reproduzido:** segunda-feira às 07h e às 10h gera somente o horário das 10h. O motor usa um mapa com uma entrada por dia da semana; a segunda configuração substitui a primeira.

**Fonte:** `frontend/src/lib/engines/ScheduleGeneratorEngine.js:39`.

**Melhoria:** armazenar uma lista de horários por dia, ordenar por data/hora e validar sobreposições. A importação do Meu Horário precisa ser verificada nesse mesmo cenário.

### 7. “Limpar agendamentos” altera também aulas concluídas — alta prioridade

**Evidência por leitura do código:** além de remover conteúdos, redefine para `AGENDADA` todas as aulas que não estejam como `NAO_REALIZADA`, incluindo concluídas e parciais.

**Fonte:** `frontend/src/app/calendario/page.js:482`.

**Melhoria:** preservar aulas realizadas por padrão; limitar a operação às futuras ou a um período. A confirmação precisa descrever exatamente quais registros serão alterados.

## Fontes de confusão e melhorias de experiência

| Situação atual | Consequência | Proposta |
|---|---|---|
| “Planejamento”, “ementa”, “tópico” e “Aula 1” usados para conteúdos | Professor confunde conteúdo com encontro marcado no calendário | Usar “Conteúdo 1” na biblioteca; “Aula de 23/10, 07h30” no calendário |
| Conteúdos associados desaparecem da lateral | Parece que os itens foram removidos; editar conteúdo agendado fica difícil | Abas “Pendentes”, “Agendados”, “Concluídos” e busca; manter acesso à edição |
| Indicador “Progresso da Ementa” divide número de aulas pelo número de tópicos | Uma aula com três tópicos concluídos pode mostrar 33%, apesar de todos terem sido ensinados | Contar tópicos únicos concluídos; apresentar quantidade de aulas em indicador separado |
| Botão automático usa substituição, mas essa escolha fica escondida | Usuário não sabe que conteúdos já programados podem mudar | Escolha explícita do modo e prévia das alterações |
| Modal afirma preservar aulas passadas, mas “Início do Ano” inclui datas passadas não concluídas | Promessa mais ampla que a proteção real | Dizer “Preserva aulas anteriores à data escolhida”; sugerir hoje por padrão |
| Importação cita Word/PDF, porém oferece somente campo para colar texto | Expectativa de envio de arquivo não é atendida | Botão “Enviar PDF/imagem/documento” e alternativa “Colar texto” |
| “Extrair e Salvar” substitui o plano diretamente | Não permite revisar a interpretação da IA nem escolher juntar/substituir conteúdos | “Extrair → revisar → adicionar/substituir → salvar” |
| Detalhe usa “Excluir este Dia”, mas exclui apenas uma aula/horário | Nome não representa o alcance da ação | “Excluir esta aula”; agrupar exclusões em menu de opções |
| Clique no corpo do conteúdo impede abertura do detalhe do cartão | Clicar no título pode não fazer o que o cartão sugere | Botão visível “Ver aula / registrar realização” |
| Grade ocupa sete colunas, com lateral fixa de 320px e ações visíveis só ao passar o mouse | Uso estreito ou por toque fica prejudicado | Lateral recolhível; lista diária no celular; ações acessíveis sem depender do mouse |
| Vários modais fecham antes de a gravação terminar | Falha é comunicada depois de o contexto desaparecer | Aguardar a gravação, mostrar progresso e manter os dados em caso de erro |
| Duração estimada não reserva aulas adicionais | Conteúdo de três aulas é colocado em um único encontro, sem cálculo de capacidade | Alocar pela quantidade de aulas/tempos e mostrar continuações |

Outros pontos: configuração inicia em datas fixas de 2026; planejamento e grade não têm chave explícita de ano letivo nos documentos por turma; falta seleção clara de bimestre/período; não há campo para justificar não realização ou registrar o que faltou em uma aula parcial. O cadastro de recesso aceita uma data por vez, sem intervalo de início/fim.

O motor de distribuição também permite atingir aulas `PARCIAL`, pois exclui somente `NAO_REALIZADA` e `CONCLUIDA`, embora RN-19 especifique preencher apenas `AGENDADA`.

Na troca rápida de turma, as respostas de carregamento não têm proteção para descartar uma requisição anterior que termine depois. Isso é um risco identificado pelo código, não um caso reproduzido com dados reais nesta auditoria.

## Organização recomendada

Fluxo inicial:

**Escolher turma e período → confirmar horários → cadastrar dias sem aula → adicionar/revisar conteúdos → distribuir com prévia.**

Uso diário:

**Abrir aula → registrar concluída, parcial ou não realizada → informar observação → decidir o destino do conteúdo restante.**

Três áreas visíveis:

1. **Calendário:** aulas da semana/mês, filtros e registro de realização.
2. **Conteúdos:** lista completa com pendentes, agendados e concluídos; criação, edição, importação e cópia.
3. **Configurações:** grade, ano/período, feriados e recessos. Exclusões e reinicialização ficam em opções avançadas.

Nenhuma redistribuição deve ser feita silenciosamente. A prévia deve informar: aulas alteradas, conteúdos preservados, conteúdos sem vaga e período afetado.

## Inclusão solicitada: horários do Meu Horário Escolar

Requisito incluído pelo usuário após esta análise e implementado na evolução descrita ao final deste documento.

- Ao selecionar uma turma, disponibilizar o carregamento dos dias e horários já cadastrados no **Meu Horário Escolar**, sem redigitação.
- Utilizar correspondência exata normalizada do nome da turma. Quando os nomes forem diferentes ou a correspondência for ambígua, permitir selecionar explicitamente a turma de origem; não usar aproximação silenciosa por substring.
- Preservar vários horários no mesmo dia, incluindo blocos separados; ignorar recreios e intervalos. Aulas consecutivas podem ser apresentadas em conjunto, desde que seus tempos e capacidade permaneçam corretos.
- Exibir prévia dos horários encontrados e do período a atualizar. Aplicar apenas após revisão, preservando conteúdos, aulas realizadas e datas bloqueadas. Conflitos precisam aparecer para resolução.
- Consultar os horários novamente ao solicitar atualização; não manter indefinidamente uma cópia antiga em cache. Importações repetidas devem ser idempotentes, sem duplicação.
- Na ausência de horários cadastrados, mostrar orientação e acesso ao Meu Horário Escolar. Não apresentar os dados demonstrativos como horários reais do professor.
- Manter cadastro manual como alternativa. Alterações no Meu Horário não devem apagar/recriar automaticamente aulas do calendário.

A importação parcial atual não basta: o conversor pode juntar horários separados em um único intervalo e o gerador retém somente uma configuração por dia. A integração deve resolver ambos antes de ser considerada concluída. As verificações dessa evolução estão registradas em `specs/TESTS_SPEC.md`.

## Ordem sugerida de implementação

1. Corrigir perda de vínculos/histórico na grade, repetição de conteúdo, retorno aos pendentes, sobra no reagendamento, persistência de feriados e limpeza das concluídas.
2. Cobrir esses cenários com testes, incluindo integração de persistência. Preservar os testes existentes e discutir explicitamente expectativas antigas que contrariem as regras.
3. Reorganizar navegação e nomes; manter os recursos úteis.
4. Acrescentar prévia e escolha de modo, filtros por período, importação de arquivos e uso por celular.
5. Validar o fluxo completo com uma turma de teste antes de publicar.

## Implementação realizada — 23/10/2026

| Item da análise | Resultado |
|---|---|
| Grade sem apagar histórico | Reconciliação com data inicial, prévia, conflitos por falta de destino/capacidade e transação única; preserva realizadas e outros períodos. |
| Distribuição sem repetir concluídos | Identidade única, duração/capacidade, proteção de parciais e vínculos fora do recorte, modos explícitos e prévia. |
| Pular / reagendar | Histórico visível separado do vínculo ativo; pendências explícitas quando faltam vagas; repetir a ação não duplica agendamentos. |
| Feriados/recessos | Bloqueio conjunto, resultado único persistido, intervalos, motivo e reabertura apenas dos bloqueios automáticos; cancelamentos manuais preservados. |
| Vários horários por dia | Geração de todos os blocos, validação de sobreposições e ordenação por data/hora. |
| Limpeza segura | Apenas agendadas futuras do recorte; concluídas/parciais/passado preservados; prévia. |
| Biblioteca e progresso | Todos/pendentes/agendados/concluídos, busca, edição visível, contagem de conteúdos únicos e tempos restantes. |
| Importação | Arquivo ou texto, leitura/OCR compartilhados, revisão editável, adicionar ou substituir somente pendentes; vinculados e históricos preservados. |
| Registro da aula | Justificativa/restante, decisão pedagógica, gravação aguardada e erros conservando contexto. |
| Navegação | Calendário, Conteúdos e Configurações, ano/período explícitos, lista em celular e clique no título abrindo detalhes. |
| Horários do Meu Horário | Leitura real, correspondência exata ou seleção manual, blocos separados, prévia e atualização sem duplicar. |
| Ano e troca de turma | Documentos anuais com compatibilidade legada e descarte de respostas de carregamentos anteriores. |
| PDF | Conteúdo e descrição completos, justificativa/restante inclusive aninhados em execução, histórico e paginação. |
| Reposição | Horário extra explicitamente autorizado na grade, validação de sobreposição/bloqueio e prévia. |

Conferência visual com componentes reais e dados sintéticos: calendário semanal, biblioteca completa, prévia com conteúdo sem vaga e lista em tela de 390 px. A rota temporária de revisão foi removida; não é parte do produto.

Evidências visuais:

- [Prévia da distribuição](evidencias-calendario/previa-distribuicao.jpg)
- [Calendário no celular](evidencias-calendario/calendario-celular.jpg)

A validação usa testes locais, transações simuladas e turma sintética; não executa gravações em turmas reais. Arquivos de correção manual/feedback da tarefa anterior foram preservados. Commit, push e publicação não foram realizados nesta etapa.

Validação final desta implementação: **523 testes aprovados em 87 arquivos**, build de produção e lint dos arquivos do calendário/integração aprovados. Nenhum teste preexistente foi alterado. A exportação PDF foi conferida com documento sintético de cinco páginas. [Guia de uso](../guias/calendario-pedagogico.md).
