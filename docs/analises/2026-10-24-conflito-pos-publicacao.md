# Falso conflito ao registrar publicação no Diário

## Sintoma observado

As imagens indicam 35 alunos publicados, sem falhas de envio, seguidos de aviso de conflito ao registrar a publicação. A edição do Diário fica bloqueada e um aviso adicional aponta diferença em dados de sessão anterior.

Nenhum dado real foi consultado ou alterado para este diagnóstico. As imagens dos alunos não foram copiadas para o repositório.

## Causa reproduzida

O repositório e a fila comparavam conteúdo com `JSON.stringify`. Esse texto muda quando a ordem das chaves de um objeto muda, mesmo mantendo exatamente as mesmas notas. Isso pode produzir falso conflito após uma gravação e releitura dos mapas. O teste simula o banco retornando chaves ordenadas: salvar uma nota funciona e registrar a publicação em seguida falhava, sem qualquer edição externa.

O mesmo critério também marcava cache pendente e sessão anterior como divergentes somente por ordenação. O botão Tentar novamente recusava qualquer estado de conflito sem revalidar a nuvem.

Esta reprodução identifica uma causa concreta; não demonstra que toda ocorrência em produção seja falsa. Diferenças reais devem continuar protegidas.

## Correção

- Comparação estável de mapas aninhados, preservando ordem de listas e diferenças efetivas de valores.
- Repositório continua exigindo revisão, existência do documento e conteúdo correspondentes antes de gravar.
- Cache pendente exige também mesma origem da base; ordem dos campos não gera divergência.
- Tentar novamente lê a nuvem em caso de conflito antigo. Só libera salvamento quando revisão, existência, origem e conteúdo da base continuam correspondentes. Mudança real mantém bloqueio e preserva rascunho.
- Aviso de sessão antiga também compara conteúdo, sem apagar ou aplicar dados automaticamente.

Não foi alterado o envio das notas ao Portal. Não há repetição automática de publicação nem remoção de rascunhos.

## Recuperação após a versão corrigida ser publicada

1. Atualizar o aplicativo, preservando o rascunho do navegador.
2. Usar Tentar novamente para confirmar o salvamento pendente. Não é necessário reenviar as notas que já constam como publicadas apenas para salvar o registro.
3. Se houver diferença real na nuvem, o bloqueio permanece. Nesse caso, baixar o rascunho antes de revisar a versão da nuvem continua necessário.

## Testes

Antes: três reproduções de conflito indevido falharam; os três testes de alteração real já bloqueavam corretamente. O teste da mensagem de sessão anterior também reproduziu o aviso incorreto.

Depois: 26 testes direcionados aprovados, incluindo regressões anteriores de persistência, recuperação de cache e página do Diário. Resultado da suíte completa/build registrado em `specs/loops/conflito-publicacao-loop.md`.
