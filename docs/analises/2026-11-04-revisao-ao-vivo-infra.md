# Revisão ao Vivo — levantamento de infraestrutura

Data: 04/11/2026. Levantamento, não homologação de capacidade ou implementação de sala.

## Evidência local

- Next.js 16.2.9/React 19.2.4, Firebase SDK 12.15.0/Admin 14.4.0 já instalados.
- Professor usa Firebase Auth; aluno usa cookie HttpOnly assinado, validado em `lib/aluno/session.js`. Esse cookie não autoriza automaticamente leitura por listener do SDK Firestore.
- Consulta somente dos nomes de variáveis de produção (`vercel env ls production`): credencial administrativa/Firebase já configurados; não foi encontrada configuração de Redis/broker realtime. Nenhum valor foi impresso, adicionado ou modificado. Isso não prova inexistência de serviços fora dessa configuração.
- Usuário mantém plano Firebase atual e recusou ativar Blaze. Não habilitar cobrança ou contratar broker automaticamente.

## Caminhos possíveis

1. **Firestore realtime com leitura estritamente autorizada e API para comandos/respostas:** usa infraestrutura existente; exige resolver identidade discente sem alterar a sessão docente, regras novas restritas e reconexão. Publicar apenas estado autorizado; recibos individuais e dados de professor separados. Custos de leitura/fanout e orçamento disponível precisam de ensaio.
2. **WebSocket Vercel + armazenamento/pubsub externo:** Vercel oferece WebSocket, mas instâncias não compartilham memória e reconexão pode chegar a outra instância. É necessário armazenamento externo coordenado, configuração ainda não demonstrada no projeto e avaliação de plano/custo.
3. **Polling HTTP curto por aluno com leitura de banco em toda consulta:** simples para protótipo; não recomendado como solução de máxima capacidade, pois multiplica requisições/leituras durante toda aula.

Próximo ensaio recomendado: testar autorização, reconexão e orçamento de operações da opção 1 em ambiente isolado. Não emitir token Firebase novo sem desenho de escopo/expiração/revogação e aplicação separada para não substituir o login docente no mesmo navegador. Não implementar regras permissivas como atalho.

Não foi escolhido/adotado transporte de produção, feita carga contra Firebase/Vercel ou prometido limite simultâneo. Frontend em memória com centenas de nomes não mede conexões. APIs/rules críticas exigem revisão independente antes de publicação.

## Referências oficiais

- https://vercel.com/docs/functions/websockets — persistência externa e reconexão entre instâncias.
- https://firebase.google.com/docs/firestore/quotas — quotas de operações; o orçamento é compartilhado com o produto atual.
- https://firebase.google.com/docs/firestore/pricing — leituras de listeners e reconexões participam do custo.

As referências foram consultadas durante o planejamento do módulo. Números de capacidade devem vir de ensaio e plano real, não de um limite teórico isolado da documentação.
