# Revisão independente da interface Aula Gamificada

Entrega Antigravity revisada em 18/11/2026. Correções necessárias antes da integração/publicação.

A execução focada encontrou 81 testes recebidos aprovados (58 servidor e 23 interface). Os cinco testes novos da revisão anterior do servidor continuam falhando. Lint da interface e pontos de entrada saiu sem erros/avisos. Capturas entregues são identificadas como fixtures; não comprovam integração autenticada com o servidor.

## Antigravity — corrigir

1. **Gabarito de ordenação alterado ao editar.** `FormularioQuestao.inicializarEstado` usa a ordem de `itens`, ignorando `respostaCorreta`. Salvar sem alteração substitui a resposta correta pela ordem visual original. Inicializar o editor pela ordem correta, preservando IDs, texto e metadados. Teste independente reproduz a inversão i2/i1 → i1/i2.
2. **Repetição sem idempotência.** `BancoQuestoes.handleSalvar` gera requestId novo em cada tentativa. Se a primeira gravação ocorreu e sua resposta se perdeu, a segunda pode duplicar criação ou gerar falso conflito. `PrepararSala` também cria requestId novo, e comandos/respostas dos jogos geram outro em tentativas após falha. Manter o ID junto ao payload da operação pendente, reaproveitando-o em reenvio e reconciliação. Editar payload representa nova operação; erro transitório com payload idêntico mantém a operação. Aplicar também ao rascunho IA: ao editar depois de um salvamento confirmado, o código hoje reutiliza a criação antiga sem expectedRevision, e o servidor retorna a versão anterior silenciosamente.
3. **Todos aparecem como respondentes.** `normalizarEstadoSala` usa `participantes.map` como lista de respostas, mesmo para quem nem entrou. Consumir evidência explícita do servidor de resposta/progresso da rodada, sem associar nome à alternativa. Se o backend ainda não oferecer o campo, manter roster separado e registrar a dependência. Não inferir resposta por presença nem pontuação.
4. **Troca de conta conserva banco anterior.** `HubDocente` mantém catálogo, aba e editor ao trocar UID, enquanto carrega a conta nova. O rascunho antigo pode ser exibido e posteriormente salvo na outra conta. Isolar estado e componentes por UID, ocultar imediatamente dados cujo dono difere da sessão e descartar resultados assíncronos do contexto antigo. Cobrir geração/extração, respostas/comandos pendentes, troca de sala e unmount.
5. **Equipes sem alunos/IDs incompatíveis.** Consumir o roster mínimo que DeepSeek deve entregar conforme `2026-11-18-aula-gamificada-revisao-independente.md`. Interface deve enviar o participanteId do servidor, preservar turma de cada aluno e impedir equipes insuficientes (servidor exige duas). Não deduplicar por aluno.id sozinho entre turmas.
6. **Memória deve consumir faces autorizadas pelo servidor.** Adaptar quando DeepSeek corrigir a projeção. Não depender de receber o texto de todas as cartas ocultas. Reconexão restaura encontradas e viradas, erro de par fecha ambas na ação seguinte e alterações de estado não deixam flags antigas de carta abertas. O estado privado de um jogador não deve aparecer a outro.
7. **IDs manuais de pares denunciam associação.** Editor cria esq_N_par-X / dir_N_par-X. Isso permite deduzir gabarito pelas strings públicas. Gerar IDs independentes e alinhar com a normalização segura que o servidor deve aplicar em qualquer questão, inclusive manual. Manter o mapeamento privado correto.
8. **Geração/extração assíncronas sem proteção de contexto.** Campos continuam editáveis durante pedidos e não há versão/abort para o resultado antigo. Revalidar conta, arquivo, disciplina, conteúdo e tipo antes de aplicar. Falha em novo arquivo não pode reaproveitar texto anterior como se fosse daquele material. Preservar o trabalho do professor de forma coerente e apresentar progresso/erro.

Regressões novas em `tests/unit/components/aula-gamificada/RevisaoIndependenteInterface.test.jsx`: ordenação preservada, requestId reutilizado, respondentes reais e troca de conta. Manter testes existentes e novos, corrigir implementação. Acrescentar cobertura necessária de geração/salvamento revisado, equipes e memória com respostas reais do contrato.

## DeepSeek — complementos de integração

Além da revisão de servidor já recebida:
- Catálogo docente precisa retornar roster autorizado com IDs de participante para preparar equipes.
- Estado docente precisa distinguir presença de resposta/progresso da rodada. Entregar, por exemplo, `respondeu`/`rodadaRespondida` por participante ou lista pública de respondentes sem alternativa, documentando o formato com Antigravity.
- Regenerar/remapear IDs de cartas de pares de entrada manual que revelam associação. `salvarQuestao` atualmente usa normalização padrão e preserva IDs escolhidos pelo cliente; normalização segura não pode depender de geração via IA. Garantir também que ordem pública e algoritmo de embaralhamento não permitam reconstruir pares/ordem corretos a partir de dados públicos e semente conhecida.

## Entrega solicitada

Respeitar fronteiras do plano original, sem modificar arquivos de propriedade do outro agente, auth-context.js ou Revisão pendente. Documentar contratos adicionais mínimos. Após correções, rodar testes focados, lint e build. Entregar diff e relatório sem commit/push até revisão integrada.
