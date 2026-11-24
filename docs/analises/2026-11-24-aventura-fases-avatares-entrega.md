# Aventura do Conhecimento — seis fases, estrelas e avatares

## Resultado
O jogo de plataforma de Revisar sozinho chama-se Aventura do Conhecimento. Agora permite até seis fases e 24 perguntas distintas, três estrelas-desafio mais portal por fase, conforme material liberado do assunto/nível escolhido. Com doze perguntas continua sugerindo três fases de três estrelas; com 24 sugere seis fases completas. Não fabrica nem repete perguntas para completar percurso.

As estrelas não tinham sido removidas: com uma pergunta só existe portal; com uma ou duas estrelas a primeira ficava em x=3155/x=1765, fora da tela inicial. Novos percursos colocam a primeira estrela na primeira área, visível desde o começo. Avisos explicam explicitamente a ausência de estrelas quando só há uma pergunta. Teste com robô que anda/pula de verdade alcança todas as estrelas e o portal nas seis fases, com uma, duas e três estrelas.

Layout versionado: novas aventuras usam layoutVersao 3; sessões antigas sem campo continuam usando 2, mantendo posições/checkpoints e respostas. Fases extras variam padrões de plataformas/obstáculos, sem alterar regras físicas, colisões ou notas.

## Personagens
Oito SVGs originais e locais, com prévia e escolha acessível: Léo e Lia (exploradores), Kai e Maya (guardiões), Caio e Luna (astronautas), Pixel (robô), Faísca (raposa estelar). Opções masculinas/femininas e personagens fantásticos. AvatarId validado por lista fechada, congelado no snapshot e retomado com a sessão. Defaults seguros no legado, sem migração ou gravação ao ler sessão antiga.

Renderer Canvas usa o sprite escolhido, com fallback visível enquanto a imagem carrega. A escolha não altera hitbox, física, pontuação ou permissões e não reinicia o percurso ao abrir uma questão. Não há imagens externas, uploads ou chamadas adicionais de IA.

## Verificação
- Direcionados: 139 testes aprovados.
- Revisão independente: 18 testes dos quatro arquivos novos e auditoria de compatibilidade, whitelist, assinatura/idempotência, material disponível e ligação do avatar até o Canvas; sem defeito funcional novo identificado.
- Testes de desenho confirmam uso de drawImage sem mutar jogador; fallback preserva personagem durante carga/falha.
- Alterações em testes existentes restritas às expectativas autorizadas dos limites: 9→13 configurações para doze questões e teto 12→24; demais expectativas intactas.
- Cinco capturas reais de UI: preparação, oito personagens, versão móvel e jogo com Pixel e primeira estrela visível, em desktop e emulação landscape. Conta/material sintéticos e serviço real com armazenamento transacional em memória. Pasta: `docs/evidencias/2026-11-24-aventura-avatares/`.

Limite da evidência: emulação Chrome não substitui teste em iPhone físico. Partidas antigas conservam seu tamanho e posições; seis fases/primeira estrela antecipada valem para novas aventuras. É necessário liberar perguntas suficientes para o conteúdo e dificuldade escolhidos.

Validação final em cópia publicável isolada: 414 arquivos aprovados e quatro ignorados; 1.958 testes aprovados, dez ignorados (emuladores opcionais). ESLint sem erros, 22 avisos existentes; build de produção aprovado. As cinco alterações alheias do workspace foram excluídas da entrega.
