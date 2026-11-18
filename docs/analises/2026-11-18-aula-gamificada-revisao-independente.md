# Revisão independente da entrega do DeepSeek

Resultado em 18/11/2026: correções necessárias antes da integração/publicação.

Os 58 testes recebidos do servidor passaram em execução independente. A revisão acrescentou cinco regressões em dois arquivos novos e reproduziu falhas. Nenhum teste recebido foi alterado.

## Correções do DeepSeek

1. **Memória expõe faces ocultas.** `questaoPublica` devolve texto/imagem de todas as cartas, e `projetarEstado` os repassa ao aluno antes da primeira virada. Navegador permite inspecionar o tabuleiro completo. Entregar somente IDs de cartas ocultas; texto/imagem de cartas viradas/encontradas são projetados individualmente pelo servidor. Recibos e reconexão precisam conter as faces que o jogador pode ver, além dos IDs. Não basta esconder via CSS. Preservar feedback final e estado do docente. Acrescentar cobertura de duas identidades distintas, cartas erradas/fechadas e pares encontrados.
2. **Entrada pode apagar pontos.** `entrar` lê participante fora de transação e faz `store.set` com cópia inteira. Outra aba pode entrar e responder antes dessa gravação, e os pontos voltam ao valor antigo. Tornar entrada atomicamente consistente com respostas, revalidar autorização e atualizar presença preservando os demais campos. Testar repetição e corrida.
3. **Pontos antecipam o gabarito.** Após responder, `eu.pontos` já muda durante a pergunta. Acerto fica detectável antes da revelação. A lista de participantes do docente também publica os pontos atualizados. Projetar pontuação consolidada de rodadas reveladas, ou omitir a pontuação ainda não revelada, preservando totais finais e equipes. O recibo privado deve continuar confirmando recebimento, sem denunciar acerto.
4. **Troca de rodada devolve questão antiga.** `comandar` lê o conteúdo da rodada atual e o reutiliza na projeção de `proxima`, mesmo após incrementar rodada. Retornar imediatamente conteúdo congelado da rodada nova. Ler todos os documentos necessários antes de começar escritas na transação Firestore.
5. **Limpeza remove matemática legítima.** `limparTextoIA('Se x < 2 e y > 3, compare x e y.')` remove o trecho entre `<` e `>`. Preservar desigualdades, fórmulas e texto legítimo, mantendo o tratamento seguro de HTML ativo. Usar renderização textual/segura da interface. Verificar também preparação de ordenação para não sanitizar apenas itens e deixar gabarito textual incompatível.

Regressões novas obrigatórias:
- `tests/integration/aula_gamificada_revisao_independente.test.js` (4 casos).
- `tests/unit/aula_gamificada_matematica_revisao.test.js` (1 caso).

## Integração com Antigravity

Há incompatibilidade objetiva na criação de equipes. O catálogo do servidor entrega turmas apenas com `id/nome/totalAlunos`, enquanto `PrepararSala` exige `turma.alunos`. Mesmo se recebesse alunos, a interface envia `aluno.id`, enquanto o servidor espera ID de participante derivado de turma + aluno via SHA-256 no runtime.

DeepSeek deve disponibilizar no catálogo docente uma lista mínima do roster por turma, com ID estável de participante já calculado no servidor, alunoId e nome. Antigravity deve consumir esse ID, manter alunos homônimos/mesmo ID local de turmas distintas e respeitar o mínimo de duas equipes validado pelo servidor. Documentar o formato adicional no relatório para a integração. Manter o contrato HTTP existente e privacidade discente.

## Retorno solicitado

Corrigir somente sua parte do plano original. Preservar arquivos da interface em edição pelo Antigravity, auth-context.js e Revisão pendente. Manter os cinco testes de regressão e testes recebidos. Executar testes do servidor, novos testes, lint e build. Atualizar relatório com resultados reais, sem commit/push até revisão integrada. Coordenar por relatório a mudança mínima de roster/estado da memória, para Antigravity adaptar a interface.
