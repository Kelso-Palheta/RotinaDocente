# Recuperação semestral por atividades

No **Gerador de Atividades**, abra **Recuperação semestral**.

1. Clique em **Novo conjunto**, escolha turma, semestre e alunos. O ano acompanha a turma; turmas antigas mantêm a indicação de legado.
2. Distribua **10 pontos** entre uma ou várias atividades. Exemplos: uma de 10; duas de 4 e 6; três de 3, 3 e 4. As notas obtidas serão somadas, sem média automática.
3. Enquanto faltar distribuir pontos, o conjunto aparece como **Montagem**: as parcelas ficam em rascunho, ocultas no Portal, sem receber respostas. Ao fechar exatamente 10, as parcelas são liberadas para os destinatários.
4. Após a entrega, abra **Corrigir**. Use correção manual ou IA e confira o feedback. A primeira entrega congela a composição e os destinatários; não é possível redistribuir pontos de um conjunto já respondido.
5. Clique em **Conferir recuperação**. Revise parcelas, total, pendências, recuperação atual e efeito no semestre. Resposta ausente ou não corrigida continua pendente; não vira zero. Uma nota zero corrigida é válida.
6. Selecione os alunos completos e clique em **Lançar recuperação**. Uma nota anterior diferente exige confirmação de substituição. Se o conjunto ou a correção mudar, gere nova prévia.
7. Publique as notas pelo fluxo do Diário para atualizar o boletim. Corrigir, lançar e publicar são ações distintas.

O boletim exportado usa os critérios do bimestre e os mesmos rótulos do Portal: abaixo da média em vermelho, na média em azul, excelente a partir de 8 em verde e ausência como em aberto. A ficha do aluno sem chamadas registradas mostra a frequência como indisponível, sem presumir 100% ou regularidade.

Exemplo: atividades valendo 4 e 6; aluno obtém 3 e 5 → recuperação **8,00**.

O lançamento preenche **Rec. 1** ou **Rec. 2**, conforme o semestre. A fórmula existente usa a recuperação para substituir a menor nota bimestral quando houver melhora, mantendo pesos e critérios de aprovação. Não adiciona oito pontos diretamente ao semestre nem altera as notas originais dos bimestres.

Atividades adaptadas podem ser vinculadas ao conjunto pelo fluxo de publicação adaptada. Quando o material for exclusivo de um aluno, organize um conjunto correspondente aos seus destinatários; todos precisam ter sua distribuição completa de 10 pontos. Revisão das imagens continua obrigatória no fluxo adaptado.

**Cancelar conjunto** impede novas entregas e novas parcelas, preservando entregas e notas já registradas. Não equivale a apagar ou desfazer uma recuperação lançada/publicada.

O aluno consulta atividades liberadas e devolutivas no Portal. O boletim usa as notas publicadas; uma correção recém-salva não atualiza automaticamente o resultado publicado.

Validação técnica: 1.087 testes aprovados em 29/10/2026. Homologação real do fluxo manual e publicação no Portal concluída com dados sintéticos; deploy confirmado. As cinco correções de PDF/visual foram verificadas localmente com dados sintéticos em 28/10/2026, incluindo capturas em 390/1440 px; os dois bloqueios da revisão independente (folga da emissão e medição com a fonte impressa) foram corrigidos em 29/10/2026 e verificados em três PDFs renderizados. Nova homologação em produção, leitor de tela e apresentação não foram executados nesta rodada. Ver `docs/analises/2026-10-28-homologacao-real-recuperacao-semestral.md` e `docs/evidencias/2026-10-28-rn81-correcoes/README.md`.

## Reaproveitar em outra turma

1. Abra o conjunto de origem e, na atividade desejada, clique em **Copiar para outra turma**.
2. Escolha um conjunto de outra turma. Se precisar, use **Criar novo conjunto** e selecione semestre e alunos. O ano acompanha a turma.
3. Confirme o novo prazo e clique em **Revisar conteúdo e prazo**.
4. Confira questões, imagens, rubricas e pontos. Se o saldo do destino for menor, reduza a pontuação das questões antes de salvar. O semestre permanece o do conjunto escolhido.
5. Clique em **Criar cópia**. Repita para as outras parcelas que quiser reaproveitar.

São atividades independentes: respostas, correções, notas e acessos da origem não são copiados. O conjunto de destino continua em montagem até completar 10 pontos; ao fechar 10, libera suas atividades para os alunos destinatários. A cópia não lança nem publica notas no boletim.

Conjuntos cancelados, congelados por entregas ou sem saldo não aceitam novas parcelas. Se o destino mudar durante a revisão, é necessário conferir novamente; repetir uma tentativa já gravada idêntica não duplica a atividade. Cancelar a cópia não apaga um conjunto que você criou explicitamente.

Esta ação atende atividades regulares de recuperação, incluindo imagens compatíveis com o formulário. Atividades adaptadas individualizadas exigem outro fluxo. Revise nomes ou outras informações visíveis no conteúdo antes de usá-lo com novo público; não há anonimização automática. Imagens locais indisponíveis precisam ser anexadas novamente.

Cópia RN-82: 1.060 testes, lint e build aprovados em 28/10/2026; interface conferida em ensaio local isolado. Homologação da cópia com Firestore real e leitor de tela não executada nesta rodada.
