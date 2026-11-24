# Aula Gamificada — módulo único e treino autônomo

## Escopo aprovado em 24/11/2026
Um acesso principal docente e discente; três áreas: Revisão interativa, Sala de jogos, Revisar sozinho. Preservar rotas antigas e todos os registros. Nove modalidades existentes permanecem no catálogo canônico; plataforma é experiência adicional, sem quebrar o contrato antigo do catálogo.

## Experiências
- Revisão interativa preserva integralmente o motor ENEM, introduções por tema, revelação e ranking.
- Sala de jogos conserva as nove modalidades e avaliação explícita. Plataforma em sala é apresentação opcional de Quiz: percurso até o portal para responder a questão corrente, próxima fase comandada pelo professor. Não altera a experiência autônoma V2 de estrelas e portais.
- Revisar sozinho mantém plataforma V1/V2 e acrescenta as nove modalidades. Seleção por disciplina/conteúdo/dificuldade/origem, quantidade compatível e jogo. Em jogos coletivos, treino individual com meta de progresso e indicação clara, sem alunos/bots falsos e sem pontuação externa no histórico. Em casa, o próprio aluno lê feedback e avança, sem professor conectado. Não impor cronômetro.
- Quiz, Equipes, Heróis, Tabuleiro, Natação e Acerte ou Perde aceitam a variante objetiva; Memória e Associação usam pares; Ordenação usa sequência. Abertas exigem julgamento docente, portanto não são liberadas ao treino automático.
- Cada modalidade preserva sua mecânica: memória vira cartas com faces autorizadas pelo servidor; associação relaciona colunas; ordenação move itens; heróis tem tentativas; tabuleiro avança peão; natação avança raia; equipes vira meta individual de treino; acerte tem progressão de rodadas. Reusar componentes e funções de domínio existentes, sem nove cópias do motor.

## Servidor e persistência
Extensão compatível do serviço autônomo: sessões novas multijogo têm schema 3 e modalidade explícita; V1/V2 permanecem legíveis e jogáveis. Questões congeladas privadas, liberação explícita por turma, vínculo atual revalidado a cada ação, revisão esperada, requestId idempotente vinculado ao payload e limites existentes. Nunca enviar gabarito/faces de memória ocultas/questões futuras. Feedback aparece após resposta final; nenhuma escrita em notas. Retomar preserva estado e modalidade. Histórico distingue modo e jogo, acertos/erros e pontos lúdicos, com tentativas quando aplicável. Erro ou edição do banco não migram sessões antigas.

## Aceite
Matriz de nove modalidades + plataforma × sala/autônomo; testes de criação/ação/feedback/avanço/conclusão/retomada, privacidade, isolamento e idempotência. Navegação única docente/aluno sem perder atalhos. Capturas desktop/mobile sintéticas, testes completos, lint e build antes da publicação. Preservar alterações alheias. Não alterar expectativas de testes antigos sem autorização específica.
