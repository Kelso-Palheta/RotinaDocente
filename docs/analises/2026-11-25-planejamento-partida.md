# Planejamento → questões → partida

## Entrega

Em Aula Gamificada → Sala de jogos, **Planejar aula** abre o planejador privado. Professor informa título, disciplina, série, conteúdo, objetivo, duração e turmas, escolhe uma das modalidades existentes e organiza as etapas. Há roteiro livre e sugestão de cinco etapas para Resgate do Rio. Tempos são editáveis e devem somar a duração escolhida.

Plano pode ser salvo sem questões. **Gerar questões deste plano** preenche disciplina, série, tema e modalidade no gerador existente. Após salvar/revisar as questões, professor volta ao planejamento e seleciona os desafios do banco. Rascunhos de IA ficam separados por plano/contexto na sessão atual.

**Preparar partida deste plano** preenche título, jogo/experiência, turmas e questões. A sala só nasce após confirmação do professor. Jogo e questões devem corresponder ao plano salvo; tempo, formato de disputa e finalidade avaliativa continuam configuráveis pelos fluxos existentes.

## Persistência e acompanhamento

Planos sobrevivem a recargas, são privados por professor e têm controle de versão. Repetição de envio não duplica plano. Falha de rede não confirmada bloqueia edição até repetir o mesmo pedido; conflito de revisão permite reabrir a versão atual mediante descarte explícito. Rascunho pode ser descartado; turmas arquivadas ou questões indisponíveis podem ser retiradas para reutilizar um plano.

Cada sala guarda sua cópia do planejamento. O painel/telão docente mostra objetivo, etapas e a etapa prevista para a pergunta atual. Editar o plano depois não reescreve essa cópia. A projeção do aluno continua restrita ao conteúdo autorizado da rodada.

Pontuação, revisão de notas, histórico, permissões e publicação de questões para revisão em casa permanecem existentes. Salvar plano não publica atividades nem altera notas.

## Limites desta entrega

O professor escreve o plano; IA gera questões pelo fluxo atual. O roteiro orienta a condução docente e a distribuição de desafios, sem gerar novos mapas/códigos ou substituir as regras dos jogos. Revisão em casa continua usando a liberação explícita por questão e turma no Banco de Questões. Rascunhos de geração ainda não salvos no banco são temporários; planos são persistentes.

## Evidências

Telas reais dos componentes com dados sintéticos em ambiente local isolado; nenhum dado de aluno real ou chave de IA foi usado.

- [Contexto e turmas](../evidencias/2026-11-25-planejamento-jogos/01-contexto-desktop.png)
- [Missões do plano](../evidencias/2026-11-25-planejamento-jogos/02-missoes-desktop.png)
- [Questões ordenadas](../evidencias/2026-11-25-planejamento-jogos/03-questoes-ordenadas-desktop.png)
- [Gerador preenchido](../evidencias/2026-11-25-planejamento-jogos/04-gerador-preenchido-desktop.png)
- [Preparação vinculada](../evidencias/2026-11-25-planejamento-jogos/05-preparacao-vinculada-desktop.png)
- [Preparação no celular](../evidencias/2026-11-25-planejamento-jogos/06-preparacao-mobile.png)
- [Roteiro congelado](../evidencias/2026-11-25-planejamento-jogos/07-roteiro-congelado-mobile.png)

Percurso no navegador verificou persistência após recarga, prefill da geração e preparação, criação pelo serviço real com armazenamento sintético, snapshot imutável após editar plano e ausência de rolagem horizontal em 390 px. Teste de integração do Hub também verifica a navegação real sem criação automática.

## Validação

Suíte isolada: **2021 testes passaram**, dez opcionais ignorados; 431 arquivos aprovados e quatro opcionais ignorados. Revisão independente final: 21 testes novos aprovados, sem bloqueadores. Testes existentes preservados. Rotas temporárias de evidências removidas antes do build final.

Lint aprovado sem erros (22 avisos preexistentes); build de produção aprovado. Alterações alheias presentes no workspace foram excluídas da validação e do commit desta entrega.
