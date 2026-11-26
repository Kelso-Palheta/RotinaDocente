# Planejamento anual como base integrada

Decisão do usuário (25/11/2026): novos planejamentos menores devem partir dos conteúdos do planejamento anual. Jogos avulsos permanecem livres e podem reutilizar um plano opcionalmente. Autorizada somente adaptação dos testes que criam planos menores sem origem anual.

## Fluxo
- Criar planejamento anual da disciplina como raiz, regular ou gamificado. Identificar disciplina, série, ano letivo e conteúdos por período.
- Ao iniciar semestre, bimestre, sequência, projeto, mês, quinzena, semana ou aula no módulo, selecionar um anual privado e um ou mais conteúdos de seus períodos. Busca por disciplina/série/ano/título; não inventar currículo quando não existir anual.
- Aplicar seleção preenche disciplina, série, ano, conteúdos, objetivos, apoios/recursos e referências do anual. Professor adapta as estratégias do novo plano. Não digitar novamente o currículo nem misturar disciplinas por coincidência de nomes.
- Biblioteca fornece estrutura/modelo; planos menores também exigem seleção do anual. Reutilização/gamificação preserva o vínculo anual. Derivação de semestral/bimestral herda a raiz anual.
- A raiz não é alterada ao criar/editar derivados. Edições no anual não sobrescrevem planos já salvos: cada um mantém revisão e conteúdos de origem, exibidos na tela/impressão. Nova seleção usa a versão atual. Vínculo salvo não é removido/trocado silenciosamente; outro recorte cria novo plano.
- Planos antigos continuam legíveis/editáveis e podem receber vínculo anual explicitamente. Contrato antigo da API é preservado. Novos rascunhos iniciados no módulo usam `integracaoAnual: 1`; nesse contrato, somente o anual da disciplina pode ser salvo sem vínculo.

## Dados e proteção
`vinculoAnual` mínimo: `{planoId, revision, conteudos: [{etapaId, indice, texto}]}`. Itens obtidos das linhas/itens separados por ponto e vírgula dos campos de conteúdo por período; ausência desses campos em anual antigo permite utilizar seu conteúdo geral. Não separar por vírgula.
Servidor valida raiz anual na conta atual, revisão, item e texto exatos, disciplina/série/ano, antes das escritas. Preenche metadados de exibição. Origem intermediária continua no campo `origem`. Recibo idempotente é verificado antes de revisar fontes; origem/vínculo e original permanecem protegidos contra falsificação. Cópia de um plano vinculado preserva o snapshot validado da fonte intermediária mesmo se o anual foi atualizado depois.

## Aceite
- Raiz anual criada sem vínculo; demais novos formatos não salvam sem seleção.
- Selecionar conteúdo anual preenche contexto correto; salvar/reabrir/imprimir mantém raiz e revisão.
- Descendentes e versão gamificada preservam vínculo; planos antigos e jogos avulsos continuam funcionando.
- Falha de carga, troca de conta, versão concorrente, origem alheia, seleção falsa, envio incerto e repetido não vazam dados nem criam duplicação.
- Testes existentes preservados, exceto adaptação autorizada do fluxo sem origem; suíte, lint, build e capturas reais desktop/celular antes de commit/push.
