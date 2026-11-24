# Aventura do Conhecimento — fases, estrelas e avatares

Aprovado em 24/11/2026: seis fases, até 24 questões distintas, três estrelas-desafio e um portal por fase; oito avatares originais. Atualizar apenas expectativas antigas ligadas aos limites/quantidade de configurações, preservando os demais testes.

## Estrelas
Não foram removidas: uma questão oferece apenas portal; com uma estrela ela aparecia em x=3155 e com duas em x=1765, fora da tela inicial de 900 px. Layout novo coloca a primeira estrela na primeira área. Exibir claramente quando só há uma questão e, portanto, nenhuma estrela-desafio. Não duplicar perguntas, fabricar material ou dar pontos acadêmicos por enfeites.

Layout versionado: novas sessões usam layoutVersao 3; antigas sem essa propriedade usam 2, preservando posições, checkpoints e progresso. Servidor e cliente usam a mesma versão e número de estrelas. As fases 4–6 variam os padrões do percurso e continuam alcançáveis pela física existente. Sugestão prioriza aproveitar questões disponíveis e três estrelas por fase, preservando 3×3 com 12 questões e oferecendo 6×3 com 24. Limites validados também no servidor.

## Avatares
Oito personagens originais com silhuetas e cores distintas: Léo (explorador), Lia (exploradora), Kai (guardião), Maya (guardiã), Caio (astronauta), Luna (astronauta), Pixel (robô), Faísca (raposa estelar). Arte vetorial local, com opções masculinas/femininas e personagens temáticos. Escolha visível e acessível na preparação da plataforma, com prévia, rótulo e seleção indicada. Novo treino preserva avatarId no snapshot; servidor valida lista fechada. Histórico/retomada conservam o avatar da sessão, com padrão seguro para legado. Avatar é cosmético: não muda física, colisões, respostas, pontos, permissões ou notas.

Canvas desenha sprite selecionado com fallback durante carregamento. Nenhuma imagem externa/URL fornecida pelo cliente. Mudança visual não remonta a física ao abrir uma questão. Respeitar movimento reduzido e manter controles/áudio móvel existentes.

## Aceite
Configurações e criação real com 24 questões/6 fases, rejeição acima dos limites e material insuficiente; privacidade/idempotência/retomada. Primeira estrela visível no layout novo; antigo estável. Oito arquivos de arte distintos e usados de fato pelo renderer, seleção/payload e avatar inválido recusado. Física alcança estrelas/portal nas seis fases. Testes completos, lint/build e capturas sintéticas desktop/mobile antes de publicação.
