# Importar currículo anual com revisão docente

## Entrega
Em Planejamento → Importar anual, o professor informa disciplina, série e ano letivo e cola texto ou lê PDF, DOCX, TXT/MD pelo extrator compartilhado. O texto permanece editável, com limite de 60000 caracteres e confirmação antes da geração. Arquivo original e texto integral não são persistidos pelo recurso.

A IA organiza quatro bimestres, usando exclusivamente a chave/provedor/modelo escolhidos pelo professor. A resposta é validada: conteúdos precisam ser trechos literais do material, respeitando limites de palavras, caixa e espaços. Conteúdo novo, duplicação indevida e período ausente/repetido são recusados; retomadas explícitas do material podem ocorrer em bimestres diferentes. A distribuição e os objetivos permanecem sugestões para revisão, sem garantia automática de cobertura integral ou validação oficial do currículo.

A prévia exige confirmação antes de abrir o editor. O anual ainda não está salvo; somente “Salvar planejamento” cria a raiz da biblioteca integrada. Navegação protege o rascunho, descarte é explícito e troca de conta cancela a aplicação de respostas tardias. Os módulos de jogo e as notas não foram alterados.

O endpoint reaproveita autenticação docente, exigência de mesma origem, limite de corpo, no-store, redigir chave e adaptador BYOK existentes. A geração não acessa nem grava o banco. Nenhuma autoria, ID, vínculo ou chave fornecida pela IA é incorporada ao anual. JSON incompleto é recusado sem expor fragmentos do material.

## Correção encontrada na validação
A abertura de uma versão recém-criada fazia GET redundante e bloqueava a navegação enquanto já exibia seus dados confirmados. O editor agora pode receber o snapshot confirmado pela API privada; abrir um plano pela listagem continua exigindo leitura na conta atual. A edição posterior mantém expectedRevision e os conflitos de concorrência. Regressão nova e teste anterior preservado comprovam o fluxo.

A primeira execução prolongada teve timeout no Dashboard, além da falha de transição reproduzida. A cópia temporária anterior também ficou com dependências incompletas. A validação final utiliza uma cópia nova, criada a partir do índice preparado para commit e dependências locais completas. Nenhum teste anterior foi alterado para passar.

## Evidências
Leitura real no navegador de PDF digital, DOCX e TXT sintéticos. Geração simulada, passando pelo normalizador real da resposta: quatro bimestres, nenhuma gravação antes da confirmação e salvamento explícito pelo editor. Viewports de desktop (1440 px) e celular (390 px), sem rolagem horizontal. Credencial/provedor real não foram acionados nas capturas nem nos testes automatizados; o encaminhamento do modelo/provedor configurado foi coberto no teste de serviço/HTTP. PDFs escaneados continuam utilizando o pipeline visual compartilhado e seus limites, sem alteração nesta tarefa.

- [PDF no desktop](../evidencias/2026-11-25-importacao-anual/01-pdf-desktop.png)
- [PDF no celular](../evidencias/2026-11-25-importacao-anual/02-pdf-mobile.png)
- [Prévia desktop](../evidencias/2026-11-25-importacao-anual/03-previa-desktop.png)
- [Prévia celular](../evidencias/2026-11-25-importacao-anual/04-previa-mobile.png)
- [Editor desktop](../evidencias/2026-11-25-importacao-anual/05-editor-desktop.png)
- [Editor celular](../evidencias/2026-11-25-importacao-anual/06-editor-mobile.png)

Alterações alheias em autenticação, atividades, jogos, nomes dos módulos e testes de outras tarefas permanecem fora desta entrega. A rota e o hook simulados existiram somente na cópia temporária das capturas; não fazem parte do código publicado.

Um contrato preexistente também exige que o diretório de validação termine em `RotinaDocente`; a cópia nova foi renomeada para respeitar esse contrato, sem alterar o teste ou a configuração.

## Validação final
Suíte completa em cópia isolada: **2161 testes aprovados**, dez opcionais ignorados; 460 arquivos aprovados e quatro opcionais ignorados. Lint: **zero erros e 22 avisos preexistentes**. Nenhum teste anterior foi alterado nesta entrega.

Build de produção aprovado (exit 0), após a suíte completa. A cópia final não contém rota de prévia nem hook simulado; o código real de conexão de IA foi usado no build. A entrega acrescenta 19 casos de teste e preserva os testes existentes.
