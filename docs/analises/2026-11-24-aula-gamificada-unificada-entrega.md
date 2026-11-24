# Aula Gamificada — unificação e revisão individual

## Resultado
Um único acesso no painel docente e no Portal abre três áreas: Revisão interativa, Sala de jogos, Revisar sozinho. Navegação compartilhada mantém as áreas acessíveis; rotas de salas/códigos e revisões antigas continuam disponíveis.

Os nove jogos atuais passam a funcionar também em casa, sem professor conectado. O aluno escolhe jogo, disciplina, assunto, dificuldade, origem e quantidade. O servidor corrige, registra progresso e revela gabarito/explicação; o aluno avança após ler. Pontos de jogo permanecem separados de notas.

| Experiência | Sala | Em casa | Questões |
|---|---|---|---|
| Quiz | existente | novo | múltipla escolha |
| Memória | existente | novo, viradas persistidas | pares |
| Associação | existente | novo | pares |
| Ordenação | existente | novo | sequência |
| Equipes | existente | treino individual com meta própria | múltipla escolha |
| Heróis | existente | novo, tentativas preservadas | múltipla escolha |
| Tabuleiro | existente | treino com peão/meta próprios | múltipla escolha |
| Natação | existente | raia/progresso individual | múltipla escolha |
| Acerte ou Perde | existente | versão objetiva | múltipla escolha |
| Plataforma | opção «Jogar em plataforma (Quiz)» | V1/V2 preservadas | múltipla escolha |

A plataforma em sala tem percurso/portal por questão e avanço da turma pelo professor. O tempo configurado inclui exploração e resposta; preparação informa isso e oferece atalho acessível. Não transforma silenciosamente salas antigas em plataforma.

## Persistência e privacidade
Novos treinos multijogo usam schema 3. Sessões V1/V2 permanecem compatíveis; não há migração do banco. Publicação explícita por turma passa a aceitar pares e ordenação revisados, além de múltipla escolha. Respostas abertas continuam exigindo professor, sem julgamento automático inventado.

Correção/viradas/avançar são autoritativos no serviço transacional. Validação de vínculo e publicação em cada ação, revisão esperada e requestId vinculado ao payload. Gabarito fica privado até resposta final; memória envia só faces viradas/encontradas; próximas questões não são projetadas. Histórico mantém modalidade, pontos lúdicos, acertos/erros e tentativas. Nenhuma gravação em Diário/notas; nenhuma conta/colega virtual é criado.

Revisão independente identificou e foram corrigidos: flag sem cronômetro, identidade da raia individual e ausência de gabarito visível no feedback genérico. Dez regressões da projeção e quatro de feedback reproduziram falhas antes das correções.

## Evidências
`docs/evidencias/2026-11-24-aula-gamificada-unificada/`: seis capturas da tela real de produção local em desktop/emulação móvel, com conta/questões sintéticas e serviço transacional em memória; módulo, preparação e memória jogável com quatro cartas e virada real enviada ao servidor. Chrome via CDP. Não houve teste em celular físico nem uso de dados reais dos alunos.

Direcionados: 246 testes de regressão dos motores/fluxos e 31 testes específicos da entrega aprovados. Expectativas antigas de comportamento preservadas. Um seletor do teste novo da plataforma foi corrigido de rádio para botão com autorização explícita do usuário.

## Uso
Professor: Aula Gamificada → Sala de jogos → Banco de Questões → questão revisada → Revisar sozinho → liberar para turmas. Aluno: Aula Gamificada → Revisar sozinho → jogo/conteúdo/nível → jogar. Jogos sem questões compatíveis mostram orientação para liberação, sem fabricar conteúdo.

Validação final em cópia isolada sem alterações alheias: 409 arquivos aprovados e 4 ignorados; 1.938 testes aprovados, 10 ignorados (emuladores opcionais). ESLint: zero erros e 22 avisos preexistentes. Build de produção aprovado, incluindo novas rotas do módulo. Capturas conferidas; ausência de teste em aparelho físico permanece declarada.
