# Planejamento independente: regular, gamificado e jogo avulso

## Design aprovado
Módulo Planejamento no painel principal, com planos regulares e gamificados, biblioteca dos materiais catalogados e meus planos. Aula Gamificada continua criando jogos avulsos sem plano. Não duplicar armazenamento, revisão de notas ou banco de questões.

## Contrato e compatibilidade
- Planos existentes, sem `tipo`, continuam gamificados de aula. Novos podem ter `tipo: normal|gamificado` e `escala: aula|semanal|bimestral|semestral|anual|sequencia|projeto`.
- Regular não exige modalidade, questões ou jogo. Normalizar modalidade para null, experiência padrao e questaoIds vazios; rejeitar referência de plano regular na criação de sala. Não associar jogo silenciosamente.
- Aula mantém duração10..240 e soma exata dos minutos. Planejamentos de outras escalas usam etapas com `prazo` descritivo, sem transformar ano/semestre em minutos; duração pode ser null. Regular aceita1..24 etapas e tipo desenvolvimento; gamificado conserva etapas de jogo e distribuição das questões. Sem criar novas regras de pontuação.
- Contexto pedagógico opcional: conhecimentosPrevios, recursos, apoios, avaliacao, habilidadesBNCC, publico, cargaHoraria; texto limitado. Não inventar habilidades oficiais. `anoLetivo` opcional2000..2100. `modeloId` opcional limitado para rastrear modelo escolhido.
- Usar serviço privado de planos atual, mesmo namespace, idempotência/revisão/limite100 e proteção HTTP. Resumos incluem tipo/escala quando novos; legado permanece legível.
- Novo módulo autentica professor antes de carregar dados. Acesso por card destacado e rota /planejamento. Tela oferece novo regular, novo gamificado, biblioteca e planos salvos. Mesmo editor compartilhado e dados privados, sem espelhar cadastros.
- Biblioteca traz100 referências organizadas nas10 categorias, com sínteses autorais, contexto CLASSE, critérios de qualidade e modelos estruturados próprios por escala. Selecionar referência inicia rascunho adaptável, sem reproduzir comandos integrais nem gerar conteúdo factual não revisado.
- Modelos de escalas longas organizam ciclos/períodos; aula regular tem introdução/desenvolvimento/fechamento. Professor sempre edita contexto, objetivos, conteúdos, recursos, inclusão e avaliação.
- Plano gamificado salvo pode seguir para gerador ou preparação via link privado /aula-gamificada/salas?plano=id&destino=gerar|salas. Destino relê plano na conta atual e mantém criação explícita. ID alheio não preenche formulário. Jogo avulso segue sem planoId.
- Planejamento rápido gamificado já existente continua usando o editor/serviço compartilhados por compatibilidade, com acesso claro ao módulo central. O módulo central é a entrada principal de organização.
- Mudança de modo/modelo não descarta edição silenciosamente: exigir salvar ou descartar antes de trocar. Impressão do plano usa página limpa, sem controles, com contexto/etapas; não prometer calendário automático.

## Verificação
Testes novos RED: plano regular sem jogo, escalas longas sem minutos fictícios, contexto limitado, legado gamificado, recusa regular→sala, jogo avulso preservado, biblioteca100/10, card/rota/auth, navegação de plano privado para jogo e proteção contra troca de conta. Preservar testes existentes. Suíte, lint/build, capturas desktop/mobile e revisão independente antes de commit/push.
