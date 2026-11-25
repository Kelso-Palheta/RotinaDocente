# Planejamento vinculado à Aula Gamificada

## Design aprovado
Professor cria e salva plano, escolhe jogo, seleciona ou gera questões, revisa e prepara uma partida preenchida. Plano não cria/publica sala automaticamente; pontuação, permissões, histórico e revisão de notas permanecem nos serviços atuais.

## Contrato da primeira entrega
- Plano privado por professor: id, revision, titulo, disciplina, anoEscolar, conteudo, objetivo, duracaoMinutos (10..240), modalidade canônica, experiencia (padrao/plataforma/resgate somente em Quiz), turmaIds, questaoIds e etapas (3..10; id, titulo, minutos, tipo introducao/jogo/fechamento, orientacao). Texto simples com limites. Soma dos minutos igual à duração; pelo menos uma etapa de jogo. Rascunho pode ter zero turmas/questões.
- Modelos: aula livre (abertura, desafio, fechamento) e Resgate (abertura, três missões, fechamento). Etapas editáveis; não gerar códigos BNCC, mapas ou software por IA. Questões podem vir do banco privado ou do gerador atual por tema/material.
- `GET /api/aula-gamificada/planos` lista resumos privados; `GET /planos/:id` lê plano; `POST /planos` salva {plano,expectedRevision,requestId}. Limite100 por professor, revisão otimista e idempotência; requisições repetidas não duplicam planos. IDs, turmas e questões sempre resolvidos no namespace docente. Não expor planos pelo catálogo público nem ao aluno.
- Salvamento precisa persistir entre recargas e contas isoladas; sem fallback silencioso para armazenamento local. Conflitos pedem reabrir versão atual.
- Planejar aula é acesso adicional do Hub. Gerar questões recebe disciplina, anoEscolar, conteúdo e modalidade do plano salvo. Questões novas só entram após salvamento/revisão existentes; retorno ao planejamento permite seleção explícita. A edição do plano não é descartada ao alternar telas.
- Preparar partida recebe título, modalidade/experiência, turmas e questões do plano salvo. Envia planoId/planoRevision; servidor lê sua versão privada na transação, valida revisão e correspondência de modalidade/experiência/questões. Se desejar trocar questões ou jogo, atualizar plano antes; tempo/formato/finalidade continuam configuráveis na preparação.
- Sala e índice docente guardam snapshot imutável `plano` com id, revision, titulo, objetivo e etapas. Etapas de jogo recebem questaoIds distribuídos em ordem; snapshot é referência de condução docente, sem mudar o motor do jogo. Alterar plano depois não reescreve sala. Salas antigas continuam válidas.
- Docente/projeção exibem referência do planejamento e etapas, sem substituir comandos atuais. Alunos continuam recebendo somente pergunta atual e feedback autorizado.
- Preparar revisão em casa reutiliza liberação por questão/turma no banco atual; salvar plano ou criar sala não publica conteúdo para alunos automaticamente. Não criar fluxo paralelo de notas.

## Aceite e testes
Novos testes RED antes de src: persistência/lista/leitura, isolamento professor/aluno, revisão e idempotência, duração/etapas inválidas, turmas/questões alheias, vínculo de sala e snapshot imutável, prefill da geração/preparação e navegação sem perda do plano. Preservar todos os testes existentes. Suíte, lint/build, capturas desktop/mobile e revisão independente antes do commit/push autorizado.

## Ampliação: módulo independente

O contrato é ampliado por `MODULO_PLANEJAMENTO_SPEC.md`: planos regulares não exigem modalidade/questões; escalas longas usam períodos, não minutos fictícios. Campos ausentes em planos antigos mantêm comportamento gamificado de aula. Jogos avulsos continuam independentes.
