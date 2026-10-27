# Evidências históricas — Analytics, 27/10/2026

Dados fictícios e serviços simulados. Os oito testes de reprodução aprovados confirmam comportamentos incorretos presentes no código; não são critérios de aceite para futuras correções. Não integram a suíte oficial. Após corrigir o módulo, algumas expectativas históricas deverão deixar de passar; preservá-las como registro desta auditoria.

Para reproduzir, copiar `config-vitest.cjs.txt` para `frontend/.auditoria-analytics.config.cjs`, executar dentro de `frontend`:

```sh
npx vitest run --config .auditoria-analytics.config.cjs --maxWorkers=2
```

Remover a configuração temporária após o uso. Testes existentes verificados separadamente:

```sh
npx vitest run ../tests/unit/analytics_calculos.test.js ../tests/unit/components/diario/PortalAprovacaoSemestral.test.jsx --maxWorkers=2
```

Logs incluem apenas dados fictícios e resultados locais. A captura do PDF intercepta texto no gerador real com jsPDF; não inspeciona um relatório de aluno real.
