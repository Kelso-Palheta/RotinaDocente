# Revisão independente — entrega Antigravity / caderneta

04/11/2026. Base `4de9290`; alterações recebidas ainda sem commit. Revisão de diff, teste novo, seis páginas PNG recebidas e execução própria das verificações.

## Achado P2 — relógio do teste depende do fuso da máquina

`tests/integration/caderneta_cabecalho.test.js:138` fixa o instante `2026-11-04T14:35:00-03:00`. A asserção em `:320` exige literalmente `EMISSÃO: 04/11/2026 às 14:35`. O exportador usa o horário local, preservando o comportamento anterior; em UTC, o mesmo instante aparece como 17:35. Assim, o teste passa em Belém e falha em uma máquina/CI em UTC, sem defeito na renderização do documento.

Reprodução própria, a partir de `frontend/`:

```sh
TZ=UTC ./node_modules/.bin/vitest run ../tests/integration/caderneta_cabecalho.test.js
```

Resultado: **1 falha / 5 aprovados**, exclusivamente na comparação do horário. Log em `tmp/caderneta-revisao-tz-utc.log`.

Correção pontual proposta: usar `vi.setSystemTime(new Date(2026, 10, 4, 14, 35, 0))`, criando o relógio civil esperado no fuso local de execução. Manter a asserção de emissão e todas as verificações geométricas, de dados e de cores. Não mudar o exportador para um fuso fixo apenas para acomodar o teste.

Na revisão inicial, nenhum teste foi alterado. O proprietário autorizou expressamente ajustar somente a criação do relógio simulado. Aplicada exclusivamente a troca para `new Date(2026, 10, 4, 14, 35, 0)`, preservando integralmente todas as asserções. Comparação com a cópia recebida confirmou que essa é a única alteração no teste. Não houve ajuste no exportador para acomodar o teste.

## Verificações próprias concluídas

- Suíte completa no fuso local: **1.176 testes / 259 arquivos aprovados**, exit 0.
- Build de produção: exit 0. Lint do exportador: exit 0. `git diff --check`: sem apontamentos.
- Produção alterada somente no cabeçalho e cursor vertical inicial da caderneta; fórmula, colunas, exportação CSV, domínio e outros exportadores permanecem intocados. Nenhum teste anterior modificado.
- Metadados medidos e desenhados com Helvética normal 9, dentro de 273 mm; título bold 16 preservado. Folgas de 4 mm e 6 mm seguem a spec.
- Inspecionadas as seis páginas PNG recebidas: curto, longo e quatro páginas com 45 alunos. Sem colisão observada em turma/professor/emissão; continuações da tabela e assinaturas separadas. A página só de assinaturas é consequência permitida da paginação existente.
- Não foram encontradas outras falhas no escopo conferido. Nenhuma escrita no banco, chamada paga ou teste com conta real. PDFs não foram regenerados nesta revisão; a geometria foi exercitada com jsPDF real pelos testes e as renderizações recebidas foram inspecionadas.

## Conclusão após autorização

CAB-REV-01 resolvido com alteração exclusiva do relógio simulado. Execução própria após o ajuste: **6/6 em UTC** e **1.176 testes/259 arquivos na suíte completa em America/Belem**, ambos exit 0. Todas as expectativas e verificações permaneceram idênticas à entrega recebida.

Build e lint aprovados na revisão da mesma implementação de produção; o ajuste posterior limitou-se à fixture do teste, sem nova alteração no exportador. Escopo aprovado para commit/push e publicação automática. Sem novas escritas em banco, chamadas pagas ou alteração de plano Firebase.
