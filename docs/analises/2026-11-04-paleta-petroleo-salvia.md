# Identidade petróleo e sálvia — implementação e revisão

04/11/2026. Base publicada `6d5bfb2`, checkout isolado `codex/paleta-petroleo-salvia`. Entrega DeepSeek concluída neste chat por solicitação expressa após o limite gratuito. Escopo: cores em toda a interface e decoração dos PDFs, preservando estrutura e classificação de notas.

## Resultado e revisão

- Tokens globais e referências fixas convertidos em 121 arquivos: landing, Hub, autenticação, Diário, Portal, atividades, adaptadas, Agentes, Calendário, Horário, Analytics, Redação e exportadores. Aliases legados `--pink`, `--navy` e `btn-brand-*` mantidos para compatibilidade, com valores novos.
- A continuação cobriu estados/gradientes/cores Tailwind e RGB ainda ausentes na primeira entrega. Fundos, bordas e textos neutros de exportadores também receberam tons sálvia. Cabeçalhos e destaques sobre petróleo usam sálvia clara quando necessário para contraste.
- Restauradas duas cores de desempenho que o executor tinha migrado indevidamente: faixa `critico` do histograma e legenda “Abaixo do mínimo” no comparativo de turmas. As demais faixas, limites, cálculos e regra 25/25/50 permanecem.
- Auditoria AST de JS/JSX ignorando somente literais/referências de cor: nenhuma mudança estrutural. Comparação de CSS sem cores/comentários/espaços: geometria, tipografia, responsividade e animações idênticas.
- Nenhum hook, API, chave, provedor de IA, consulta de banco ou lógica de autorização/persistência foi alterado. O logout RN-83 ainda reprovado permanece separado e não é publicado nesta entrega.

## Validação própria

- Seis testes complementares passaram por RED/GREEN observado: três lacunas de marca (landing/conexão/PDF), duas cores de desempenho preservadas, uma marca legível em superfície escura.
- Suíte publicável final: **1.146 testes / 250 arquivos aprovados**, sem falhas. Build de produção aprovado.
- Lint dos arquivos JS/JSX alterados: **22 erros / 13 avisos**, exatamente os mesmos da base `6d5bfb2`, comparados por arquivo, linha, regra e mensagem. **Nenhum apontamento introduzido**; não se declara lint global limpo. Débitos concentram-se em efeitos de estado, entidades JSX e avisos anteriores.
- Três testes antigos exigiam literalmente o rosa/navy anterior. O usuário autorizou expressamente ajustar somente expectativas de cor. Mudaram valores e nomes ligados à marca, sem enfraquecer asserções de notas, dados, fontes, margens ou paginação.
- Componentes reais, dados sintéticos, sem serviços pagos/contas reais: landing, Hub, Diário/Portal, Agentes, Calendário, Horário, Redação/critérios e Adaptadas, antes/depois em 390 e 1440 px. Capturas e medidas em `docs/evidencias/2026-11-04-paleta-petroleo-salvia/revisao/`.
- Medidas amostradas de títulos/botões/campos/tabelas idênticas em oito das nove telas. Em Agentes, diferença subpixel de transformações animadas durante a captura; classes/estrutura da animação idênticas no AST. Diálogo de ajuda exercitado e capturado em ambas as larguras.
- Diário e Portal exibiram juntos 3,00 vermelho, 6,00 azul, 10,00 verde e ausência neutra. Testes anteriores de classificação e boletim continuam aprovados.
- Oito exportadores/amostras reais antes/depois: boletim, ficha sem frequência, ficha com presença zero, caderneta, relatório bimestral, Calendário, Analytics, Redação. **Conteúdo extraído e paginação idênticos**, descontando apenas o horário dinâmico de emissão (11 páginas em cada conjunto); renderização PNG conferida. Amostras sintéticas, sem dados pessoais reais.

## Exceções e limites

- Mantidas cores de notas/situações, séries e competências ENEM; cores do Google, imagens didáticas, modo educacional de alto contraste e escolhas de cor de disciplinas/conteúdo. Nenhuma migração de cores personalizadas salvas.
- Contraste automatizado cobre os cinco pares sólidos principais. Revisão visual incluiu superfícies escuras, campos e diálogo; não equivale a certificação integral WCAG nem teste com leitor de tela.
- O ensaio-base já apresenta largura excedente em mobile no Hub (+8 px), Horário (+85 px) e tabela sintética de notas (+269 px). Antes/depois iguais; não mudar estrutura nesta tarefa de cores.
- A caderneta já sobrepõe metadados no cabeçalho quando turma/professor são muito longos. Confirmado no conjunto anterior e posterior; registrado para correção funcional separada. Boletim e ficha possuem sua proteção anterior preservada.
- Não foram feitas chamadas de IA, escritas no Firebase ou mudança para Blaze. Armazenamento das imagens adaptadas permanece pendente para o final das tarefas.
