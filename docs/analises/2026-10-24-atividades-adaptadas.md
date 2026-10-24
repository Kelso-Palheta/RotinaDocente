# Atividades Adaptadas (DUA) — auditoria e proposta de organização

Data: 24/10/2026. Etapa 3 da auditoria sequencial. Análise do código local; nenhuma implementação ou publicação realizada nesta etapa. Não foram consultados alunos reais, gravados dados em produção ou feitas chamadas reais de IA.

## Resultado

Há recursos de adaptação, criação, perfis, questões e provas. A interface oferece vários caminhos, mas não explica suficientemente a diferença entre atividade completa, questão reutilizável e prova montada. Antes de ampliar o módulo, corrigir persistência, identidade do destinatário, validação da IA e fidelidade da publicação.

## O que está correto no escopo verificado

- Modos separados para adaptar conteúdo existente e criar a partir de tema; configuração de disciplina, ano, habilidade e tipos/quantidade de questões.
- Seleção combinada de necessidades, harmonização de diretrizes e geração de guia de mediação. A qualidade pedagógica efetiva depende de revisão docente; o prompt não comprova conformidade integral.
- Upload utiliza o extrator compartilhado com suporte a imagens e PDF digital/escaneado; texto extraído é editável. O teste de interface simula a extração, não mede qualidade de OCR real.
- Existem banco de atividades, banco de questões, montagem com reordenação/edição e visualização de estudante/mediação.
- Há controles de fonte, contraste, espaçamento e impressão; não foi feita auditoria completa de leitor de tela, teclado ou PDF acessível.
- Geração usa a configuração central BYOK. Gemini selecionado passa pelo provedor Google; o módulo também admite outros provedores. A configuração da conta e uma chamada real não foram verificadas. Imagens têm serviço alternativo, portanto a seleção de Gemini não garante que toda imagem venha dele.

## Problemas reproduzidos com dados sintéticos

Reprodução isolada em Node, importando os módulos reais de domínio/repositório, com localStorage em memória e Firestore clássico simulado. Nenhum arquivo de implementação ou teste existente foi alterado.

| Prioridade | Evidência observada | Melhoria necessária |
|---|---|---|
| Alta | `salvarAtividade` devolveu sucesso após falha de gravação na nuvem. O cache continha 1 atividade; uma leitura posterior bem-sucedida de nuvem vazia deixou lista e cache com 0. | Distinguir salvo localmente, pendente e sincronizado; preservar operações pendentes e reconciliar sem descartar rascunhos. Tratar também quota/indisponibilidade do armazenamento local. |
| Alta | Reaproveitar de Aluno A para Aluno B mudou `alunoNome` para B, mas manteve `aluno.nome` e `aluno.id` de A. O visualizador usa o objeto interno. | Atualizar identidade de forma consistente, conferir turma/vínculo e exigir revisão do perfil antes de reutilizar. |
| Média | Publicação de 3 questões gerou total declarado 10, mas soma das questões 9,99. | Distribuir arredondamento garantindo soma exata; validar escalas antes de publicar. |
| Média | Questão com `dicaScaffolding` chegou ao formato online com `scaffolding` vazio. | Preservar os apoios do formato gerado na conversão para o Portal. |

Fontes: `frontend/src/infraestrutura/adaptacoes/AtividadeAdaptadaRepository.js` (`salvarAtividade`, `listarAtividades`, `reaproveitarParaAluno`); `frontend/src/dominio/adaptacoes/publicadorAtividadeOnline.js`.

## Achados por leitura do código, sem reprodução ponta a ponta

### Prioridade alta

1. **Destinatário da publicação pode perder vínculo com o Diário.** O formulário manda nome/perfil à IA sem ID do aluno/turma. O visualizador busca `aluno.id`/`uid` no resultado, podendo criar ID a partir do nome; a turma pode assumir a primeira da lista ou `turma_geral`. O ID salvo no topo da atividade também não é usado nesse cálculo. Preservar IDs fora da resposta da IA; exigir seleção explícita de aluno existente na turma e mostrar destinatário/bimestre antes de publicar. Falha de emissão de acesso após criar atividade precisa permitir retomada sem duplicação.
2. **Resposta inválida da IA pode aparecer como geração bem-sucedida.** A rota converte falha de JSON em questão discursiva contendo a resposta bruta, com `sucesso: true` e guia genérico. JSON sintaticamente válido também é normalizado sem exigir questões/enunciados/guia completos. Retornar erro recuperável, preservar formulário e validar estrutura, quantidade e tipos antes de mostrar resultado utilizável.
3. **Gabarito não é exigido no esquema do prompt.** O publicador aceita gabarito vazio e converte qualquer questão com alternativas em múltipla escolha. Associação e verdadeiro/falso precisam de representação própria ou conversão explícita revisada. Não publicar objetiva sem resposta correta válida.
4. **Feedback de salvamento pode antecipar confirmação.** Salvar questão individual marca sucesso sem aguardar callback; callbacks da página capturam erros sem propagá-los. O lote pode indicar sucesso mesmo após erro tratado pelo pai. Aguardar confirmação e distinguir resultado local/nuvem; impedir duplicação em repetição.
5. **Imagens geradas não têm persistência consistente.** O visualizador normaliza resultado criando cópias das questões, altera `q.imagemUrl` e guarda URL no estado interno. Os callbacks de salvar/publicar recebem `resultado` original. Incorporar imagens ao mesmo documento editável e persistido, com teste gerar → salvar → reabrir → publicar.

Fontes: `frontend/src/app/adaptacoes/page.js` (`handleGerar`, callbacks de salvamento); `frontend/src/components/adaptacoes/VisualizadorAtividadeAdaptada.jsx` (`handleGerarImagem`, `handleConfirmarPublicacaoOnline`, ações de salvar); `frontend/src/app/api/adaptacoes/gerar/route.js`; `frontend/src/dominio/adaptacoes/RespostaGeracaoAdaptada.js`; `frontend/src/dominio/adaptacoes/AdaptacaoPromptBuilder.js`.

### Clareza e continuidade do trabalho

- **Organizar o caminho principal:** 1. escolher aluno/turma ou atividade sem destinatário; 2. escolher material/tema; 3. definir apoios e questões; 4. revisar; 5. salvar, imprimir ou publicar. Mostrar resumo de contexto no resultado.
- **Explicar os três acervos:** “Minhas atividades” para trabalhos completos; “Banco de questões” para itens; “Montar avaliação” para composição. Separar claramente ações de guardar atividade e guardar questões.
- **Unificar seleção de estudantes:** Diário e perfis PEI em um seletor com origem visível, turma e ano. Evitar cadastro duplicado. Para o montador, incluir alunos do Diário, não apenas lista PEI carregada no início.
- **Carregar turmas quando necessário:** atualmente o carregamento depende de abrir seletor/banco de alunos ou importação. Publicar uma criação avulsa pode encontrar lista vazia. Buscar contexto com estado de carregamento/erro e nova tentativa.
- **Proteger trabalho em andamento:** formulário, resultado e montagem ficam em estado React. Oferecer rascunho por conta, indicador de alterações e proteção ao sair/recarregar. Não substituir resultado anterior sem aviso.
- **Impedir geração com leitura pendente:** botão de gerar verifica `gerando`, sem incluir `extraindoArquivo`; uma nova extração pode substituir conteúdo digitado. Aguardar conclusão e mostrar prévia antes de substituir texto existente; tratar seleções concorrentes/cancelamento.
- **Diferenciar atividade e critério de nota:** importar do Diário pode trazer apenas nome/metadados, sem questões, e parecer material completo. Identificar registros sem conteúdo e solicitar o material original. Acrescentar filtro por bimestre/ano e turmas arquivadas.
- **Simplificar linguagem:** explicar DUA, PEI, mediação e “scaffolding” em texto curto; usar “Dica de apoio” na interface. Apoio pedagógico não deve depender apenas de categoria diagnóstica; apresentar barreiras, estratégias e revisão docente.
- **Conta e sincronização:** não carregar/gravar sob `anonimo` enquanto autenticação está pendente; limpar estados ao trocar conta e comunicar falha de carregamento, atualmente muitas vezes apenas registrada no console.

## Novas implementações sugeridas, após correções

1. Revisão lado a lado: atividade original, adaptação e objetivo/habilidade preservados.
2. Lista de conferência antes de disponibilizar: destinatário, questões/gabaritos, apoios, nota total, guia docente e prévia do estudante sem respostas.
3. Histórico de versões e duplicação explícita para outro estudante, com revisão das necessidades e vínculo.
4. Painel “Meus materiais”: rascunhos, prontos para revisão, salvos e publicados; busca por turma/aluno/disciplina.
5. Comparação entre versão impressa e digital, com conferência de imagens, dicas, formatos de resposta e destino das notas no Diário.

## Opções de organização

- **Recomendada: fluxo guiado + acervos em segundo plano.** Facilita a primeira utilização sem retirar recursos avançados.
- **Alternativa mínima: manter abas e esclarecer nomes/ações.** Menor mudança visual, mas mantém o professor responsável por montar a sequência de uso.
- **Alternativa avançada: central por estudante.** Reúne materiais e histórico individual; demanda maior integração e não substitui o modo sem destinatário.

## Verificação e limites

Executados os seis arquivos existentes: `atividades_adaptadas`, `banco_questoes_montador_provas`, `publicador_atividade_adaptada`, `UploadVisual`, `adaptacoes_api` e `adaptacoes_normalizacao`: **55 testes aprovados**. Eles não cobrem todos os achados acima. Aprovação não comprova que o módulo inteiro esteja livre de falhas.

Esta entrega altera apenas documentação. Não foi necessário executar build nem repetir a suíte completa do projeto; nenhuma implementação foi concluída nesta análise. Para correções futuras, atualizar specs e escrever testes novos que reproduzam os defeitos antes de alterar fonte, preservando os testes existentes. Validar por etapas e conferir regressões de Gerador, Diário e Portal. Próximo módulo da sequência: Portal do Aluno.

## Aprofundamento de imagens

[Auditoria aprofundada de geração e adaptação de imagens](2026-10-24-imagens-atividades-adaptadas.md): seis falhas reproduzidas, distinção entre extração de texto e edição do original, estratégia por tipo de figura, critérios técnicos/pedagógicos e plano de homologação.
