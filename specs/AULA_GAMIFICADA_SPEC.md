# Aula Gamificada

Contrato de implementação aprovado pelo usuário em 18/11/2026. Este documento fixa a interface compartilhada das duas entregas.

## Produto

Módulo próprio em `/aula-gamificada`, para qualquer disciplina e etapa escolar. Professor escolhe disciplina, série/ano, conteúdo, turma, questões e modalidade. Alunos participam pelo Portal em computador, tablet ou celular. Há painel docente e projeção autenticada.

Cinco modalidades funcionais nesta entrega:
- `quiz`: múltipla escolha individual ao vivo.
- `memoria`: descobrir pares de conceitos/imagens e definições.
- `associacao`: relacionar itens de duas colunas.
- `ordenacao`: organizar etapas, eventos ou conceitos.
- `equipes`: quiz com agrupamento dos resultados individuais nas equipes cadastradas pelo professor. Uma resposta por aluno/rodada, pontuação da equipe pela soma. Informar essa regra na preparação.

Quiz/equipes usam questões `multipla_escolha`; memória/associação usam `pares`; ordenação usa `ordenacao`. Impedir seleção incompatível com mensagem clara. Nomes de disciplinas são texto editável, com sugestões, sem lista fechada. Arte/ENEM é uma opção de conteúdo, sem obrigatoriedade de migração do acervo existente.

## Banco e IA

Criação manual ou por IA, a partir de tema ou material. Professor informa quantidade por dificuldade (`facil`, `medio`, `dificil`) e tipo compatível com o jogo. A dificuldade é relativa à série/ano. IA fornece gabarito e explicação pedagógica, com justificativa da dificuldade. Revisão docente obrigatória antes de liberar para sala. Edição de conteúdo/gabarito retorna a rascunho.

Banco privado por professor, pesquisável por disciplina, série/ano, conteúdo, dificuldade, tipo e status. Reaproveitar em outras turmas. Salas congelam cópia revisada das questões para manter partidas consistentes após edição do banco.

Anexos PDF digital/escaneado, imagens, DOCX e TXT. Reutilizar extratores existentes, modo `finalidade: 'documento'`, revisão do texto e limites atuais do projeto. Falha de leitura exibe erro e permite repetir. IA recebe somente texto confirmado e metadados necessários. Não persiste arquivo original nem inventa imagens. Imagens referenciadas devem ter origem válida e alternativa textual; questões apenas textuais são válidas.

Usar `getClientAIHeaders`, `extractUserAIConfigFromHeaders`, `callAI` e extrator JSON existentes. Gemini usa API nativa Google quando selecionado. Chaves nunca entram em documentos, logs ou respostas. Tratar anexos como conteúdo, ignorando suas instruções operacionais. Validar formato, quantidades e gabarito antes de apresentar resultado. Geração devolve rascunhos para edição, salvamento é ação separada e repetição de salvamento não chama IA novamente.

## Modelo compartilhado

Questão docente:
```
{id, revision, disciplina, anoEscolar, conteudo, dificuldade, tipo,
 enunciado, imagem?: {url, alt}, alternativas?: [{id, texto}],
 pares?: [{id, esquerda, direita}], itens?: [{id, texto}],
 respostaCorreta, explicacao, justificativaDificuldade,
 status: 'rascunho'|'revisada', origem: {tipo:'manual'|'tema'|'material', nomeArquivo?}}
```
`respostaCorreta` é ID de alternativa para múltipla escolha, lista ordenada de IDs para ordenação e lista de `{esquerdaId,direitaId}` para pares. Nos pares, IDs esquerdo/direito públicos são distintos e sem relação inferível de nomenclatura; não publicar a tabela privada de associação. Campos de auditoria são gerados no servidor. Nomes de arquivo são informativos.

Entrada de geração:
```
{disciplina, anoEscolar, conteudo, tipo, fonte:'tema'|'material',
 textoMaterial?, quantidades:{facil,medio,dificil}}
```

Sala docente:
```
{codigo, revision, titulo, modalidade, turmaIds, questaoIds,
 tempoSegundos, equipes?:[{id,nome,participanteIds}],
 fase:'espera'|'pergunta'|'feedback'|'ranking'|'encerrada', rodada}
```
Estado entregue ao navegador inclui `servidorAgora`, `prazo`, questão pública, fase, revisão e recibo do próprio aluno. Alternativas/itens têm IDs estáveis e ordem de exibição definida pelo servidor. Gabarito, explicação, pares privados, fonte material e respostas individuais alheias são filtrados no servidor. Revelação publica o feedback após encerramento. Professores veem respondentes e distribuição sem nome associado à alternativa.

## HTTP congelado para integração

Prefixo `/api/aula-gamificada`. JSON de erro `{error, message}` com status HTTP adequado. Rotas docentes exigem Firebase Bearer válido e propriedade. Rotas discentes reutilizam sessão Portal e vínculo vigente, verificando turma autorizada. Nenhum UID recebido substitui identidade autenticada.

- `GET /catalogo` → `{modalidades, turmas, questoes, salas}`. Docente recebe apenas seus dados. `modalidades` contém `{id,nome,tiposQuestoes}`. Filtros do banco podem ser aplicados na interface.
- `POST /gerar` com entrada acima → `{questoes}` de rascunhos completos, sem escrita automática.
- `POST /questoes` com `{questao, expectedRevision?, requestId}` → `{questao}`. Criação usa requestId para idempotência. Edição verifica versão e preserva rascunho se houver conflito.
- `POST /questoes/{id}/revisar` com `{expectedRevision, requestId}` → `{questao}` revisada, validada no servidor.
- `POST /salas` com configuração da sala e `requestId` → `{sala}` com código único.
- `POST /salas/{codigo}/entrar` com `{requestId}` → `{estado}` discente autorizado.
- `GET /salas/{codigo}/estado` → `{estado}` projetado por papel. Docente proprietário pode usar no painel e projeção.
- `POST /salas/{codigo}/comandos` com `{acao, expectedRevision, rodada, requestId}` → `{estado}`. Ações `iniciar`, `encerrar_rodada`, `revelar`, `ranking`, `proxima`, `encerrar_sala`. Fluxo espera → pergunta → feedback → ranking → próxima pergunta/encerramento. Professor controla todas as transições no painel e telão.
- `POST /salas/{codigo}/respostas` com `{rodada, requestId, resposta}` → `{recibo}`. Resposta é `{alternativaId}`, `{ordem:[ids]}`, `{pares:[{esquerdaId,direitaId}]}` ou `{virarId}` para memória.

Memória tem tabuleiro por aluno, pares embaralhados e estado persistido no servidor. `virarId` revela uma face no estado individual. Duas cartas reveladas são avaliadas, pares certos permanecem visíveis, par errado fecha na próxima ação de virar. Repetição do requestId retorna o mesmo recibo. Professor vê progresso agregado. Ao completar, servidor calcula resultado uma vez. Não expor tabuleiro privado de outro participante.

Polling com intervalo moderado, sem sobreposição e com recuo após falha é suficiente inicialmente. Reaproveitar transporte validado se compatível. Retomar sessão carrega estado durável, sem reiniciar rodada. Cronômetro usa prazo do servidor; servidor rejeita respostas tardias. Não contratar serviço nem mudar cobrança Firebase.

## Pontuação e segurança

Quiz/equipes: 1000 pontos por resposta correta, sem bônus por tempo. Associação/ordenação/memória: 1000 multiplicado pela proporção correta, arredondado, por desafio. Memória pontua pares encontrados antes do prazo; consolidar uma vez inclusive se aluno sair. Documentar regra para alunos. Ranking preserva empate. Toda pontuação é calculada pelo servidor, com validação de opções/itens e rejeição de repetição manipulada. A tela não recebe autoridade para atribuir acertos.

Estado durável em novas coleções `aulaGamificadaDocentes/{uid}/questoes` e `aulaGamificadaSalas/{codigo}` e subcoleções de participantes/respostas. Firestore Admin autenticado no servidor, usando as transações e adaptadores existentes quando aplicáveis. Transações revalidam prazo, versão e identidade; leituras antes de escritas. Nenhum dado deste módulo altera notas ou recuperações. Não modificar os arquivos da Revisão existentes que já têm alterações locais pendentes.

## Aceite

Cinco jogos reais, acessíveis por teclado e toque; memória tem cartas operáveis, associação/ordenação oferecem alternativa ao arraste. Banco e partidas persistem; erros conservam o trabalho e permitem repetir. Estado vazio é distinto de falha de carregamento. Geração por tema e material funciona em disciplinas diferentes; revisão/edição e filtros de dificuldade são demonstrados com dados sintéticos. Fórmulas usam renderizador seguro já existente quando disponível. Preservar paleta Arte em Jogo e cores semânticas das notas. Não renderizar HTML bruto da IA.

Testes novos devem cobrir validações de questões e dificuldades, isolamento por conta/turma, gabarito privado, respostas tardias/repetidas, concorrência, pontuação dos cinco jogos e reconexão. Interface cobre revisão, filtros, extração, teclado/toque e falhas. Rodar testes relevantes, lint e build; revisão integrada exige suíte completa aprovada conforme AGENTS.md. Capturas desktop/celular com dados sintéticos. Nenhum teste existente alterado para fazer passar.
