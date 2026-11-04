# Evidências — cabeçalho dinâmico da caderneta PDF (CAB-01..06)

Data: 04/11/2026. Dados exclusivamente sintéticos, gerados localmente sem conexão com contas reais, Firebase ou serviços pagos.

## Método e Renderer

- **Exportador real:** `generateCadernetaPDF` de `frontend/src/lib/diario/caderneta-export.js` executado com `jsPDF 4.2.1` real.
- **Renderização visual:** `pdfjs-dist` (`legacy/build/pdf.mjs`) + `@napi-rs/canvas` em escala `2.0x` (todas as páginas convertidas para PNG e inspecionadas visualmente, além da extração textual em `.txt` e metadados em `resumo.json`). Os arquivos `.pdf` intermediários foram gravados em `tmp/2026-11-04-caderneta-cabecalho/` (diretório ignorado pelo Git).

## Fixtures Sintéticas e Páginas Inspecionadas

| Documento | Páginas | Conteúdo e Verificação Visual |
|---|---:|---|
| [caderneta-curto-pagina-1.png](caderneta-curto-pagina-1.png) | 1 | Turma curta (`3º Ano A`), `Prof. Carlos Lima` e 3 estudantes sintéticos cobrindo aprovação (`4,00` / `8,00` → S1 `32,00`; `5,00` / `5,00` → S2 `25,00`; anual `57,00` `APROVADO`), zero real vs. ausência (`0,00` no 1º bim, `5,00` no 2º bim, `—` nos 3º/4º bim e `EM ANDAMENTO`) e recuperação anual (`20,00` + `20,00` = `40,00` `RECUPERAÇÃO`). Metadados alinhados em `x = 12 mm`, folga de 4 mm acima da faixa `#0f766e` e 6 mm entre a faixa e a tabela. |
| [caderneta-longo-pagina-1.png](caderneta-longo-pagina-1.png) | 1 | Turma e professora com ~300 caracteres cada e acentuação completa. Comparado à evidência anterior (`docs/evidencias/2026-11-04-paleta-petroleo-salvia/pdfs/depois/caderneta-pagina-1.png`), elimina integralmente a colisão horizontal entre `TURMA`, `TOTAL DE ALUNOS`, `PROFESSOR(A)` e `EMISSÃO`: cada campo quebra em linhas dentro de `273 mm` (`x` entre `12 mm` e `285 mm`), o fundo `#123c3a` acompanha a altura total e a tabela desce proporcionalmente sem sobreposição. |
| [caderneta-45-alunos-pagina-1.png](caderneta-45-alunos-pagina-1.png) | 4 (pág. 1) | Cabeçalho longo (2 linhas de turma + total + professor + emissão) com deslocamento da tabela na página 1 e renderização íntegra dos estudantes `01.` a `13.`. |
| [caderneta-45-alunos-pagina-2.png](caderneta-45-alunos-pagina-2.png) | 4 (pág. 2) | Continuação com repetição do cabeçalho da tabela (`Nº / NOME DO ESTUDANTE` ... `SITUAÇÃO`) e estudantes `14.` a `29.` com linhas inteiras. |
| [caderneta-45-alunos-pagina-3.png](caderneta-45-alunos-pagina-3.png) | 4 (pág. 3) | Continuação com repetição do cabeçalho da tabela e estudantes `30.` a `45.` até o limite seguro inferior da página. |
| [caderneta-45-alunos-pagina-4.png](caderneta-45-alunos-pagina-4.png) | 4 (pág. 4) | Bloco de assinaturas (`Assinatura do(a) Professor(a) Regente` e `Assinatura da Coordenação / Direção`) posicionado na página seguinte por falta de espaço vertical após o 45º aluno na página 3, sem colidir com a última linha da tabela. |

## Arquivos de Apoio

- [resumo.json](resumo.json): contagem de páginas e mapeamento dos artefatos gerados.
- [caderneta-curto-texto.txt](caderneta-curto-texto.txt), [caderneta-longo-texto.txt](caderneta-longo-texto.txt) e [caderneta-45-alunos-texto.txt](caderneta-45-alunos-texto.txt): texto extraído página a página confirmando conservação integral dos nomes de turma e professor sem reticências no cabeçalho.

## Limites

- Ensaio local com dados sintéticos; não substitui homologação em ambiente de produção pelo usuário final.
- O truncamento preexistente de nomes de estudantes nas células da tabela (`> 34` caracteres → `32` caracteres + `...`) foi preservado conforme especificação (`CAB-05`).
