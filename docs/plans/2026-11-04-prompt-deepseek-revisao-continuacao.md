# DeepSeek — continuar acervo de Arte/ENEM

No projeto `/Users/kelsopalheta/Developer/RotinaDocente`, leia AGENTS.md, specs/REVISAO_AO_VIVO_SPEC.md, specs/TESTS_SPEC.md, docs/analises/2026-11-04-revisao-entregas-aulao.md e o prompt original `docs/plans/2026-11-04-prompt-deepseek-revisao.md`.

Continue sua frente até cobrir o recorte 2009–2025, regular/PPL/reaplicações. Há somente 16 questões únicas e zero elegíveis; não considere sua entrega anterior como conclusão do acervo. Preserve as correções feitas pela revisão: Linguagens no segundo dia antes de 2017; fontes compartilhadas aparecem em ambas as modalidades sem duplicar questões. IDs existentes permanecem estáveis. O usuário autorizou somente o limite 90→180 no teste recebido; não altere outras verificações.

Trabalhe SOMENTE em `content/revisao-enem/`, `docs/analises/2026-11-04-acervo-arte-enem-continuacao.md` e, se necessário, testes NOVOS `tests/contract/revisao_acervo_continuacao.test.js`. Não alterar specs, testes existentes, frontend, dependências, credenciais ou arquivos de outros agentes. Não fazer commit/push/deploy/build. Releia arquivos atuais antes de editar; a revisão já corrigiu parte dos seus dados.

Prioridade: questões de 2025 regular/reaplicação, completar Arte de 2024/2023/2019 e seguir anos restantes. Registrar aplicações especiais e compartilhadas com precisão; não inventar caderno ausente nem inferir inexistência pela ausência de link. Quando nome do PDF divergir da capa, conferir documento/gabarito e registrar anomalia. Número impresso e página são campos distintos.

Extrair textos, A–E, gabarito e figuras somente de fontes oficiais. Ler gabarito real correspondente ao caderno, preservar obras/legendas, não gerar imagem substituta. Escrever explicações específicas de todas as alternativas e conteúdo preparatório. Manter rascunho e revisão docente pendente: não simular revisão humana nem liberar registros automaticamente.

Para validação, executar `cd frontend && npx vitest run ../tests/contract/revisao_acervo.test.js ../tests/contract/revisao_acervo_revisao.test.js` e seus testes novos. Não ajustar testes para passar. Reportar questões únicas por ano/modalidade, quais provas foram percorridas integralmente, lacunas, fontes verificadas e resultado dos testes. Se não concluir todo o acervo, dizer exatamente o que falta e entregar os lotes válidos, sem alegar completude.
