# Planejamento independente: abrangência, duração, regular e gamificado

## Design aprovado
Módulo Planejamento no painel principal. O professor escolhe primeiro **o que** está organizando e só depois **por quanto tempo**. Aula Gamificada continua criando jogos avulsos sem plano. Não duplicar armazenamento, revisão de notas ou banco de questões.

## Abrangência × duração
São dois eixos distintos e nunca devem ser apresentados como uma única lista.

1. **Planejamento da disciplina** (`abrangencia: planejamento`)
   - Durações: `anual`, `semestral`, `bimestral`.
   - Organiza **vários conteúdos distribuídos em períodos** (etapas com `prazo`).
   - Campos esperados: objetivos, conteúdos por período, carga horária prevista, metodologias, recursos, inclusão e avaliações.
   - O período inteiro **não** é o desenvolvimento de um único tema. Cada etapa descreve um período e o que será trabalhado nele.
2. **Plano de conteúdo** (`abrangencia: conteudo`)
   - Durações: `aula`, `semanal`, `quinzenal`, `mensal`, `bimestral`, `sequencia`, `projeto`.
   - Organiza **assunto(s) específico(s)** durante a duração escolhida.
   - Aula mantém duração em minutos (10..240) e soma exata das etapas. As demais durações usam etapas com `prazo` descritivo e `duracaoMinutos: null`.
   - `bimestral` existe nos dois eixos com significados diferentes: no planejamento da disciplina é o período que contém vários conteúdos; no plano de conteúdo é um tema (ou conjunto coeso) desenvolvido ao longo do bimestre. A abrangência é o que desfaz a ambiguidade.

Regular (`tipo: normal`) e gamificado (`tipo: gamificado`) permanecem **independentes** da abrangência: qualquer uma das duas abrangências pode ser regular ou gamificada.

## Contrato e compatibilidade
- `abrangencia` é opcional no armazenamento para não reclassificar planos antigos. Quando presente, vale `planejamento|conteudo` e a `escala` precisa pertencer à lista daquela abrangência.
- `escala` continua sendo a chave de duração já usada pelo serviço. Novos valores: `quinzenal` e `mensal`. Só são aceitos com `abrangencia: conteudo` explícita.
- Plano sem `abrangencia` permanece legível e imprimível. Derivação **de leitura** (não persistida): `aula`, `semanal`, `sequencia`, `projeto` → conteúdo; `anual`, `semestral`, `bimestral` → planejamento da disciplina, porque o gerador anterior tratava essas três durações como organização de períodos. O editor marca esses planos como “formato anterior” e só grava `abrangencia` quando o professor escolhe o formato explicitamente. Nenhum plano existente é reescrito, renomeado ou tem campos apagados ao ser apenas aberto.
- Planos existentes sem `tipo` continuam gamificados de aula. Regular não exige modalidade, questões ou jogo: normalizar modalidade para null, experiência padrão e `questaoIds` vazios; rejeitar referência de plano regular na criação de sala. Não associar jogo silenciosamente.
- Planejamento da disciplina nunca prepara partida diretamente, mesmo gamificado: é preciso derivar um plano de conteúdo. Regular aceita 1..24 etapas; gamificado conserva etapas de jogo e distribuição das questões. Sem criar novas regras de pontuação.
- Contexto pedagógico opcional: conhecimentosPrevios, recursos, apoios, avaliacao, habilidadesBNCC, publico, cargaHoraria; texto limitado. Não inventar habilidades oficiais nem calendário. `anoLetivo` opcional 2000..2100. `modeloId` opcional limitado para rastrear modelo escolhido.
- Usar serviço privado de planos atual, mesmo namespace, idempotência/revisão/limite100 e proteção HTTP. Resumos incluem abrangência/tipo/escala quando novos; legado permanece legível.
- Novo módulo autentica professor antes de carregar dados. Acesso por card destacado e rota /planejamento. Tela oferece as duas abrangências, com regular e gamificado em cada uma, biblioteca, planos salvos e derivação. Mesmo editor compartilhado e dados privados, sem espelhar cadastros.
- Biblioteca traz100 referências organizadas nas10 categorias, com sínteses autorais, contexto CLASSE, critérios de qualidade e modelos estruturados próprios por abrangência/duração. Selecionar referência inicia rascunho adaptável, sem reproduzir comandos integrais nem gerar conteúdo factual não revisado.
- Professor sempre edita contexto, objetivos, conteúdos, recursos, inclusão e avaliação.
- Plano gamificado de conteúdo salvo pode seguir para gerador ou preparação via link privado /aula-gamificada/salas?plano=id&destino=gerar|salas. Destino relê plano na conta atual e mantém criação explícita. ID alheio não preenche formulário. Jogo avulso segue sem planoId.
- Planejamento rápido gamificado já existente continua usando o editor/serviço compartilhados por compatibilidade, com acesso claro ao módulo central.
- Mudança de abrangência, modo ou modelo não descarta edição silenciosamente: exigir salvar ou descartar antes de trocar. Impressão do plano usa página limpa, sem controles, com abrangência, duração, contexto e etapas; não prometer calendário automático.

## Derivação de plano de conteúdo
- A partir de um planejamento da disciplina, o professor seleciona **um recorte de etapas** e escolhe a duração e o tipo (regular ou gamificado) do novo plano de conteúdo.
- A derivação cria **outro registro**, preserva o original intacto e grava vínculo de origem `{planoId, revision, etapaIds, finalidade: 'conteudo'}`. O servidor preenche os metadados de exibição (título, escala, abrangência) e ignora metadados forjados.
- O plano derivado preserva disciplina, ano escolar, conteúdos, objetivos, contexto, turmas e ano letivo da fonte, mas nasce com identidade, revisão e `questaoIds` próprios. Editar o derivado não altera a origem.
- Origem `finalidade: 'conteudo'` só é aceita quando a fonte é um planejamento da disciplina e o destino é um plano de conteúdo. A origem é imutável depois de criada; o tipo do derivado não pode ser convertido em planejamento.
- A origem anterior (sem `finalidade`), usada para gamificar um planejamento regular, mantém exatamente o comportamento e os metadados já publicados.
- Se a fonte mudar de revisão antes do salvamento, o serviço recusa com 409 e pede releitura. Pedido repetido com o mesmo `requestId` devolve a mesma cópia.

## Verificação
Testes novos RED: separação abrangência/duração no domínio e nos modelos, plano de conteúdo em todas as durações, planejamento da disciplina em períodos, derivação de recorte com origem e original imutável, recusa de origem incompatível, regular/gamificado independentes nas duas abrangências, legado sem reclassificação automática, recusa de planejamento da disciplina → sala, jogo avulso preservado, biblioteca100/10, card/rota/auth, navegação de plano privado para jogo e proteção contra troca de conta. Preservar testes existentes. Suíte, lint/build, capturas desktop/mobile e revisão independente antes de commit/push.

## Complemento de revisão (25/11/2026)
- Cada período pode registrar `curriculo` com conteúdos, objetivos, carga horária, metodologias, recursos, apoios, avaliação e habilidades informadas pelo professor. Campos opcionais, limitados e preservados no salvamento, impressão e cópia. Não preencher currículo/BNCC fictícios.
- A derivação utiliza conteúdos e objetivos dos períodos selecionados quando preenchidos; no legado, preserva os textos gerais existentes. Os campos do recorte continuam editáveis.
- Gamificar um plano novo preserva sua abrangência quando a duração é compatível. Quinzena e mês também funcionam na reutilização. Origem de gamificação é compatível com planejamento da disciplina; origem de derivação exige destino de conteúdo.
- Planos antigos sem abrangência continuam no fluxo anterior de geração/partida; nenhuma inferência de leitura pode bloqueá-los. Exibir indicação de formato anterior sem apresentá-los como classificação escolhida pelo professor.
- Link direto de planejamento da disciplina para geração/partida é recusado na interface; orientar derivar um recorte. A geração existente é de questões, não geração automática de planejamento completo.

## Integração anual — atualização de 25/11/2026
O fluxo padrão de novos planos menores passa a exigir seleção dos conteúdos de um anual privado, conforme `PLANEJAMENTO_ANUAL_INTEGRADO_SPEC.md`. Esse contrato substitui a criação independente nesses novos fluxos do módulo. Anuais, planos anteriores e jogos avulsos conservam sua compatibilidade. Vínculo é preservado na gamificação/derivação e impressão; o índice guarda apenas metadados compactos da raiz anual, sem duplicar listas de conteúdos em todos os resumos.
