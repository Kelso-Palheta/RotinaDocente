# Disputas — reconciliação após corrigir presença e republicar

Data: 19/11/2026. **Correções anteriores aprovadas nos testes focados; ainda resta este bloqueio de publicação.**

## Evidência

- Suíte focada existente: **43 arquivos / 197 testes aprovados**, incluindo as nove regressões da última revisão e as onze audiovisuais anteriores.
- Novo arquivo: `tests/regression/aula_gamificada_presenca_republicacao.test.js`.
- Resultado: **2 testes falhando**, pela mesma causa de reconciliação incompleta.
- Nenhum teste existente foi modificado. As reproduções usam IDs SHA-256 e transações com leituras antes de escritas e confirmação atômica ao final.

## Fluxo reproduzido pelas APIs públicas

1. Sala coletiva avaliativa encerrada; Ana e Beto foram inicialmente confirmados presentes. O grupo acertou, e o professor publica nota 10.
2. Professor corrige presença com `confirmar_presenca`, marcando Beto ausente. O relatório passa corretamente a mostrar `notaFinal:null` para ele.
3. Professor finaliza e publica novamente, com nova revisão/requestId.
4. O detalhe publicado de Beto mostra nota nula na versão nova, mas o resumo de `minhasAvaliacoes` ainda mostra **10** da versão anterior.
5. `entregas/ag_PRES01_t1_a2` continua com status `corrigido` e nota 10. A sincronização regular de Atividades ainda pode usar essa nota obsoleta.

## Causa e correções

`finalizarAvaliacao` ignora alunos sem nota numérica em dois loops:

- atualização das entregas;
- atualização dos resumos `aulaGamificadaPortal/{alunoId}/avaliacoes/{codigo}`.

O `continue` evita criar nota para um ausente novo, mas também evita reconciliar documentos anteriormente criados. O snapshot publicado é atualizado, porém os demais destinos permanecem válidos com o valor antigo.

### REV-DIS-08 — resumo e detalhe da publicação

Na republicação, atualizar/inativar o resumo anterior também para resultado sem nota, refletindo a nova situação/versão. Pode manter a avaliação visível com nota nula e justificativa de ausência, ou retirar o resumo ativo conforme contrato documentado; não pode manter a nota antiga como atual. Preservar o snapshot anterior para histórico/auditoria. Uma revisão não republicada continua preservando a versão anterior visível ao aluno.

### REV-DIS-09 — entrega e sincronização

Invalidar/versionar a nota antiga da entrega quando o novo resultado confirmado ficar sem nota. Ela não pode permanecer como corrigida/revisada e sincronizável com o valor anterior. Preservar a auditoria e a origem coletiva, sem converter ausência automaticamente em zero.

Se a nota anterior já foi enviada ao Diário, apresentar a divergência na prévia e um caminho explícito de reconciliação/pendência, preservando edição concorrente e confirmação docente. Não apagar notas alheias ou declarar todos os destinos sincronizados enquanto ainda possuem resultado antigo. Tratar também ausência → presença, revisão posterior, resposta perdida/reenvio e falha transacional, com os limites de persistência já validados.

Mudança de presença que altera resultado de avaliação já finalizada/publicada deve sinalizar que o resultado conferido mudou e quais destinos aguardam nova confirmação. Não perder essa informação ao trocar representante ou atualizar outra presença.

## Entrega esperada

Correção delimitada a esse fluxo e dependências necessárias. Preservar as duas novas regressões e todos os testes anteriores. Ampliar integração para nota já sincronizada, reconciliação explícita, retorno à presença e repetição idempotente. Atualizar relatório/capturas do resumo e detalhe após republicação.

Executar suíte completa, lint e build. Nesta revisão não repeti essas verificações integrais após reproduzir o bloqueio; o resultado focado acima não valida a versão futura. **Sem commit/push até revisão neste chat.** Preservar alterações alheias de ENEM/auth.
