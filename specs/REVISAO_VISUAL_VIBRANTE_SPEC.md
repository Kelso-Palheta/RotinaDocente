# Revisão ao Vivo — festival de Arte + game show

04/11/2026. O usuário substituiu explicitamente a direção discreta petróleo/sálvia das telas do aulão por cores vibrantes, animações chamativas e transições marcantes para engajar alunos. Esta é exceção restrita ao novo módulo Revisão ao Vivo; identidade dos demais módulos e cores de notas permanecem intactas.

## Direção visual

Referência conceitual em `docs/evidencias/2026-11-04-revisao-direcao-visual/festival-arte-conceito.png`. É referência de composição/cor, com conteúdo ilustrativo; não reproduzir a imagem inteira como interface, nem cadastrar a obra ou questão fictícia no acervo.

- Fundo de palco violeta profundo #25104A; áreas de destaque violeta #6334E3.
- Acentos ciano #00DDEB, amarelo #FFE14D, coral #FF4F9B, lima #B7F247 e laranja #FF8A3D.
- Superfícies de leitura #FFFDF7 e texto escuro #25104A. Texto claro sobre fundo profundo; não usar texto branco pequeno sobre amarelo/ciano/lima. Conferir contraste mínimo 4,5:1 nos pares de texto, inclusive hover/foco.
- Letras A–E têm cores e rótulos distintos, com igual destaque antes do feedback. Cor de alternativa não indica acerto. Gabarito vem exclusivamente do estado autorizado, após o encerramento.
- Arte original da questão preservada, sem filtros cromáticos/recriação/recorte destrutivo. Decoração geométrica/pop-art fica fora das áreas de leitura. Tema visual pode variar por assunto, com controles estáveis.

## Movimento

- Entrada e mudança de etapa: composição coreografada de 400–800ms; impacto principal de até 1,2s, sem atrasar ações já autorizadas.
- Espera/abertura: letras e formas surgem com energia. Contagem 3–2–1 só quando existir horário de abertura fornecido pelo controlador; não inventar três segundos ou alterar prazo da rodada.
- Resposta individual confirmada: pop breve de confirmação; nunca comemorar resposta ainda pendente ou revelar acerto antecipadamente.
- Respondentes e barras: animação breve com atualização de dados; agrupar chegada em lote e limitar elementos animados para não disparar 500 animações simultâneas.
- Feedback: realçar gabarito e revelar explicações A–E. Ranking: transição de posições recebidas, empate preservado. Confetes breves no encerramento/ranking, sem inventar pontos ou premiados.
- Texto e alternativas ficam estáveis durante leitura; nenhum tremor/zoom constante sobre conteúdo. `prefers-reduced-motion` desativa movimento amplo e partículas, preservando informação e controles. Não adicionar reprodução de áudio automática.
- Animar transform/opacity; nenhuma nova dependência, canvas pesado ou medição de layout por frame. Framer Motion já está instalado, mas uso não é obrigatório. Limpar efeitos em unmount/StrictMode.

## Contratos e validação

Não mudar exports/props, validações, controle por fase, segurança de dados, cronômetro monotônico, recibos, callbacks ou regras de pontuação. Não criar rede/auth/storage, rotas ou Hub. Componentes continuam controlados e não importam o acervo privado. Preservar todo teste existente.

Testes novos: `tests/unit/components/revisao/RevisaoVisualVibrante.test.jsx` para eventos/estados/reduced-motion/limpeza; `tests/unit/revisao_visual_contraste.test.js` para pares semânticos. Definir tokens semânticos próprios no escopo da Revisão, sem alterar tokens globais ou reutilizar cores antigas de marca. Não contornar/editar auditorias globais: conflito deve ser relatado, com a autorização de exceção documentada nesta spec.

Conferir componentes reais em 360/1440/1920px: sem corte horizontal, figuras e A–E legíveis, controles acessíveis por teclado, respondentes com lista de altura limitada. Conteúdo extenso pode precisar de rolagem/paginação controlada; não reduzir tipografia a ponto de perder leitura. Registrar exatamente o que foi verificado e o que permanece pendente.

## Composição de referência para a próxima revisão

A captura do painel finalizado mostra cartões roxos altos e uma coluna de fase com muito espaço vazio. O conceito de “Arte em jogo” apresenta três telas em um storyboard. Aplicar a linguagem visual de cada área à tela correspondente.

- **Identidade comum.** Moldura clara com formas geométricas nas bordas, marca “Arte em jogo” com sombra em camadas e selo amarelo “Revisão ENEM”. Roxo profundo no palco e na faixa de controles. Reservar ciano, rosa, amarelo, lima e laranja para elementos de destaque. A decoração fica atrás do conteúdo e fora da navegação por teclado.
- **Telão na pergunta.** Barra compacta “Telão da turma” com código amarelo e etiqueta ciano da rodada. Em largura suficiente, palco com imagem original à esquerda, enunciado e alternativas ao centro e cronômetro circular com total de respostas à direita. Em questão sem figura, o enunciado ocupa o espaço disponível. A–E em cartões claros, com borda, letra e barra de mesma cor por alternativa. Ordem cromática do conceito: amarelo, rosa, ciano, lima e laranja. Cronômetro e barras consomem os dados já autorizados e deixam os valores legíveis.
- **Painel docente.** Faixa compacta de etapas Conteúdo → Pergunta → Explicação → Ranking, com etapa ativa e ação correspondente ao estado, como “Encerrar pergunta”. Na fase finalizada, resultado e pódio dominam o palco. A conclusão fica em um selo compacto junto ao título, liberando a coluna vazia da captura.
- **Aluno.** Tela clara e de coluna única com faixa roxa no topo. Imagem inteira, enunciado e botões A–E claros e largos, com borda e letra da cor correspondente. Seleção, envio, recibo e feedback mantêm mensagens e controles legíveis.
- **Verificação visual.** Comparar lado a lado com a referência, usando capturas dos componentes reais em pergunta (telão a 1920 px), finalizada (professor a 1440 px) e pergunta (aluno a 360 px). Incluir uma questão extensa sem imagem e checar corte horizontal, foco e movimento reduzido. Usar dados sintéticos em ambiente local e respeitar o contrato de estado.

O escopo é o módulo Revisão ao Vivo. A edição de sala segue em especificação própria.
