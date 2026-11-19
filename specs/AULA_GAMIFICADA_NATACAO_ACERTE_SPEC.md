# Natação e Acerte ou Perde — 19/11/2026

## Escopo aprovado
Adicionar `natacao` e `acerte_perde` ao catálogo, preservando as sete modalidades anteriores. Todas as disciplinas, questões manuais/IA por tema/material, revisão docente, dificuldades, individual/duelo/grupos, respostas individuais/compartilhadas, histórico e avaliação existentes.

## Regras
- Natação aceita múltipla escolha. Cada aluno/unidade coletiva avança um trecho por acerto, zero por erro/ausência, sem bônus de velocidade. Em grupos com respostas individuais, progresso é a proporção de acertos da equipe na rodada (não favorece grupos grandes). Piscina com cinco trechos por padrão, configurável de 1 a 50. Avanço consolidado no servidor uma vez ao revelar. Chegada encerra após o ranking; chegadas simultâneas compartilham vitória. Sem chegada, vence o maior progresso; empate compartilhado. Sem revelar gabarito/progresso antes da revelação.
- Acerte ou Perde aceita múltipla escolha e `resposta_aberta` com resposta-modelo privada. Uma resposta por aluno/unidade coletiva/rodada, até o prazo. Texto com limite de 2000 caracteres; sem autocorreção por comparação textual.
- Múltipla escolha tem correção automática; aberta exige julgamento docente correto/incorreto, somente na fase de feedback, com justificativa obrigatória e auditoria. Pendências impedem ranking, avanço e encerramento definitivo. Idempotência, revisão esperada, isolamento de conta e leituras antes de escritas em transações são obrigatórios.
- Acerte: 1000 pontos por acerto e zero por erro. Opção de última questão especial vale 10000 pontos; desligada por padrão. Peso especial afeta apenas o placar do jogo. Nota e aproveitamento usam fração de acerto por questão, sem bônus.
- Cronômetro configurável como nos demais jogos; em Acerte pode ficar sem limite, com encerramento manual explícito. Prazo nulo só permite respostas nesse modo de sala, e só em fase pergunta.
- Não conceder segunda oportunidade/repassar questão depois de revelar a resposta, pois isso compromete o resultado avaliativo.

## Experiência
Piscina e nadadores no telão e aparelho do aluno; animação de avanço, chegada e medalhas. Acerte com suspense, sirene/relógio, revelação, feedback e placar. Respeitar som desativado, gesto obrigatório de áudio, aba oculta e movimento reduzido. Reaproveitar imagens e trilhas dos PPTX fornecidos; capas locais otimizadas e cenas semanticamente adequadas. Mostrar pendências de correção apenas ao docente; resposta de outro aluno nunca viaja na projeção/aluno.

## Aceite
Nove modalidades reais em catálogo/preparação/IA; questões abertas editáveis e geráveis; fluxo ponta a ponta de cada novo jogo, reconexão, duplicidade, segurança, fronteira do prazo, grupos e relatório sem contaminação de notas pelo bônus. Capturas sintéticas desktop/celular, suíte completa, lint e build. Atualizações de expectativas antigas de quantidade/lista de jogos autorizadas pelo usuário em 19/11/2026; demais verificações intactas.

## Contratos e persistência (compatíveis com salas anteriores)
- Sala: `trechosNatacao`, `natacaoEstado: {totalTrechos,raias:[{id,nome,progresso}],ultimaRodadaAvaliada,vencedoresIds}`; Acerte: `semCronometro`, `desafioFinal`. Ausência mantém comportamento legado.
- Questão aberta: `tipo: resposta_aberta`, `respostaCorreta` contém modelo textual privado. Envio discente aceita somente `{texto}`; ignora campos de julgamento/pontos fornecidos pelo cliente.
- Resposta persistida: `correcaoManual: {correta,justificativa,professorId,corrigidoEmMs}` e `auditoriaCorrecoes`. Correção muda pontos por delta, nunca soma em duplicidade. `POST /salas/:codigo/comandos` aceita `acao: corrigir_aberta`, `participanteId` do registro individual/coletivo, `correta`, `justificativa`, `rodada`, `expectedRevision`, `requestId`.
- `GET /salas/:codigo/correcoes` exclusivo do docente proprietário, retorna textos só na fase feedback. Não incluir textos no polling geral ou na projeção. Estado público expõe somente `pendentesCorrecao` agregado; recibo do próprio aluno recebe a justificativa após revelação.
- Ranking da Natação segue progresso com tolerância numérica, tanto no servidor como na normalização de interface. Pontos automáticos só aparecem no recibo depois da revelação.
