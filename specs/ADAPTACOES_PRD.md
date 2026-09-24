# 📄 Product Requirements Document (PRD) — Módulo de Atividades Adaptadas & Educação Inclusiva

---

## 1. Visão Geral do Módulo

O módulo **Elaborador de Atividades Adaptadas** do ecossistema **Gestão Docente** é uma solução assistiva e pedagógica orientada a professores da Educação Básica e do Atendimento Educacional Especializado (AEE). 

Fundamentado na **LBI (Lei Brasileira de Inclusão nº 13.146/2015)**, nas diretrizes do MEC e nos três pilares do **DUA (Desenho Universal para a Aprendizagem / CAST)** — *Engajamento, Representação, e Ação e Expressão* —, o módulo automatiza a diferenciação curricular de atividades escolares sem empobrecer o conteúdo pedagógico e sem rebaixar a expectativa de aprendizagem dos estudantes.

O professor pode:
1. **Adaptar uma atividade preexistente** (colando o texto original ou carregando arquivos PDF/DOCX).
2. **Gerar atividades adaptadas do zero** a partir de um tema, ano letivo e código de habilidade da **BNCC**.
3. **Selecionar uma ou múltiplas necessidades específicas** simultaneamente (para atender estudantes com **múltipla deficiência** ou comorbidades, como TEA + Deficiência Intelectual, Paralisia Cerebral + Baixa Visão, Surdocegueira, etc.).
4. **Cadastrar e vincular perfis de alunos (PEI / PDI rápido)** para reuso instantâneo em planejamentos futuros.
5. **Operar de forma bimodal:** disponibilizar a versão adaptada digitalmente no módulo de Atividades Online ou exportar em **PDF formatado de alta acessibilidade pronto para impressão**.
6. **Receber o Guia de Mediação Pedagógica**, que instrui o professor regente e o mediador escolar sobre como conduzir a aplicação da atividade na sala de aula regular ou no AEE.

---

## 2. Personas e Cenários de Uso

### Persona 1: Professora Regente da Sala Comum (Ensino Fundamental / Médio)
- **Desafio:** Tem 35 alunos em sala, dos quais 2 possuem laudo (um com TEA Nível 1 e outro com Deficiência Intelectual). Não dispõe de horas extras para redigir 3 provas diferentes toda semana.
- **Solução:** Pega a atividade que planejou para a turma toda, insere no módulo, seleciona os perfis dos alunos cadastrados e gera em segundos as versões adaptadas com gabarito e guia de mediação.

### Persona 2: Professor do Atendimento Educacional Especializado (AEE / Sala de Recursos)
- **Desafio:** Precisa articular com os professores regentes materiais táteis, recursos de comunicação alternativa (CAA) e atividades com leitura fácil para estudantes com múltiplas deficiências (ex: Paralisia Cerebral + Baixa Visão).
- **Solução:** Utiliza o módulo para construir o plano de intervenção e imprimir atividades com diagramação especial, tipografia ampliada de 24pt e opções de resposta por apontamento ou pareamento.

### Persona 3: Estudante com Necessidades Específicas
- **Benefício:** Recebe uma atividade visualmente limpa, com instruções claras e acessíveis, capaz de demonstrar seu real aprendizado sobre o conteúdo sem ser bloqueado pela barreira da escrita manual fina ou pela prolixidade do enunciado.

---

## 3. Matriz de Deficiências & Motor de Harmonização Multi-Select

O módulo suporta a seleção individual ou combinada das seguintes categorias:

| Código | Categoria | Barreira Primária | Adaptações Aplicadas pela IA (DUA) |
| :--- | :--- | :--- | :--- |
| `tea` | **TEA (Transtorno do Espectro Autista)** | Ambiguidade, sobrecarga sensorial, abstração social. | Linguagem literal e direta; roteiro de passos numerados; apoio pictográfico (ARASAAC); ancoragem em hiperfoco opcional; enunciados limpos. |
| `di` | **Deficiência Intelectual** | Carga cognitiva alta, raciocínio hipotético abstrato. | Leitura Fácil (*Easy-to-Read*); conceitos concretizados no cotidiano; redução de distratores (3 opções em objetivas); caixas de dicas processuais (*scaffolding*). |
| `tdah` | **TDAH (Desatenção / Hiperatividade)** | Disfunção executiva, impulsividade, perda de foco. | Destaque em **negrito estratégico** nos comandos; eliminação de textos puramente ornamentais; caixas delimitadas por etapa; *checklist* de conclusão. |
| `baixa_visao` | **Deficiência Visual (Baixa Visão)** | Dificuldade com contraste, corpo tipográfico e entrelinha. | Tipografia ampliada (18pt a 24pt) sem serifa (*Atkinson Hyperlegible* / Arial); alto contraste (preto/branco ou amarelo/preto); espaçamento 1.5x; audiodescrição de imagens. |
| `cegueira` | **Deficiência Visual (Cegueira)** | Inacessibilidade a elementos visuais puros. | Estrutura linear para leitor de tela (NVDA/TalkBack); audiodescrição textual obrigatória de figuras; comandos independentes de visão; formato para conversão Braille. |
| `surdez` | **Deficiência Auditiva / Surdez** | Barreira da Língua Portuguesa como L2 (L1 é Libras). | Estrutura sintática direta (S-V-O); períodos curtos; eliminação de rimas e figuras sonoras; glossário imagético dos conceitos principais. |
| `motora` | **Deficiência Física / Motora** | Incapacidade ou lentidão na grafia manual fina ou coordenação. | Dispensa escrita cursiva longa; áreas ampliadas para assinalação direta ou pareamento; suporte a resposta oral ou digital; tempo estendido. |
| `dislexia` | **Dislexia / Transtornos de Leitura** | Decodificação grafema-fonema lenta e fadiga de leitura. | Fontes com espaçamento aberto; texto alinhado à esquerda (sem justificar); suporte de áudio/leitura guiada; comandos segmentados. |
| `discalculia` | **Discalculia** | Processamento numérico e memorização de algoritmos. | Apoio visual de reta numérica e agrupamentos; consulta autorizada a tabelas de fórmulas/tabuada; eliminação de pegadinhas numéricas. |
| `ah_sd` | **Altas Habilidades / Superdotação** | Tédio e desengajamento com tarefas mecânicas ou repetitivas. | Enriquecimento curricular; problemas abertos com múltiplos caminhos de solução; estímulo à pesquisa autônoma e interdisciplinaridade. |

### Regra de Ouro da Múltipla Deficiência:
Quando múltiplas categorias são selecionadas (ex: `tea` + `di` + `motora`):
1. **Prioridade Sinérgica:** As regras se complementam sem conflito (Linguagem Literal + Leitura Fácil Concreta + Respostas em Assinalação Ampla sem exigência de escrita manual).
2. **Invariante de Não-Contradição:** Se uma deficiência exigir apoio visual e outra for cegueira, a IA fornece o apoio visual acompanhado de audiodescrição em texto alternativo semântico.

---

## 4. Requisitos Funcionais (RF)

- **RF-01 (Banco de Perfis de Alunos / PEI Rápido):**
  - O professor pode cadastrar estudantes vinculados a turmas com: Nome, Turma, Categorias de Deficiência (Multi-select), Nível de Suporte (1 - Leve, 2 - Moderado, 3 - Intenso), Hiperfoco/Interesses (opcional) e Observações Pedagógicas específicas.
  - Persistência híbrida: Firestore (`professores/{userId}/alunos_adaptados`) e cache no `localStorage`.

- **RF-02 (Seleção e Filtro de Necessidades):**
  - Ao criar uma adaptação, o professor pode selecionar um aluno cadastrado (carregando suas necessidades automaticamente) OU selecionar manualmente uma ou mais categorias e níveis de suporte em tempo de execução.

- **RF-03 (Entrada Dual de Conteúdo):**
  - **Modo A (Adaptar Existente):** Aceita entrada de texto digitado/colado ou upload de arquivo (PDF/DOCX/TXT).
  - **Modo B (Gerar do Zero):** Aceita campos estruturados: Tema, Disciplina, Ano/Segmento Escolar, Habilidade BNCC (opcional), Quantidade de Questões e Tipos (Objetivas / Discursivas / Mistas).

- **RF-04 (Geração Assistida por IA com DUA):**
  - O motor de IA gera:
    1. **Atividade Adaptada para o Estudante:** Conteúdo reestruturado com aplicação rigorosa das diretrizes das categorias selecionadas.
    2. **Gabarito & Expectativa de Resposta:** Respostas esperadas e rubricas formativas flexíveis.
    3. **Guia de Mediação Pedagógica:** Orientações ao professor/AEE com sugestão de materiais concretos de apoio, tempo estimado e estratégias de intervenção caso o aluno apresente bloqueio.

- **RF-05 (Bimodalidade de Aplicação & Integração):**
  - **Módulo Independente (`/adaptacoes`):** Painel para gerenciamento, histórico, impressão e gestão do PEI.
  - **Integração no Módulo Atividades Digital (`/atividades`):** Botão "Gerar Versão Adaptada" na listagem de atividades regulares, associando a versão adaptada ao aluno cadastrado no portal digital.

- **RF-06 (Exportação de PDF de Alta Acessibilidade para Impressão):**
  - Geração de PDF pronto para impressão física com:
    - Controle de tamanho de fonte (Padrão 14pt, Ampliada 18pt, Extra-Grande 24pt).
    - Opções de contraste (Padrão claro, Alto Contraste preto no branco, Fundo sépia para dislexia).
    - Cabeçalho escolar limpo e espaçamento generoso para respostas.

- **RF-07 (Autonomia & BYOK Obrigatório):**
  - A geração consome a chave de IA do próprio professor (`gemini`, `openai`, `anthropic`, `maritaca`, `openrouter`), sem qualquer custo de IA para a plataforma (RN-27 a RN-30).

---

## 5. Requisitos Não-Funcionais (RNF)

- **RNF-01 (Conformidade Legal & Pedagógica):** Total alinhamento à LBI (Lei 13.146/2015) e princípios DUA/CAST.
- **RNF-02 (Privacidade e LGPD):** Dados de laudos e deficiências dos alunos pertencem exclusivamente ao professor/escola e nunca são compartilhados ou utilizados para treinamento de modelos de IA.
- **RNF-03 (Acessibilidade Digital WCAG 2.2 Nível AA):** A interface do módulo deve suportar navegação completa por teclado, leitores de tela e contraste mínimo de 4.5:1.
- **RNF-04 (Performance):** Geração da atividade e guia de mediação em menos de 15 segundos utilizando o modelo ativo do provedor do professor.

---

## 6. Métricas de Sucesso

1. **Redução de Tempo do Professor:** O tempo de elaboração de uma atividade adaptada cai de ~45 minutos para menos de 2 minutos.
2. **Taxa de Reuso de Perfis PEI:** Pelo menos 80% das adaptações são geradas a partir de perfis de alunos pré-cadastrados.
3. **Qualidade da Diagramação Impressa:** 100% dos PDFs gerados atendem às especificações de legibilidade tipográfica para baixa visão e foco atencional (TDAH).
