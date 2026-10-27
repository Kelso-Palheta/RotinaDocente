# Evidências — auditoria do Portal do Aluno

Data: 27/10/2026. Dados inteiramente fictícios, sem acesso a contas reais.

`reproducao.test.jsx` confirma cinco comportamentos incorretos atuais. Seus testes passarem demonstra a reprodução dos problemas, não aprovação funcional. É evidência histórica fora da suíte oficial; poderá falhar após as correções.

Para reproduzir, a partir de `frontend/`, copiar `config-vitest.cjs.txt` para `.auditoria-portal.config.cjs`, executar `npx vitest run --config .auditoria-portal.config.cjs --maxWorkers=2` e remover somente a configuração temporária ao terminar. Não alterar a configuração oficial.

`reproducoes.log`: 5 reproduções confirmadas. `testes-existentes.log`: 48 testes existentes aprovados em 9 arquivos. Resultado limitado aos cenários selecionados; a suíte completa deve ser executada na futura implementação.
