# Aula Game — ramificação de plano de aula gamificado e novos jogos

Status: **coleta de materiais** (15 materiais catalogados em 24/11/2026).

Este diretório concentra os materiais recebidos e a organização inicial das ideias.
Nada aqui altera código, rotas ou specs existentes: é um espaço de planejamento.

## Estrutura

```
docs/planejamento/aula-game/
├── README.md          # este índice
├── materiais/         # arquivos originais recebidos
│   ├── extrair.py     # extrator docx/pdf/xlsx → extraidos/
│   └── extraidos/     # texto extraído para consulta
└── ideias/            # notas sintetizadas por tema
```

## Protocolo de entrada (para cada material)

Ao receber um material, registrar aqui:

| Campo | O que anotar |
|---|---|
| ID | `mat-01`, `mat-02`... |
| Arquivo / link | caminho em `materiais/` ou URL |
| Origem | quem produziu, onde foi publicado |
| Tipo | plano de aula, BNCC, jogo, pesquisa, referência visual, áudio etc. |
| Data de recebimento | dd/mm/aaaa |
| Resumo | 3–6 linhas com a ideia central |
| Ideias extraídas | mecânicas, dinâmicas, temas, avaliações |
| Relação com o Aula Game | qual jogo/modalidade/tela conversa com o material |
| Status | anotado · em análise · incorporado · descartado |

## Extração de texto

Para deixar o material pesquisável (sem abrir o binário):

```bash
cd docs/planejamento/aula-game/materiais
python3 extrair.py                      # todos os arquivos suportados
python3 extrair.py novo-material.docx   # apenas um
```

Requer `pypdf` para PDF (`pip install pypdf`). A saída vai para `materiais/extraidos/`.

## Materiais recebidos

| ID | Material | Tipo | Resumo | Ideias extraídas | Uso potencial |
|---|---|---|---|---|---|
| mat-01 | `COMANDO--NO--CHAT--GPT.docx` | Prompt de referência | Quatro comandos prontos (tabuleiro, quiz, roteiro de vídeo, RPG) para História/8º ano sobre Revolução Industrial, com contexto de turma (36 alunos, escola privada) e habilidade EF08HI03. | Trilha gradual de 13 casas; quiz de 10 questões com 3 alternativas; roteiro de imersão em vídeo; narrativa de RPG com o professor como mestre. | Modelo de **briefing** para o gerador IA e para um wizard de "criar aula"; referência de formatos além do digital (impresso, PPT, vídeo, RPG). |
| mat-02 | `FORMAS--INTERATIVAS--DE--INICIAR--UM--CONTEÚDO.pdf` | Coletânea pedagógica (licenciada) | Nove formas de abrir um conteúdo novo: roda do conhecimento com polling, escape room, caça ao tesouro com QR, debate express, vídeo interativo, histórias colaborativas, simulação virtual, gamificação e mapa mental coletivo. | Cada estratégia traz objetivo, passo a passo e materiais; forte ênfase em diagnóstico inicial e participação ativa. | **Modo aquecimento/abertura** no Aula Game (rodada curta antes do conteúdo) e catálogo de dinâmicas presenciais. |
| mat-03 | `GUIA--DE--USO--DA--BIBLIOTECA--DE--PROMPTS.pdf` | Guia de IA | Explica o método **CLASSE** (Contexto, Logro, Audiência, Saída, Situação, Especificações) e como usar 100 prompts com revisão pedagógica obrigatória. | Contexto explícito melhora a resposta; um prompt por vez; revisar exatidão, adequação, tempo, recursos, inclusão e privacidade; salvar o que funcionou. | Estruturar o formulário de geração IA e o texto do prompt; checklist de revisão já existe no fluxo (revisão docente obrigatória). |
| mat-04 | `GUIA--PRÁTICO_--MODELAGEM--DE--ROTEIROS--NARRATIVOS--GAMIFICADOS--PARA--O--CONTEXTO--PEDAGÓGICO.docx` | Modelos de estrutura | Três matrizes narrativas: **Operação de Resgate** (investigação e revisão), **Desafio dos Guardiões** (cooperação/competição em equipes) e **Jornada do Especialista** (progressão linear em marcos). | Etapas pedagógicas por modelo, identidade de equipes, tipologia de desafios, métricas, mecanismos de ajuda (consulta avançada, segunda instância, extensão de tempo) e avaliação formativa. | **Templates de plano de aula** e, no futuro, "modos de jogo" com regras próprias. |
| mat-05 | `Matriz_de_Avaliacao_Formativa_e_Desempenho_Gamificado.xlsx` | Planilha de avaliação | Rubricas de participação, colaboração e rigor científico; níveis Bronze/Prata/Ouro; planilha de lançamento por estudante com pontuação automática. | Avaliação transparente, feedback contínuo, ranking **sem nomes expostos** (usar IDs), pesos por indicador. | Painel docente de **avaliação formativa** (separado de notas) e critérios de ranking já existentes. |
| mat-06 | `Modelo_Aula_Gamificada_Editavel.docx` | Template em branco | Estrutura de plano: título, objetivo, narrativa, etapas, pontuação, níveis/recompensas, materiais e avaliação. | Campos mínimos de um plano de aula gamificado. | Base do **modelo de plano** dentro do produto (exportável). |
| mat-07 | `Pack_Modelos_Aulas_Gamificadas.docx` | Quatro planos prontos | Exemplos em Ciências (Guardiões da Água), Matemática (Operação Fracionária), História (Revolução dos Cidadãos) e Língua Portuguesa (Caçadores de Gêneros). | Cada plano tem narrativa, etapas, pontuação, faixas Bronze/Prata/Ouro, materiais e avaliação. | **Presets/modelos** prontos para o professor adaptar. |
| mat-08 | `PAINEL--DE--IDEIAS--DE--ICEBREAKERS--GAMIFICADOS.docx` | Painel de dinâmicas | Oito quebra-gelos de 7–15 min (bingo de emojis, quiz maluco, quem sou eu, pique-prompt, missão secreta, verdade ou mito, avatares, caça à curiosidade) com prompt base para IA. | Atividades curtas de abertura, com objetivo, estilo de jogo e uso de IA. | **Rodada de aquecimento** e sugestões contextuais antes da sala ao vivo. |
| mat-09 | `Planilha_Pontuacao_Ranking_Preenchimento.docx` | Planilha (template) | Tabela de lançamento com colunas: aluno, participação (0–10), colaboração (0–10), tarefa entregue (✅/❌), bônus/missão (0–5), pontuação total automática e nível. Exemplo: Ana 29 pts = Ouro, João 15 pts = Bronze. Duas tabelas em branco para preenchimento. | Fórmula implícita nos exemplos: `participação + colaboração + (entrega ✅ = 5, ❌ = 0) + bônus`; máximo de 30 por atividade; nível derivado do total; nomes de alunos na tabela de trabalho. | Base da **exportação de rubrica** e do painel docente de avaliação formativa. |
| mat-10 | `PLANILHA--DE--PONTUAÇÃO--COMO--USAR--.docx` | Manual técnico da planilha | Repete a planilha e adiciona o guia de rubricas: participação ativa, colaboração e rigor científico em 3 faixas (0–4, 5–7, 8–10); bônus 0–5 só para alta complexidade; marcos Bronze (<20), Prata (20–34), Ouro (≥35). | Rubricas descritivas por nível; separação entre **nota de jogo** e **rubrica formativa**; privacidade por código numérico (Coluna A); atualização síncrona após cada marco; análise preditiva com IA. | Especificação do **modelo de avaliação formativa** e das regras de nível. Fonte mais detalhada que `mat-05`. |
| mat-11 | `PROMPTS--PRONTOS--PARA--PROFESSORES.docx` | Biblioteca de prompts curta | Cinco famílias de comandos (quiz, desafios/missões, narrativas, correção de redação, plano de aula) com um prompt genérico e 3 exemplos prontos cada. | Prompts de uma linha, sem contexto de turma, tempo, recursos ou restrições — servem como atalho, não como especificação. | **Presets rápidos** no gerador IA; cada preset deve ser expandido no formato CLASSE de `mat-03` para produzir saída confiável. |
| mat-12 | `CALENDARIO--DE--ATIVACAO--GAMIFICADA.md` | Calendário de planejamento | Modelo de 5 semanas (diagnóstico → novo conteúdo → RPG → revisão por estações → projeto final) e um bloco de sugestões por momento do ciclo: início, meio, fim e intervenção para turmas desmotivadas. | Primeiro material a tratar **distribuição no tempo**: cadência semanal, progressão de objetivos e receitas por fase. Nomes de mecânicas: Missão Inaugural, Boss Final, Mapa do Tesouro, Cartas de Poder, gincana por estações. | **Sequência de aulas** no produto: cada semana/etapa recebe modalidade + narrativa + rubrica. Liga o plano à sala ao vivo e à revisão. |
| mat-13 | `BANCO--DE--ATIVIDADES--GAMIFICADAS--COM--IA.md` | Banco de atividades | Oito atividades prontas em 5 disciplinas (Ciências, História, Português, Matemática, Geografia), cada uma com ano, missão, tipo de jogo, objetivo, descrição, pontuação e prompt de IA. | Primeiro material com **esquema de ficha repetível** por atividade; cobre 5º ano ao Ensino Médio; mistura mecânicas digitais e presenciais (QR, tabuleiro, estações). | **Biblioteca de atividades** filtrável por disciplina/ano/modalidade — entrega de conteúdo, sem motor de jogo novo. |
| mat-14 | `MODELOS--DE--AULAS--GAMIFICADAS--GUIA.md` | Guia de modelos | Estrutura base em 5 campos (nome do desafio, problema central, fases, como ganhar pontos, níveis) e 4 exemplos completos de aula em **3 fases com tempo marcado** (15 + 25 + 20 min). | Primeiro material que fecha a **duração** da aula; pontuação 4×10 = máx. 40 com Bronze 0–25 / Prata 26–35 / Ouro 36–40; 3 dos 4 critérios são socioemocionais. | **Modelo de plano de aula** de 60 min e régua de níveis **coerente** — resolve a divergência do `mat-09`/`mat-10`. |
| mat-15 | `BIBLIOTECA--100--PROMPTS--NOTION.md` | Biblioteca online (link Notion) | Página pública com 100 prompts em 10 categorias. Em 25/11/2026, as 100 páginas internas foram lidas e catalogadas em sínteses próprias, com fontes individuais, campos e saídas; textos integrais permanecem na fonte. | Cobertura real do que o professor pede: planejamento, gamificação, missões, narrativas, personagens, quizzes, avaliação, inclusão, materiais e criatividade. | Referência para **categorias do gerador IA**: uma estrutura-base e dez formatos de entrega. Os títulos indicam possibilidades; implementação depende de especificação própria. Ver `materiais/notion-100-prompts/README.md`. |

> Inconsistências detectadas nos materiais (resolver antes de implementar):
> 1. **Terceira coluna muda de tipo** — `mat-09` usa "Tarefa entregue (✅/❌)"; as rubricas de `mat-10` definem "Rigor científico (0–10)" no mesmo lugar. Mesma posição, dado diferente.
> 2. **Peso da entrega não declarado** — em `mat-09` os totais só fecham se ✅ valer **+5** e ❌ valer **0** (Ana: 9+10+5+5 = 29; João: 6+7+0+2 = 15). É inferência a confirmar.
> 3. **Régua incompatível com a escala de `mat-09`** — o máximo dessa planilha é **30** (10+10+5+5), então "Ouro ≥ 35" (`mat-05`/`mat-10`) é inalcançável por atividade isolada. Só faria sentido como pontuação **acumulada entre marcos**.
> 4. **Ouro exigiria nota perfeita em `mat-10`** — com três métricas 0–10 + bônus 0–5, o máximo é **35** e "Ouro ≥ 35" só ocorre com 10+10+10+5. Na prática, Prata vira o teto real. Ou os limiares, ou os pesos, precisam de ajuste.
> 5. **Exemplo de `mat-09` contraria as duas réguas** — 29 pontos aparece como Ouro, mas pela régua de `mat-10` seria Prata.
>
> Observação de licença: `mat-02` é material licenciado (marca d'água "Licensed to Ramon Bernardo"). Usar como referência de mecânica e redigir conteúdo próprio; não redistribuir o arquivo nem copiar o texto integralmente.

## Síntese das primeiras ideias

Ver `ideias/00-primeiras-ideias.md`.

## Perguntas que os materiais devem responder

1. Público e etapa (fundamental/médio, ano, faixa etária).
2. Objetivo pedagógico e habilidade BNCC associada.
3. Duração da aula e ritmo (aquecimento, jogo principal, fechamento).
4. Disciplinas e conteúdos prioritários.
5. Como avaliar sem transformar a aula em prova.
6. Infraestrutura disponível (projetor, celular do aluno, internet, áudio).
7. Acessibilidade (leitor de tela, contraste, movimento reduzido, teclado).
8. Relação com o que já existe (Sala de jogos, revisão autônoma, banco de questões).

## Próximos passos

1. ~~Receber e catalogar os materiais.~~ (15 recebidos)
2. Agrupar por tema e por tipo de jogo.
3. Desenhar as primeiras mecânicas candidatas.
4. Só então transformar em spec/plano com critérios de aceite e testes.

## Complemento de mat-15 — 25/11/2026

[Registro das 100 páginas internas](materiais/notion-100-prompts/README.md): dez arquivos por categoria e catálogo estruturado, com 100 referências únicas. Leitura concluída; material em análise. Não houve mudança em código, rotas ou specs.
