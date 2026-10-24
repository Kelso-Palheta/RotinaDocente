# Evidências da auditoria de imagens adaptadas

Data: 24/10/2026. Dados sintéticos, APIs simuladas; nenhuma chamada real de geração, gravação em produção ou leitura de credenciais.

`reproducao.test.jsx` importa componentes e rota reais, substituindo somente autenticação, configuração de IA, persistência e respostas externas. **Os seis testes passam ao confirmar defeitos atuais. Não são testes de aceite nem prova de que o comportamento esteja correto.** Estão fora de `tests/` e da suíte normal para não consolidar os defeitos como requisitos.

Para repetir, na pasta `frontend`:

```sh
cp ../docs/analises/evidencias-imagens-adaptadas/vitest.config.cjs.txt .auditoria-imagens.config.cjs
npx vitest run --config .auditoria-imagens.config.cjs --maxWorkers=2
rm .auditoria-imagens.config.cjs
```

A configuração reaproveita ambiente DOM e aliases do projeto. Logs nesta pasta registram seis reproduções e 32 testes existentes aprovados (cinco arquivos). Os dados base64 propositalmente inválidos demonstram ausência de validação: não representam amostras de qualidade visual.

Não há avaliação visual de imagens reais nesta entrega. Uma homologação visual futura deve usar os casos do relatório, guardar originais/saídas, parâmetros, métricas e decisão humana.

Após a implementação RN-72, as reproduções de defeitos neste diretório são evidência histórica; elas podem falhar ao encontrar o comportamento corrigido. Os critérios de aceite novos estão na suíte `tests/`, incluindo identidade, concorrência, API, integridade e persistência. `previa.test.jsx` exporta uma prévia sintética do componente real, sem chamadas de IA.
