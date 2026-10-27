# RN-79/RN-80 — ciclo de implementação

## Perceber
Auditorias aprovadas apontaram origem antiga/cache global de Analytics, critérios divergentes e PDF com notas zero indevidas. Revisão de commits recentes reproduziu troca de conta na repetição, perda de rascunho/legado e apagamento visual após erro parcial.

## Decidir
Dataset consultivo único e leitor do repositório autenticado do Diário. Sem gravação ao abrir Analytics. Proteção de operações assíncronas por conta; pendência persistente e decisão explícita em diferenças com a nuvem. Portal atualiza seção somente quando sua consulta tem sucesso.

## Agir
Specs RN-79/RN-80 e novos testes antes das correções. Regressões de dados, filtros, semestres, PDF integral, contexto e foco. Nenhum teste preexistente ou evidência histórica alterado.

## Verificar
Primeira suíte completa: 893 testes/189 arquivos aprovados e build aprovado. Refinamentos posteriores acrescentaram testes de escala semestral, símbolos/paginação do PDF, taxa por turma, comparação semântica de horário e foco do diálogo. Conferência visual sintética desktop/celular e download de PDF concluídos, sem erros de execução e sem rolagem horizontal em 390 px. Resultado final: 900 testes/196 arquivos aprovados, lint sem alertas e build de produção aprovado. Uma rodada simultânea com build/lint encontrou timeouts e foi interrompida; os dois testes passaram isoladamente, a rodada sequencial de 899 e a rodada final de 900 também passaram. Nenhum teste nem timeout foi relaxado.

## Revisão independente
A revisão final identificou que tema/turno podiam contornar a confirmação de conflito. Dois testes adicionais reproduziram o problema antes da correção. Agora saveState restringe toda edição normal ao dispositivo enquanto houver conflito; apenas o reenvio confirmado autoriza nuvem. Revisão independente do ajuste confirmou resolução; nova suíte completa aprovada com 902 testes/198 arquivos. Build final aprovado (exit 0), lint sem alertas; pronto para commit/push autorizado.
