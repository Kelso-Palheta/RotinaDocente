# Gerador de Atividades — uso após as correções

## Criar e salvar

Escolha ano, turma e bimestre. A nova atividade herda turma e bimestre abertos. Na visão Todas as atividades, os filtros selecionados também preenchem o formulário.

Adicione material e aguarde a leitura. O texto extraído continua editável. Se a leitura falhar, o arquivo permanece disponível para tentar novamente; também é possível removê-lo. A atividade não pode ser salva ou gerada com arquivo ainda pendente ou com erro.

O formulário mostra quando um material excede o trecho usado pela IA: até 8.000 caracteres para gerar, 6.000 para corrigir e 4.000 para sugerir critérios. Revise o material utilizado.

A pontuação escolhida é usada pela geração e pelos critérios. Questão objetiva precisa de gabarito apontando uma alternativa preenchida. A soma dos critérios gerados conserva a pontuação, inclusive no arredondamento.

O prazo usa horário local. Editar outros campos conserva o instante original, inclusive segundos e milissegundos. O campo informa o formato esperado; datas inexistentes são recusadas.

Ao salvar, aguarde a confirmação. O formulário permanece aberto se houver falha e usa o mesmo identificador na nova tentativa. A publicação grava atividade e acessos juntos. O vínculo ao mapa do Diário é confirmado em seguida; falhas ficam visíveis e podem ser retomadas.

## Corrigir, sincronizar e publicar

1. Abra uma atividade da turma/bimestre desejados.
2. Use **Corrigir com IA** ou **Corrigir manualmente**. A correção salva nota, autoria quando manual e devolutiva. Similaridade é somente aviso para revisão humana; não reduz nota automaticamente.
3. Use **Conferir e sincronizar notas** para visualizar alunos/notas e confirmar envio daquela atividade ao Diário.
4. No Diário, use **Conferir e publicar** para disponibilizar os totais ao aluno. A correção não publica automaticamente as notas pelo novo fluxo.

A lista de turma conserva sincronização por turma e bimestre. Todas as atividades conserva sincronização global; sua confirmação informa que abrange todas as turmas, anos e bimestres. Com filtros de turma/bimestre, a sincronização fica restrita ao filtro informado.

O resultado da sincronização aparece na própria tela. Falhas podem ser repetidas sem recarregar a página. Correção em lote informa andamento e resumo; nova execução considera entregas pendentes ou com erro, sem refazer as já corrigidas.

## Acessos dos alunos

Novas publicações geram links aleatórios separados por turma e aluno, inclusive quando duas turmas têm alunos com o mesmo ID interno. O servidor valida o vínculo atual antes de ler ou receber respostas. Cadastros de colegas, materiais privados e rubricas não são enviados ao aluno.

Links antigos continuam reconhecidos, mas exigem login no Portal do Aluno. O boletim encontra acessos novos e antigos. Após atualizar a proteção de sessão, poderá ser necessário entrar novamente.

Uma entrega registrada não é sobrescrita por novo envio. Respostas e correções anteriores são preservadas; reabertura de entrega é funcionalidade futura com regra própria.

## Editar e arquivar

Depois que houver entregas ou notas, alterações estruturais de turma, bimestre, questões ou escala são bloqueadas. Ajustes permitidos, como prazo, não removem registros anteriores.

**Arquivar** substitui a exclusão destrutiva. A confirmação informa que afeta todas as turmas vinculadas. Notas e entregas permanecem no histórico, e o aluno continua podendo ler a devolutiva existente; novas respostas ficam bloqueadas. Arquivadas não aparecem na lista de trabalho do professor.

A persistência das turmas usa a mesma proteção do Diário, com conta, revisão, rascunho e conflito. Restauração está conectada ao salvamento confirmado. Em conflito, preserve o rascunho e revise a versão da nuvem antes de continuar.

## Publicação técnica

Estas mudanças estão locais. Para produção, a versão do aplicativo e `frontend/firestore.rules` devem ser publicadas em conjunto. O push/deploy do aplicativo não publica automaticamente as regras do banco.

A sessão usa `ALUNO_SESSION_SECRET` (ou os segredos de sessão já suportados). Na ausência deles, deriva um segredo privado estável da credencial administrativa Firebase já configurada. Não há mais segredo público fixo. Sem nenhuma dessas configurações em produção, o acesso falha explicitamente em vez de aceitar sessão insegura.

Nenhuma migração destrutiva ou alteração de registros reais foi executada. Notas que sofreram penalização automática antes desta atualização não são restauradas sem revisão do professor.


## Verificação desta entrega

Suíte completa: 690 testes aprovados em 131 arquivos. Emulador Firestore: cinco testes adicionais aprovados, incluindo bloqueio entre professores e lote de atividade/acessos. Build aprovado; lint sem erros, com dois avisos antigos de imagens. Sem chamadas reais Gemini ou operações em produção.
