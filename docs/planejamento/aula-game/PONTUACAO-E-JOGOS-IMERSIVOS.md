# Aula Game — pontuação consistente e roteiros jogáveis

Data: 25/11/2026. Proposta de desenho pedagógico e de produto. Não modifica notas, partidas, planilhas originais, código ou specs. Configurações abaixo são recomendações para a próxima especificação; ainda não são regras adotadas no sistema.

## 1. Retificação baseada nos arquivos originais

Foi conferido o XML da planilha `Matriz_de_Avaliacao_Formativa_e_Desempenho_Gamificado.xlsx`, incluindo as fórmulas das colunas G e H. A fórmula em G5 é `C5+D5+(E5*2)+F5`: participação e colaboração valem até 10 cada, entrega até 10 com peso 2 e bônus até 5. Portanto, o máximo é **45**. Ouro a partir de 35 é alcançável nessa planilha, equivalendo a aproximadamente 77,78% do máximo.

A anotação inicial que agrupava essa planilha com o manual de máximo 35 estava incorreta. O peso 2 não pode ser ignorado. A classificação da planilha usa testes `<20` e `<35`, que também cobrem resultados fracionários; a descrição textual “20 a 34” é menos precisa que a fórmula.

| Fonte | O que efetivamente está definido | Divergência a resolver |
|---|---|---|
| mat-05, XLSX | `participação + colaboração + 2×entrega + bônus`; máximo 45; cortes 20/35 | Escala diferente dos outros arquivos; células sem lançamentos também são somadas como zero pela planilha |
| mat-09, DOCX | Participação, colaboração, entrega sim/não e bônus; exemplos totalizam 29 e 15 | Valor 5 para entrega é inferido dos exemplos, não explicitamente parametrizado; máximo 30 sob essa hipótese |
| mat-10, DOCX | Repete a tabela inicial de entrega sim/não, mas o manual descreve rigor científico de 0 a 10 | São dois tipos de dado diferentes. A leitura das três métricas numéricas sem peso resulta em máximo 35; não há peso 2 explícito como no XLSX |
| mat-14, guia | Quatro eixos apresentados como acréscimos de 10; faixas 0–25/26–35/36–40+ | Não define claramente notas intermediárias nem se acertos se acumulam por questão. Máximo 40 só vale quando cada eixo tem teto 10, aplicado uma vez |

Consequência: não importar fórmulas, bônus e faixas de fontes distintas como se fossem uma única rubrica. Preservar os originais como referência, com a interpretação identificada.

## 2. Decisão confirmada: reaproveitar a pontuação atual

Atualização de 25/11/2026, após esclarecimento do usuário: não há obrigação de seguir a planilha. A primeira versão dos roteiros jogáveis deve usar as regras de pontuação e avaliação já existentes nos jogos. Não introduzir uma rubrica numérica paralela, faixas Bronze/Prata/Ouro ou novos pesos como requisito.

### Pontuação durante a partida

Reutilizar `frontend/src/dominio/aula-gamificada/pontuacao.js` e as regras da modalidade escolhida. A base objetiva utiliza até 1.000 pontos por desafio: múltipla escolha pontua acerto; pares, ordenação e memória possuem cálculo proporcional. Jogos com turnos, equipes, tentativas ou movimento no tabuleiro conservam seus critérios específicos.

Nos futuros Resgate, Guardiões e Jornada, os desafios do mundo devem se ligar a essas respostas e evidências. A história, o inventário e os desbloqueios mudam a experiência; não precisam criar outra escala de pontuação. Recompensas visuais podem acompanhar conquistas já confirmadas, com cuidado para reenvio/retomada não duplicarem pontos.

### Avaliação e nota

Reutilizar `frontend/src/dominio/aula-gamificada/avaliacao.js` e o serviço correspondente. A nota é calculada pelo aproveitamento individual e pelo valor máximo configurado, com conferência e finalização docentes. Não usar posição no ranking, moedas, casas ou o total bruto do placar como substitutos automáticos dessa evidência.

Exemplo simples: dez questões de mesmo peso, todas abertas e elegíveis; oito acertos geram 8.000 pontos na base objetiva e 80% de aproveitamento. Se a atividade valer 5, a nota calculada será 4,00, sujeita à conferência existente. Parciais, tentativas, ausências e oportunidades seguem as regras já implementadas, sem inventar uma conversão única de pontos brutos para todos os jogos.

A finalidade continua explícita: revisão/treino conserva seu histórico de aprendizagem; atividade avaliativa usa ano, turma, bimestre, valor e critérios confirmados pelo professor. Preservar a distinção entre pendência, ausência, falta de oportunidade e zero.

### O que fica fora da primeira entrega

A normalização de rubricas para 0–100%, pesos por critério e cortes sugeridos de 65%/90% eram uma alternativa de planejamento. **Não serão adotados nesta proposta inicial**, conforme a preferência do usuário. Rubricas adicionais podem ser discutidas futuramente se houver necessidade de avaliar produção, argumentação ou colaboração com critérios próprios. Observações qualitativas e feedback podem ser registrados sem criar uma nota paralela.

As divergências dos materiais ficam resolvidas, para fins de integração, tratando suas fórmulas como referências externas e mantendo o motor atual como fonte da verdade para pontuar e avaliar. As planilhas originais permanecem intactas; seus pesos e limites não serão importados.

## 3. Transformar roteiro em jogo de verdade

É viável. A narrativa precisa alterar as ações disponíveis, os objetivos, os obstáculos e as consequências observáveis. Não basta trocar título, fundo ou personagem de um quiz.

| Roteiro | Experiência jogável proposta | O que o aluno faz |
|---|---|---|
| Operação de Resgate | Investigação em mapa 2D com ambientes, objetos e inventário | Explora, coleta evidências, compara pistas, usa ferramentas e escolhe soluções; decisões liberam locais e modificam o cenário |
| Desafio dos Guardiões | Estratégia cooperativa com proteção de áreas e gestão de recursos | Distribui papéis, enfrenta desafios por etapas, escolhe prioridades e vê efeitos das decisões da equipe; evidências individuais continuam registradas |
| Jornada do Especialista | Aventura com fases, personagens, caminhos e desafio final | Aprende habilidades, aplica conceitos em obstáculos, resolve missões e usa o que aprendeu numa combinação final |

Questões objetivas, associação e ordenação existentes podem ser interações dentro do mundo: relacionar pista a evidência, organizar eventos para operar uma máquina, escolher ferramenta conforme um conceito ou interpretar uma imagem para desbloquear um acesso. Respostas abertas exigem análise docente ou avaliação por critérios revisável; não são liberadas como correção automática autônoma sem contrato próprio.

Exemplo de episódio: **Resgate do Rio**, em Ciências. O aluno percorre uma região fictícia, recolhe amostras virtuais, interpreta dados fornecidos no jogo, identifica uma fonte de poluição e escolhe intervenções. A solução escolhida muda visualmente o rio e os recursos da missão. Feedback explica a relação entre os dados, a decisão e o resultado. O desafio final combina evidências anteriores; não é apenas um conjunto de perguntas guardado para o fim.

O mesmo motor pode receber uma investigação histórica ou cultural, desde que cenários, ações e desafios sejam autorados para o tema. Reutilizar motor não significa fingir que todo conteúdo cabe nas mesmas interações.

## 4. Arquitetura recomendada para essa imersão

- **Motor de aventura reutilizável:** mapa, movimentação/interações, inventário, condições de desbloqueio, objetivos, checkpoints, estados de tentativa e consequências.
- **Episódio configurado por dados:** cenário autorizado, personagens originais, objetos, missão, evidências, questões vinculadas, ajudas, feedback e condições de conclusão.
- **IA gera rascunhos desses dados:** não executa código arbitrário e não inventa um motor novo a cada solicitação. O professor revisa fatos, adequação e respostas antes de liberar.
- **Reaproveitamento:** autenticação, turmas, questões, correção compatível, áudio/feedback disponíveis, histórico e avaliação. Plataforma atual pode ser ampliada para a Jornada; investigação e estratégia exigem comportamentos próprios.
- **Dois modos:** em sala, professor conduz/libera etapas quando configurado; em casa, o aluno progride pelas condições da missão, recebe feedback e retoma o checkpoint. Regras e evidências centrais são compartilhadas, sem exigir professor conectado no treino autônomo.
- **Jogabilidade acessível:** computador e celular, teclado e toque, caminhos legíveis, interface responsiva, movimento reduzido, áudio com controle e ativação após interação inicial. Agilidade motora e rapidez não devem substituir o objetivo curricular na avaliação.
- **Persistência:** resultados e desbloqueios confirmados pelo servidor; gabaritos futuros e dados de outras contas permanecem privados. Conteúdo revisado é congelado por sessão. Cancelamento, retomada e reenvio não duplicam recompensas.

## 5. Primeiro produto jogável recomendado

**Um motor de investigação 2D e um episódio original de Resgate, com três missões encadeadas**, ligado ao banco de questões e com feedback no cenário, inventário e checkpoint. Incluir um ciclo completo: entrada → exploração → desafio → consequência → recuperação/ajuda → nova missão → resultado e histórico. O professor consegue adaptar conteúdo dentro das interações suportadas e revisar antes da aplicação.

A experiência deve ser testada em sala e no modo autônomo, com desktop/celular, erro/acerto, ajuda, retomada e conclusão. O primeiro episódio reutiliza a pontuação, o histórico e o fluxo avaliativo existentes; rubricas adicionais ficam adiadas. A etapa seguinte deve especificar o protótipo e seus testes, em vez de entregar somente outro documento de plano de aula.

Esse recorte é de complexidade média a alta. Um RPG 3D aberto, com liberdade ampla e história gerada em tempo real, é uma evolução de esforço maior e com validações adicionais. Não é necessário para produzir uma primeira experiência imersiva.

## 6. Verificações antes de adotar a rubrica ou publicar o jogo

- Pontos, respostas parciais e tentativas seguem o domínio atual; o novo motor não cria recompensas ou notas paralelas.
- Cálculo de aproveitamento e arredondamento existentes preservados; ausência, pendência, falta de oportunidade e zero distintos.
- Nenhuma nota é alterada por estrela, velocidade, compra de item ou ajuda acessível.
- Configuração congelada, conferência docente e vínculo correto com ano/turma/bimestre.
- Progressão, decisões, feedback e retorno visual realmente modificam a experiência; não apenas apresentação de quiz.
- Retomada, reenvio, múltiplos aparelhos, privacidade, acessibilidade e limites de carga medidos antes da liberação.
- Conexão ainda é necessária onde o servidor é autoridade. Uma alternativa presencial/imprimível não equivale a implementar execução digital offline.

Originais preservados. A próxima especificação deve transformar as recomendações aprovadas em contratos e critérios de aceite; este documento não cria nem altera regras de produção.

## Registro da conferência

Fórmula G5 do XLSX conferida diretamente no arquivo original, confirmando máximo 45. A decisão de produto não adota essa escala. Conferidos os arquivos de pontuação e avaliação atuais: base objetiva de 1.000 pontos por desafio e nota por aproveitamento × valor máximo. Exemplo validado: 8/10 = 80%; atividade de valor 5 resulta em 4,00. Nenhuma implementação, partida ou nota foi alterada nesta etapa documental.
