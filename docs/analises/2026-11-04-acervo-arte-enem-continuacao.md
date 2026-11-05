# Continuação do acervo de Arte/ENEM

Entrega técnica consolidada em 05/11/2026. Continuação assumida pelo Codex após o limite do DeepSeek. Escopo: dados privados em `content/revisao-enem/`, documentação e testes novos. A primeira fase não alterou módulos, notas, autenticação, persistência ou dependências. Após ela, o usuário autorizou corrigir o lint global antes de publicar; essa manutenção é descrita em `2026-11-05-correcao-lint-inicializacao.md`.

## Resultado verificável

O repositório publicado tinha 48 questões e 36 imagens. Foram integrados os 12 rascunhos de 2015/2016 deixados pelo DeepSeek e acrescentadas outras 137 questões. Resultado: **197 questões únicas, 124 imagens, todos os anos de 2009–2025 representados; zero questões elegíveis para sala**. Contagens por ano/modalidade constam do README do acervo. Questões compartilhadas não são somadas duas vezes.

O inventário mantém 51 entradas: 46 catalogadas, três não localizadas e duas pendentes. Não atribuí inexistência de aplicação à simples ausência de URL. O rótulo anterior `nao_aplicavel` de PPL 2009 foi substituído por `nao_localizada`, pois o levantamento não dispõe de comprovação histórica suficiente.

## Trabalho de fonte e transcrição

- Provas e gabaritos obtidos por HTTPS com verificação TLS. SHA-256 calculado sobre os arquivos efetivamente baixados; nenhuma chave de resposta foi criada a partir do nome do PDF.
- `curadoria.json` registra 34 pares de prova/gabarito e 1.360 posições do recorte principal de Linguagens, além da conferência de **260 referências de gabarito** das questões catalogadas. Esse percurso técnico não representa leitura editorial integral de cada prova.
- Posições sem decisão editorial continuam `curadoria_pendente`. Não converti ausência na seleção em exclusão do recorte de Arte.
- Gabaritos de 2010 estão assinalados graficamente no próprio caderno: foram conferidos nas marcações, com os resultados registrados na curadoria. Nos demais anos, foi usada a tabela oficial correspondente ao caderno.
- Fontes com codificação defeituosa exigiram OCR Tesseract e transcrição localizada. Apple Vision falhou neste ambiente e não foi usado como evidência. Uma tentativa de mapear glifos por fonte também foi descartada por produzir letras incorretas.
- Os novos textos permanecem com revisão de transcrição pendente. Nenhuma extração automática foi promovida a conferência docente.

## Correções materiais

1. **2025 regular azul, questão 41:** a entrega anterior trazia D; a chave oficial indica **B**. Chave e comentários de B/D foram corrigidos. Fonte: [gabarito oficial](https://download.inep.gov.br/enem/provas_e_gabaritos/2025_GB_impresso_D1_CD1.pdf).
2. Foram revistos comentários que contradiziam as respostas corretas em 2016 PPL/99, 2017 PPL/20, 2018 regular/29 e 2018 PPL/16. As explicações continuam rascunhos, sem aprovação pedagógica simulada.
3. Foram removidos marcadores OCR das alternativas e legendas que haviam sido incorporadas ao comando da questão 2016 PPL/111.
4. Nove questões PPL de 2017 receberam também a referência da reaplicação azul, com seus números e páginas próprios. Não foram criadas duplicatas para outra cor do mesmo conjunto.
5. **55 recortes de imagens corrigidos:** pdfplumber fornece coordenadas da MediaBox; a renderização PDFium usava por padrão a CropBox. A divergência deslocava algumas figuras. Os recortes foram refeitos com a mesma referência espacial e inspecionados visualmente. Coordenadas e hashes estão registrados. As seis figuras novas de 2010 já usam o procedimento corrigido.
6. As alternativas visuais de 2010/102, 2016 PPL/111 e 2017/21 foram identificadas nas descrições. Em 2016, a ordem física de leitura do PDF era A/D/B/E/C; a coleção foi organizada em A/B/C/D/E, preservando os arquivos e suas identidades.

As figuras derivam das provas oficiais. Não houve geração, reconstrução de obra por IA ou promessa de resolução superior à fonte. A inspeção técnica de recortes não substitui conferência docente de todas as figuras.

## Limites e pendências

**O acervo ainda não pode ser declarado completo nem pronto para uma aula.**

- 2011 Reaplicação/PPL: prova localizada; gabarito correspondente não localizado. Sem questões com chave presumida. A página oficial identifica a aplicação compartilhada e ambas as entradas do inventário refletem isso.
- 2009 PPL/reaplicação e 2025 PPL: fontes não localizadas, sem afirmar inexistência histórica.
- Há posições de Linguagens ainda sem decisão editorial individual. Ciências Humanas e demais áreas não foram percorridas integralmente; as questões interdisciplinares já existentes foram preservadas. Línguas estrangeiras também não tiveram levantamento integral. Aplicações digitais não foram catalogadas.
- O caderno regular regional D3 de 2025 mantém seus seis IDs legados, com classificação `regular` e edição regional. Ele não equivale à reaplicação nacional D5. Seus registros foram preservados, mas o caderno regional não foi incluído como percurso integral de 40 posições na curadoria.
- Todos os 197 registros exigem revisão docente das explicações antes de aprovação. Nenhum foi promovido automaticamente para `revisada`; o bloqueio de elegibilidade permanece.

Próxima frente do acervo: concluir as decisões editoriais pendentes e o levantamento interdisciplinar, localizar as fontes ausentes e executar a conferência docente. A integração de salas, servidor e Portal é outra frente; este lote não a implementa.

## Validação

Foram acrescentados três arquivos de testes, sem alterar testes recebidos:

- `revisao_acervo_continuacao.test.js`: representação dos anos, vínculo com o inventário, percurso rastreável e ausência de imagens órfãs. RED observado antes da consolidação.
- `revisao_acervo_fidelidade.test.js`: resíduos OCR, comando separado das opções e referência compartilhada de 2017. Três falhas reproduzidas antes da correção.
- `revisao_acervo_gabarito_2025.test.js`: regressão para a chave B da questão 41. RED observado com a chave D anterior.

Contratos do acervo: **14 testes em seis arquivos aprovados**. Suíte completa: **1.277 testes em 276 arquivos aprovados**, execução `npm test -- --maxWorkers=2`, em 82,49 segundos. Testes não certificam exaustividade, precisão pedagógica nem revisão humana. Não houve mudança de código de aplicação que justificasse alterar a implementação para acomodar os dados.


## Publicação e verificações globais

Build de produção (`npm run build`, Turbopack): **aprovado, exit 0**, incluindo as 37 páginas estáticas e rotas dinâmicas.

Lint geral (`npm run lint`): **reprovado, 23 erros e 13 avisos preexistentes**. Os erros estão em `aluno/page.js`, `BotaoLeitorVoz.jsx`, `ModalAlunoPEI.jsx`, `ModalImportarAtividadeTurma.jsx`, `ModalNovaQuestao.jsx`, `ModalConectarIA.jsx` e `auth-context.js`; envolvem estado síncrono em efeitos e aspas não escapadas. Nenhum arquivo em `frontend/` foi alterado nesta tarefa, conforme `git diff --name-only HEAD -- frontend` vazio. Não desativei regras nem reescrevi esses módulos para liberar o lote.

O usuário escolheu corrigir o lint antes de publicar. A manutenção posterior eliminou os 23 erros, sem desativar regras nem alterar testes recebidos. Validação final do conjunto: **1.295 testes em 280 arquivos aprovados**, **lint zero erros (11 avisos existentes de imagens)** e **build de produção aprovado**. A publicação segue a autorização automática do projeto após essas verificações; não houve exceção ao AGENTS.md.
