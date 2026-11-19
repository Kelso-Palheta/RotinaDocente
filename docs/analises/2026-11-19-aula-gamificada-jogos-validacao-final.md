# Aula Gamificada — validação final de audiovisual e disputas

Data: 19/11/2026. **Aprovada para commit/push.**

## Entrega revisada

- Palco de Heróis maior, catálogo de cenas variadas nos sete jogos, áudio por aparelho, reações/sons por fase, alternativas estáticas e controles de volume/movimento.
- Capas no catálogo e preparação, formatos individual/duelo/grupos conforme compatibilidade e respostas individuais ou compartilhadas em grupos.
- Representante com identificação estável, controles docentes de presença/troca, placar coletivo sem multiplicação por integrantes e ocultação de resultados antes da revelação.
- Relatórios e publicação identificam avaliação coletiva; ausência confirmada prevalece sobre sessão anterior e não recebe nota automaticamente.
- Correção/republicação de presença reconcilia resumo e detalhe do Portal, invalida entregas antigas e identifica notas obsoletas no Diário sem removê-las silenciosamente.

## Complemento implementado nesta revisão

O servidor já recebia `reconciliarAusentes`, mas o cliente HTTP e o relatório não ofereciam o fluxo correspondente. Foi acrescentada confirmação explícita na prévia para retirar somente notas anteriores da atividade dos alunos sem nota, com envio da autorização e revisão do Diário. A autorização começa desmarcada e é renovada a cada prévia. O envio também usa a revisão da sala que originou a prévia.

Quando o professor mantém uma divergência, a interface informa pendências em vez de declarar conclusão integral. A nota nova nula aparece como “Sem nota”. O complemento foi coberto por três testes novos do percurso real componente → cliente HTTP, primeiro falhando e depois aprovados, sem alteração de testes existentes.

## Validação independente

Executada numa cópia limpa de HEAD acrescida somente dos arquivos desta entrega. Alterações alheias em `components/revisao/*`, `lib/auth-context.js`, previews e testes/capturas de outros módulos ficaram fora da versão validada.

| Verificação | Resultado |
| --- | --- |
| Testes focados antes do complemento | 45 arquivos / 200 testes aprovados |
| Regressões novas da confirmação na interface | 3 testes aprovados após reproduzir as falhas |
| Suíte completa da versão a publicar | **381 arquivos aprovados, 4 ignorados; 1.743 testes aprovados, 10 ignorados** |
| Lint | **0 erros, 18 advertências** |
| Build de produção | **Aprovado** |

As regressões preservadas incluem os itens REV-IM-01 a REV-IM-14 e REV-DIS-01 a REV-DIS-09, identidade SHA-256, autoria/presença coletiva, versão publicada, reconciliação e preservação de notas alheias. Os logs RED nas pastas de revisão documentam falhas anteriores, não falhas da versão aprovada.

Capturas fornecidas de desktop/celular foram inspecionadas. Os GIFs demonstrativos são visuais e não comprovam captura de áudio do sistema. A revisão de áudio incluiu código e testes de reprodução/gesto/volume/cleanup; a qualidade percebida da trilha e o comportamento dos aparelhos reais devem ser conferidos em uso. O navegador pode exigir gesto local para permitir som.

Os dez testes ignorados dependem de emuladores opcionais. Não foram executadas partidas com dados reais nem chamadas pagas de IA. Testes de limite e reconciliação usam adaptadores transacionais; não equivalem a ensaio de rede escolar sob carga.

Logs finais em `docs/evidencias/2026-11-19-aula-gamificada-presenca-reconciliacao/revisao/`: `publicacao-tests-GREEN.txt`, `publicacao-lint.txt`, `publicacao-build.txt`, `interface-RED.txt` e `interface-GREEN.txt`.
