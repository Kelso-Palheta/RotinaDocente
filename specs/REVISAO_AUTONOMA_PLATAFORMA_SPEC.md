# Revisão autônoma — Aventura do Conhecimento (plataforma 2D)

## Objetivo aprovado em 19/11/2026
Primeiro jogo efetivamente jogável de plataforma 2D para qualquer disciplina, acessível pelo Portal em computador/celular, sem sala, código ou professor conectado. Aprendizagem registrada separadamente da destreza motora, sem escrever notas do Diário.

## Conteúdo e autorização
- Professor libera explicitamente questões revisadas de múltipla escolha do banco da Aula Gamificada para turmas próprias. Questões privadas, rascunhos e respostas abertas não entram automaticamente. Edição retira a liberação, pois o banco normaliza a questão como uma nova versão sem metadados de publicação.
- Aluno autenticado por cookie do Portal escolhe professor/conteúdo liberado à sua matrícula ativa, disciplina, dificuldade e de 1 a 10 desafios disponíveis. Não expor gabaritos no catálogo, IDs de login ou chaves de IA. Não há geração paga nem chave docente no cliente discente.
- Revalidar matrícula/turma não arquivada, existência do aluno e publicação em cada operação de sessão. Histórico pessoal não expõe dados de outro aluno; vínculos revogados não dão acesso aos resultados/conteúdos do professor.

## Jogo
Movimento horizontal, salto, gravidade, colisão com chão/plataformas, obstáculos e retorno ao checkpoint. Cada fase tem estrelas para coletar e um portal de conhecimento. Obstáculos/quedas não afetam acertos nem percentuais. Controles de teclado e toque, pausa em aba oculta e modo acessível para ir diretamente ao desafio pedagógico. Não exigir habilidade motora para revisar conteúdo.

## Sessão e aprendizagem
- Sessão individual com cópia privada congelada de até dez questões autorizadas; somente questão atual sem gabarito viaja ao aluno. Ordenação de alternativas definida na criação.
- Uma resposta por questão/tentativa de revisão. Primeiro envio aceito determina acerto/erro; reenvio idempotente recupera o mesmo resultado. Cliente não fornece pontuação, acerto, proprietário nem progresso persistido.
- Resposta libera feedback com gabarito/explicação somente daquela questão. Aluno confirma leitura para avançar à fase seguinte. Revisão livre permite erros e novas tentativas sem alterar a tentativa anterior. No final, opção de nova revisão somente dos erros ainda publicados.
- Resposta inclui ID da questão, revisão esperada e requestId. Avanço também transacional/idempotente. Recarregar retoma a fase/feedback atual; checkpoints motores não valem nota nem são autoridade de aprendizagem.
- Histórico mantém últimas cinquenta sessões resumidas por aluno, com disciplina, conteúdo, dificuldade, acertos, erros, progresso e datas. Sessões anteriores continuam armazenadas; nenhuma alegação de histórico ilimitado na interface. Uma sessão ativa pode ser retomada; recomeçar exige escolha explícita.

## Contratos
Prefixo `/api/revisao-autonoma`: GET `catalogo`, POST `publicar` (docente), POST `sessoes`, GET `sessoes/:id`, POST `sessoes/:id/responder`, POST `sessoes/:id/avancar`, GET `historico`. JSON privado/no-store, cookie do Portal ou Bearer docente existente; POST exige origem compatível e limite de corpo. Somente servidor acessa Firestore Admin.

Persistência: metadados de liberação na questão do professor; `revisaoAutonomaAlunos/:loginKey` com índice pessoal limitado a cinquenta resumos, subcoleções `sessoes/:id` e `requisicoes/:requestId`. Identificadores validados, transações com todas as leituras antes de escritas. Nada escreve coleções de notas, avaliação, redação ou salas ao vivo.

## Aceite
RED/GREEN em física, colisões/respawn, isolamento, vínculo revogado, ausência de gabarito futuro, idempotência/conflito de versão, restauração e reforço de erros. Testes de UI para acessibilidade/toque e publicação explícita. Capturas reais de componentes com dados sintéticos desktop/celular; revisão independente de autenticação/persistência; suíte integral, lint e build aprovados antes de commit/push.

Proteção de uso: no máximo trinta novas revisões por hora/aluno; leitura e retomada continuam disponíveis. Consulta do banco filtra o indicador de liberação para evitar ler questões privadas desnecessariamente.
