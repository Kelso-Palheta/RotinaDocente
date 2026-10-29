# Revisão independente — cinco correções de homologação RN-81

Data: 29/10/2026. Base: `bb89f83`. Entrega DeepSeek em alterações locais, sem commit. **Resultado: aprovação retida por duas falhas de layout reproduzidas.** Produção e testes recebidos não foram alterados nesta revisão.

## Validação executada

- Suíte recebida: `cd frontend && npm test` → **1.081 testes/234 arquivos aprovados**, exit 0. São 21 testes novos em seis arquivos; testes já versionados sem alterações.
- Lint dos sete arquivos de produção alterados: exit 0, sem erros/avisos.
- `NODE_USE_SYSTEM_CA=1 npm run build`: exit 0; fontes e configuração preservadas.
- Reprodução adicional: `tests/integration/relatorios_pdf_revisao.test.js` → **2 testes, 2 falhas**, exit 1. Arquivo novo mantido local para a correção. A suíte atual não pode ser declarada integralmente aprovada após essas reproduções.
- `git diff --check`: sem erros. Logs locais em `tmp/revisao-20261029-{testes,lint,build,reproducoes}.log`, ignorados pelo Git.

## Cobertura examinada

O boletim reutiliza `faixaNotaBimestral` e recebe a configuração dos bimestres do Portal; limites customizados e ausência/zero têm testes novos. A cor é aplicada ao rótulo de situação; o número da nota continua na cor navy. A descrição da evidência recebida dizendo “5,00 azul” deve ser entendida como classificação azul, não como mudança da cor do próprio número.

Frequência sem base usa `disponivel:false` e `semRegistros:true`; exportação omite percentual/regularidade nesse estado. Valores numéricos legados continuam no domínio por compatibilidade. Pesquisa dos consumidores de `consolidarFichaAluno360` encontrou somente a exportação, que verifica os novos indicadores. Chamadas com presenças/ausências reais mantêm a apuração existente; não houve alteração do consolidador bruto.

O formatador de prazo reaproveita o interpretador compartilhado e é usado no professor e no Portal. A barra permite quebra de linha e ganha rótulos acessíveis. As capturas recebidas em 390/1440 px foram inspecionadas e mostram controles dentro da largura; não foi executada nova sessão independente de navegador nesta rodada.

Imagens recebidas das páginas dos PDFs foram inspecionadas: identificação e ausência de frequência melhoraram; devolutivas continuam legíveis na segunda página. Os anexos da amostra usam atividades **regulares, com 1º/2º bimestre**, não recuperação semestral, embora a documentação recebida os descreva como atividades do 1º semestre. Isso não demonstra regressão no rótulo semestral, mas a nova evidência precisa incluir recuperação real no payload para satisfazer o cenário solicitado.

## Falhas reproduzidas

### P2 — REV-H81-01: data de emissão coincide com faixa rosa no boletim

Arquivo: `frontend/src/lib/aluno/boletim-pdf.js`, cálculo de `alturaCabecalho` e `cabecalhoY`.

Para `n` linhas de aluno/turma, a emissão é desenhada em `26 + 5n`, exatamente onde começa a faixa rosa (`alturaCabecalho - 2`, com altura `28 + 5n`). No caso curto do teste, ambas estão em **36 mm**. A inspeção da captura recebida de nomes longos também mostra a data encostada na faixa.

Aceite: calcular altura a partir da última linha de texto, reservando espaço entre a linha de base/descendentes da emissão e o início da faixa. Testar cabeçalho curto e com múltiplas linhas, sem cortar data, deslocando a tabela de notas conforme a nova altura. Não resolver escondendo a emissão.

### P2 — REV-H81-02: quebra de nomes usa fonte diferente da impressão

Arquivo: `frontend/src/lib/diario/fichaAlunoExport.js`, `identificacaoBlocos.map`.

O `splitTextToSize` da identificação roda com a fonte/tamanho herdados do cabeçalho (normal/8,5), mas estudante é escrito em **bold/9,5**. Por isso a linha que parecia caber fica maior ao ser impressa. O teste com identificação longa produziu extremo direito em **205,28 mm**, ultrapassando a margem esperada de **196,6 mm**. A causa é a métrica divergente, não ausência de chamada a `splitTextToSize`.

Aceite: medir cada bloco com a mesma fonte, estilo, tamanho e largura usados para desenhá-lo. Preservar textos completos; recalcular altura/posição da seção seguinte e garantir paginação. Cabeçalhos de professor e boletim também devem ser medidos com seus estilos efetivos, evitando dependência da fonte padrão do jsPDF. Testes existentes permanecem intocados.

## Prompt pronto para DeepSeek/OpenCode

```text
Corrija somente os dois bloqueios restantes da revisão RN-81 em /Users/kelsopalheta/Developer/RotinaDocente.
Leia AGENTS.md, specs/RULES.md, specs/TESTS_SPEC.md e docs/analises/2026-10-29-revisao-correcoes-pdf-recuperacao.md.

Preserve integralmente todos os testes existentes/recebidos e o novo arquivo local tests/integration/relatorios_pdf_revisao.test.js. Seus dois testes estão vermelhos: corrija produção, nunca os testes.

1. REV-H81-01: frontend/src/lib/aluno/boletim-pdf.js. A emissão está exatamente sobre o início da faixa rosa. Reservar margem vertical abaixo da última linha da emissão e deslocar a tabela conforme a altura calculada. Validar cabeçalhos curtos e longos, sem ocultar/truncar texto.
2. REV-H81-02: frontend/src/lib/diario/fichaAlunoExport.js. Medir cada identificação com a mesma fonte/estilo/tamanho usados na impressão (especialmente estudante bold 9,5). Recalcular alturas e sequência/paginação; nenhum texto pode ultrapassar a margem. Conferir também estilos usados na medição de professor e no cabeçalho do boletim.

Acrescentar testes novos de nomes curtos/longos e emissão, sem editar os anteriores. Executar as duas reproduções, suíte completa, lint dos arquivos e build. Renderizar e inspecionar todas as páginas dos PDFs sintéticos, incluindo nomes longos, ausência de frequência, presença real zero e feedback de atividades com finalidade recuperacao_semestral/semestre 1. Preservar totais S1=32, S2=25, anual=57 e metas 25/25/50. Atualizar evidências/documentação com os casos realmente usados; não chamar feedback regular por bimestre de recuperação semestral.

Não alterar notas/fórmula/pesos/critério, autenticação, persistência ou sincronização. Não mexer no logout, armazenamento de imagens ou plano Firebase. Sem dados reais/chamada paga de IA. Não fazer deploy/push antes de nova revisão neste chat.
```

## Limites e publicação

Sem Firestore real, IA real, leitor de tela ou nova homologação de produção. A revisão usou código, suíte, testes independentes e imagens fornecidas pela entrega, não gerou novos PDFs. Nenhum PDF auditado foi aprovado como artefato final para distribuição.

Somente esta documentação e o registro de acompanhamento são publicados nesta rodada. Implementação do DeepSeek, evidências recebidas e teste novo de reprodução permanecem locais para correção. Os demais três pontos não tiveram bloqueio adicional identificado no escopo examinado; isso não equivale a homologação integral em produção.
