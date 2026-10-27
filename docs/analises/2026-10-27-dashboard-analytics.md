# Dashboard Analytics — auditoria e proposta de organização

Data: 27/10/2026. Escopo: `/analytics`, cálculos, gráficos, radar e exportação PDF do código local. Entrega de análise, sem alteração funcional. Dados de teste inteiramente fictícios; nenhuma conta real foi consultada.

## Conclusão

O painel tem uma base útil de indicadores e evolução, mas ainda não é confiável para orientar acompanhamento sem conferência no Diário. As prioridades são corrigir origem/isolamento dos dados, unificar critérios e fazer o PDF reproduzir as notas efetivamente exibidas. A organização visual deve vir acompanhada dessas correções.

| Prioridade | Achado | Proposta |
|---|---|---|
| P0 | Cache global é aceito sem conferir proprietário; consulta de nuvem usa caminho antigo | Reutilizar persistência canônica do Diário, vinculada ao UID, com descarte de respostas de contexto anterior |
| P0 | PDF consulta estrutura antiga e transforma ausência em zero | Exportar o mesmo conjunto calculado da tela, preservando zero real, ausência e período |
| P1 | Aprovação por turma difere da consolidação e do radar | Critério único derivado da configuração de cada turma/bimestre |
| P1 | Card “risco/recuperação” conta apenas situação crítica | Explicitar grupos, numerador e denominador; reconciliar card, distribuição, radar e PDF |
| P1 | Erro vira “nenhuma turma”; radar vazio sugere notas adequadas | Separar erro, vazio, sem avaliações, avaliações parciais e ausência comprovada de alertas |
| P1 | Cores, escala e meta variam entre componentes | Usar regras compartilhadas e escala real, com legenda completa |
| P2 | Sem filtro de ano/arquivamento e sem visão semestral | Contexto explícito e indicadores semestrais/anuais conforme regras existentes |
| P2 | Radar pouco acionável; relatório incompleto para acompanhamento | Abrir aluno/contexto no Diário e oferecer listagem completa com paginação |

## O que funciona

Os cálculos usam `calcTotal` e `temNota`: zero lançado é nota válida, ausência é excluída da média, e a consolidação pondera pelo número de alunos avaliados. A evolução preserva períodos sem média como nulos. O radar ordena as menores notas primeiro. Há filtros de turma/bimestre e exportação disponível. Essas partes podem ser preservadas.

Nota parcial entra no cálculo quando existe lançamento, conforme RN-17. Isso não é, por si só, defeito: falta mostrar cobertura e indicar resultado provisório. A média de uma turma com muitas atividades pendentes não deve parecer equivalente à de uma turma com avaliações concluídas.

## Oito reproduções confirmadas

Arquivos em `evidencias-analytics/`. Os testes passam ao confirmar os comportamentos problemáticos, não ao demonstrar correções.

1. Turma com mínimo de aprovação 7 e nota 6: aprovação da turma é 0%, mas consolidado é 100%, e radar não mostra o aluno.
2. Notas 4,5 e 2: radar inclui ambos, mas taxa usada no card de risco/recuperação é 50%.
3. Sem avaliações: média é nula, mas aprovação aparece como 0%, sem estado próprio de indisponibilidade.
4. Radar vazio informa que estudantes avaliados têm notas adequadas sem receber quantidade de avaliados; pode aparecer assim quando ninguém foi avaliado.
5. Comparativo anuncia faixa verde a partir de 7, divergindo do excelente a partir de 8 usado na classificação compartilhada.
6. Nota canônica 6 é calculada corretamente na tela; PDF consulta campos antigos do aluno, imprime 0,00 e “Recuperação”.
7. Sessão da conta B aceita turma do cache identificado como conta A e consulta `diario_turmas/conta-b`, caminho antigo. Reprodução local com serviços simulados; não houve acesso real entre contas.
8. Falha na consulta da nuvem aparece como “Nenhuma turma cadastrada”.

## Origem, contexto e salvamento

A página lê `sessionStorage.diario_turmas` sem validar `diario_userId`. Consulta depois `diario_turmas/{uid}`, em vez do repositório canônico `professores/{uid}/turmas/data`. Não reutiliza a proteção já disponível no Diário. Uma resposta vazia da nuvem não limpa cache antigo, pois só aplica arrays com elementos. Troca de conta também precisa limpar estado imediatamente e impedir resposta atrasada de repovoar o contexto.

Proposta: um único leitor autenticado do Diário, com estados carregando, atualizado, rascunho local, falha e vazio confirmado. Mostrar origem e atualização dos dados; oferecer nova tentativa. Revisar proteção direta da rota e permissões do módulo além do acesso pelo Hub. Não confundir indisponibilidade com cadastro vazio.

Adicionar ano letivo e situação ativa/arquivada, preservando tratamento explícito de turmas legadas sem ano. Inicializar período pelo contexto vigente. Se a turma selecionada desaparecer, pedir nova seleção ou limpar filtro visivelmente; hoje o cálculo retorna silenciosamente ao consolidado. Identidades devem ser IDs, não nomes.

## Critérios, cores e denominadores

`calcularMetricasTurma` usa mínimos configurados nas taxas, mas a classificação de cada nota continua fixa. Consolidado, distribuição e radar usam essa classificação fixa. É necessário resolver o critério uma vez e compartilhá-lo entre todos os consumidores.

O card da média fica verde em 7, enquanto seu texto considera média suficiente em 6; comparativo fica verde em 7, e classificação excelente usa 8. A legenda do comparativo omite a faixa intermediária amarela. A evolução anuncia meta 6 fixa. Eixos ficam entre 0 e 10 independentemente de configuração.

Aplicar RN-18 às notas: abaixo do mínimo configurado em vermelho; aprovadas abaixo de 8 em azul; excelentes a partir de 8 em verde, respeitando o contrato de escala. Se houver faixas adicionais de acompanhamento, nomeá-las como classificação de atenção e mostrar limites completos. Não criar nova regra escolar através das cores. Escalas diferentes exigem comparação explicitamente normalizada ou separação; não misturar médias brutas incompatíveis.

Mostrar “avaliados / matriculados”, pendências e resultados parciais. Uma contagem somada entre turmas pode representar vínculos/matrículas repetidas, não pessoas únicas. Se o produto exigir pessoas únicas, deduplicar por identidade estável, nunca por nome. Definir denominadores junto aos percentuais e distinguir sem dados de zero verdadeiro.

## Semestres e acompanhamento

Acrescentar visões bimestral, semestral e anual usando cálculo compartilhado: mínimo de 25 pontos por semestre e 50 no ano, com regras existentes de recuperação e conclusão. Evitar apresentar aprovação bimestral como resultado escolar definitivo. Semestres não concluídos devem indicar situação provisória, em coerência com Portal e Diário.

O radar deve diferenciar: nenhum avaliado, nenhum alerta entre avaliados e dados incompletos. Incluir busca, filtros, paginação e acesso à ficha do aluno/Diário no contexto correspondente. A propriedade `onSelectAluno` existe, mas não oferece atualmente um fluxo funcional na página.

Recomendações como prova de recuperação ou tutoria devem ser sugestões para decisão do professor, sem criar avaliação ou decidir situação automaticamente. Exibir motivo do alerta, nota, critério aplicado e pendências. Não inferir desinteresse ou incapacidade a partir de ausência de lançamento.

## Organização proposta

1. Cabeçalho compacto: ano, período, turma e origem/atualização dos dados.
2. Visão geral: média, cobertura das avaliações, desempenho e quantidade que precisa de acompanhamento, com critérios acessíveis.
3. Atenção: alunos e pendências com ações de abrir ficha/Diário.
4. Evolução: trajetória por período e comparações com mesma escala, sem metas fixas inventadas.
5. Relatórios: prévia de contexto, critérios e alcance antes de exportar.

Manter navegação curta; explicar nomes como distribuição e taxa ao lado dos próprios indicadores. Não aumentar a quantidade de cards sem necessidade.

## PDF

Usar os mesmos DTOs/cálculos que alimentam a tela. Hoje o gerador busca `aluno.b1.notaFinal/media`, enquanto os lançamentos atuais ficam em `turma.bimestres[1].notas[aluno.id]`. A conversão de ausência para zero cria informação incorreta. O cabeçalho também converte média nula em zero, e aprovação usa mínimo fixo 5.

Filtrar por IDs e manter exatamente ano/período/turma selecionados. Exportar ausência como “Sem nota”, zero como zero, critério e situação corretamente. O radar imprime no máximo 12 nomes e informa que há outros; oferecer versão completa paginada para acompanhamento. Evitar truncamento de nomes e sobreposição do cabeçalho em textos longos. “Visto e Homologação Oficial” deve ser revisado: gerar PDF não homologa resultado escolar automaticamente.

## Implementação sugerida e aceite

Etapa 1: corrigir leitor autenticado e estados de carregamento/erro; testes de troca de conta, nuvem vazia, resposta atrasada e cache incompatível.

Etapa 2: unificar métricas, critérios e dataset do PDF; testes de zero/ausência, mínimos configurados, faixas limítrofes, notas parciais, turmas com configurações diferentes e consistência tela/relatório.

Etapa 3: filtros de ano/arquivamento, semestres e navegação para acompanhamento; testes de 25/25/50, recuperação e períodos não concluídos conforme domínio existente.

Etapa 4: simplificar interface e revisar acessibilidade/responsividade; conferir teclado, descrição dos gráficos, cor acompanhada de texto e PDF com nomes longos e muitas páginas.

Antes de implementação: atualizar PRD, RULES e TESTS_SPEC; adicionar testes que expressem comportamento correto e falhem antes da correção. Não alterar testes existentes para acomodar defeitos.

## Validação desta análise

- 8 reproduções sintéticas aprovadas em 2 arquivos; confirmam os problemas documentados.
- 11 testes existentes aprovados: cálculos Analytics e aprovação semestral do Portal.
- Nenhuma alteração em código funcional ou testes oficiais; sem consulta de produção, deploy ou homologação visual de PDF real.

Próximo módulo na sequência: Agentes Pedagógicos IA. Antes de avançar, o usuário solicitou revisão das implementações recentes atribuídas ao Deepseek.
