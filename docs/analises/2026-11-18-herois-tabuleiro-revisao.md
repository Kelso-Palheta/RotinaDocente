# Revisão independente — Heróis e Tabuleiro

18/11/2026. Entrega em revisão, com falhas reproduzidas antes da publicação.

## Evidências

O teste focado recebido apresentou 113 casos aprovados e uma falha no contrato antigo de catálogo, que espera exatamente cinco modalidades. O usuário autorizou em 18/11/2026 a atualização dessa expectativa. Foram acrescentados somente os IDs herois e tabuleiro em tests/integration/aula_gamificada_banco.test.js; todas as demais verificações permanecem intactas.

Nova suíte independente `tests/unit/components/aula-gamificada/HeroisTabuleiroRevisaoIndependente.test.jsx` reproduziu seis falhas em entradas reais da interface. A única alteração autorizada em teste existente é a lista do catálogo descrita acima. Os arquivos da preparação de sala foram atualizados durante a revisão, portanto a validação final deve usar a versão mais recente.

## Correções necessárias

1. **Envio desconectado (dois testes).** `SalaAlunoView` já calcula `bloqueado` com base em conexão/prazo/ocupação, mas não repassa esse bloqueio às duas novas modalidades. `JogoHerois` e `JogoTabuleiro` continuam habilitando alternativas quando desconectados. Propagar o estado real e manter distinção de resposta pendente/confirmada.
2. **Idempotência de tentativa.** Os jogos chamam `onResponder({alternativaId})` sem requestId pendente e sem aguardar/capturar rejeições. Falha de rede após gravação pode consumir a segunda tentativa nos Heróis ou perder a confirmação do Tabuleiro. Usar ID estável por payload/tentativa pendente, tratamento visível do erro e reconciliação com recibo do servidor. Após primeira tentativa confirmada como errada, a segunda tentativa precisa de ID novo mesmo se repetir a alternativa. Bloquear duplo clique em voo e impedir rejeição de Promise sem tratamento.
3. **Movimento reduzido.** O Tabuleiro continua renderizando GIF de carta mesmo com preferência de movimento reduzido ativa. Usar imagem estática correspondente para cartas, vitória e qualquer outra mídia animada. O controle deve efetivamente alterar a mídia, incluindo a preferência do sistema e o toggle manual.
4. **Feedback pedagógico docente (dois testes).** O fluxo de `SalaDocenteView` substituiu o painel genérico pelos componentes temáticos durante `feedback`, mas os novos componentes não exibem a explicação nem destacam o gabarito após revelação. Exibir o feedback real da rodada no painel e telão. Durante pergunta, preservar segredo; feedback individual dos Heróis é permitido somente ao próprio aluno.
5. **Catálogo inteiramente dinâmico.** `HubDocente` ainda contém aba `Catálogo (5 jogos)` e contagem 5; `AcessoAulaGamificada` e metadados do módulo também precisam refletir o total real. Não basta alterar título e um badge. Não mascarar falha de carregamento com contagem padrão arbitrária.
6. **Equipes do Tabuleiro.** Garantir máximo de quatro equipes no cliente e no servidor. Revalidar alunos autorizados/IDs, ausência de equipe e troca de turmas. Adicionar uma turma quando já há integrantes não deve deixar os novos alunos invisivelmente fora de todas as equipes. Preparação precisa de prévia editável consistente com a sala realmente criada. Preservar o limite próprio da modalidade `equipes` existente.
7. **Fidelidade e evidências.** Entregar relatório desta implementação e capturas reais desktop/celular das duas modalidades, incluindo pergunta, erro/repetição, revelação, avanço e encerramento. Comparar com a composição dos slides fornecidos. Os cenários/mídias originais devem compor o palco de jogo, com textos dinâmicos e controles responsivos. Confirmar vitória/celebração nas fases em que os componentes temáticos são realmente montados. Verificar imagens e áudio, não somente existência dos arquivos extraídos. Identificar fixtures sintéticas.

## Aceite do retorno

Manter as seis regressões independentes e todos os demais testes. Acrescentar cobertura específica dos casos de tentativa/reenvio, equipes e feedback. Rodar testes focados, lint e build na versão final dos arquivos; corrigir erros de lint na implementação sem desligar regras. Não alterar testes existentes para forçar aprovação, salvo a única expectativa de catálogo se autorizada pelo usuário. Preservar alterações alheias de Revisão e auth-context.js. Entregar para revisão, sem commit/push.
