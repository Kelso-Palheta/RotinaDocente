# Revisão independente — audiovisual e disputas

Data: 19/11/2026. **Ainda não aprovar/publicar o conjunto.** As alterações audiovisuais e de disputas estão misturadas nas mesmas telas; esta revisão considera ambas.

## Evidência

- Suíte focada existente: **39 arquivos / 181 testes aprovados**, incluindo as 11 regressões audiovisuais anteriores.
- `tests/regression/aula_gamificada_disputas_revisao.test.js`: **6 falhas reproduzidas**, usando IDs SHA-256, APIs públicas do serviço e transações que proíbem leitura após escrita e só confirmam gravações ao final.
- `tests/regression/aula_gamificada_imersao_semantica.test.jsx`: **3 falhas reproduzidas** em requisitos semânticos já pedidos na revisão audiovisual anterior.
- Nenhum teste existente foi alterado. Não executei nova suíte completa/lint/build após identificar os bloqueios; repetir essas verificações na versão corrigida.

## REV-DIS-01 — identificação ambígua do representante

`validarEquipes` aceita `representanteAlunoId` mesmo quando dois integrantes de turmas diferentes têm o mesmo ID local. A regra de autorização de `responder` compara apenas `participante.alunoId` com esse campo; não identifica unicamente o representante. A troca de representante e a confirmação de presença também aceitam IDs locais sem resolver ambiguidades.

Usar o participante estável (SHA-256 de turma + aluno), ou identidade composta equivalente, da preparação até criação, envio, troca e auditoria. Rejeitar identificações legadas ambíguas; preservar as inequívocas. O teste reproduz a aceitação ambígua na validação; a comparação inadequada no envio foi confirmada por inspeção. Acrescentar integração demonstrando que o outro aluno homônimo de ID não consegue enviar, além do caso autorizado e da troca.

## REV-DIS-02 — pontos coletivos antecipam acerto antes de revelar

Depois de uma resposta compartilhada correta, `atualizarPontosParticipantes` atribui pontos a todos os integrantes. A projeção tenta ocultar pontos procurando registro pelo ID individual, mas o registro compartilhado usa `eq_<equipe>`. Resultado reproduzido: Beto, integrante que não enviou, recebe `estado.eu.pontos=1000` enquanto `rodada.revelado=false`.

Ocultar toda pontuação não autorizada da rodada por escopo correto, incluindo resultados de equipes. Preservar as exceções individuais legítimas de Heróis/Memória, sem expor antecipadamente pontos a adversários/telão. Cobrir tanto aluno quanto projeção, reconexão e reenvio idempotente.

## REV-DIS-03 — pontuação compartilhada multiplicada por integrantes

Uma única resposta de grupo correta vale 1000, mas os 1000 pontos são replicados em cada integrante e `calcularRanking` soma os integrantes novamente. Reproduzido em Equipes: grupo de dois recebe **2000** pela única resposta. Um grupo maior ganha vantagem sem acertar mais.

Computar o placar compartilhado uma vez por evidência do grupo/rodada. Manter a nota coletiva explicitamente compartilhada entre presentes como conceito separado do placar. Não corrigir dividindo arbitrariamente pelo tamanho do grupo: usar evidências e preservar acumulado, parciais, tentativas e idempotência. Cobrir grupos de tamanhos diferentes e troca de representante.

## REV-DIS-04 — formatos em grupo mantêm ranking individual

`calcularRanking` escolhe ranking coletivo apenas por `modalidade === 'equipes' || 'tabuleiro'`. Novos grupos de Quiz (e demais jogos liberados pela matriz) continuam com ranking de alunos. O teste via fluxo criar evidência → encerrar → revelar → ranking devolve IDs dos três alunos em vez de `g1`/`g2`.

Derivar ranking pelo formato de participação, modo de resposta e mecânica. Preservar ranking individual/duelo e o critério específico de casas/pontos do Tabuleiro. Grupo com respostas individuais soma resultados individuais; resposta compartilhada usa o resultado único do grupo. Atualizar DTOs, normalização e apresentação de ranking docente/discente/projeção para os sete jogos, não só a função de domínio.

## REV-DIS-05 — ausência registrada não impede nota coletiva

Sequência reproduzida: Beto entrou anteriormente; docente executa `confirmar_presenca` com `substituir=true`, mantendo somente Ana presente; o participante Beto fica `presenteConfirmado=false`, mas recebe nota **10** no relatório.

`gerarRelatorioSala` usa `p.presenteConfirmado === true || Boolean(p.entrouEmMs)`, ignorando o `false` explícito. A decisão docente registrada deve prevalecer sobre evidência histórica de login. Distinguir presença não confirmada de ausência confirmada. Não atribuir nota coletiva a ausente, nem transformá-lo em nota zero sem decisão explícita. Cobrir relatório, finalização, publicação e Diário; manter contexto/auditoria dessa decisão.

## REV-DIS-06 — nova disputa aceita grupo vazio

Criar Quiz em `grupos/individual` com grupo vazio e outro grupo contendo todos os alunos é aceito. O servidor só exige membros para resposta compartilhada. A especificação exige impedir grupos vazios.

Validar grupos não vazios na configuração nova e cobertura dos participantes selecionados, sem alterar retroativamente contratos de salas legadas. Nenhum aluno selecionado deve ficar sem grupo silenciosamente. Preservar validação de integrantes duplicados/fora do roster, equilíbrio editável e limites do Tabuleiro.

## REV-DIS-07 — faltam controles operacionais e transparência coletiva

As operações `alterar_representante` e `confirmar_presenca` existem no servidor, mas **não há controles correspondentes na tela docente**. O professor só escolhe representante na preparação. Em grupo usando um único aparelho, não consegue confirmar presentes pela interface para atribuir nota corretamente, nem trocar representante durante a partida conforme solicitado.

Adicionar controles docentes acessíveis, com estado atual, integrantes por turma, IDs estáveis, confirmação da gravação, revisão/conflito, auditoria e recuperação de falha. Não reiniciar tentativas/prazo/pontos ao trocar representante. Validar permissões pelo servidor.

O domínio adicionou `origemColetiva`/`criterioColetivo`, porém relatório visual, PDF/CSV e devolutiva do aluno não os apresentam. Completar identificação do formato, grupo, autoria, composição/presença congelada e critério individual/coletivo, conforme a spec. Informar separadamente pessoas presentes e respostas únicas de grupos, sem fingir múltiplos envios individuais. O aluno deve entender quando a nota é coletiva. Acrescentar cobertura pelos percursos reais da interface e exportações.

## REV-IM-12/13/14 — semântica audiovisual ainda incompleta

`derivarContextoAudiovisual` agora consulta o recibo, mas:

- Pontuação parcial vira **erro total**.
- Aluno sem resposta/recibo vira **erro**.
- Revelação no telão/docente vira **acerto**, mesmo sem resultado individual aplicável.

Essas distinções já foram exigidas no item 1 da revisão audiovisual anterior. Completar estados/cenas/sons para parcial, sem resposta/aguardando e revelação coletiva neutra. Preservar acerto/erro individuais somente quando aplicáveis e autorizados. Não resolver apenas alterando a string do derivador enquanto o catálogo usa fallback aleatório para cenas semanticamente erradas; integrar os estados ao catálogo e às telas.

## Entrega esperada

Corrigir todos os itens acima, preservando **as nove novas regressões** e todos os testes anteriores. Adicionar testes de integração/UI para representante, presença, ranking por grupos e identificação coletiva nas exportações. Não alterar testes existentes para forçar aprovação nem tocar arquivos alheios de revisão ENEM/auth.

Entregar relatório atualizado e capturas reais desktop/celular de ranking coletivo, confirmação de presença/troca de representante, resultado parcial e revelação neutra no telão. Executar suíte completa, lint e build. **Sem commit/push até nova revisão neste chat.**
