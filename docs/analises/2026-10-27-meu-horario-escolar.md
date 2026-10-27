# Meu Horário Escolar — auditoria e proposta de simplificação

Data: 27/10/2026. Escopo: grade individual, persistência, configuração, importação, backup, impressão e ligação com Calendário. Horário Inteligente é outro módulo e não foi alterado. Código local e serviços simulados; sem acesso a grades reais.

## Decisão do usuário aplicada

O usuário informou que o **Gerador Mágico não é necessário**. Foram retirados botão, modal, estado de formulário e acionamento do algoritmo no Meu Horário Escolar. Não foi criado substituto. O cadastro manual, importação PDF/JSON, backup, impressão e integração existentes permanecem no fluxo. A função legada isolada não é acionada pela tela; seu defeito histórico não é uma proposta de evolução do produto.

Esta remoção é a única alteração funcional autorizada nesta etapa. Os demais achados abaixo são sugestões para avaliação.

## Conclusão

A grade manual atende à organização semanal e já exporta/imprime dados. As prioridades são confiabilidade: separar dados por conta, informar falhas reais e garantir que um backup preserve os horários personalizados. Só depois vale reorganizar a experiência de importação e configuração.

| Prioridade | Problema | Proposta |
|---|---|---|
| P0 | Cache global pode entregar grade de uma conta a outra | Armazenamento por UID e estado sem autenticação separado; migração de cache antigo com conferência, sem aplicar em outra conta |
| P0 | Erros local/nuvem são absorvidos e podem aparecer como sincronizado | Estado explícito de salvamento, salvo na nuvem, somente local, pendente e falha; conservar rascunho e permitir repetir |
| P1 | Backup de horário personalizado restaura configuração, mas descarta suas aulas | Validar contra slots reais do backup e mostrar prévia de perdas/conflitos antes de aplicar |
| P1 | Importação aceita dia/turno desconhecidos e não valida profundamente configuração | Contrato único para dias, IDs, intervalos, horas, versão e tipos; não descartar silenciosamente |
| P1 | Parser PDF e tela discordam do nome do campo de contagem; horário pode virar turma | Contrato estruturado, amostra editável e confirmação de professor/dia/horário/turma/disciplina |
| P1 | Aplicar importação ou replicar aula pode sobrescrever dados sem conferência | Escolha de mesclar/substituir; prévia por célula e backup antes da substituição; desfazer |
| P1 | Mudanças concorrentes gravam documento completo sem revisão/fila | Proteção por revisão e fila por conta, com conflito explícito e recuperação |
| P2 | Turnos e estatísticas incluem aulas ocultas; personalizações podem deixar registros sem slot | Separar alcance do turno/semana, listar horários ocultos e prévia ao remover slots/trocar configuração |
| P2 | Importar JSON aparece em dois fluxos com comportamentos diferentes | Um único ponto de importação; Backup focado em exportar/restaurar com mesma conferência |
| P2 | Navegação por células e modais depende principalmente do mouse | Botões de células com rótulos, teclado, foco no modal e fechamento por Escape |

## O que já funciona

- Rota canônica `/meuhorario`, com redirecionamento de `/horario`.
- Cadastro e edição manual de disciplina, turma, sala, cor e observações; replicação entre dias.
- Turnos manhã, tarde, noite e integral; sábado opcional; intervalos visualmente separados.
- Configuração de horários e intervalos, exportação JSON e impressão pelo navegador.
- Regras locais de Firestore restringem o documento ao professor proprietário.
- Camadas de domínio, aplicação, infraestrutura e apresentação já separadas neste módulo.
- Calendário usa carregamento `somenteReal`, evitando cache de outra conta na importação autenticada, e conversor estrito com correspondência exata, conferência de horários e prévia. Essa integração deve ser preservada.
- Dicionários pt-BR/es-Latam e testes básicos existem, embora partes da interface continuem em português fixo.

## Reproduções sintéticas

Arquivo `evidencias-meu-horario/reproducao.test.js`. Oito verificações confirmaram comportamentos atuais/anteriores à remoção; seus testes passarem não significa aprovação funcional.

1. Conta A salva grade; conta B, sem documento na nuvem, recebe o cache da conta A. A chave local é compartilhada e não contém UID. Reproduzido no repositório real com Firestore simulado.
2. LocalStorage e nuvem falham; `salvarGrade` ainda resolve com payload, sem sinal de falha para o chamador. A interface interpreta retorno como nuvem sincronizada quando há usuário.
3. Exportar e importar aula em slot personalizado `s_123` mantém a definição, mas retorna `schedule` vazio. A restauração valida somente IDs dos presets.
4. JSON com turno inexistente e dia inválido é aceito quando o slot corresponde ao preset de manhã.
5. Validador de alocação aceita dia e slot desconhecidos, desde que não sejam reconhecidos como intervalo e haja disciplina.
6. Parser PDF retorna `totalDetectado`, mas a tela usa `totalAulas`. No exemplo “Segunda | 1º Horário | Matemática | 3º Ano B | Sala 10”, a turma reconhecida não é “3º Ano B”.
7. Algoritmo legado gera chave `seg-m1`, incompatível com a grade `seg_m1`. Antes da remoção, o botão também referenciava `visibleSlots`, variável inexistente, e não persistia o resultado. A interface foi retirada por decisão do usuário; não se propõe corrigir/retomar essa funcionalidade.
8. Estatísticas contam aulas de diferentes turnos presentes no mesmo mapa, inclusive as ocultas na grade selecionada. Reproduzida a contagem; a melhoria é explicitar se o indicador é global ou do turno.

## Persistência — como evitar perda e mistura

`HorarioRepository` escreve a mesma chave local para qualquer conta e absorve falhas. `HorarioApp` também não reinicia o estado de carregamento ao trocar usuário; enquanto carrega, a grade anterior pode permanecer editável. Revisar a captura do contexto das operações e invalidar resultados atrasados antes de atualizar a tela ou salvar em nova conta.

A gravação substitui o mapa completo sem revisão transacional nem fila de operações. Requisições podem concluir fora de ordem, e outra aba/dispositivo pode sobrescrever alterações. Recomenda-se adaptar a estratégia compartilhada do Diário às necessidades da grade, preservando campos e compatibilidade.

Os retornos precisam indicar onde o dado foi efetivamente salvo. Erro não pode fechar edição e informar sucesso; preservar formulário e rascunho. Conta sem documento deve começar vazia ou oferecer demonstração explícita, sem apresentar grade fictícia como agenda real.

## Importação e backup

Hoje existem dois caminhos: restaurar JSON pelo Backup substitui o mapa, enquanto Importar Horário mescla as células e sobrescreve colisões. Ambos precisam usar a mesma prévia e declarar alcance. A prévia atual mostra quantidade/turno, sem apresentar toda a grade detectada ou comparar células afetadas.

O PDF é lido por extrator local de texto/OCR impresso, não por um serviço de IA de interpretação de grade. O parser é heurístico e pode confundir a numeração da aula com a turma e horários com números de aula. Texto extraído pode perder estrutura de tabela/linhas. Não anunciar reconhecimento universal nem aplicação segura sem revisão.

Quando o filtro de professor não encontra resultado, o código pode tentar sem filtro; essa ampliação deve ser apresentada para escolha explícita, sem importar aulas de outros professores como se pertencessem ao usuário. Antes de aplicar, permitir editar/excluir linhas e mostrar professor/turma/disciplina/dia/horário/sala, conflitos e dados não reconhecidos.

Proposta de importação: escolher arquivo → escolher professor/turno → conferir linhas e correspondências → escolher mesclar/substituir → conferir impacto → aplicar e confirmar salvamento. Um modo futuro de interpretação por IA só deve ser discutido se necessário para documentos reais; o usuário não solicitou novo gerador.

Backups precisam validar app/versão, turno existente, dias permitidos, IDs únicos, horários válidos sem sobreposição, tipos e cores. Slots personalizados devem orientar a validação. Não perder aulas silenciosamente ao restaurar.

## Configuração, contexto e integração

A configuração permite horário final anterior ao início e sobreposição sem conferência; remover um slot pode deixar aulas órfãs. Mostrar impacto antes de remover/trocar slots e oferecer remanejamento manual, sem redistribuição automática. Um intervalo não pode receber aula nem ser reinterpretado por um preset de outro turno.

O mapa único compartilha IDs entre turnos (por exemplo manhã/integral); turno muda horários, podendo reapresentar as mesmas aulas em horas distintas. Propor grades por escola, ano/período e turno, com seleção explícita e migração revisável. O impresso usa ano atual do computador, não um ano cadastrado.

Turma é texto livre; oferecer turmas do Diário com ID e nome, mantendo avulsas claramente identificadas. No Meu Horário, mostrar “Usar no Calendário” para orientar o caminho existente de importação, com turma/ano/período e aviso de que alterar a grade semanal não deve apagar aulas realizadas. Não duplicar nem enfraquecer o fluxo seguro já existente no Calendário.

## Clareza e acessibilidade

Organização sugerida:

1. **Minha semana:** contexto escola/ano/turno, estado de salvamento, grade e opção de lista por dia no celular.
2. **Editar aula:** disciplina, turma, sala e observações; replicação com prévia de conflitos e confirmação.
3. **Importar horário:** um fluxo com arquivo, professor, conferência e aplicação.
4. **Configurar grade:** aulas/intervalos com validação e impacto; ações avançadas separadas.
5. **Backup e impressão:** exportação, restauração conferida e PDF com contexto correto.

Reduzir controles simultâneos e explicar que células vazias são editáveis. Células `<td>` clicáveis não oferecem teclado/foco adequados. Modais precisam nome acessível, foco controlado e Escape; campos de configuração precisam rótulos. Estilos globais `:root`, `body` e `data-theme` podem afetar outras telas; limitar ao módulo e restaurar tema ao sair. Conferir impressão real, contraste, celular e textos longos.

Completar tradução de importação, configuração, avisos e impressão. Os specs específicos ainda citam es-ES/dependências antigas, enquanto implementação geral usa es-Latam e versões atuais; harmonizar documentação com comportamento confirmado.

## Plano proposto para próxima implementação

1. Atualizar specs e criar testes de regressão novos, sem alterar os existentes.
2. Isolar cache e operações por conta; estados reais de persistência, revisão/fila e conflito.
3. Corrigir restauração de slots personalizados e validação profunda; unificar importação com prévia/backup/mesclagem.
4. Corrigir parser/contrato PDF e filtro de professor; revisão obrigatória antes de aplicar.
5. Validar configuração e impacto nos dados; separar contexto e métricas; preservar integração segura com Calendário.
6. Melhorar teclado, modais, tradução, tema isolado, impressão e documentação de uso.
7. Executar suíte completa e build, testar conflitos entre contas/abas e homologar com arquivos fictícios e exemplos autorizados.

## Evidências e limites

27 testes existentes passaram em quatro arquivos (domínio, persistência, integração segura do Calendário e jornada React). O teste denominado E2E usa jsdom e serviços simulados; não equivale a sessão real de navegador.

Oito reproduções adicionais confirmaram os cenários descritos. Não houve acesso a conta real nem importação de dados escolares reais. A remoção do gerador passou no teste de regressão e na suíte completa: 806 testes em 168 arquivos; build aprovado e lint do arquivo sem erros/avisos. Evidências em `evidencias-meu-horario/validacao-remocao.md`.

Demais problemas permanecem documentados, sem correção nesta etapa. Próximo módulo da sequência: **Horário Inteligente**. Ao final das nossas tarefas, retomar imagens de Atividades Adaptadas e adicionar atividades de recuperação semestral, conforme lembretes registrados.
