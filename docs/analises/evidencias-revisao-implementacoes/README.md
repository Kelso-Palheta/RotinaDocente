# Evidências históricas da revisão

Quatro testes confirmam falhas com dados fictícios. Não integram a suíte oficial e não são critérios de aceite; após as correções, expectativas históricas poderão deixar de passar.

Copiar `config-vitest.cjs.txt` para `frontend/.auditoria-revisao.config.cjs` e executar dentro de `frontend`:

```sh
npx vitest run --config .auditoria-revisao.config.cjs --maxWorkers=2
```

Remover configuração temporária após execução. `horario.test.jsx` controla conclusão tardia de gravação após troca de conta; `portal.test.jsx` controla duas respostas parciais; `repositorio.test.jsx` utiliza armazenamento em memória e adaptador Firestore fictício. Nenhuma escrita externa.
