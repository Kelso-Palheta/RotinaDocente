# Cabeçalho da caderneta PDF — implementação e validação (CAB-01..06)

Data: 04/11/2026. Base: `4de9290` (descendente direto de `1a95f58`). Escopo restrito a `frontend/src/lib/diario/caderneta-export.js` e ao novo teste de integração `tests/integration/caderneta_cabecalho.test.js`.

## Causa confirmada

Em `generateCadernetaPDF`, os quatro metadados do cabeçalho (`TURMA`, `TOTAL DE ALUNOS`, `PROFESSOR(A)` e `EMISSÃO`) eram impressos na mesma linha (`y = 21`) em posições horizontais fixas (`margin`, `margin + 65`, `margin + 125`, `margin + 200`), sobre um fundo fixo de `32 mm`, faixa decorativa fixa em `y = 30.5` e tabela iniciando em `cursorY = 38`. Com nomes de turma ou professor extensos, os textos colidiam horizontalmente na mesma linha de base e ultrapassavam a margem direita de `285 mm`.

## Ciclo TDD (RED → GREEN)

1. **RED (`tests/integration/caderneta_cabecalho.test.js`):**
   - Instrumentação do `jsPDF` real capturando página, fonte/estilo/tamanho, coordenadas, largura real (`getTextWidth`), `splitTextToSize`, retângulos e linhas.
   - Execução antes da mudança de produção (`npx vitest run ../tests/integration/caderneta_cabecalho.test.js`): **3 falhas em 6 testes**:
     - Colisão horizontal na amostra de homologação: interseção de `32,48 mm` (`expected 32.480249999999984 to be less than or equal to 0.2`).
     - Extravasamento da margem direita com ~300 caracteres: `x` direito atingiu `594,52 mm` para limite de `285,20 mm` (`expected 594.5172499999998 to be less than or equal to 285.2000833333333`).
     - Início fixo da tabela com 45 alunos e cabeçalho longo: `tabelaPag1.y` permaneceu em `38 mm` (`expected 38 to be greater than 38`).
2. **Implementação mínima (`frontend/src/lib/diario/caderneta-export.js`):**
   - Configuração de `helvetica` `normal` `9` antes de medir e quebrar cada um dos quatro metadados (`TURMA`, `TOTAL DE ALUNOS`, `PROFESSOR(A)`, `EMISSÃO`) com `doc.splitTextToSize(campo, maxLineWidth)` (`maxLineWidth = 273 mm`).
   - Fluxo vertical de metadados a partir de `y = 20` com passo de `4,2 mm` por linha.
   - Reserva de `4 mm` entre o último baseline dos metadados e o topo da faixa decorativa (`faixaY = ultimoBaselineMetadadosY + 4`, altura `1,5 mm`), fundo `#123c3a` cobrindo `alturaCabecalho = faixaY + 1.5` e início da tabela `6 mm` abaixo do fim da faixa (`cursorY = alturaCabecalho + 6`).
   - Preservação integral do título (`bold 16`), paleta petróleo/sálvia, colunas e larguras da tabela, cálculos `25/25/50`, distinção entre zero e ausência, paginação com repetição do cabeçalho da tabela, bloco de assinaturas e exportações CSV/bimestral.
3. **GREEN:**
   - `npx vitest run ../tests/integration/caderneta_cabecalho.test.js`: **6/6 testes aprovados**.

## Verificações executadas

- **Regressões de PDF:** `npx vitest run ../tests/integration/caderneta_cabecalho.test.js ../tests/integration/aprovacao_relatorios_pdf.test.js ../tests/integration/relatorios_pdf_cabecalho.test.js ../tests/integration/relatorios_pdf_revisao.test.js ../tests/integration/relatorio_bimestre_export.test.js ../tests/integration/boletim_faixa_bimestral.test.js` → **6 arquivos / 25 testes aprovados**.
- **Suíte completa:** `cd frontend && npm test` → **259 arquivos / 1.176 testes aprovados** (1.170 preexistentes intocados + 6 novos).
- **Lint do arquivo alterado:** `cd frontend && npx eslint src/lib/diario/caderneta-export.js` → **exit 0** (0 erros, 0 avisos).
- **Build de produção:** `cd frontend && NODE_USE_SYSTEM_CA=1 npm run build` → **exit 0** (37/37 rotas geradas).
- **PDFs reais renderizados e inspecionados:** `caderneta-curto.pdf` (1 página), `caderneta-longo.pdf` (1 página) e `caderneta-45-alunos.pdf` (4 páginas) renderizados com `pdfjs-dist` + `@napi-rs/canvas` em `docs/evidencias/2026-11-04-caderneta-cabecalho/`.

## Limites e escopo preservado

- Nenhum teste preexistente foi editado ou removido.
- Nenhuma dependência foi adicionada; nenhuma chamada de IA, autenticação ou gravação em banco foi executada.
- Conforme instrução do plano, não foram realizados `git commit`, `git push` ou deploy nesta execução.


## Revisão posterior neste chat

Revisão independente concluída após a entrega: `docs/analises/2026-11-04-revisao-antigravity-caderneta.md`. Encontrada dependência de fuso exclusivamente na fixture do teste novo; o usuário autorizou ajustar somente a construção do relógio. Todas as asserções preservadas, 6/6 em UTC e suíte completa 1.176/259 em Belém. Nenhuma alteração adicional de produção foi necessária.
