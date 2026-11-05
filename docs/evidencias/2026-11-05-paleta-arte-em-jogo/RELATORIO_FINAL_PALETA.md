# Relatório de Entrega: Nova Paleta "Arte em Jogo" (Roxo Festival)

Data: 05/11/2026
Status da Tarefa: **Concluída com Sucesso — Aguardando Revisão do Usuário (Sem Commit/Push)**

---

## 1. Resumo Executivo

A identidade visual do projeto **RotinaDocente** foi integralmente migrada da paleta petróleo/sálvia para a nova paleta **"Arte em Jogo"** (roxo festival), conforme a imagem de referência fornecida pelo usuário.

### Tokens Centrais Implementados

| Papel | Token / Hex | Aplicação no Sistema |
|---|---|---|
| **Roxo Principal** | `#6315D9` | Navegação, botões primários (`--pink`, `--primary`), ícones de marca, estados ativos |
| **Roxo Hover** | `#5411B8` | Estado hover do primário (`--pink-dark`) |
| **Roxo Profundo** | `#25104A` | Superfícies escuras, texto principal (`--navy`, `--ink`, `--foreground`), cabeçalhos |
| **Fundo Claro** | `#FFFDF7` | Fundo geral da aplicação (`--background`) |
| **Superfície Suave** | `#F3EDFF` | Superfícies secundárias, cards, áreas de leitura (`--bg-soft`, `--pink-soft`) |
| **Chip / Destaque Claro** | `#E7DBFD` | Chips e badges suaves (`--pink-light`) com texto escuro `#25104A` |
| **Bordas** | `#E2D9F7` | Bordas sutis de formulários e divisórias (`--border`) |
| **Texto Secundário** | `#5B4B86` | Texto de apoio e legendas (`--gray`, contraste 7,39:1) |
| **Texto Terciário / Placeholder** | `#6E5F94` | Placeholders e metadados discretos (`--gray-light`, contraste 5,54:1) |
| **Rótulos Semibold** | `#4A3B7C` | Títulos e rótulos intermediários (contraste 9,35:1) |
| **Lavanda de Marca** | `#B9A6EF` | Destaque do logotipo "Rotina**Docente**" sobre fundos escuros (contraste 7,80:1) |
| **Destaque Ciano** | `#00DDEB` | Acento vibrante em detalhes |
| **Destaque Amarelo** | `#FFE500` | Acento vibrante em detalhes (com texto `#25104A`) |
| **Destaque Rosa** | `#FF2D93` | Acento vibrante em detalhes |
| **Destaque Lima** | `#B9EF00` | Acento vibrante em detalhes (com texto `#25104A`) |

---

## 2. Preservações Estritas Garantidas

1. **Notas e Classificações (RN-18):**
   - Arquivo `frontend/src/utils/diario/coresNota.js`: cores semânticas preservadas (`sem_nota` em slate, `abaixo` em red-600, `aprovado` em blue-600, `excelente` em green-600).
   - Arquivo `frontend/src/dominio/analytics/analise.js`: regras de cálculo de nota e faixas de risco intactas.
2. **Gráficos de Desempenho (Analytics):**
   - Faixas críticas de desempenho em rosa `#f60c49` preservadas em `DistribuicaoChart.jsx` e `ComparativoTurmasChart.jsx`.
3. **Disciplinas do Horário Escolar:**
   - Paleta de disciplinas em `gradeService.js` e `HorarioApp.jsx` mantida (ex.: `#0d9488` Biologia, `#7c3aed` Física, etc.).
4. **Módulo Revisão ENEM ao Vivo (`REVISAO_VISUAL_VIBRANTE_SPEC.md`):**
   - Mantido seu caráter festivo original com convergência cromática natural ao fundo `#25104A`.
5. **Estrutura, Tipografia e Layout:**
   - Tipografia (Manrope/Inter), espaçamentos, grids responsivos, exports, rotas e lógica mantidos 100% inalterados.

---

## 3. Verificações da entrega inicial

### A. Novo Teste de Contrato (`tests/unit/paleta_arte_em_jogo.test.js`)
- **Resultado:** 25/25 testes aprovados (`✓ 25 passed`).
- Validação de contrato de tokens em `globals.css`.
- Varredura de hexes legados da marca petróleo/sálvia em toda a base de código.
- Teste independente de contraste WCAG 2.1 AA para todos os pares de cor (todos ≥ 4,5:1).

### B. Linters (ESLint)
- **Resultado:** 0 erros (`✖ 11 problems (0 errors, 11 warnings pré-existentes de @next/next/no-img-element)`).

### C. Build de Produção Next.js
- **Resultado:** Concluído com sucesso (`✓ Compiled successfully in 14.5s`). Todas as 39 páginas estáticas e dinâmicas geradas sem erros.

### D. Suíte Geral Vitest
- **Resultado:** 316 arquivos de teste aprovados, 4 pulados e apenas 3 arquivos reprovados devido a assertivas que exigiam literalmente a paleta legada (detalhados na seção 4).

---

## 4. Expectativas de cor identificadas na entrega inicial

Em estrito respeito à **Blindagem de Testes**, os seguintes testes **NÃO foram modificados ou removidos** e aguardam autorização explícita do usuário para atualização:

1. `tests/unit/paleta_petroleo_salvia.test.js`:
   - *Assertiva que falha:* Linha 76 — `expect(tokens[token]).toBe(valorEsperado)` esperando `--pink: #0f766e`, `--navy: #123c3a`, etc.
   - *Ação sugerida após revisão:* Arquivar ou atualizar para os novos tokens.
2. `tests/unit/paleta_superficies_escuras.test.js`:
   - *Assertiva que falha:* Linha 9 — `expect(source).toMatch(/Rotina<span className="text-\[#B7D3C8\]">Docente/)`.
   - *Motivo:* `#B7D3C8` (sálvia claro) foi atualizado para `#B9A6EF` (lavanda de marca em fundo escuro com contraste 7,80:1).
3. `tests/integration/padrao_visual_redacao.test.js`:
   - *Assertivas que falham:* Linhas 34, 35, 41 e 47 — `expect(src).toMatch(/#0f766e/)` e `expect(src).toMatch(/#123c3a/)` no módulo de redação.
   - *Motivo:* RN-50 exigia petróleo na redação; o módulo agora utiliza o roxo `#6315d9` e o roxo profundo `#25104a`.

---

## 5. Capturas de rotas sem sessão autenticada

As capturas abaixo registram o destino observado ao abrir cada rota. Várias telas protegidas redirecionaram para entrada; esses arquivos não comprovam revisão visual do interior dos módulos.

As capturas de tela foram geradas via headless Chrome CDP diretamente do servidor de produção do Next.js e estão salvas em `docs/evidencias/2026-11-05-paleta-arte-em-jogo/`:

1. `01-landing-desktop.png` (1280x800) — Landing page no desktop
2. `01-landing-mobile.png` (390x844) — Landing page no mobile
3. `02-diario-desktop.png` (1280x800) — Diário de classe no desktop
4. `02-diario-mobile.png` (390x844) — Diário de classe no mobile
5. `03-analytics-desktop.png` (1280x800) — Analytics pedagógico no desktop
6. `04-redacao-desktop.png` (1280x800) — Painel de redação no desktop
7. `05-portal-aluno-desktop.png` (1280x800) — Portal do aluno no desktop
8. `05-portal-aluno-mobile.png` (390x844) — Portal do aluno no mobile
9. `05-portal-aluno-notas-desktop.png` (1280x800) — Visualização de notas do aluno no desktop
10. `06-atividades-desktop.png` (1280x800) — Painel de atividades no desktop
11. `07-adaptacoes-desktop.png` (1280x800) — Adaptações PEI no desktop
12. `08-calendario-desktop.png` (1280x800) — Planejamento e calendário no desktop
13. `09-revisao-desktop.png` (1280x800) — Revisão ENEM no desktop
14. `09-revisao-mobile.png` (390x844) — Revisão ENEM no mobile

## 6. Revisão independente — bloqueios para publicação

A revisão corrigiu os valores de preenchimento dos PDFs, que em parte ainda usavam o RGB antigo, e manteve as cores da nota final no PDF de redação e da média ativa no gráfico. Nenhum teste recebido ou anterior foi alterado.

A migração depende de atualização exclusivamente cromática nos três contratos de marca da seção 4. Também é necessário atualizar os seletores de faixas em `caderneta_cabecalho.test.js`, `relatorios_pdf_cabecalho.test.js` e `relatorios_pdf_revisao.test.js`: RGB `18,60,58` → `37,16,74` e `15,118,110` → `99,21,217`, conforme o papel da faixa. Preservar todas as verificações de geometria, fonte e conteúdo.

Em `paleta_arte_em_jogo.test.js`, a varredura deve permitir exclusivamente as cores de dados preservadas nas linhas da nota final e da média ativa, mantendo a proibição da marca antiga nos demais contextos. A atualização exclusivamente cromática foi autorizada pelo usuário. Os seletores de faixa foram atualizados e as exceções de cores de notas também verificam a preservação dos valores. As demais verificações continuam intactas.

Validação após a revisão: 1.480 testes aprovados em 319 arquivos; 10 cenários condicionais ao emulador não executados. Lint sem erros (11 avisos existentes) e build de produção aprovados. As capturas e os logs brutos da entrega inicial foram mantidos localmente.
