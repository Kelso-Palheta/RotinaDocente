# Revisão interativa — apresentações explicativas v1

Aprovado em 24/11/2026: professor avança cada etapa, com reprodução automática opcional. Abrange as 34 aulas existentes. Preservar conteúdo integral, questões, notas, permissões, snapshots e modificações alheias.

## Apresentação
- Imagens reais contextualizadas e com fonte/licença; novos recursos locais e manifesto próprio. Nunca sobrescrever esquemas antigos com fotografia sob créditos antigos.
- Cenas de leitura de obra, comparação, sequência/movimento, processo/camadas, linha temporal e relações; selecionar conforme tema. Exposição curta por etapa, texto original completo acessível em detalhes.
- Transformações explicativas sobrepostas são identificadas como leitura didática; não modificar/documentar falsamente a obra. Movimento reduzido mantém conteúdo e controle.
- Todas as 34 aulas recebem direção visual e imagem real; substituir a exibição dos 15 esquemas textuais mantendo arquivos legados.

## Contrato de etapas
Novo módulo puro `dominio/revisao/apresentacao.js`: `criarEtapasExplicacao(texto)` agrupa frases em até quatro etapas não vazias, sem perder texto. Exportar `ACOES_EXPLICACAO`.
Ações docentes: `avancar_explicacao`, `voltar_explicacao`, `repetir_explicacao`, `reproduzir_explicacao`, `pausar_explicacao`. Somente sala temática em conteúdo; exigir revisão/rodada atuais e autorização existente. Nenhuma resposta ou nota é alterada.
Estado interno `sala.apresentacao`: `{chave, etapaBase, automatica, iniciadaEmMs}`. Chave `${conteudoId}:${blocoId}`. Intervalo fixo 8000ms; etapa limitada à última; sem escrita por tick e sem avanço automático de bloco/questão. Comando manual pausa; repetir volta à primeira etapa. Mudar bloco/reiniciar descarta estado anterior.
Projeção `aula.apresentacao`: `{etapa, totalEtapas, automatica, iniciadaEmMs, etapaBase, intervaloMs:8000, agoraServidorMs}`. Todos os papéis recebem mesma projeção; clientes interpolam relógio monotônico entre atualizações. Ausência de estado significa primeira etapa manual. Prévia sem sala permite controle local independente, nunca comandos de aluno.
Controles docentes no componente compartilhado ControlesSala: anterior/próxima etapa, repetir, reproduzir/pausar; separar de avançar bloco. Atalhos apenas com foco em controles; nunca capturar campos de texto.

## Aceite e testes
- SLIDE-01: cobertura 34/34, mídia local decodificável, créditos/fontes/licenças e sem esquema textual como imagem principal.
- SLIDE-02: segmentação sem perda, limites, sincronização manual/automática, pausa/repetição, reset de bloco, conflitos e autorização.
- SLIDE-03: renderer acessível em desktop/celular, texto completo, controles/estados, movimento reduzido, fallback de imagem e URLs seguras.
- SLIDE-04: manter testes existentes, sequência assunto→questões, privacidade e avaliação. Executar suíte completa, lint, build, conferir capturas e sequência de etapas; revisão antes de publicar.

## Compatibilidade e curadoria
A conferência mantém o acervo original como padrão de homologação e permite alternar para a prévia renovada. Imagens textuais antigas não são sobrescritas. Na projeção renovada, blocos de esquema recebem os pontos curados do exemplo real, agrupados no mesmo número de etapas da versão congelada; o texto original permanece em detalhes e seu esquema pode ser consultado. Em salas legadas, a presença de `aula.bloco` também determina modo somente leitura; servidor projeta apresentação manual padrão sem persistência adicional.
