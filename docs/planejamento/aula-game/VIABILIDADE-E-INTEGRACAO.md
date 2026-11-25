# Aula Game — viabilidade e integração dos materiais

Data: 25/11/2026. Proposta de planejamento, sem autorização inferida para implementar funcionalidades. Base: 15 materiais catalogados, leitura das 100 páginas internas do Notion e inspeção do código atual.

## Conclusão

A integração é viável por etapas. O maior ganho inicial é um planejador de aula que organiza contexto, narrativa, etapas, jogos e evidências de aprendizagem. Banco de questões, geração de rascunhos com IA, execução das modalidades, revisão autônoma e serviços de avaliação já oferecem pontos concretos de integração.

Os 100 prompts representam uma estrutura-base com dez formatos de entrega. Seus títulos não são cem motores de jogo nem requisitos completos de produto. Servem para orientar modelos autorais e formulários contextualizados. Os materiais de planos, narrativas, calendário e rubricas acrescentam decisões pedagógicas que o catálogo genérico de prompts não especifica.

## O que foi confirmado no código

- `frontend/src/components/aula-gamificada/ModuloAulaGamificada.jsx`: entrada com Revisão interativa, Sala de jogos e Revisar sozinho.
- `frontend/src/components/aula-gamificada/HubDocente.jsx`: catálogo, banco de questões, geração IA, preparação de sala e acesso a histórico/avaliações.
- `frontend/src/dominio/aula-gamificada/geracao.js`: geração atual de questões por disciplina, ano, conteúdo, material revisado e dificuldade, com estrutura de resposta definida. Não é um gerador genérico de planos ou narrativas.
- `frontend/src/aplicacao/aula-gamificada/AulaGamificadaService.js`: operações de relatório, revisão/finalização de avaliação, sincronização com Diário e consulta individual. Evitar criar uma segunda implementação paralela dessas funções.
- `specs/AULA_GAMIFICADA_UNIFICADA_SPEC.md`: compatibilidade por modalidade e preservação de sessões/snapshots. Questões abertas continuam dependendo de julgamento docente; treino automático exige tipos compatíveis.

O exame trata do código disponível, incluindo trabalho em andamento no workspace. Existência de componente/serviço não substitui validação do fluxo online em cada entrega.

## Onde cada conjunto entra

| Material/estrutura | Inclusão proposta | Reaproveitamento | Esforço relativo |
|---|---|---|---|
| Catálogo de prompts e banco de atividades | Biblioteca filtrável por disciplina, etapa escolar, duração, objetivo e recursos; favoritos e modelos próprios | Catálogo documental como referência, com fichas originais | Baixo a médio |
| Contexto CLASSE | Formulário simples com informações da turma e condições da aula, preenchidas quando disponíveis | Autenticação, turmas e contexto docente; ampliar a entrada de geração de forma compatível | Médio |
| Planos e três matrizes narrativas | Plano editável com abertura, desenvolvimento, desafio e fechamento; versões Resgate, Guardiões e Jornada | Questões, jogos e renderer de conteúdo como destinos | Médio |
| Avaliação, rubricas e devolutivas | Critérios observáveis vinculados ao plano, com evidências e feedback | Histórico e avaliação já presentes; novos indicadores formativos precisam de representação própria | Médio |
| Calendário de cinco semanas | Sequência opcional de aulas vinculada ao Calendário Pedagógico | Datas, turmas e planejamento existentes, após revisão dos contratos | Médio a alto |
| Escape room, investigação ramificada e RPG com escolhas | Novas mecânicas quando exigirem estado, inventário, pistas ou caminhos diferentes | Autenticação, banco e parte da infraestrutura; motor e avaliação precisam de projeto específico | Alto |

Classificação comparativa, sem estimativa de prazo ou custo financeiro fechado.

## Experiência recomendada

Dentro do módulo Aula Game, oferecer ao professor a ação **Planejar aula**, preservando as três áreas atuais e os acessos dos alunos.

Fluxo proposto:

1. Escolher um modelo ou começar em branco.
2. Informar tema, turma/ano, objetivo, duração, participantes, conhecimentos anteriores, recursos e apoios necessários. Habilidade BNCC pode ser informada/confirmada pelo professor, sem inventar códigos.
3. Gerar ou escrever o plano, com narrativa, etapas e tempos. A soma dos tempos deve respeitar a duração escolhida; não fixar todas as aulas em 50 ou 60 minutos.
4. Revisar conteúdo, viabilidade, acessibilidade e critérios de acompanhamento.
5. Selecionar ou gerar questões no banco atual e escolher uma modalidade compatível.
6. Confirmar a criação da sala; compartilhar treino autônomo somente quando autorizado e compatível.
7. Consultar resultados e feedback pelos serviços existentes; finalizar/sincronizar avaliação conforme decisão explícita do professor.

Exemplo: o professor escolhe Arte, 1º ano, Manguebeat, 50 minutos e recursos disponíveis. O plano propõe uma abertura, explicação com exemplos, desafio e fechamento. O professor ajusta tempos e questões e associa Quiz, Heróis ou Tabuleiro conforme a proposta. A narrativa muda o contexto e o roteiro; só muda as regras do jogo quando isso for implementado e testado explicitamente.

## Primeira entrega recomendada

Um MVP com **biblioteca + plano de aula editável**, usando os três modelos narrativos e os exemplos já catalogados como referência para redação própria. Geração manual ou assistida por IA, rascunho salvo por professor, revisão e ligação com questões/jogos existentes.

Começar com quatro saídas bem definidas: plano, missão, conjunto de questões e adaptação de uma proposta. Os outros formatos entram quando tiverem campos e critérios de aceite próprios. O catálogo pode representar os cem títulos sem prometer que todos os formatos já tenham execução interativa.

Uma proposta de plano deve registrar identificação e versão, contexto pedagógico, etapas com tempo e ações, recursos/apoios, vínculos de questões e modalidades, critérios de acompanhamento e estado de revisão. Esses dados ainda precisam virar contrato formal; não alterar silenciosamente o DTO atual de questões para comportar planos.

## Sequência de implementação

1. Formalizar escopo e testes do planejador; rever pendências do fluxo atual antes de acrescentar navegação.
2. Entregar biblioteca e plano editável, com salvamento e isolamento entre professores.
3. Acrescentar geração estruturada e reaproveitamento de contexto, mantendo revisão docente e validação das saídas.
4. Conectar banco, criação de sala, treino e relatórios sem duplicar serviços ou migrar partidas antigas.
5. Incorporar rubricas formativas e planejamento de várias aulas.
6. Implementar uma nova mecânica por vez; escape room é candidato para uma primeira especificação, não conclusão de viabilidade já validada em carga.

## Condições para a entrega funcionar

- Plano docente, gabaritos e dados individuais não podem ser publicados junto com o material visível ao aluno. Revalidar autorização, vínculo e versão nas operações.
- Sala criada congela o material necessário à partida; editar o plano posterior não altera resultados históricos. Plano reutilizado em outra turma gera vínculo próprio.
- Pontuação lúdica, avaliação formativa e nota escolar têm finalidades distintas. Reutilizar a conversão e conferência existentes; não importar automaticamente limiares Bronze/Prata/Ouro dos materiais, que apresentam divergências.
- Critérios devem medir os objetivos escolhidos. A escala matematicamente coerente de um modelo não torna obrigatório avaliar colaboração, apresentação ou criatividade com os mesmos pesos em todas as disciplinas.
- Um material de adaptação offline não torna o aplicativo offline. Execução digital sem conexão precisa de trabalho próprio de sincronização e testes. Uma versão imprimível pode ser uma entrega menor e independente.
- IA pode reutilizar o provedor/chave configurados, mas novas gerações consomem uso. Gerar uma estrutura-base e blocos selecionados, reutilizar o que foi aprovado e evitar cem chamadas separadas ou geração integral repetida.
- Primeira versão pode guardar texto e vínculos. Hospedagem de imagens/vídeos e geração multimídia requerem decisão própria de armazenamento, custos e direitos de uso; a configuração de imagens adaptadas continua pendente.
- Antes de publicar: critérios de aceite, testes de acesso/salvamento/revisão/reutilização, compatibilidade com sessões antigas, telas desktop/celular, validação de tempo, lint e build. Testes antigos só mudam com autorização aplicável.

## Correções em relação às primeiras notas de coleta

O documento `ideias/00-primeiras-ideias.md` é uma anotação inicial anterior à leitura integral e à conferência atual. Hoje não se deve assumir que:

- o texto interno dos prompts ainda falta: as cem páginas já foram lidas e catalogadas;
- a lista valida demanda real ou contém universos/jogos completos: ela apresenta tarefas genéricas a detalhar;
- histórico individual e avaliação ainda inexistem: há serviços e interfaces que devem ser reaproveitados;
- anonimização de ranking, bônus de velocidade ou qualquer detalhe de pontuação já funciona de uma determinada forma sem conferir a modalidade e a configuração atuais;
- a rubrica de um único material deva ser adotada como regra global.

Este documento registra uma recomendação de evolução. Não altera código, rotas, banco de dados, notas ou specs e não inicia a implementação.

## Complemento de pontuação e imersão — 25/11/2026

A conferência da fórmula XLSX identificou peso 2 na entrega e máximo 45. A [proposta de pontuação e roteiros jogáveis](PONTUACAO-E-JOGOS-IMERSIVOS.md) retifica as primeiras notas, separa as três finalidades da pontuação e detalha um primeiro episódio de investigação 2D. Considerando o interesse do usuário em imersão, recomenda-se que a próxima especificação inclua um protótipo jogável completo, além do planejamento editável.

## Decisão posterior: pontuação existente

Em 25/11/2026, o usuário esclareceu que não é necessário adotar a escala das planilhas. A primeira versão dos roteiros jogáveis deve reutilizar a pontuação e o fluxo avaliativo atuais. Não criar nova rubrica numérica nem faixas de conquista obrigatórias. A decisão está detalhada na seção 2 de `PONTUACAO-E-JOGOS-IMERSIVOS.md`.
