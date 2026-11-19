# Aula Gamificada — experiência audiovisual e variedade de cenas

Data: 19/11/2026. Escopo autorizado pelo usuário: ampliar imagens/GIFs de Heróis; tornar **os sete jogos** empolgantes com trilhas, efeitos, animações e transições; variar imagens/GIFs para evitar monotonia. Preferência confirmada: **música e efeitos em todos os aparelhos**, incluindo os alunos.

Ler antes de implementar: `AGENTS.md`, `RULES.md`, `PRD.md`, `TESTS_SPEC.md`, `AULA_GAMIFICADA_SPEC.md`, `AULA_GAMIFICADA_HEROIS_TABULEIRO_SPEC.md` e `AULA_GAMIFICADA_AVALIACAO_SPEC.md`.

## 1. Diagnóstico e direção escolhida

- `JogoHerois.jsx` limita a mídia a `max-h-40` (160 px) e seleciona basicamente quatro GIFs para todos os estados. Existem **19 GIFs** originais em `public/aula-gamificada/herois/`, com personagens/cenas distintos que ainda não são aproveitados pelo fluxo.
- `ControladorAudioJogo.jsx` inicia com `somAtivo=false`; os controladores estão dentro dos jogos Heróis/Tabuleiro, sujeitos a desmontagem/troca de rodada. Os demais modos não compartilham uma direção sonora por fase.
- As cenas originais variam de aproximadamente 245×163 a 518×426. Aumentar o contêiner não aumenta a resolução da mídia.

Adotar uma camada audiovisual compartilhada com temas próprios para `quiz`, `memoria`, `associacao`, `ordenacao`, `equipes`, `herois` e `tabuleiro`. Usar mídias originais, CSS/SVG e áudio local/Web Audio. Essa composição permite variações e funciona em aparelhos modestos; vídeos de tela inteira e um motor 3D completo acrescentariam peso sem serem necessários ao resultado pedido.

## 2. Palco de Heróis e biblioteca visual

### Tamanho e composição

- Transformar a mídia em protagonista: em desktop/telão, palco com aproximadamente 40–50% da largura útil da área da questão e altura adaptativa em torno de 280–420 px; na revelação, permitir destaque de 360–520 px quando a altura disponível comportar.
- Em celular, palco de largura útil, aproximadamente 180–260 px de altura, com controles e alternativas legíveis. Ajustar também paisagem e notebooks baixos; não empurrar a experiência inteira para fora da tela.
- Usar `object-fit: contain`, proporção preservada, fundo/cenário complementar e moldura temática. Não cortar rosto/legenda da mídia nem esticar GIF pequeno até ficar visivelmente degradado. Usar variantes maiores/originais vetoriais quando necessário.
- Animações de transição não devem mover o botão sob o dedo, bloquear respostas ou esconder o texto explicativo.

### Variedade obrigatória

- Criar catálogo explícito de cenas: ID, jogo, situação compatível, mídia animada, alternativa estática, proporção, origem e descrição. Revisar o movimento real dos GIFs, não classificar somente pelo nome do arquivo ou miniatura.
- Heróis: usar personagens, poses e ações distintos; contemplar no mínimo três variantes de acerto, três de erro, duas de nova tentativa e duas de celebração final, reutilizando os 19 GIFs adequados e complementando com cenas originais quando faltar cobertura. Uma cena pode servir a eventos compatíveis, mas erro/nova chance não deve virar vitória por acaso.
- Para cada um dos outros jogos, pelo menos duas cenas de sucesso, duas de erro/retentativa, duas de vitória/finalização, uma de espera e uma de desafio. Variantes precisam diferir em composição/pose/ação, não só cor ou texto.
- Seleção estável por evento, com rotação/embaralhamento controlado: não repetir a mesma cena em ocorrências consecutivas de uma situação quando houver alternativas. Rerender, recibo duplicado ou reconexão não sorteiam outra cena para o mesmo evento nem repetem efeitos.
- Explicação pedagógica e mídia da questão têm prioridade; a animação decorativa não pode substituir a imagem didática anexada.
- Reutilizar assets locais existentes e criar complementos originais. Registrar arquivos e caminhos reais; não usar placeholders, URLs quebradas, bibliotecas remotas de GIFs ou ampliar artificialmente a resolução declarada. Carregar só mídia atual e, no máximo, próximas variantes relevantes.

## 3. Trilha emocional e eventos visuais

O percurso deve ter identidade em todas as fases, com intensidade ajustada à tarefa. Manter movimento ambiental discreto durante leitura; reservar explosões e transições fortes para eventos.

| Momento | Direção visual | Direção sonora |
| --- | --- | --- |
| Espera/entrada | Personagens/cenário vivo, chegada de participantes e convite à missão | Loop temático de expectativa |
| Abertura de rodada | Entrada do tema/questão e transição de cenário | Vinheta curta + trilha de desafio |
| Resposta recebida | Confirmação imediata e clara de registro | Clique/confirmado; sem fingir acerto |
| Últimos segundos | Acento no relógio, pulsação crescente | Tensão progressiva e sinal final, sem disparar som a cada atualização de relógio |
| Revelação de acerto | Explosão gráfica, personagem/pose de conquista, alternativa correta destacada | Acorde/impacto de vitória, trilha temporariamente reduzida |
| Revelação de erro | Reação temática breve, recuperação/encorajamento, explicação legível | Contraste sonoro curto e acolhedor |
| Nova tentativa em Heróis | Reação diferente de derrota final, energia recuperada e convite claro | Sinal de retomada |
| Ranking | Entrada dos lugares, contagem visual e destaque de posição | Vinheta de pódio |
| Encerramento | Celebração final distinta da comemoração por questão | Fanfare + resolução da trilha |

Temas: Heróis = aventura em quadrinhos e energia; Tabuleiro = exploração em blocos, peças e progresso; Quiz = programa de perguntas; Memória = descoberta de cartas/pares; Associação = conexões visuais; Ordenação = sequência/mecanismo montado; Equipes = arena cooperativa. Todos continuam adequados a qualquer disciplina.

O telão mostra revelação coletiva; não atribuir um erro individual a toda a turma. Aluno vê sua própria reação conforme o resultado autorizado. Destacar avanços de peões, pares encontrados, conexões e posições corretas conforme a modalidade, sem inventar resultados.

## 4. Áudio ligado e coordenação por aparelho

- **Padrão confirmado: trilha e efeitos habilitados em todos os aparelhos.** Não aplicar por conta própria “só efeitos no celular” ou “só música no telão”.
- Navegadores podem bloquear áudio antes de gesto local. Preparar a preferência ligada e iniciar/resumir o áudio no gesto real de Entrar/Iniciar/Continuar ou primeiro toque/clique apropriado, com chamada a `play()`/`AudioContext.resume()` dentro do gesto quando necessário. Cada nova aba de projeção pode exigir seu próprio toque.
- Se houver bloqueio, exibir estado honesto “Toque para ativar o som”; não afirmar que está reproduzindo quando `play()` foi rejeitado. Não exigir um segundo botão se o gesto de entrada já permite destravar. Fonte: [MDN — autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).
- Um gerenciador por página/aparelho, acima da montagem de cada rodada, evita trilhas duplicadas e reinícios contínuos. Integrar os controles de Heróis/Tabuleiro à camada comum, sem dois players concorrentes.
- Controles visíveis de som geral, volume, música e efeitos. Respeitar preferências escolhidas pelo usuário nas rodadas seguintes e na recarga; nunca religar uma preferência explicitamente silenciada.
- Dar perfis próprios aos sete jogos e transições por estado, com loops musicais estruturados, melodias/ritmo e vinhetas. Um beep repetido não substitui uma trilha. Reutilizar os dois MP3 originais quando adequados; novos arranjos/assets locais originais podem complementar os demais modos sem serviços pagos.
- Volume inicial moderado; reduzir a trilha sob efeito relevante e restaurar suavemente. Limitar vozes simultâneas, não acumular alarmes, normalizar volumes e evitar clipping. Trocar de fase com fades curtos; não reiniciar faixa a cada polling.
- Suspender reprodução em aba oculta/saída da sala e tratar retorno sem sobreposição. Liberar timers, listeners, nós de áudio e mídia no unmount/troca de conta. Falha de mídia não interrompe o jogo.

## 5. Regras de dados preservadas

- Camada audiovisual reage ao estado autorizado do servidor. Não modifica cronômetro real, tentativas, pontos, notas, avaliação, sincronização, publicação, permissões ou persistência.
- Uma resposta apenas enviada/recebida não implica acerto. Em jogos com gabarito oculto, revelar acerto/erro somente quando o servidor autorizar; Heróis preserva seu recibo individual imediato e as duas tentativas existentes. Memória preserva os estados individuais já permitidos.
- Usar identidade de evento com sala, rodada, tipo e tentativa/recibo ou revisão pertinente. Evitar retrigger por polling, StrictMode e reconexão, mantendo nova animação em nova tentativa/rodada real. Não trocar cena de feedback por causa de presença atualizada.
- Não criar writes no Firestore ou requisições extras por animação/som. Professor continua controlando o avanço; vinheta nunca aumenta prazo, envia resposta, avança rodada ou recalcula nota.

## 6. Movimento, desempenho e acessibilidade

- Entrada de cenas e revelação com impacto em cerca de 300–900 ms; comemoração breve de aproximadamente 1–2 s, sem impedir leitura/avanço. A música pode continuar enquanto a cena se estabiliza.
- Priorizar transform/opacity, animação vetorial leve e poucas camadas; limitar partículas, evitar flashes rápidos e tremor de página inteira. Testar celulares e texto grande/questões longas.
- Preservar `prefers-reduced-motion` e controle manual; modo reduzido usa cena estática e feedback equivalente. Não remover informações de acerto/erro, foco de teclado ou alternativas. Redução de movimento não obriga desligar música.
- Respostas, relógio e navegação devem continuar operantes se asset falhar, o aparelho ficar lento ou a preferência de áudio for bloqueada.

## 7. Arquivos e contratos

Pontos de integração: `components/aula-gamificada/SalaDocenteView.jsx`, `SalaAlunoView.jsx`, `AcessoAlunoView.jsx`, `jogos/ControladorAudioJogo.jsx`, `JogoHerois.jsx`, `JogoTabuleiro.jsx`, `JogoQuiz.jsx`, `JogoMemoria.jsx`, `JogoAssociacao.jsx`, `JogoOrdenacao.jsx`, catálogo/gerenciador audiovisual compartilhado e `public/aula-gamificada/`.

Preservar contratos e testes existentes. Há teste legado em `HeroisTabuleiroUI.test.jsx` que monta o componente isolado com som desligado e verifica o toggle. O novo padrão das salas reais pode ser configurado explicitamente na integração/gerenciador, preservando o comportamento legado da API isolada. **Não alterar expectativas existentes para fazer passar, não detectar ambiente de teste e não enfraquecer as novas verificações de áudio ligado nas salas reais.** Se uma incompatibilidade exigir modificar teste antigo, reportar o ponto exato antes da mudança.

Preservar alterações locais de outras tarefas, especialmente `components/revisao/*`, `lib/auth-context.js`, previews e capturas não relacionadas. Não redesenhar o site inteiro nesta entrega.

## 8. Aceite e entrega para revisão

Criar testes antes de implementar e mapear a nova cobertura em `TESTS_SPEC.md`. Cobrir:

1. Os sete jogos no percurso real de aluno/docente/projeção, com preferência inicial de música e efeitos ligada e sem players duplicados.
2. Desbloqueio por gesto, bloqueio/rejeição reais de autoplay, persistência de mute/volume, troca de rodada, StrictMode, aba oculta/retorno e cleanup.
3. Revelação correta/incorreta, feedback parcial, retentativa de Heróis, falha de envio e prazo encerrado; sem antecipar gabarito.
4. Mesma atualização recebida várias vezes não repete som/animação. Novo evento produz efeito novo e cena compatível; não há repetição consecutiva quando existe variante.
5. Palco maior nos breakpoints, proporção, alternativa estática, arquivos locais existentes, caminhos válidos e estados completos sem placeholders.
6. Avaliações, relatórios, publicação versionada, sincronização, regras dos jogos e testes anteriores permanecem aprovados.

Entregar relatório, inventário de cenas/trilhas e capturas reais desktop/celular com dados sintéticos. Incluir gravação curta de Heróis mostrando acerto → erro/nova tentativa → revelação → ranking/vitória e demonstração dos outros seis jogos. Preferir gravação com o áudio realmente reproduzido pelo app; se a ferramenta não capturar áudio, declarar a limitação e fornecer procedimento/artefato reproduzível para ouvir os eventos, sem adicionar trilha artificial para simular funcionamento.

Executar suíte completa, lint e build. **Entregar sem commit/push para revisão neste chat.**
