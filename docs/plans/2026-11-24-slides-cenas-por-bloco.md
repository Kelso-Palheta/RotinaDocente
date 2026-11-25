# Slides por bloco — plano de implementação

**Objetivo:** corrigir repetição e incoerência, acrescentar animações de texto e variedade pedagógica nas 34 aulas.
**Arquitetura:** cenas declarativas por bloco, mídias locais com atribuição, seletor puro de composição e renderer compartilhado. Protocolo sincronizado já existente permanece intacto.
**Tecnologias:** React, CSS, Motion, Vitest; sem nova dependência.

1. Testes RED: cobertura completa e regressão manguebeat versus viola; mudança de conexões e animação acessível.
2. Curadoria: mapear todos os blocos a imagens pertinentes ou diagramas; novos exemplos licenciados quando disponíveis; palavras-chave extraídas do texto e diversidade de layouts. Não modificar JSON original de aulas.
3. Implementação: resolver cena por conteúdo/bloco; conteúdo contextual específico; animação por unidades sem esconder texto por falha de hidratação e sem reiniciar em heartbeat; modo reduzido estático.
4. Validação: testes novos e antigos, mídia decodificada, capturas e passos reais em desktop/celular; revisão independente; lint/build/suíte completa.
5. Publicação: somente arquivos desta tarefa, preservar cinco alterações alheias, commit/push e confirmação Vercel.

## Execução em 25/11/2026
Curadoria completa e sete novas mídias locais; texto animado e conexões específicas implementados. Regressão adicional garante destaque alinhado à frase atual. Capturas desktop/celular e revisão independente concluídas. Validações finais registradas no relatório de evidências.
