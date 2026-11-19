# Revisão independente — imersão audiovisual

Data: 19/11/2026. **Entrega ainda não aprovada para publicação.** Não iniciar integração de cards/disputas antes de corrigir esta entrega.

## Evidência executada

- Suíte focada existente: **36 arquivos / 164 testes aprovados**.
- Novas regressões: `tests/regression/aula_gamificada_imersao_revisao.test.jsx`, **11 testes falhando** pelos problemas abaixo. Nenhum teste existente foi alterado.
- Inspecionados código, catálogo, SVGs e captura `05-herois-revelacao-desktop.png`. A captura confirma a ausência do palco na revelação do aluno.
- Não repeti suíte completa/lint/build após reproduzir os bloqueios. O relatório de entrega não substitui a validação da versão corrigida.

## 1. REV-IM-01/02/03 — reação contradiz o estado real da resposta

`audiovisual/ProvedorAudiovisualSala.jsx:derivarContextoAudiovisual` trata qualquer `fase='feedback'` como acerto por padrão. Mas a fase começa quando o professor **encerra** a pergunta, com `revelado=false`, antes de revelar a resposta.

Além disso, consulta `feedback.correta`, campo ausente do contrato real: feedback contém gabarito/explicação; o resultado individual autorizado vem no recibo (`correta`, `pontuacao`, estado de Heróis etc.). Consequências reproduzidas:

- Sem revelação, já toca/seleciona acerto.
- Após revelação, aluno com resposta errada recebe situação `acerto`.
- Resultado parcial também vira acerto integral.

Derivar estados a partir do contrato real normalizado e da autorização de revelação. Antes dela, mostrar espera/recebimento neutro, com as exceções individuais já autorizadas de Heróis/Memória. Distinguir erro, parcial, ausência e acerto, sem inferir acerto por falta de dados. Telão/docente mostram revelação coletiva neutra, sem afirmar que todos acertaram. Revisar também a derivação local de `JogoHerois`, que igualmente converte feedback sem recibo em `acerto`.

## 2. REV-IM-04/05/11 — integração de fases incompleta nas telas reais

- Ranking não tem caso próprio no derivador: uma projeção em ranking recebe evento sonoro de `abertura`.
- Em `SalaAlunoView`, o palco genérico da seção feedback usa **`ranking` fixo**; portanto exibe celebração/pódio também para erro.
- Heróis e Tabuleiro só são montados dentro do bloco `fase==='pergunta' && questao`. Na seção feedback, `modoTemPalcoProprio` impede o palco genérico e nenhum palco próprio é montado. **O aluno fica sem GIF/cena exatamente na revelação**, como mostra a captura fornecida.

Integrar espera, pergunta, resposta recebida, encerramento aguardando revelação, revelação, ranking e finalização nos caminhos reais de aluno, docente e projeção. Reutilizar um contexto de evento coerente para som e imagem; não disparar efeitos duplicados por derivadores locais e pelo provedor. Testar erro e parcial com DTO real, não apenas renderizar os componentes isolados.

## 3. REV-IM-06/07 — áudio não destrava pelos gestos prometidos

- O desbloqueio está ligado aos comandos do docente e à alternativa de Heróis. Na sala real do aluno, clicar numa alternativa do **Quiz** não chama o desbloqueio; outros modos também precisam ser cobertos.
- No áudio sintético, `AudioContext.resume()` pode permanecer pendente com `state='suspended'`. O código só marca bloqueio se houver rejeição; fica silencioso sem exibir necessidade de ativação. A regressão reproduz esse estado.

Desbloquear as APIs necessárias dentro do gesto real, cobrindo os sete jogos e a aba de projeção. Tratar contexto suspenso/promise pendente, rejeição e efetiva reprodução sem declarar sucesso indevido. Não depender de um clique extra no painel quando a ação de entrada/jogo já destrava áudio. Preservar mute escolhido pelo usuário, uma trilha por página e limpeza de listeners/timers.

## 4. REV-IM-08 — efeito torna audível o volume zero

`MotorAudioJogo.tocarEfeito` faz ducking com `Math.max(0.05, volume*0.35)`: com volume zero, a trilha MP3 sobe para **5%**. Reproduzido no teste. `tocarNota` também força ganho mínimo positivo mesmo quando o volume solicitado é zero.

Zero deve continuar silêncio. Implementar mix/ganho coerente para música e efeitos, respeitando mute e ajustes durante a execução. Ducking só reduz a trilha, não a aumenta. Parar/liberar vozes concluídas e limitar sobreposição; não deixar sons continuarem por timers após saída/ocultação.

## 5. REV-IM-09 — redução manual não interrompe os SVGs animados

Nas cenas SVG dos cinco jogos, `alternativaEstatica` aponta para o **mesmo SVG animado**, com `animation: ... infinite`. A media query interna observa apenas a preferência do sistema; o botão manual do aplicativo não altera essa preferência, e um SVG em `<img>` não recebe a classe/estado interno do React.

Entregar uma alternativa realmente estática ou uma forma verificável de controlar/parar o movimento no modo manual. Preservar também a preferência do sistema. Não resolver apenas trocando nomes de arquivo ou retirando o teste: verificar que a alternativa não contém animação ativa. Legendas, resultados e controles continuam disponíveis.

## 6. REV-IM-10 — falha de uma mídia desativa as próximas

`PalcoCenaJogo` guarda `erroMidia=true` sem limpar ao mudar cena/URL. Depois de uma falha, a próxima cena válida também exibe somente texto. Resetar/reconciliar erro por mídia e usar fallback adequado, sem loop infinito de imagens quebradas. Cobrir troca de cena e troca entre animada/estática.

## 7. Catálogo: variedade não pode mudar o significado do evento

O catálogo usa cartas com mensagens/regras como variantes intercambiáveis: no Tabuleiro, `carta-avance-1.gif` e `carta-avance-2.gif` pertencem à mesma situação genérica de acerto. A rotação pode escolher uma carta que anuncia duas casas quando o servidor avançou uma. Igualmente, passe de vez e erro precisam refletir o evento confirmado, sem inventar nova tentativa no Tabuleiro.

Selecionar primeiro pelo resultado semântico exato (avanço, quantidade de casas, turno, erro, prazo), depois variar apenas cenas compatíveis. Rever a correspondência entre alternativas estáticas e animadas; peão/casa genéricos não devem perder a informação essencial da carta. Acrescentar teste de avanço de uma/duas casas, passe e erro no fluxo real.

## 8. Direção sonora e evidências

O relatório chama os loops de “multi-voz”, mas `iniciarLoopSintetico` agenda uma única nota de oscilador por intervalo; os cinco jogos dependem de sequências curtas semelhantes. Completar a direção musical solicitada (identidade, ritmo/harmonia/camadas e dinâmica por fase) e as transições/ducking também no sintetizador. Heróis/Tabuleiro tocam o mesmo MP3 sem tratamento musical específico por fase; garantir que revelações, ranking e encerramento tenham transições perceptíveis e coerentes.

Validar **ouvindo** as trilhas/efeitos reais, além dos mocks. Não afirmar recursos ausentes no código. A limitação de GIF sem áudio foi declarada corretamente e pode permanecer, mas o procedimento reproduzível precisa funcionar nos sete jogos; atualmente o primeiro gesto não destrava todos eles.

## Entrega de correção

Corrigir todos os itens, preservando as **11 novas regressões** e testes anteriores. Ampliar testes para situações dos itens 7/8 e para o conjunto aluno/docente/projeção, presença de feedback ainda oculto, pontuação parcial e caminhos reais de gesto.

Reexecutar suíte completa, lint e build. Atualizar relatório e capturas reais de Heróis na revelação de acerto/erro, dos demais modos em revelação/ranking, e demonstração sonora reproduzível. Manter alterações de cards/disputas em tarefa separada e preservar arquivos alheios de revisão ENEM/auth. **Sem commit/push até nova revisão neste chat.**
