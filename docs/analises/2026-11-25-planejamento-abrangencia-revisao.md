# Revisão e conclusão — abrangência e duração no Planejamento

## Entrega encontrada
O DeepSeek havia acrescentado as duas abrangências, listas próprias de duração, derivação de um planejamento da disciplina para um plano de conteúdo, integração com persistência e cinco arquivos de testes. Os 30 testes iniciais passaram, mas não cobriam todas as combinações de reutilização e compatibilidade.

## Correções concluídas
- Planejamento da disciplina: anual, semestral e bimestral; conteúdos, objetivos, carga horária, metodologias, recursos, inclusão, avaliação e habilidades informadas por período. Não há preenchimento fictício de currículo ou BNCC.
- Plano de conteúdo: aula, semana, quinzena, mês, bimestre, sequência e projeto. Regular ou gamificado permanece independente da abrangência.
- Currículo dos períodos é validado, salvo, reaberto, impresso e preservado nas cópias. Cada campo tem limite; campos externos não reconhecidos são descartados.
- Derivar um recorte usa conteúdos e objetivos dos períodos selecionados quando preenchidos, mantendo textos gerais como compatibilidade para fontes anteriores. O novo plano tem identidade própria; o original continua intacto.
- Gamificação mantém a abrangência explícita compatível e aceita as novas durações. O vínculo anterior de gamificação continua aceito no planejamento da disciplina.
- Planos anteriores sem abrangência continuam executáveis: a inferência de leitura não bloqueia sua geração/partida nem grava classificação automática.
- Link direto de um planejamento novo da disciplina para geração/partida orienta derivar um recorte primeiro. Aula gamificada derivada permite etapas de desenvolvimento e jogo no mesmo roteiro.
- Persistência permanece privada por docente, com revisão, origem imutável, metadados preenchidos pelo servidor e repetição idempotente. Não houve migração de dados.

## Validação
Oito regressões novas falharam antes das correções e passaram depois. Os testes anteriores foram preservados. Testes adicionais cobrem campos por período, privacidade da origem, revisão concorrente, idempotência, edição independente e bloqueio da entrada direta de planejamento da disciplina.

A primeira suíte completa teve um timeout de cinco segundos em um teste preexistente de imagem do acervo, com 2115 testes aprovados. O arquivo isolado passou nos 18 testes em 1,52 segundo. A suíte completa foi repetida com dois workers para reduzir concorrência, sem alterar testes ou seus limites. O navegador e o servidor temporários foram encerrados após as capturas.

## Evidências visuais
Capturas do componente real com catálogo e persistência simulados apenas em uma rota temporária da cópia isolada; nenhum dado real foi utilizado. Fluxo exercitado: abrir planejamento anual, conferir conteúdos por período, selecionar o segundo bimestre, derivar plano semanal e reabrir o resultado com apenas “Fontes de energia”. Original preservado; sem rolagem horizontal em 390 px e 1440 px. Rota temporária removida antes do build.

- [Início desktop](../evidencias/2026-11-25-planejamento-abrangencia/01-inicio-desktop.png)
- [Início celular](../evidencias/2026-11-25-planejamento-abrangencia/02-inicio-mobile.png)
- [Períodos desktop](../evidencias/2026-11-25-planejamento-abrangencia/03-periodos-desktop.png)
- [Períodos celular](../evidencias/2026-11-25-planejamento-abrangencia/04-periodos-mobile.png)
- [Plano derivado desktop](../evidencias/2026-11-25-planejamento-abrangencia/05-derivado-desktop.png)
- [Plano derivado celular](../evidencias/2026-11-25-planejamento-abrangencia/06-derivado-mobile.png)

## Limite de escopo
A IA existente gera questões a partir do plano de conteúdo. A geração automática do planejamento completo não existia no módulo e não foi acrescentada nesta correção. Os planejamentos são editáveis a partir dos modelos estruturados e da biblioteca de referências. Datas/calendário, currículo e habilidades oficiais dependem da informação e revisão do professor.

Alterações alheias, incluindo autenticação, atividades, renomeações gerais e testes anteriores modificados por outras tarefas, ficam fora deste commit e da cópia isolada validada.

Resultado final da suíte: **2116 testes aprovados**, dez opcionais ignorados; 452 arquivos aprovados e quatro opcionais ignorados. Lint: **zero erros e 22 avisos preexistentes**. A repetição completa passou sem alterar nenhum teste anterior.

Build de produção aprovado (exit 0), executado após a remoção da rota temporária de captura. Validação realizada em cópia isolada do conteúdo preparado para commit, sem incluir alterações alheias do workspace.
