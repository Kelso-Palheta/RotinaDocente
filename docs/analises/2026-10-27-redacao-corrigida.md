# Redação Corrigida — auditoria e proposta de organização

Data: 27/10/2026. Escopo: criação, extração, correção, notas ENEM, persistência, histórico/desempenho, acesso do aluno e exportação. Auditoria do código local, com serviços simulados; não houve acesso a alunos reais, chamadas pagas de IA ou mudanças funcionais nesta etapa.

## Conclusão

O fluxo de transcrever, revisar e corrigir já existe, assim como devolutiva por competências, exportação e consulta do aluno. Entretanto, a segurança da consulta, a preservação das redações e a validação das notas precisam preceder melhorias visuais. O módulo ainda utiliza caminhos de persistência que não acompanham a proteção por revisão implantada no Diário.

## Prioridades

| Prioridade | Achado | Proposta |
|---|---|---|
| P0 | Consulta individual de redação não verifica se o documento pertence ao aluno conectado | Corrigir autorização no servidor, vínculo vigente e projeção dos campos; achado compartilhado com auditoria do Portal |
| P0 | Correção com login usa o hash do aluno como ID do documento; nova correção pode substituir a anterior | ID único por redação, identidade do aluno separada, histórico por ano/turma/bimestre e versões de revisão |
| P0 | Abrir “Minhas Correções” migra documentos automaticamente para a mesma chave, sobrescrevendo e apagando originais | Retirar migração destrutiva do carregamento; migração explícita, revisável, idempotente e com backup |
| P0 | Abrir correção pode gravar cache de turmas no Diário sem conferir revisão | Consumir persistência compartilhada; carregar turmas sem gravar como efeito colateral; conflito real exige resolução |
| P1 | Parser aceita competência inválida, total divergente e competências ausentes como zero | Validar contrato completo no servidor com domínio ENEM; total calculado pelas competências; não salvar nota inventada |
| P1 | Criação de vínculo usa nome da turma como `turmaId`, sem `alunoId` | Persistir IDs reais, ano e nome legível separados; preservar vínculo do Diário e diferentes contextos |
| P1 | Salvamento ou preparação de login pode falhar depois/antes da IA sem recuperação adequada | Separar estados de correção e gravação; preservar resultado, reexecutar apenas salvamento; capturar erro de login |
| P1 | Exclusão em lote remove também vínculo compartilhado do professor | Exclusão não revoga acesso a notas e atividades; arquivar com restauração e histórico |
| P1 | PDF misto pode ignorar páginas escaneadas; imagem direta de correção OpenAI é descartada | Extração por página e contrato explícito: transcrever/revisar antes da correção ou transportar a imagem corretamente |
| P2 | Histórico, filtros e relatórios apresentam estados/contextos inconsistentes | Navegação por tarefa, filtros coerentes, visualização compartilhada e evolução longitudinal integrada |

## O que funciona e deve ser preservado

- Fotos de manuscritos seguem extração por visão de IA; PDFs digitais têm leitura local, sem obrigar gasto com IA.
- Texto extraído passa pela revisão do professor. O prompt de transcrição solicita preservação dos erros do aluno.
- Provedor, chave e modelo vêm da configuração pessoal; sem chave, a rota recusa IA.
- Gemini selecionado segue os caminhos da API Google; há fallback de modelos dentro do provedor na transcrição. Isso não significa que o módulo esteja globalmente fixado em Gemini: o contrato atual é multiprovedor/BYOK.
- Limites de geração variam com a profundidade; resposta truncada tem repetição limitada no provedor compartilhado.
- Há notas por competência, feedback formatado nas telas principais e exportação PDF paginada.
- Firestore local restringe leitura direta de correções ao professor proprietário. Isso não resolve a falha da rota administrativa de consulta do aluno.
- Validador puro de pontuação e diagnóstico longitudinal já existem, mas não estão plenamente conectados ao fluxo persistido.

## Sete reproduções com dados fictícios

Evidências em `evidencias-redacao/`. Os testes passam ao confirmar defeitos atuais; não são critérios de aceite das correções.

1. `extractScore` aceita C1=250 e total=999, apesar de as competências somarem 410. Não aplica o validador ENEM existente.
2. JSON com apenas C1=160 se transforma em cinco competências, sendo quatro zero. Ausência de avaliação é convertida em nota.
3. JSON solto com todas as competências zero e `anulada: true` retorna `null`, ao contrário do formato cercado por fence. A condição de anulação também não é preservada no objeto de notas retornado.
4. `generateCorrection` com OpenAI e somente imagem chama o provedor sem incluir os bytes da imagem. O fluxo normal da interface transcreve primeiro, portanto o defeito comprovado é do contrato de correção direta da API, não da transcrição comum.
5. PDF de duas páginas, com mais de 50 caracteres digitais na primeira e segunda escaneada, retorna apenas o texto da primeira, sem renderizar/transcrever a segunda.
6. Montar a página real “Minhas Correções” com duas redações legadas do mesmo aluno em bimestres distintos produz duas gravações para a mesma chave e apaga os dois documentos de origem, sem ação do usuário. Os efeitos de Firestore foram simulados; não foram excluídos documentos reais.
7. Montar a página real de correção com cache de turmas e timestamp local maior grava esse cache no documento do Diário, mesmo com revisão na nuvem, sem transação nem conferência da revisão. O cenário demonstra capacidade de sobrescrita por cache; não comprova que uma conta real sofreu perda.

## Persistência e identidade — atenção especial

### Uma redação não pode ter o mesmo identificador que o aluno

Em `app/redacao/page.js`, com login disponível, `corrId` recebe `gerarLoginKey(loginAluno)` e a correção é salva com `setDoc` sem versão. Isso permite apenas um documento por aluno/professor nesse caminho. Bimestre ou tema diferentes não mudam a chave.

Proposta: cada redação recebe ID próprio e contém `alunoId`, `turmaId`, `anoLetivo`, bimestre, tema, autoria e datas. Login identifica acesso, não redação. Revisões pertencem à redação original e não substituem silenciosamente histórico. A consulta do Portal deve deixar de depender de um único documento sob o hash do aluno.

A migração do histórico atual procura aluno pelo primeiro nome completo correspondente entre todas as turmas, sem restringir turma/ano. Homônimos podem ser associados incorretamente. A associação precisa usar IDs; registros legados ambíguos exigem conferência, sem escolha automática.

### Vínculos compartilhados não são propriedade exclusiva deste módulo

A criação atual usa `studentClass` (nome) como `turmaId` e não informa `alunoId`. O mesmo vínculo, identificado pelo professor, também é usado pelo Diário. A migração do desempenho volta a gravar a turma nesse vínculo; a exclusão em lote o apaga por inteiro. Essas ações podem invalidar o contexto exigido pelo boletim e atividades.

Recomenda-se contrato compartilhado por contexto e módulo, sem apagar autorização de outros recursos. Exclusão de redação e revogação de acesso devem ser operações distintas. Operações em lote precisam apresentar resultados parciais e permitir retomada; hoje uma falha no meio pode deixar dados removidos com estado visual antigo.

### Estado de processamento e recuperação

A resolução de login ocorre depois de `setStep('correcting')`, mas antes do bloco `try`. Falha nessa leitura pode deixar a tela presa em processamento. Se IA responder e o salvamento falhar, o resultado ainda não é aplicado à tela, levando à repetição de toda a correção. Guardar resultado antes de persistir e permitir “Tentar salvar novamente” sem novo consumo de IA.

A página mantém texto/resultado em memória. Propor rascunho isolado por conta e aluno, com aviso de saída, recuperação e limpeza adequada. Cancelar ou ignorar extrações antigas após troca de arquivo, aluno ou contexto. Revisar também estado inicial/cache na troca de conta: não apresentar turmas da conta anterior durante carregamento/falha.

## Contrato de notas e avaliação pedagógica

O domínio `enemScoreValidator.js` já exige cinco competências válidas e soma estrita. A rota `/api/corrigir` usa apenas o parser tolerante, permitindo resultado inconsistente seguir para persistência. O contrato deve distinguir notas completas, avaliação parcial, anulação e resposta inválida. JSON incompleto/truncado não pode gerar zeros para o que não foi avaliado.

A interface permite selecionar competências, mas mantém total sobre 1000 e o prompt ainda pede C1–C5. Definir claramente: correção completa produz total; análise de competências selecionadas informa alcance e não anuncia total comparável a avaliação integral. Revisão docente pode ajustar notas e justificativas com autoria, data e histórico.

O prompt menciona regras de 2024/2025. Esta auditoria não certifica aderência ao manual oficial vigente. Recomenda-se versionar a rubrica e conferir a documentação oficial antes de anunciar atualização ENEM. Proposta: motivo de anulação explícito, evidências textuais por competência e limites da avaliação automática visíveis.

Há conflito documental: RN-06 determina modelo exclusivo Maritaca, enquanto RN-27 e implementação autorizam BYOK multiprovedor. Harmonizar specs com a decisão atual do produto antes de implementar, sem trocar silenciosamente a IA escolhida.

## Extração e materiais

A decisão digital/escaneado é tomada pelo total de caracteres do PDF inteiro. Adotar decisão por página para documentos mistos, exibir progresso, páginas reconhecidas e eventuais falhas. Preservar fonte, ordem e quebras relevantes para revisão; texto de PDF é atualmente unido, o que enfraquece avaliação automática por contagem de linhas.

Fotos precisam de orientação de iluminação, enquadramento, rotação e legibilidade, com ampliação e comparação fonte/transcrição. Não usar regras de anulação por linhas como conclusão infalível quando a estrutura original foi perdida. Propor limites de arquivo antes do processamento, erros claros e preservação da transcrição em falhas. A mensagem atual que pede conferir se o PDF é escaneado precisa refletir que esse formato é aceito.

## Histórico, desempenho e relatórios

- Cards de desempenho usam todas as correções do bimestre, mesmo quando uma turma é selecionada. Fazer contagens, médias e lista responderem aos mesmos filtros e identificarem o alcance.
- A listagem por turma associa correções apenas pelo nome e bimestre, sem turma/ano. Usar identidade explícita para impedir mistura de homônimos.
- Falha de carregamento é registrada no console e pode parecer histórico vazio. Exibir erro, tentativa novamente e dados preservados.
- “Vincular Correção” busca todos os professores, mas as regras locais permitem apenas documentos próprios. A função conflita com o isolamento; substituir por associação de registros próprios ou compartilhamento explícito e autorizado, sem abrir acesso global.
- O modal de histórico imprime `result` bruto, sem o renderizador compartilhado; markdown/JSON podem aparecer. Unificar a renderização usada por professor e aluno.
- PDF calcula total pela soma, enquanto tela pode usar total informado pela IA; a mesma redação pode divergir entre formatos. Unificar contrato e data original da correção, mantendo data de exportação separada.
- PDF usa cores e cabeçalho próprios, data atual e rodapé fixo em 2026. Tema/nome longos precisam quebra e paginação apropriadas; homologar visualmente o arquivo exportado.
- Evolução longitudinal existe como função, mas não é exibida no módulo e não normaliza diretamente `scoreData`/`totalScore` persistidos. Adaptar o contrato e mostrar evolução por competência, sem interpretar falta de dados como zero.
- Links de relatório são copiados sem contexto explícito de professor e exigem sessão do aluno. Explicar autenticação; oferecer prévia do professor separada da consulta autenticada do aluno.

## Organização proposta

1. **Visão geral:** turma, ano e bimestre; contagens coerentes, pendências de revisão e acesso a Nova correção, Histórico e Evolução.
2. **Identificar redação:** selecionar turma/aluno por IDs; tema e bimestre explícitos; opção de texto avulso sem associação automática por nome.
3. **Enviar e revisar texto:** arquivo ou texto; fonte ao lado da transcrição; motivadores opcionais em área própria; avanço após conferência.
4. **Configurar avaliação:** completa ou competências específicas; profundidade explicada pelo tipo de devolutiva; provedor/modelo conectados visíveis.
5. **Revisar resultado:** notas válidas, evidências, texto original e sugestões; editar manualmente com histórico e distinguir análise da IA de decisão docente.
6. **Salvar e disponibilizar:** estados separados de rascunho, corrigido, revisado e publicado; prévia do aluno e confirmação do salvamento. Histórico existente não é substituído.
7. **Evolução:** comparação de redações por aluno/competência; filtros e propostas de reescrita; exportação coerente com versão publicada.

Essas são sugestões para aprovação. Publicação explícita de redações e correção manual são novas funcionalidades propostas para este módulo; não devem ser confundidas com a correção manual de atividades, já implementada.

## Plano de execução e aceite

Antes de editar código funcional: atualizar PRD, RULES, API_SPEC, DATABASE_SCHEMA e TESTS_SPEC; criar novos testes sem alterar testes existentes para mascarar regressões.

1. Corrigir autorização da consulta e registrar regressões com alunos distintos do mesmo professor e vínculos removidos.
2. Adotar ID único/versionamento e migração com backup e prévia. Duas redações em temas/bimestres distintos devem sobreviver a gravação, releitura e abertura de desempenho; abrir tela nunca apaga registros.
3. Remover gravação lateral de turmas e utilizar persistência compartilhada. Cache obsoleto não sobrescreve nuvem; turma vazia e troca de conta são tratadas corretamente.
4. Corrigir contratos de identidade/vínculo. Criar/excluir redação não modifica acesso a notas/atividades; homônimos são isolados por contexto.
5. Aplicar validação de notas e estados de anulação/parcial. Competência inválida, ausente, não finita ou total divergente não é publicada como resultado válido.
6. Preservar extração/resultado em falhas. Repetir salvamento não chama IA novamente; falha de login encerra processamento com orientação; respostas antigas não mudam contexto atual.
7. Cobrir PDF misto, imagem direta, revisão docente, filtros/contagens e relatórios. Validar visualmente desktop, celular, teclado e PDF paginado.
8. Executar suíte completa e build antes de publicar alterações; homologar com materiais fictícios antes de dados reais.

## Evidências e limites

- 48 testes existentes passaram em 6 arquivos: pontuação de domínio, evolução, extração de manuscritos/provedores, feedback e padrão visual.
- 7 reproduções passaram confirmando problemas atuais, em 2 arquivos de evidência. Serviços e identidades são fictícios.
- Falha de autorização compartilhada já foi reproduzida na auditoria do Portal; não foi testada novamente contra produção.
- Não foi executada migração, exclusão, correção paga nem publicação. Nenhuma correção funcional faz parte desta entrega documental.
- A cobertura atual não garante segurança dos fluxos completos: testes de domínio válidos não asseguram que as telas e rotas utilizem o domínio.

Próximo módulo: **Meu Horário Escolar**. Ao final das nossas tarefas, lembrar de retomar a configuração do armazenamento de imagens de **Atividades Adaptadas**, mantendo a decisão de não ativar Blaze por enquanto.
