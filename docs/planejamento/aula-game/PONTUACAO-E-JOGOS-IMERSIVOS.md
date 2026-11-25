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

## 2. Proposta de resolução

### Três registros independentes

1. **Pontuação lúdica:** experiência, estrelas, itens, conquistas e placar. Regras próprias de cada modalidade, informadas antes da partida. Bônus e velocidade podem ser recursos do jogo quando adequados; não viram nota por consequência automática.
2. **Rubrica formativa:** evidências de aprendizagem por critério e objetivo. Sem bônus solto que altere o teto; desafio avançado pode gerar conquista lúdica ou evidência dentro de um critério previamente definido.
3. **Nota da atividade:** usada somente em atividade explicitamente avaliativa, após conferência docente. Mantém valor máximo, turma, ano e bimestre do fluxo existente. Não altera regras semestrais/anuais.

### Escala comparável para rubricas novas

Cada critério possui descrição observável, escala e peso. Os pesos somam 100%. O resultado normalizado é:

`R = soma(pesoPercentual × valorObtido / valorMaximoDoCriterio)`

Isso funciona com escalas 0–4, 0–10 ou outras previamente declaradas. O resultado vai de 0 a 100 quando todos os valores estão dentro das escalas. Arredondar somente o resultado final a duas casas; o nível usa esse mesmo resultado exibido.

Exemplo numérico: compreensão e aplicação com pesos 50%/50%, ambas de 0 a 10. Valores 8 e 9 produzem `50×8/10 + 50×9/10 = 85%`. Não é obrigatório usar esses dois critérios ou esses pesos em todas as disciplinas. Colaboração, argumentação e outros critérios entram quando fizerem parte dos objetivos e tiverem evidências avaliáveis.

**Faixas propostas, opcionais e configuráveis por atividade:** Bronze de 0 até menos de 65%; Prata de 65% até menos de 90%; Ouro a partir de 90%. São marcos dessa atividade, não diagnóstico de capacidade, aprovação escolar ou comparação entre disciplinas. Os limites são uma proposta de padronização, não regra descoberta em todos os materiais. Se a escala/limites forem mudados, mostrar exemplos e congelar a configuração antes de começar.

Essa regra cobre 64,99/65/89,99/90 sem lacunas e evita depender de totais brutos incompatíveis. O exemplo de 29/30 passa a 96,67% (Ouro nas faixas propostas); o máximo 35/35 corresponde a 100%; 35/45 corresponde a 77,78% (Prata), embora seja Ouro na regra original do XLSX. Essa diferença é uma mudança explícita de classificação, não uma correção silenciosa do arquivo-fonte.

### Evidências ausentes e fechamento

- Zero lançado é evidência avaliada com resultado zero. Campo vazio é pendente, não zero nem Bronze automático.
- Sem oportunidade de participação permanece identificado separadamente.
- Critérios obrigatórios pendentes bloqueiam o fechamento. Critério não aplicável exige decisão e configuração explícitas; não redistribuir pesos silenciosamente depois da atividade.
- Uso de ajuda, tentativas e condições de tempo são registrados. O efeito avaliativo é definido antes; apoio de acessibilidade não gera penalidade oculta.
- Placar coletivo não determina automaticamente a avaliação de cada integrante. A evidência individual precisa estar disponível ou a limitação precisa ser apresentada ao professor.

### Integração futura com nota

O serviço atual já calcula aproveitamento por modalidade e mantém conferência/finalização/sincronização. Isso permanece intacto.

Para uma futura avaliação por rubrica, o professor escolhe explicitamente essa base. A proposta é `nota = valorMaximoDaAtividade × R / 100`, com arredondamento final. No exemplo de 85%, uma atividade de valor 2 produziria 1,70, antes da conferência. Escolher rubrica, aproveitamento objetivo ou uma combinação com pesos definidos é uma decisão de configuração; não somar as duas fontes ou pontuação lúdica automaticamente. Critérios, gabaritos e regras da partida ficam versionados para auditoria e retomada.

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

A experiência deve ser testada em sala e no modo autônomo, com desktop/celular, erro/acerto, ajuda, retomada e conclusão. O primeiro episódio pode usar avaliação descritiva; a rubrica normalizada entra depois da escolha dos critérios e da aprovação do contrato. A etapa seguinte deve especificar o protótipo e seus testes, em vez de entregar somente outro documento de plano de aula.

Esse recorte é de complexidade média a alta. Um RPG 3D aberto, com liberdade ampla e história gerada em tempo real, é uma evolução de esforço maior e com validações adicionais. Não é necessário para produzir uma primeira experiência imersiva.

## 6. Verificações antes de adotar a rubrica ou publicar o jogo

- Máximos e pesos corretos; nenhum critério permite superar a escala; pesos inválidos ou soma diferente de 100 são rejeitados.
- Faixas completas, resultados de borda e arredondamento consistentes; ausência, pendência e zero distintos.
- Nenhuma nota é alterada por estrela, velocidade, compra de item ou ajuda acessível.
- Configuração congelada, conferência docente e vínculo correto com ano/turma/bimestre.
- Progressão, decisões, feedback e retorno visual realmente modificam a experiência; não apenas apresentação de quiz.
- Retomada, reenvio, múltiplos aparelhos, privacidade, acessibilidade e limites de carga medidos antes da liberação.
- Conexão ainda é necessária onde o servidor é autoridade. Uma alternativa presencial/imprimível não equivale a implementar execução digital offline.

Originais preservados. A próxima especificação deve transformar as recomendações aprovadas em contratos e critérios de aceite; este documento não cria nem altera regras de produção.

## Registro da conferência

Fórmula G5 do XLSX conferida diretamente no arquivo original. Validados por cálculo racional/decimal: máximo 45; 29/30 = 96,67%; 35/45 = 77,78%; 35/35 = 100%; exemplo ponderado 85%; nota ilustrativa 1,70/2; cortes 0, 64,99, 65, 89,99, 90 e 100. Verificados pesos somando 100 e limites das escalas. Essas verificações conferem a proposta documental; não equivalem a testes de uma funcionalidade de rubrica implementada.
