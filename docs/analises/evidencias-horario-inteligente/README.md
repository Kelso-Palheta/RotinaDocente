# Evidências — Horário Inteligente

27/10/2026. `reproducao.test.js` usa funções reais extraídas do HTML em VM isolada, DOM/serviços simulados e verificação local de assets. Oito testes passam confirmando defeitos; não são testes de aceite e podem falhar depois de correções. Nenhum dado real acessado nem servidor acionado.

Para reproduzir, copiar config-vitest.cjs.txt para frontend/.auditoria-inteligente.config.cjs; a partir de frontend, executar npx vitest run --config .auditoria-inteligente.config.cjs --maxWorkers=1; remover configuração temporária ao terminar.

31 testes relacionados passaram: api_client_jwt, horario_escolar, horario_calendario_seguro e horario_persistencia. Não representam cobertura funcional do módulo estático. Logs em reproducoes.txt e testes-relacionados.txt.
