# Gerador de Atividades — auditoria e proposta de organização

**Atualização:** defeitos corrigidos localmente em 24/10/2026. Veja `docs/guias/gerador-atividades.md`. O diagnóstico abaixo registra o estado anterior às correções; novas funcionalidades sugeridas continuam como propostas.

Data: 24/10/2026. Escopo: gerador regular, criação, materiais, questões, entregas, correção e integração com Diário/Portal. Atividades Adaptadas terá análise própria.

Esta entrega documenta diagnóstico e sugestões. Não altera código de produção. Considera o estado local atual, inclusive melhorias anteriores ainda não publicadas. Não houve consulta a alunos reais, chamadas reais de IA nem gravações em produção.

## Resultado

O módulo já tem recursos úteis, mas mistura criação, distribuição e envio de notas. Antes de ampliar funcionalidades, recomendo corrigir acesso de alunos, confirmação de salvamento, persistência compartilhada com o Diário e redução automática de notas por similaridade.

## O que está correto nas partes verificadas

- Listagem e sincronização possuem recorte por turma e bimestre. A visão geral mantém sincronização ampla. Há regras e testes específicos para impedir mistura de escopos.
- Existem correção manual e por IA, notas por questão e devolutivas. Testes cobrem preservação de revisões manuais e feedback no Portal/relatórios em suas respectivas implementações.
- Materiais aceitam texto, documentos e imagens. A extração distingue PDF digital de página escaneada, preserva a ordem e usa leitura visual quando necessária. Limites atuais: PDF de até 15 MB, imagem de até 7 MB e até 10 páginas visuais por PDF.
- Com Gemini selecionado, o fluxo usa a API Google e o modelo configurado. Testes confirmam o domínio `generativelanguage.googleapis.com`, JSON e tratamento de respostas truncadas. O nome legado `/api/maritaca` é uma entrada compartilhada, não comprovação de uso da Maritaca.
- A configuração Gemini efetivamente salva na conta do usuário e a qualidade de uma chamada real não foram verificadas nesta auditoria. O módulo aceita configuração de provedor; não está tecnicamente limitado ao Gemini.

## Falhas reproduzidas localmente

As seis reproduções usam dados sintéticos e serviços simulados. Os testes de reprodução passam ao confirmar o comportamento incorreto atual; não significam que os problemas estejam corrigidos.

| Prioridade | Falha comprovada | Efeito e correção sugerida |
|---|---|---|
| Crítica | A leitura de atividade aceita um identificador codificado sem token emitido e devolve `alunosPorTurma` | O retorno pode conter dados dos colegas armazenados no documento. Validar acesso emitido/revogável e vínculo no servidor; retornar somente campos públicos necessários. Não copiar cadastros completos para a atividade. |
| Crítica | A entrega aceita requisição sem sessão/token e aceita turma/bimestre enviados pelo cliente | O servidor não comprova quem está entregando nem a turma vinculada. Exigir credencial válida e derivar contexto do vínculo autorizado. |
| Alta | Abrir o fluxo de entregas pode disparar redução de nota por similaridade | Com detector simulado indicando similaridade, o efeito transforma 8 em 4 sem decisão do professor. Substituir punição automática por alerta, comparação de respostas e confirmação explícita. Similaridade não comprova plágio. |
| Alta | Formulário fecha enquanto a gravação ainda está pendente | `onCreate`/`onUpdate` não são aguardados. Manter editor aberto, aguardar confirmação, preservar conteúdo no erro e permitir nova tentativa sem duplicar. |
| Alta | Editar sem mudar o prazo desloca o horário em três horas no fuso de Belém | Conversão UTC para campo local e nova interpretação local mudam o instante. Usar conversão local consistente e entrada de data/hora validada. |
| Média | Questão objetiva salva com gabarito apontando alternativa vazia | Exigir que o gabarito exista entre alternativas preenchidas, com validação antes de publicar. |

Referências: `frontend/src/app/api/aluno/atividade/[id]/route.js:15–49`, `frontend/src/app/api/aluno/entregar/route.js:8–44`, `frontend/src/hooks/atividades/useEntregas.js:120–158`, `frontend/src/components/atividades/AtividadeForm.jsx:223–229,370–448`.

## Outros problemas identificados pela leitura do código

Estes achados têm evidência de implementação, mas não foram reproduzidos de ponta a ponta nesta entrega.

### Persistência e notas

- **O Gerador ainda grava turmas pelo fluxo antigo.** `app/atividades/page.js:26–135` usa cache compartilhado e substituição de toda a lista baseada em horário local. Não usa a persistência por conta/revisão recém-adicionada ao Diário. Pode sobrescrever mudanças concorrentes. Documento com lista vazia também é tratado como ausência de dados, abrindo caminho de migração. Reutilizar o mesmo serviço seguro do Diário e reconhecer vazio como estado válido.
- **Criação pode ficar incompleta.** `hooks/atividades/useAtividades.js:80–105` salva atividade, depois emite acessos por turma. Falha intermediária deixa parte do trabalho pronta. Adotar operação recuperável e identificador estável, com estado de publicação e retomada explícitos.
- **Editar turmas não reconcilia acessos.** A atualização não emite/revoga vínculos conforme alterações. Tokens usam apenas `aluno.id` no caminho; IDs iguais em turmas diferentes podem colidir. Chavear por vínculo e compatibilizar dados existentes.
- **Mudar bimestre pode remover notas anteriores do mapa.** Os callbacks de edição removem o item antigo e adicionam outro, sem migração de notas definida. Bloquear mudança com entregas/notas ou oferecer migração revisável, com histórico.
- **Corrigir também pode publicar automaticamente.** `AtividadePainel.jsx:107–122` sincroniza e chama publicação individual; erros de sincronização ficam no console. Separar estados “correção salva”, “nota enviada ao Diário” e “publicada ao aluno”; mostrar resultado e permitir repetição segura. Manter sincronização global na visão geral.
- **Autoria da correção manual falta na visão por turma.** `AtividadesList` não repassa `user` ao painel. Propagar identidade validada e registrar histórico, sem depender apenas de informação fornecida pelo navegador.
- **Excluir atividade compartilhada afeta todas as turmas.** Informar exatamente quais turmas e entregas serão atingidas. Preferir arquivamento. A exclusão atual apaga o documento principal antes dos registros dependentes e concentra dependentes em um único lote; precisa tolerar volume e falhas parciais.

### IA, materiais e validação

- **Pontuação da rubrica pode divergir da questão.** `AtividadeForm.jsx:321–335` não envia a pontuação escolhida a `gerarQuestoesComIA`, cujo padrão é 2. Depois atribui a nota escolhida sem readequar a rubrica. Enviar e validar a mesma escala em geração, critérios e correção.
- **Imagem anexada à questão pode não chegar à correção.** O formulário salva `{ base64 }`; `utils/atividades/correcaoIA.js:67` só encaminha `img.url`. Padronizar formato e testar o caminho completo. Isso é distinto da extração de texto de imagens como material, que já existe.
- **É possível continuar enquanto o material é extraído.** O formulário registra `_extracting`, mas não bloqueia salvar/gerar. O material incompleto pode ser descartado do payload. Exibir progresso, falha e nova tentativa; aguardar leitura ou pedir retirada explícita do arquivo pendente.
- **Material longo é cortado sem explicação.** Limites internos de contexto: 8.000 caracteres na geração, 6.000 na correção e 4.000 na rubrica. Mostrar cobertura utilizada e permitir selecionar trechos/páginas; não insinuar leitura integral quando houve corte.
- Validar resposta da IA por tipo de questão, alternativas, gabarito e soma dos critérios antes de incorporar ao editor. Exibir revisão do professor antes da publicação.

### Clareza e navegação

- Nova atividade não herda a turma/bimestre abertos; o formulário começa no primeiro bimestre. Preencher pelo contexto, mantendo alteração explícita.
- Incorporar seleção de ano e tratamento de turmas arquivadas do Diário. Limpar painel/edição ao trocar contexto, com proteção de conteúdo não salvo.
- “Banco Completo” lista atividades distribuídas; o nome sugere banco reutilizável de questões. Renomear para “Todas as atividades” e reservar “Banco de questões” para reutilização real.
- A barra lateral compartilhada exibe restauração, mas o Gerador não conecta `onImportTurmas`. Integrar o serviço seguro ou retirar o controle deste contexto.
- Correção em lote precisa de progresso, resumo de erros e repetição somente das pendentes/com falha. Evitar recarregar a página como confirmação de sincronização.

## Organização de uso proposta

1. **Escolher contexto:** ano, turma e bimestre sempre visíveis. Visão “Todas as atividades” com filtros e ação de sincronizar todas.
2. **Preparar atividade:** título, material e questões. Arquivos com botão claro de envio, estado da leitura e texto extraído revisável. Salvar rascunho sem distribuir.
3. **Revisar e publicar:** prévia como aluno, prazo, turmas, valor total e critérios conferidos. Mostrar destinatários e confirmar publicação concluída.
4. **Acompanhar e corrigir:** entregas, pendentes e falhas. Ações “Corrigir com IA” e “Corrigir manualmente” igualmente claras. Feedback por questão e geral.
5. **Conferir e enviar notas:** prévia de aluno, nota, turma e bimestre; sincronização restrita ao contexto; publicação ao Portal com estado explícito e devolutiva disponível também no relatório.

## Novas implementações sugeridas

- Rascunho persistente e recuperação de edição interrompida.
- Duplicar atividade para outra turma/período sem reaproveitar entregas ou notas.
- Banco de questões com busca por conteúdo, tipo e dificuldade.
- Geração em lote com quantidade, tipos e pontuação planejados; revisão antes de incorporar.
- Impressão/PDF do aluno e versão do professor com gabarito separado.
- Histórico de publicação, correção, revisão e sincronização; reabertura de entrega com regra explícita para invalidar resultados anteriores.
- Prévia de materiais, páginas utilizadas e aviso de texto ilegível/incompleto.

## Ordem de implementação recomendada

1. Acesso e retorno mínimo de dados; validar entrega e política de reenvio.
2. Remover penalização automática; confirmar salvamento e unificar persistência com o Diário.
3. Corrigir prazo, gabarito, escala de rubrica e envio de imagens.
4. Proteger edição, criação parcial, vínculos e arquivamento.
5. Organizar contexto, rascunho, revisão/publicação e acompanhamento.
6. Adicionar reutilização, geração em lote e exportação.

Cada etapa deve atualizar especificações, acrescentar testes de comportamento esperado, demonstrar a falha e corrigir a implementação sem enfraquecer testes existentes. Migrações devem preservar atividades, entregas, notas e feedback já cadastrados.

## Evidência e limites

- **83 testes existentes passaram, em 18 arquivos selecionados:** componentes de atividades, correção manual, Gemini, JSON, extração de documentos e sincronização por escopo.
- **Suíte completa: 646 testes passaram, em 117 arquivos**, executada também após a documentação; nenhum teste existente foi alterado.
- **6 reproduções locais passaram, em 3 arquivos temporários:** confirmam as seis falhas da primeira tabela. Detector de similaridade e banco foram simulados; não foi medida a precisão do detector nem validado acesso em produção.
- Fontes das reproduções preservadas em `docs/analises/evidencias-atividades/`, com extensão `.txt` para não incorporar comportamento incorreto como contrato da suíte. O arquivo de configuração registra o ambiente usado; para repetir, restaurar os nomes e diretório temporário indicados nele, executando Vitest a partir de `frontend`.
- Não houve teste autenticado no navegador, medição de custo/tempo de IA, chamada real Gemini ou validação do deploy. Testes aprovados não eliminam as lacunas descritas.

Próximo módulo da fila: **Atividades Adaptadas (DUA)**.
