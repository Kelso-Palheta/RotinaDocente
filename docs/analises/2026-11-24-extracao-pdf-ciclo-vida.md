# Extração PDF — destroy is not a function

O extrator compartilhado chamava `destroy()` em `PDFDocumentProxy`. A versão instalada, PDF.js 6.0.227, expõe a liberação em `PDFDocumentLoadingTask`. O `finally` lançava erro mesmo após extração bem-sucedida e também mascarava erros úteis da extração.

Correção: conservar a tarefa retornada por `getDocument`, aguardar seu documento dentro de `try` e destruir a tarefa no `finally`, inclusive se o carregamento falhar. Nenhuma mudança em prompts, provedor de IA, limites ou conteúdo extraído.

Referência: [API oficial PDFDocumentLoadingTask.destroy](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFDocumentLoadingTask.html), confirmada nas declarações da dependência instalada.

Quatro regressões novas reproduziram falhas antes da correção. Casos: PDF digital sem IA, PDF escaneado com visão, erro de chave ausente e erro de carregamento; todos verificam liberação do worker. Conjunto direcionado: 26 testes aprovados. O PDF específico da captura não foi anexado; validação usa documentos simulados com o contrato da versão instalada.

Validação da entrega isolada: 1.902 testes aprovados, 10 ignorados (emuladores opcionais); lint sem erros, 22 avisos; build aprovado.
