# Cabeçalho da caderneta — plano de implementação

> **Para Antigravity:** usar a skill `executing-plans` disponível em `/Users/kelsopalheta/.agents/skills/executing-plans/SKILL.md`, executando as etapas e verificando cada resultado. O escopo e a divisão com revisão neste chat já estão definidos; não é necessário solicitar nova escolha de executor.

**Objetivo:** corrigir colisão dos metadados com nomes longos na caderneta PDF, mantendo dados e cálculos atuais.

**Arquitetura:** alterar somente apresentação do cabeçalho em `generateCadernetaPDF`. Medir/quebrar cada metadado com a fonte da impressão, calcular altura e deslocar verticalmente tabela/assinaturas pelos mecanismos existentes; domínio e infraestrutura permanecem intactos.

**Stack:** JavaScript, jsPDF 4.2.1, Vitest 4.1.11 e Next.js 16.2.9 já instalados. Não adicionar bibliotecas.

---

## Etapa 1 — Base e leitura

1. Trabalhar em `/Users/kelsopalheta/Developer/RotinaDocente`, partindo de `1a95f58` ou descendente que preserve essa versão. Ler `AGENTS.md`, `frontend/AGENTS.md`, `specs/PRD.md`, `specs/RULES.md`, `specs/TESTS_SPEC.md` e `specs/CABECALHO_CADERNETA_SPEC.md`.
2. Conferir estado/branch e preservar alterações alheias. Não usar reset/clean/stash global nem criar nova instalação/cópia do projeto. O disco ficou sem espaço na rodada anterior; reutilizar dependências existentes e evitar cópias desnecessárias.
3. Ler por inteiro `frontend/src/lib/diario/caderneta-export.js`. Consultar como referência de medição `frontend/src/lib/aluno/boletim-pdf.js` e `frontend/src/lib/diario/fichaAlunoExport.js`, sem editá-los.
4. Abrir a evidência da colisão indicada na spec. Confirmar a causa: quatro campos na mesma linha, x e altura fixos sem medição.

## Etapa 2 — RED antes de implementação

**Criar:** `tests/integration/caderneta_cabecalho.test.js`.

1. Instrumentar jsPDF real seguindo o padrão de `tests/integration/relatorios_pdf_cabecalho.test.js`, preservando esse arquivo. Registrar número de página, texto/array normalizado, fonte/tamanho, coordenadas, largura medida e faixas/retângulos. Não usar um mock de largura constante.
2. Cobrir os seis aceites da spec. Comparar caixas na mesma página; considerar alinhamento e todas as linhas de arrays. Confirmar conservação integral dos valores de turma/professor, não apenas de seus prefixos. Verificar largura máxima por linha e folgas verticais, sem pressupor altura fixa nova.
3. Gerar fixtures determinísticas, com relógio controlado no teste: curto, nomes longos com acentos, ~300 caracteres por campo, turma vazia e 45 alunos. Para notas, incluir zero e ausência. Testar objeto de entrada antes/depois para não aceitar mutação.
4. Executar a partir de `frontend/`:

```sh
npx vitest run ../tests/integration/caderneta_cabecalho.test.js
```

Esperado: falha geométrica real por colisão/extravasamento na versão atual. Guardar resumo RED no relatório. Corrigir erro de setup/import separadamente; não chamar erro de infraestrutura de RED válido.

## Etapa 3 — Correção mínima e GREEN

**Modificar:** `frontend/src/lib/diario/caderneta-export.js`, apenas cabeçalho e posicionamento vertical indispensável.

1. Preparar os quatro campos completos e quebrar em linhas com `splitTextToSize`, após definir Helvética normal 9. Preferir fluxo vertical por campo, dentro da largura útil da página. Preservar título bold 16.
2. Calcular as posições de todas as linhas, altura do fundo, início da faixa e início da tabela a partir do último baseline. Reservar as folgas da spec (4 mm até a faixa; 6 mm depois do fim da faixa até a tabela).
3. Desenhar com a mesma fonte/tamanho usados na medição. Manter paleta petróleo/sálvia e as cores atuais das notas.
4. Conservar tabela, dimensões horizontais, ordem dos alunos, linhas inteiras, cabeçalhos das continuações e assinaturas. Não mudar cálculos, domínio, arquivos CSV, dados, API pública, autenticação, calendário ou outros PDFs.
5. Executar o teste novo: esperado GREEN sem alterar os testes para acomodar resultado incorreto.

## Etapa 4 — Regressões e validação

A partir de `frontend/`:

```sh
npx vitest run ../tests/integration/caderneta_cabecalho.test.js ../tests/integration/aprovacao_relatorios_pdf.test.js ../tests/integration/relatorios_pdf_cabecalho.test.js ../tests/integration/relatorios_pdf_revisao.test.js ../tests/integration/relatorio_bimestre_export.test.js ../tests/integration/boletim_faixa_bimestral.test.js
npm test
npx eslint src/lib/diario/caderneta-export.js
npm run build
```

Esperado: regressões e suíte sem falhas, lint do arquivo limpo, build exit 0. Não repetir suíte/build após aprovação sem novas alterações ou evidência que justifique. Se a falha for de ambiente/disco, informar e preservar código/dados; não apagar arquivos pessoais nem instalações de outros projetos.

## Etapa 5 — PDF real, revisão e entrega

1. Gerar PDFs reais curto/longo/45 alunos com dados inteiramente sintéticos. Renderizar usando ferramentas já disponíveis (Poppler ou pdfjs/canvas). Inspecionar todas as páginas: cabeçalho, direita/esquerda, emissão, faixa, primeira/última linha e assinaturas. Extração de texto sozinha não comprova layout.
2. Guardar evidências em `docs/evidencias/2026-11-04-caderneta-cabecalho/` com README: fixtures, renderer, páginas e limites. Não inventar valores nem usar dados reais. Comparar com a evidência anterior; aumento necessário de páginas é permitido.
3. Acrescentar relatório `docs/analises/2026-11-04-caderneta-cabecalho.md` e atualizar somente a entrada pertinente de `specs/TESTS_SPEC.md`/`specs/TASKS.md` com resultados observados.
4. Revisar diff: código permitido somente no exportador; testes novos; documentação/evidências da tarefa. Nenhum teste existente alterado/deletado. Nenhum pacote/configuração novo, escrita em banco ou chamada paga.
5. Entregar resumo de arquivos, RED/GREEN, testes, lint, build e evidências para revisão neste chat. **Nesta execução delegada, não fazer commit/push/deploy.** A publicação automática será feita pelo revisor após aprovar a entrega, conforme o fluxo já adotado com agentes externos.
