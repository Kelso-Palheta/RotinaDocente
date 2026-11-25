# Resgate do Rio — primeira experiência de investigação 2D

## Entrega

Experiência da modalidade Quiz disponível em Sala de jogos e Revisar sozinho. Não adiciona uma décima modalidade nem altera rubricas, cálculo de notas ou pontuação existente.

Três missões conectadas: investigar a nascente, conectar evidências e recuperar o rio. Mapa original com personagem, ponte, margens e nove estações narrativas distribuídas pelas missões. Exploração por teclado ou controles de toque; lista acessível oferece as mesmas pistas e ferramentas. Pistas podem ser relidas; coleta não duplica inventário.

Cada desafio curricular é liberado após investigar as três estações da missão. O cenário fictício pode acompanhar perguntas de qualquer disciplina. As pistas ambientais não afirmam responder questões do banco; perguntas, imagens, alternativas, gabaritos e explicações continuam pertencendo ao conteúdo selecionado pelo professor.

## Como usar

- Professor: Aula Gamificada → Sala de jogos → Preparar sala → Quiz → marcar **Resgate do Rio · investigação 2D**. Selecionar ao menos três questões revisadas e turmas autorizadas. O prazo inclui exploração; configurar tempo suficiente ou usar sem cronômetro. Revelação e avanço continuam sob comando docente.
- Aluno: Revisar sozinho → Jogo **Quiz** → marcar **Resgate do Rio · investigação 2D** → escolher disciplina, conteúdo, dificuldade e entre três e dez desafios liberados.
- Retomada salva o desafio e a missão por meio da sessão existente. Posição e inventário da exploração ainda não respondida são locais e podem reiniciar. Essa limitação aparece no jogo.

## Avaliação e segurança

Mil pontos por acerto, zero por erro; itens e movimento não alteram nota. Respostas, correção, isolamento entre contas, liberação por matrícula, revogação, idempotência e histórico usam os fluxos existentes. Repetição de erros pode usar Quiz padrão quando restarem menos de três perguntas. Nenhum conteúdo novo é publicado automaticamente.

Consequências visuais dependem do recibo confirmado: acerto faz surgir vegetação; erro orienta revisar o plano sem bloquear a continuidade; ausência de resposta e telão recebem mensagem neutra. Releitura e controles acessíveis não reduzem pontos.

## Evidências

Capturas locais das telas reais com conteúdo sintético, sem dados de alunos reais:

- [Investigação desktop](../evidencias/2026-11-25-resgate-rio/01-investigacao-desktop.png)
- [Pistas e desafio](../evidencias/2026-11-25-resgate-rio/02-pistas-desafio-desktop.png)
- [Consequência do acerto](../evidencias/2026-11-25-resgate-rio/03-consequencia-acerto-desktop.png)
- [Retomada no celular](../evidencias/2026-11-25-resgate-rio/04-retomada-mobile.png)
- [Revisão após erro](../evidencias/2026-11-25-resgate-rio/05-consequencia-revisao-mobile.png)
- [Missão final](../evidencias/2026-11-25-resgate-rio/06-missao-final-mobile.png)
- [Conclusão e placar](../evidencias/2026-11-25-resgate-rio/07-conclusao-mobile.png)

Navegação real no navegador verificou movimento por teclado e toque, liberação por três pistas, som após gesto, retomada após recarregar, ausência de rolagem horizontal em 390 px, redução de movimento e conclusão com dois acertos, um erro e 2000 pontos. O modo móvel foi emulado no Chrome; não equivale a teste físico em iPhone.

## Validação

- Suíte completa isolada das alterações alheias: **2000 testes passaram**, dez opcionais ignorados; 427 arquivos aprovados e quatro opcionais ignorados.
- Revisão independente aprovou backend, seleção, pontuação, checkpoint e histórico. Corrigidos durante revisão: imagem curricular ausente, classificação visual de ausência e releitura das pistas.
- Rotas temporárias de demonstração existem somente no ambiente de evidências e foram removidas antes da compilação final.

Esta primeira versão usa cenário e interações predefinidos. Editor livre de episódios, geração de mapas por IA e dados científicos específicos revisados ficam para etapas futuras.

Validação final: 18 testes específicos aprovados; lint sem erros (22 avisos preexistentes); build de produção aprovado. Capturas e percurso validados após as correções da revisão.
