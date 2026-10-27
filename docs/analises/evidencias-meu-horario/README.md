# Evidências — Meu Horário Escolar

27/10/2026. Dados inteiramente fictícios, sem serviços reais.

`reproducao.test.js` confirma oito comportamentos atuais/históricos, incluindo algoritmo legado cujo acionamento foi retirado da interface por decisão do usuário. Passar estes testes confirma a reprodução, não valida o comportamento desejado. Evidência fora da suíte oficial; pode falhar depois das correções propostas.

Para reproduzir, copiar `config-vitest.cjs.txt` para `frontend/.auditoria-horario.config.cjs`, executar `npx vitest run --config .auditoria-horario.config.cjs --maxWorkers=1` a partir de frontend e remover a configuração temporária.

27 testes existentes passaram em quatro arquivos. A remoção autorizada possui teste funcional próprio em `tests/unit/components/horario/SemGeradorMagico.test.jsx`, preservando os testes anteriores. Validação final é registrada após as verificações.
