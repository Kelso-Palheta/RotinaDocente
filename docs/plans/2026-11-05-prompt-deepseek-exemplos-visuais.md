# DeepSeek/OpenCode — completar exemplos visuais das aulas

Projeto: `/Users/kelsopalheta/Developer/RotinaDocente`.

## Pedido aprovado

Todas as aulas introdutórias devem ensinar com exemplos comentados para fixação. O usuário confirmou que espera imagens comentadas dentro do conteúdo. Há 34 aulas; apenas `impressionismo` e `fotografia` possuem imagem atualmente. Complete as outras 32 e audite as duas existentes. Não basta declarar a melhoria em documentação.

Leia `AGENTS.md`, `specs/REVISAO_TEMATICA_SPEC.md`, `specs/TESTS_SPEC.md` e `docs/analises/2026-11-05-revisao-integracao-tematica.md`. Este pacote complementa um design já aprovado; não pedir outra aprovação do mesmo escopo.

## Escopo exclusivo

- Alterar `content/revisao-enem/aulas/conteudos/*.json` e criar recursos em `content/revisao-enem/aulas/imagens/`.
- Criar `tests/contract/revisao_tematico_exemplos_visuais.test.js` e `docs/analises/2026-11-05-revisao-exemplos-visuais.md`.
- Não alterar `src/`, catálogo/objetivos/IDs, mapa de vínculos, questões ou imagens originais de prova, testes existentes, dependências, configurações, fontes compartilhadas ou specs. Não desfazer alterações de outros agentes.
- Não fazer commit/push/deploy, chamadas pagas, mudança de plano ou aprovação docente automática. Implementação técnica de imagem + comentário já existe: tipo `imagem`, `imagemId`, `texto` e registro correspondente em `imagens`.

## Qualidade obrigatória

1. Cada uma das 34 aulas deve ter pelo menos um exemplo visual real ou esquema autoral pertinente, mostrado no bloco com leitura guiada. Use mais de um quando o escopo exigir comparação ou conceitos distintos; não tratar uma figura como cobertura de uma aula inteira automaticamente.
2. O comentário explica o que observar, como os elementos produzem sentido e como o exemplo ajuda a compreender o conceito. Faça uma pergunta de observação para mediação/fixação; não resolver antecipadamente uma questão do desafio. Legenda sozinha não é comentário didático.
3. Pintura/escultura/fotografia: obra corretamente identificada e análise visual concreta. Arquitetura/design: forma, estrutura, função e contexto. Música: instrumento, partitura, registro ou esquema musical que contribua para a explicação. Teatro/dança: gesto, espaço, encenação, sequência de movimento ou documentação pertinente. Culturas indígenas/afro-brasileiras: atribuições e contextos específicos, sem misturar povos ou reduzir culturas a enfeites.
4. Priorizar acervos e instituições com imagens e condições de uso verificáveis, como os recursos Open Access adequados dos museus. Confirmar os direitos de CADA imagem; a existência de foto na internet não significa uso liberado. Não inventar licença, data, autor, URL ou consulta. Se houver impedimento, encontrar outro exemplo equivalente ou registrar o bloqueio sem forjar conclusão.
5. Não gerar imitação de uma obra real nem atribuir uma imagem inventada a artista/povo. Esquema original deve ser identificado como esquema autoral, com conceito e fontes claros, sem fingir que é obra histórica. Não usar imagem de uma questão selecionável para entregar a resposta na introdução; preservar a separação entre ensino e resolução.
6. Imagens precisam ser legíveis em projeção: resolução suficiente, bom contraste, sem distorção ou ampliação artificial. Preferir arquivos otimizados perto de 1 MB quando possível, nunca acima do limite técnico de 7 MB. Formatos aceitos: PNG, JPG e WebP. Nome seguro em `aulas/imagens/<slug>.<ext>`.
7. Registrar ID, arquivo, descrição alternativa útil, legenda correta, fonte HTTPS direta e condições de uso verificadas. Não substituir a fonte de uma obra por homepage genérica. Nenhum recurso remoto é carregado diretamente na aula: manter arquivo privado e referência declarada.
8. Preservar objetivos, blocos necessários e explicações já boas; inserir leitura guiada sem reduzir o conteúdo a frases decorativas. Cada aula continua `rascunho`; revisão técnica não é aprovação pedagógica do professor. Alterar o arquivo/imagem invalida a conferência anterior pelo hash existente; não contornar essa proteção.

## Testes e entrega

Teste novo primeiro, RED para as 32 aulas sem imagem. Verificar em todos os conteúdos: recurso referenciado existe, identificação segura, bytes/MIME, bloco de imagem com comentário desenvolvido (não só legenda), fonte/alt/crédito/condições de uso preenchidos e ausência de gabarito. Comprimento mínimo é apenas proteção estrutural, não prova de qualidade: auditar semanticamente cada exemplo.

Executar a partir de `frontend/`:

```sh
npx vitest run ../tests/contract/revisao_tematico_exemplos_visuais.test.js ../tests/contract/revisao_tematico_acervo.test.js ../tests/contract/revisao_tematico_servidor.test.js ../tests/contract/revisao_tematico_integridade.test.js --maxWorkers=1
```

Não alterar testes anteriores para acomodar a entrega. Reportar aula a aula: exemplo escolhido, fonte direta, direitos consultados, resolução/tamanho, objetivo atendido, texto da leitura guiada e pendências. Não afirmar revisão visual se não abriu a imagem. Trabalhar em lotes de até oito aulas para controlar contexto e continuar até fechar o escopo, mantendo um checklist real. Ao concluir, entregar arquivos e relatório sem publicar; ChatGPT revisará e integrará.
