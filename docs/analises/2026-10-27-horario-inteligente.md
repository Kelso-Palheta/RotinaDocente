# Horário Inteligente — auditoria e proposta de organização

Data: 27/10/2026. Escopo: módulo escolar acessado pelo Hub em `/modules/horario-inteligente/index.html`, scripts estáticos e contratos relacionados no Django. Não confundir com Meu Horário Escolar nem com o Gerador Mágico já retirado. Esta entrega é análise; não altera código funcional.

## Conclusão

O módulo reúne visualização por turma/professor/sala, edição, importação, auditoria, IA e otimização, mas a integração está fragmentada. A prioridade é restaurar um fluxo seguro de carregar, editar, validar e salvar. Acrescentar automações agora ampliaria riscos de sobrescrita e mistura de contexto.

A página é HTML/JavaScript legado público, fora do ciclo de autenticação e persistência da interface React. Há scripts referenciados em caminhos inexistentes, migração que pode substituir uma grade editada por dados de demonstração e clientes HTTP incompatíveis com as rotas atuais. O estado publicado em produção não foi sondado; os achados referem-se ao repositório local.

## Prioridades

| Prioridade | Problema | Melhoria proposta |
|---|---|---|
| P0 | Scripts locais e dados iniciais ausentes nos caminhos do HTML | Corrigir empacotamento/carregamento e tratar falha visivelmente; começar com grade vazia ou demonstração escolhida explicitamente |
| P0 | Atualização de versão substitui automaticamente escola padrão | Migração revisável, backup anterior e preservação de todas as edições; nunca redefinir grade no carregamento |
| P0 | Cache compartilhado entre usuários; backend JSON não separa escola/proprietário | Contexto autenticado por conta/escola/ano/versão e autorização no servidor, além do bloqueio visual do Hub |
| P0 | Campos externos entram em HTML gerado sem escape em várias telas | Renderização segura de nomes, disciplinas, salas, JSON e conteúdo de IA, sem executar marcação importada |
| P1 | Rotas, autorização e payloads da API divergem dos contratos Django | Unificar cliente autenticado e endpoints reais; falha explícita, sem mudar silenciosamente para dados de exemplo |
| P1 | Cancelar edição de célula vazia deixa aula criada em memória | Formulário independente; alteração somente ao confirmar; validação antes de persistir e desfazer |
| P1 | Auditoria local não verifica todos os conflitos rígidos e ignora planejamento de manhã | Motor único de professor/turma/sala/disponibilidade, com regras explícitas e exceções declaradas |
| P1 | IA usa configuração Maritaca legada, sem chave pessoal do Hub | Integrar BYOK/provedor escolhido; se Gemini for selecionado, chamar Google; sem fallback central |
| P1 | Otimização usa escola fixa e aplica resultado sobre o contexto atual | Capturar contexto/versão da solicitação; apresentar comparação e validar antes de aplicar |
| P2 | Muitas áreas técnicas e ações semelhantes dificultam uso | Separar Configurar, Montar, Conferir e Exportar; concentrar ações avançadas em área própria |

## O que pode ser aproveitado

- Visualizações por turma, professor, sala e quadro completo; indicadores de carga horária.
- Cadastros de escolas, salas, áreas e planejamento; configuração de horários; exportação JSON/Excel/PDF.
- Importação com referência e lista de professores não reconhecidos, que pode servir de base à conferência manual.
- Opção de importar como nova versão, reduzindo necessidade de substituir a atual.
- Confirmação antes de substituir a grade por PDF; dados de prévia e sugestões de IA já têm ponto de revisão, ainda insuficiente.
- Backend em camadas com validação, remanejamento e tarefas assíncronas; autenticação global Django exige usuário autenticado. Isso não substitui a autorização por escola/proprietário.

Esses pontos foram avaliados por leitura de código. Não equivalem a validação de integração em produção.

## Oito reproduções sintéticas

Evidências em `evidencias-horario-inteligente/reproducao.test.js`. Funções reais são avaliadas em ambiente isolado, com DOM e serviços simulados. Testes passam ao confirmar os comportamentos incorretos.

1. HTML referencia `data_embed.js` e `js/modules/api-client.js`, inexistentes nesses caminhos no diretório público. O cliente está em `modules/api-client.js`; há incompatibilidades semelhantes em outros scripts. Nenhum arquivo de chave local foi acessado.
2. `bootSchool` encontra versões diferentes e troca o conteúdo de `escola_001` por `DEFAULT_DATA`, substituindo uma aula editada pela demonstração sem revisão.
3. `openEdit` acrescenta imediatamente uma aula vazia ao mapa; `closeEdit` não a remove. Outra operação de salvamento pode persistir a inclusão cancelada.
4. Duas aulas da mesma turma e mesma sala, no mesmo dia/tempo, com professores distintos, produzem zero conflitos na auditoria local. Ela verifica duplicação por professor e planejamento, sem cobrir turma/sala.
5. `remanejarAula` sem o terceiro argumento falha com `False is not defined`, antes de enviar requisição. É literal Python dentro de JavaScript.
6. Cliente estático envia consulta de grade sem cabeçalho Authorization. Os testes do cliente JWT moderno não exercitam esse cliente legado.
7. Cliente de fallback Maritaca envia `action/userMessage/schoolData`, enquanto o serializer Django exige `mensagem_usuario`. Não houve chamada real ao servidor.
8. Planejamento selecionado como “só manhã” é ignorado por `isPlanningOff`; a opção existe na interface, mas a função trata apenas dia inteiro e tarde.

## Carregamento, identidade e persistência

O carregamento inicial depende de `DEFAULT_DATA`. Sem cache, o caminho ausente do arquivo embutido pode interromper a inicialização. A presença de `data.json` não resolve por si só, porque o index não o carrega nesse fluxo. Propor estado de carregamento/erro e botão de nova tentativa, sem agenda fictícia apresentada como dado real.

LocalStorage usa chaves globais de escolas, escola atual e tema, sem UID. Trocar de conta no Hub não constitui isolamento dessa página. Uma escola nova e uma versão nova também compartilham o mesmo conceito no mapa. Separar escola, ano letivo e versão de grade; indicar qual está ativa e qual está oficialmente em uso.

O backend usa `JSONGradeRepository` com caminho padrão único `data.json`; o parâmetro `escola_id` não determina arquivo nem filtro por proprietário. As views não derivam escola autorizada de `request.user`. Mesmo com autenticação global, precisa haver autorização por escola em carregar/remanejar/otimizar/status de tarefa antes de integrar esse backend a dados reais de várias contas. Nenhum teste contra dados reais ou outra conta foi executado.

Salvamento local não trata indisponibilidade/quota. Carregar da nuvem substitui o objeto local sem prévia de diferenças ou proteção por revisão. Proposta: rascunho por conta, salvamento versionado/transacional, conflito explícito e backup/exportação antes de substituição. Mostrar se está salvo apenas no dispositivo, na nuvem ou pendente.

## Contratos e IA

O cliente legado chama `/api/v1/grade/...` e `/api/v1/assistente/maritaca/`. O roteador principal Django inclui este app sob `/api/v1/horario-escolar/`, com subrotas próprias. Não foi encontrado proxy correspondente no Next atual. Além disso, o modal de sincronização usa `/api/save-grade` e `/api/load-grade`, outra família de contratos. Não solicitar ao usuário comum URL de servidor para realizar salvamento.

A abertura da IA exige `window.MARITACA_API_KEY` e orienta conferir arquivo local. Esse fluxo não acompanha o modal BYOK do Hub nem confirma Gemini. O adaptador Django pode obter chave de ambiente central, divergindo da RN-27. Substituir pela configuração pessoal autenticada já utilizada pelos demais módulos e rejeitar ausência de chave de forma clara.

Prompts atuais truncam texto/slots em alguns caminhos (8.000 caracteres, 30 slots ou 6.000 caracteres). A IA pode receber apenas parte da grade. Apresentar alcance e impedir propostas de substituição global baseadas em dados incompletos. Resposta estruturada precisa validar nomes/IDs, horários, conflitos e contexto, tratando instruções dos arquivos como conteúdo, não comandos.

Preservar sugestões como propostas: mostrar antes/depois, motivos, células afetadas e conflitos. Aplicação de IA não pode substituir o mapa inteiro sem backup, conferência e autorização explícita. Explicar que IA não garante uma grade válida; motor determinístico valida as regras rígidas.

## Validação e edição

Usar um único contrato para carga semanal requerida, professor, turma, disciplina, sala, turno, dia e horário. Nomes são apresentação; identidades precisam de IDs estáveis para evitar confusão com homônimos e renomeações.

Validar disponibilidade do professor, turma única no mesmo horário, sala/capacidade, intervalos, duração, planejamento por período e carga prevista versus alocada. Espaços compartilhados precisam de exceções/capacidade declaradas, sem liberar toda colisão de sala. Alertas devem abrir as células implicadas e explicar a regra violada.

A edição atual mostra alertas, mas `saveEdit` grava sem bloqueá-los. Proposta: conflitos rígidos bloqueiam ou exigem exceção autorizada/documentada; preferências pedagógicas são avisos. “Sem conflitos” não deve aparecer quando somente parte das regras foi executada.

Horários são guardados como strings e a configuração não faz validação completa de sequência/sobreposição. Há regras fixas como clubes/tutoria na quarta-feira e almoço/intervalos após certas aulas. Transformar em configurações da escola, com indicação de impacto, em vez de pressupostos para qualquer escola.

## Importação, versões e segurança de conteúdo

Há importador separado (`importer.html`) e caminhos no index, com diferentes extrações/mapeamentos. Unificar em um fluxo: arquivo → identificar escola/versão → conferir dados → resolver correspondências → validar conflitos/carga → salvar rascunho ou nova versão.

A correspondência aproximada deve sugerir, sem confirmar automaticamente professor/sala quando houver dúvida. Mostrar nome original, candidato e justificativa; não preencher sala por suposição sem conferência. PDF sem texto, documento misto e tabelas quebradas precisam de diagnóstico próprio, com suporte explicitamente informado.

JSON é aceito com pouca validação estrutural e pode substituir o mapa de escolas. Validar versão, IDs, campos, limites, listas e contexto; prévia de mesclar/substituir e backup do estado anterior. A aplicação de PDF à escola atual preserva listas antigas quando já preenchidas, podendo deixar filtros/metadados divergentes dos novos slots; reconciliar em prévia, preservando identidades.

Diversos nomes/campos são interpolados em `innerHTML` e atributos. Sanitizar/renderizar como texto e evitar handlers inline derivados de dados. Trata-se de achado de código, sem execução de conteúdo malicioso em navegador real. Dados de exemplo publicados em assets devem ser inequivocamente fictícios e separados de material escolar real.

## Otimização e clareza de uso

O otimizador chama `gerarGradeAssincrono(1)`, independentemente da escola selecionada. Quando conclui, usa `currentData()` daquele momento e substitui seus slots; trocar a escola durante a tarefa pode aplicar resultado ao contexto errado. Capturar escola/ano/versão e conferir revisão antes de oferecer aplicação. Preservar grade anterior e mostrar aulas não alocadas e alterações de carga.

O progresso percentual cresce pelo número de consultas, não por medição real do motor. Mostrar etapas reais ou indicador de processamento indeterminado, sem porcentagem inventada. Fechar modal não deve fingir cancelamento de tarefa no servidor; diferenciar acompanhar, sair e cancelar quando suportado.

Nomes como Celery, Redis, workers, backtracking, task ID e score interno não ajudam a decisão do professor/coordenador. Interface sugerida:

1. **Escola e versão:** contexto, estado de salvamento, versão ativa e ações de backup.
2. **Cadastros e regras:** professores, turmas, disciplinas, salas, cargas e disponibilidades.
3. **Montar grade:** edição por turma/professor/sala e importação revisada.
4. **Conferir grade:** conflitos rígidos, preferências, cargas e pendências, com ação direta.
5. **Exportar e disponibilizar:** prévia por destinatário/recorte, PDF/Excel/JSON e versão identificada.
6. **Ações avançadas:** sugestões de IA e eventual otimização, sempre com validação e prévia. A necessidade de otimização deve ser confirmada no uso do módulo; esta proposta não recria o Gerador Mágico removido.

Revisar contraste, marca pink/navy, teclado, foco/fechamento de modais, rótulos e tabelas extensas no celular. Consolidar dependências externas e fixar versões; o módulo carrega bibliotecas por CDN e um pacote com `latest`, tornando o resultado dependente do ambiente externo.

## Integrações propostas

Após estabilizar identidade e persistência, oferecer envio de grade selecionada ao Meu Horário Escolar por professor e ao Calendário por turma/período. A integração deve apresentar correspondências, prévia e conflitos, preservar aulas realizadas e não misturar grade institucional com agenda individual silenciosamente. Não existe integração completa demonstrada entre esses três fluxos nesta análise.

## Plano de implementação sugerido

1. Especificar contratos próprios do módulo e casos de teste: há lacuna de specs específicos para esta página legada.
2. Resolver carregamento/empacotamento, identidade/autorização e cache separado; retirar migração destrutiva do boot.
3. Unificar cliente/API e BYOK; corrigir propriedade da escola e tarefas antes de conectar contas reais.
4. Formulário sem mutação antecipada, validação única, desfazer/versionamento e confirmação das substituições.
5. Unificar importação com prévia, correspondências, backup e validação completa.
6. Organizar áreas, ocultar detalhes técnicos e homologar exportação, teclado e celular.
7. Somente então avaliar otimização e integração com outros módulos.

## Evidências e limites

- Oito reproduções sintéticas confirmaram os comportamentos descritos, sem alterar dados reais.
- 31 testes relacionados passaram em quatro arquivos: cliente JWT moderno, domínio do Meu Horário, persistência e conversão segura para Calendário. Eles não certificam o cliente estático nem o backend completo deste módulo.
- Não foram executados backend Django/Celery/Redis, chamadas pagas de IA nem integração em produção. Não se afirma indisponibilidade de todos os serviços publicados apenas pela leitura do repositório.
- Nenhuma funcionalidade foi implementada nesta auditoria. Documentação e evidências seguem para commit/push conforme preferência do usuário.

Próximo módulo: **Dashboard Analytics**. Permanecem os lembretes para o fim das tarefas: terminar configuração das imagens de Atividades Adaptadas e adicionar atividades de recuperação semestral.
