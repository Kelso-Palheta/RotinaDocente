# Entrega — Natação e Acerte ou Perde

## Resultado
O catálogo passa de sete para nove modalidades. Os dois jogos usam banco privado, questões manuais ou geradas por IA, dificuldades, formatos individual/duelo/grupos, sessões do Portal e critérios avaliativos existentes.

### Natação
- Piscina com raias e três imagens diferentes de nadadores extraídas do material fornecido.
- Cinco trechos por padrão, configuráveis de 1 a 50. Um trecho por acerto individual; grupos com respostas individuais avançam proporcionalmente aos acertos dos membros presentes/participantes, sem vantagem pelo tamanho.
- Estado, progresso e chegada calculados pelo servidor somente na revelação. Reenvios não duplicam avanço.
- Empate compartilhado, inclusive diante de pequenas diferenças numéricas de frações. Sem chegada, classificação por maior progresso. Chegada conclui após o ranking.
- Transição visual de posição, medalhas, trilha original, efeitos e respeito a movimento reduzido e preferências de áudio.

### Acerte ou Perde
- Múltipla escolha automática ou resposta aberta de até 2.000 caracteres, com modelo privado e julgamento docente auditável.
- Cronômetro configurável ou encerramento manual sem limite. Erro não desconta pontos.
- Acerto vale 1.000 pontos; última questão pode valer 10.000, por opção explícita desligada por padrão. Bônus não entra no cálculo da nota/aproveitamento.
- Textos para correção são obtidos por rota exclusiva do professor proprietário; não aparecem no polling de alunos ou projeção.
- Pendências bloqueiam ranking, encerramento e finalização avaliativa. A correção e a justificativa ficam no recibo após revelar e nos detalhes do relatório publicado.
- Trilha original e sirene sintetizada integradas ao controlador existente, sem tocadores concorrentes.

## Adaptação dos modelos
Os PPTX são referências de regras e mídia, não código executável. As perguntas de exemplo não foram importadas como conteúdo real. As animações de avanço e a pontuação manual dos slides foram substituídas por estado autoritativo e correção explícita. Não há repasse de questão depois de revelar o gabarito.

Fontes locais preservadas:
- `/Users/kelsopalheta/Documents/Jogos pedagógicos/Jogo da natação.pptx`
- `/Users/kelsopalheta/Documents/Jogos pedagógicos/acerde ou perde.pptx`

Capas e imagens WebP otimizadas em `frontend/public/aula-gamificada/natacao/` e `acerte_perde/`; capas públicas SVG com raster incorporado em `catalogo/natacao.svg` e `catalogo/acerte.svg`. Os feedbacks de Acerte também reutilizam as cenas pedagógicas locais do Quiz. As trilhas MP3 são as dos arquivos fornecidos.

## Revisão independente
Quatro achados corrigidos e cobertos por regressões: ordenação por progresso na interface, pontuação do recibo após revelar, resposta-modelo no telão e tolerância de empate fracionário. Revisão encerrada sem outro bloqueador concreto identificado.

A atualização das expectativas antigas de quantidade/lista de jogos foi autorizada pelo usuário em 19/11/2026. Nenhuma outra verificação existente foi enfraquecida. Alterações paralelas de revisão ENEM/autenticação foram excluídas da cópia de publicação.

## Verificações
- RED confirmado antes da implementação: modalidades ausentes, nova questão aberta, novas telas; regressões de ranking/recibo/telão/empate reproduzidas antes das respectivas correções.
- Evidências visuais em `docs/evidencias/2026-11-19-natacao-acerte/`: componentes reais com dados sintéticos, desktop e celular. A página temporária de demonstração não faz parte da publicação.
- As capturas não representam uma turma real nem um teste de carga/conectividade escolar.
- Suíte completa: **386 arquivos aprovados**, 4 ignorados; **1.769 testes aprovados**, 10 ignorados.
- Lint: **zero erros**, 18 avisos preexistentes.
- Build de produção: **aprovado**.
- Oito capturas de componentes reais em 1.440 px e 390 px; imagens carregadas e sem rolagem horizontal.
