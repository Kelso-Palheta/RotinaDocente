# Evidências da auditoria — 24/10/2026

Os três arquivos `.test.jsx.txt` registram seis reproduções de defeitos atuais. São material de diagnóstico, fora da suíte de regressão. Não devem ser adotados como critérios de comportamento correto.

Todos os dados são sintéticos. Acesso ao banco, detector de similaridade e serviços relacionados são simulados.

Para repetir no ambiente local usado na análise:

1. Copiar os três arquivos para `/private/tmp/rd-auditoria-gerador/`, removendo `.txt`.
2. Copiar `vitest.config.cjs.txt` para a mesma pasta como `vitest.config.cjs`.
3. A partir de `frontend`, executar `npx vitest run --config /private/tmp/rd-auditoria-gerador/vitest.config.cjs --maxWorkers=2`.

Resultado observado:

```text
Test Files  3 passed (3)
     Tests  6 passed (6)
```

Os testes confirmam: fechamento antecipado do editor, deslocamento de prazo, gabarito vazio, leitura sem acesso emitido, entrega sem autenticação/vínculo e efeito automático de penalização quando o detector aponta similaridade. Não exercitam produção, infraestrutura de hospedagem ou precisão real do detector.

Verificação separada de testes existentes:

```text
npx vitest run --maxWorkers=4 ../tests/unit/components/atividades ../tests/integration/correcao_atividades_gemini.test.js ../tests/integration/documento_visual.test.js ../tests/integration/documento_extracao.test.js ../tests/integration/documento_truncamento.test.js ../tests/integration/documento_finalidade.test.js ../tests/integration/sincronizacao_atividades_firestore.test.js ../tests/unit/sincronizacao_atividades_escopo.test.js ../tests/unit/correcao_manual_atividades.test.js ../tests/unit/extrair_json_ia.test.js

Test Files  18 passed (18)
     Tests  83 passed (83)
```

Suíte completa, verificada separadamente com `npx vitest run --maxWorkers=4`:

```text
Test Files  117 passed (117)
     Tests  646 passed (646)
```


## Correções implementadas — banco local

`tests/regression/atividades_firestore_emulador.mjs` executa cinco testes reais contra o emulador Firestore. Recusa execução sem host local explícito. Projeto fixo: `demo-rotina-atividades`; somente dados sintéticos.

Antes das correções nas regras: quatro falhas e um aprovado. Depois: cinco aprovados. Logs `firestore-antes.log` e `firestore-depois.log`.

Para repetir, configure Firebase Emulator Suite com Java 21, regras `frontend/firestore.rules`, host `127.0.0.1` e porta local; execute pelo `firebase emulators:exec --only firestore --project demo-rotina-atividades` o comando `node --test` apontando para o teste. O Firebase preenche `FIRESTORE_EMULATOR_HOST`.

Na auditoria, foi usado Java temporário em `/tmp/rd-java21` e configuração temporária em `/tmp/rd-firestore-emulador`; não houve instalação global nem deploy. A validação usa o suporte documentado de [condições/regras](https://firebase.google.com/docs/firestore/security/rules-conditions) e [emulador](https://firebase.google.com/docs/emulator-suite/connect_firestore).
