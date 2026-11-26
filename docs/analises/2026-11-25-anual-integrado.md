# Planejamento anual integrado

## Comportamento entregue
O módulo orienta começar pelo planejamento anual da disciplina. Novos planos menores — semestre, bimestre, sequência, projeto, mês, quinzena, semana ou aula — escolhem conteúdos dessa base. Regular/gamificado permanece uma escolha independente. Jogos avulsos continuam disponíveis sem planejamento obrigatório e a reutilização opcional de planos permanece.

O seletor busca anuais privados por título, disciplina, série e ano. Conteúdos são apresentados por período, separados por linhas/ponto e vírgula; vírgulas nos títulos são preservadas. Anual anterior sem distribuição por período oferece seu conteúdo geral. Sem anual, a interface orienta cadastrar a base e bloqueia o salvamento dos novos planos menores.

Aplicar seleção preenche disciplina, série, ano letivo, conteúdos, objetivos e recursos/apoios/avaliação do recorte. Professor adapta as estratégias. O vínculo anual e a origem intermediária são preservados na gamificação/derivação, reabertura, impressão e snapshot do jogo. Os resumos guardam apenas metadados compactos da raiz para não duplicar o catálogo inteiro no índice.

Planos já salvos preservam a revisão escolhida do anual; uma versão mais recente é sinalizada quando disponível na listagem. Não ocorre atualização destrutiva automática. Planos anteriores permanecem editáveis sem migração e podem receber vínculo explicitamente. Anual salvo não pode ser convertido acidentalmente em plano menor; outro formato cria um registro novo.

## Proteção dos dados
O serviço valida a raiz na conta atual, versão, conteúdo/índice/período exatos e consistência de disciplina/série/ano, antes das escritas. Metadados de exibição são preenchidos pelo servidor. Vínculo salvo não pode ser removido por omissão nem trocado silenciosamente; autorreferência é recusada. Idempotência é verificada antes da leitura da versão atual. Cópias de planos vinculados preservam o snapshot verificado da origem intermediária mesmo se o anual mudou depois.

Compatibilidade: o contrato novo é marcado com `integracaoAnual: 1` nos rascunhos iniciados pelo módulo. O contrato anterior da API e os jogos avulsos continuam aceitos; não houve migração de registros antigos nem alteração de notas, permissões ou autenticação.

## Testes e autorização
Testes novos reproduziram ausência do catálogo/vínculo, salvamento sem raiz, perda da base na gamificação e conversão indevida do anual antes das correções. Cobertura inclui todos os formatos menores, conteúdo com vírgula, compatibilidade, origem alheia, item adulterado, revisão concorrente, envio repetido, edição independente e resposta tardia após troca de seleção.

O usuário autorizou adaptar somente os testes que criavam planos menores sem anual. Foram adaptados dois testes de interface em `ModuloPlanejamento.test.jsx` e `ModuloReaproveitamento.test.jsx`: acrescentaram seleção da base e verificação de vínculo; acesso, salvamento, original intacto, listagem e demais verificações permanecem.

## Evidências visuais
Componentes reais em cópia isolada, com catálogo/persistência simulados em rota temporária. Fluxo: iniciar plano semanal, confirmar bloqueio sem anual, selecionar “Fontes de energia” do segundo bimestre, aplicar, salvar e reabrir com vínculo, preservando a revisão 1 da raiz. Nenhum dado real foi utilizado. Desktop 1440 px e celular 390 px sem rolagem horizontal. Rota de captura removida antes de lint/suíte/build finais.

- [Início desktop](../evidencias/2026-11-25-anual-integrado/01-inicio-desktop.png)
- [Início celular](../evidencias/2026-11-25-anual-integrado/02-inicio-mobile.png)
- [Seleção desktop](../evidencias/2026-11-25-anual-integrado/03-selecao-desktop.png)
- [Seleção celular](../evidencias/2026-11-25-anual-integrado/04-selecao-mobile.png)
- [Plano vinculado desktop](../evidencias/2026-11-25-anual-integrado/05-vinculado-desktop.png)
- [Plano vinculado celular](../evidencias/2026-11-25-anual-integrado/06-vinculado-mobile.png)

## Resultado final
Suíte completa: **2142 testes aprovados**, dez opcionais ignorados; 455 arquivos aprovados e quatro opcionais ignorados. Lint: **zero erros, 22 avisos preexistentes**. Build de produção: **exit 0**. A execução foi sequencial, em cópia isolada do conteúdo preparado para commit, após remover a rota temporária de captura. Nenhum arquivo de autenticação, nota ou alteração alheia foi incluído.
