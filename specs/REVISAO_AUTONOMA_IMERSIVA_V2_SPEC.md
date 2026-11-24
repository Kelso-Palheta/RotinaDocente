# Aventura do Conhecimento V2 — desafios no percurso e imersão

Pedido do usuário em 19/11/2026. Complementa `REVISAO_AUTONOMA_PLATAFORMA_SPEC.md`, preservando salas, notas e sessões anteriores. Não considerar este documento uma implementação entregue.

## 1. Experiência
Aluno escolhe tema/conteúdo, dificuldade, quantidade de fases e desafios por fase. Fase passa a ter perguntas distribuídas pelo percurso: estrelas acionam questões e o portal contém o desafio de passagem. Não restringir perguntas ao final nem transformar cada pergunta em uma fase inteira.

Padrões propostos para o incremento: até 3 fases e de 1 a 3 estrelas-desafio por fase, mais 1 questão no portal; portanto 2–4 questões por fase, no máximo 12 por aventura. Sugerir 3 fases × 3 estrelas quando houver 12 questões liberadas; ajustar opções à disponibilidade real do tema. Não fabricar, repetir silenciosamente questões ou importar rascunhos para completar o número. Mostrar quantidade necessária/disponível e permitir escolher configuração menor. Professor pode preparar mais questões pelo fluxo de IA/manual já existente.

Percurso V2 significativamente maior que os 2.200 px atuais: referência 4.500–6.500 px, com áreas visualmente distintas, plataformas alcançáveis, obstáculos, checkpoints distribuídos, estrelas-desafio e portal final. Tempo de exploração não deve ser preenchido por chão vazio repetitivo. Quantidade/posições devem combinar com a configuração pedagógica. Demonstrar percurso real, não apenas botão acessível ou imagem estática.

## 2. Estrelas, questões e pontos
- Encostar numa estrela disponível abre desafio daquela estrela, pausa física/entrada e impede gatilhos simultâneos. Uma pergunta por estrela; cada evento corresponde a uma única questão congelada no servidor.
- Permitir exploração/ordem de coleta livre dentro da fase quando fisicamente possível. Não retornar o banco inteiro para viabilizar isso: servidor abre só o desafio escolhido e autorizado da fase atual.
- Acerto concede 100 pontos de jogo por evento, uma única vez. Erro concede zero e mostra resposta/explicação com incentivo para aprender; não desconta pontos. O portal também vale 100 por acerto. Estes são pontos de jogo, não nota do Diário.
- A primeira resposta aceita define desempenho daquela tentativa. Repetir requisição, coletar a mesma estrela, morrer, recarregar ou ouvir feedback novamente não pode produzir novos pontos ou inflar acertos.
- Depois de confirmar leitura do feedback, retomar o MESMO personagem, câmera e posição na MESMA fase. Estrela resolvida fica marcada como concluída (com distinção de acerto/erro), não pode disparar novamente. Não remontar o Canvas a cada pergunta.
- Portal só libera passagem quando os desafios previstos da fase foram respondidos, inclusive os errados com feedback confirmado. Exibir progresso, por exemplo: “2 de 3 estrelas revisadas”. Não obrigar acertar novamente uma pergunta cujo gabarito já foi revelado para avançar.
- Checkpoint/queda não apagam desafios nem pontos confirmados. Retomar sessão restaura fase, eventos resolvidos e feedback pendente, sem recolher estrelas já usadas.
- Modo acessível continua: permite selecionar os mesmos desafios disponíveis sem exigir saltos, com mesmas regras de aprendizagem e pontuação. Não deve pular questões obrigatórias nem premiar destreza motora como nota.

## 3. Autoridade, persistência e compatibilidade
Servidor controla mapa de eventos/questões da fase, abertura de um desafio por vez, respostas, acertos, pontos, feedback e passagem. Cliente não fornece gabarito, pontos concedidos ou eventos concluídos. Posição física é apresentação; não vender antitrapaça de movimento ou usá-la para nota.

Usar versão de schema explícita: sessões atuais V1 continuam retomáveis com suas regras originais. Novas sessões V2 recebem configuração de fases/eventos e snapshots privados. Não migrar destrutivamente históricos nem alterar silenciosamente resultados anteriores. Catálogo dos nove jogos ao vivo permanece com nove modalidades.

Desenhar contrato antes do código para abrir/responder/confirmar evento e avançar fase, com revisão esperada e requestId. Estado público contém somente posições/IDs/estados dos eventos, progresso e questão atualmente aberta, sem gabaritos futuros. Congelamento, vínculo ativo, professor/turma corretos, retirada de liberação e isolamento por aluno continuam obrigatórios.

Persistir campos separados de pontos do jogo e acertos/aproveitamento pedagógico. Não usar 100 pontos ou estrelas para calcular notas. Histórico deve mostrar fases, desafios respondidos, acertos/erros e pontos, preservando tentativas. Reforço dos erros não sobrescreve primeira tentativa.

Manter documentos abaixo do limite Firestore: verificar bytes reais do snapshot completo e evitar documento monolítico acima do limite. Limitar quantidade e/ou separar questões privadas em subcoleção, com leituras antes de escritas e tamanho de respostas públicas controlado. Não expor chaves de IA ou criar geração paga pelo aluno.

## 4. Tela cheia e orientação
Separar preparação da aventura do gesto de entrar/retomar o jogo. Ao tocar “Jogar”/“Continuar”, solicitar fullscreen e desbloquear áudio diretamente no gesto, antes de aguardar chamadas de rede. Não depender de pedido fullscreen depois de um await que perde ativação do usuário.

Solicitar orientação landscape quando suportada, normalmente depois de fullscreen. Não prometer suporte universal nem usar APIs depreciadas. Se negado/indisponível, manter partida funcional em área imersiva e oferecer aviso dispensável para girar o aparelho. Não rotacionar toda a página por CSS como falso bloqueio de orientação. Modo acessível também deve funcionar em retrato.

Canvas, HUD, perguntas/feedback, menu, áudio e controles precisam estar DENTRO do elemento fullscreen. Perguntas continuam legíveis/roláveis em landscape baixo. Oferecer pausar, sair da tela cheia e retomar; nunca prender Escape/voltar do navegador. Pausar ao perder foco/ocultar aba/sair de fullscreen; limpar teclas e ponteiros para evitar movimento preso. Não perder dados confirmados.

Referências oficiais verificadas em 19/11/2026:
- https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
- https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock

## 5. Controles de jogo
- Direcional horizontal no canto inferior ESQUERDO (botões grandes ou controle virtual), pulo no canto inferior DIREITO, bem separado. Multitoque real: andar e pular simultaneamente.
- Alvos confortáveis de pelo menos 56 px, preferência 64–80 px conforme viewport; respeitar safe areas/notch, não cobrir perigos/portal nem alternativas. Layout adaptável a celulares pequenos em landscape.
- Tratar pointerdown/up/cancel/lostcapture/blur/unmount; preventDefault/touch-action só no palco/controles, sem impedir rolagem das perguntas. Limpar todos os inputs ao abrir desafio, pausar ou sair.
- Preservar teclado com setas/A/D e espaço/W, inclusive maiúsculas. Nada de teclas do jogo sendo capturadas em campos, botões de respostas ou menu. Controles acessíveis e foco visível.
- HUD compacto: fase, estrelas respondidas/acertos, pontos, pausa e som. Configuração/histórico ficam fora do palco durante a partida para maximizar área útil.

## 6. Áudio e feedback em todos os jogos da Aula Gamificada
Auditar as nove modalidades ao vivo E o modo autônomo, no professor/telão/aluno quando aplicável. Não presumir som funcional só porque existem arquivos e botões. Verificar gesto de desbloqueio, autoplay recusado, mute/volume salvos, aba oculta e retomada. Não religar preferência silenciada.

Reutilizar o motor audiovisual compartilhado e seus perfis, evitando tocadores/contextos concorrentes. Revisão autônoma atualmente não usa esse motor: integrar trilha temática, coleta, salto/queda leves, acerto, erro, passagem e conclusão. Música/efeitos seguem a preferência já escolhida pelo usuário: em todos os aparelhos, com controle individual.

Adicionar componente compartilhado de feedback emocional: acerto com estrelas/fogos/confetes e efeito de conquista; erro com reação temática de surpresa/tristeza leve e mensagem de apoio; fase/vitória com celebração mais forte. Variar cenas para não repetir sempre o mesmo visual. Sem humilhação, flashes agressivos, áudio estridente contínuo ou animação que impeça ler explicação.

Disparar apenas após resultado confirmado/revelado, com evento estável por sessão/sala/rodada/desafio/resposta. Polling, rerender, reconexão, retry e StrictMode não repetem pontos, som ou fogos. Diferenciar acerto, erro, parcial, sem resposta e correção manual pendente; não inferir vitória a partir de qualquer pontuação positiva. No telão, feedback coletivo não pode atribuir resultado individual sem dados apropriados.

Respeitar prefers-reduced-motion e o botão de reduzir animações; alternativa estática equivalente, mute/volume persistidos, cleanup de RAF/timers/listeners/áudio. Sons devem vir de assets locais autorizados ou síntese; não introduzir hotlinks frágeis ou downloads pagos.

## 7. Aceite e testes
- Novos testes RED para eventos no percurso, perguntas por fase, ordem livre, limite/configuração insuficiente, pontos exatamente uma vez, erro sem bônus, confirmação de feedback, portal bloqueado/liberado, morte/retomada e schema V1 compatível.
- Autorização/revogação/troca de conta, concorrência e requestId com payload diferente, questões/gabaritos futuros privados, nenhuma escrita em notas. Preservar regressões de recuperação 409/422/429 e de conta já recebidas.
- Testes reais de multitoque, teclado simultâneo, cancelamento, overlay, foco, fullscreen/orientation negados e pausa. Não validar fullscreen apenas por screenshot de viewport grande.
- Testes de áudio com autoplay bloqueado, gesto, mute preservado, um controlador por aparelho e idempotência do feedback em todas as nove modalidades e no autônomo.
- Ensaio jogável completo no desktop e em viewport móvel landscape: coletar estrela, responder, retornar à posição, coletar outra, abrir portal, avançar e retomar após reload. Emulação deve ser identificada; se não testar aparelho físico, declarar.
- Evidências reais com dados sintéticos, contagens observadas, lint/build/suíte integral e revisão de diff antes de publicar. Não afirmar “perfeito”, desempenho garantido ou compatibilidade universal com base só nos testes.
