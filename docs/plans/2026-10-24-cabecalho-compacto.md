# Cabeçalho compacto da turma

Pedido autoriza escolher a organização mais adequada. Opções: somente reduzir fontes (ganho pequeno); apertar larguras (mantém quebras indesejadas); organizar duas faixas com indicadores horizontais (escolhida).

Design: identificação e abas na primeira faixa; indicadores compactos e ações na segunda. Rótulos completos sem quebra; grupos quebram em telas menores. Manter fontes legíveis e cores existentes. Alteração só de apresentação, sem mudar cálculos ou persistência.

Plano: registrar requisitos; acrescentar teste de semântica/contagens/controles; observar falha; reorganizar JSX/classes do TurmaView; validar testes e medidas visuais com dados sintéticos; executar suíte e build. Sem commit/push automático.

## Validação

Dois testes novos falharam antes da alteração e passaram depois. Suíte completa: 706 testes, 135 arquivos. Build de produção e lint aprovados. Prévia com TurmaView real e dados sintéticos: em 1440 px, cabeçalho passou de 214,44 para 105 px; em 1120 px ficou com 147 px; em 375 px, 322 px, com grupos reorganizados e sem rolagem horizontal. Os quatro rótulos permaneceram em uma linha (16 px de altura) em computador e celular. Evidência: [prévia](../analises/evidencias-diario/cabecalho-compacto.png).
