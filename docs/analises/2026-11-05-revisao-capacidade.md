# Revisão ao Vivo — ensaio isolado de integridade e capacidade

Data: 05/11/2026. Resultado: **integridade aprovada; cenário progressivo de respostas únicas e transporte em memória com cem streams SSE aprovados no emulador local**. O estresse de duzentos envios simultâneos, com duplicatas concorrentes, preserva integridade e excede a meta proposta de p95 ≤ 2 s. Não há homologação em produção, Vercel ou Wi-Fi escolar.

## Ambiente e execução

- macOS Darwin arm64, processo local de testes Node/Vitest 4.1.11.
- Firestore Emulator 1.21.0, Java Temurin JRE 21.0.13+9 temporário. Distribuição oficial Adoptium, download HTTPS e SHA256 conferido antes da extração; nenhuma instalação de sistema.
- Endpoint exclusivo de loopback `127.0.0.1:8788`. Projeto `demo-revisao-capacidade`, separado do `demo-revisao` utilizado no ensaio do adaptador para evitar colisões. Nenhuma credencial de produção necessária e nenhuma escrita em banco real.
- Duas instâncias independentes de `RevisaoService`, dois `FirestoreRevisaoStore` e dois clientes Admin no mesmo projeto do emulador, em um processo de teste. Isso demonstra compartilhamento persistente entre clientes; **não equivale a dois servidores HTTP/processos independentes**.
- Questões, professor, turma, vínculos e cem estudantes são sintéticos, criados pela fixture `tests/helpers/revisaoCenario`. Os documentos do ensaio são removidos ao final.
- Relógio das regras de prazo é sintético e controlado. Latências são medidas com `performance.now()` real. A rodada não vence durante a rajada por tempo de relógio de parede; o limite de prazo é verificado separadamente.

Executar a partir de `frontend/`, com o emulador já ativo:

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8788 npx vitest run ../tests/integration/revisao_capacidade_emulador.test.js --maxWorkers=1
```

O teste é explicitamente ignorado quando o host de emulador local não está definido. Um host remoto nunca ativa este ensaio.

Comando do emulador usado nesta sessão:

```sh
/Users/kelsopalheta/.codex/tmp/revisao-integracao/jdk-21.0.13+9-jre/Contents/Home/bin/java -jar /Users/kelsopalheta/.cache/firebase/emulators/cloud-firestore-emulator-v1.21.0.jar --host 127.0.0.1 --port 8788 --project_id demo-revisao
```

O mesmo endpoint permite projetos demo separados. O projeto efetivo do teste é escolhido explicitamente pelos dois clientes Admin. O SDK emitiu `MetadataLookupWarning` de descoberta de ambiente; o endpoint do Firestore permaneceu o emulador local.

## Cenário e verificações

Cem alunos entram na sala; duas instâncias disputam o mesmo comando docente com a mesma revisão e rodada. Apenas um comando avança e o outro recebe conflito 409. Cada aluno envia a mesma alternativa duas vezes, em uma rajada de **200 operações simultâneas**, distribuída pelas duas instâncias. Cinquenta respostas são corretas e cinquenta erradas.

Verificações aprovadas:

- 200 operações retornam confirmação; cada par do mesmo aluno recupera o mesmo recibo.
- Exatamente 100 respostas persistidas e 100 participantes; soma de pontos 50.000, com exatamente 1.000 ou zero por aluno conforme a alternativa. Nenhum ponto ou recibo duplicado.
- Respostas não alteram o documento compartilhado da sala nem a publicação comum da rodada.
- Nova instância do serviço recupera o recibo aceito sem depender da memória do serviço anterior.
- Projeção discente não contém comentários antecipados nem dados de participação coletiva.
- Tentativa de trocar alternativa aceita é recusada com 409.
- Revogação persistida do vínculo bloqueia consulta e repetição da resposta com 403.
- Ranking preserva os cem participantes e a posição compartilhada pelos cinquenta empatados em primeiro.
- Na segunda rodada, resposta que chega no instante do prazo é recusada com 409; não cria novo recibo.

## Métricas registradas

A primeira execução aprovou a integração em 26,03 s, mas a saída de `console.info` não foi capturada. A execução seguinte repetiu os mesmos critérios com saída explícita de métricas e aprovou em 18,74 s, incluindo preparação, verificações adicionais e limpeza.

| Medida da rajada, segunda execução | Resultado |
| --- | ---: |
| Participantes distintos | 100 |
| Instâncias de serviço / clientes Admin | 2 / 2 |
| Operações concorrentes, incluindo duplicatas | 200 |
| Recibos persistidos | 100 |
| Tempo total da rajada | 6.894 ms |
| p95 de confirmação por operação | 6.647 ms |
| Maior latência | 6.893 ms |
| Pontuação total | 50.000 |
| Perda ou duplicação de recibo/pontos confirmados | 0 |

O p95 considera a chamada completa de `RevisaoService.responder`, incluindo transação, bloqueios/retries e retorno, até o recibo ser confirmado. Não inclui HTTP, autenticação de rota, SSE, latência de internet ou renderização do celular. A duplicação simultânea é deliberada; é uma condição de pressão maior que uma resposta única por aluno.

## Limites e próximo portão

O p95 de **6.647 ms excede a meta proposta de 2.000 ms** no cenário de duzentos envios duplicados simultâneos. Os asserts de integridade não foram reduzidos nem alterados para encobrir esse resultado. Havia validação geral concorrente na máquina nessa etapa, e o cenário também provoca disputa/retry no mesmo documento de participante; as duas condições impedem atribuir a lentidão exclusivamente ao número de alunos. O ensaio progressivo dedicado abaixo separa a operação normal dessa condição de estresse.

Nos ensaios diretos de serviço acima não foram medidos cem streams SSE simultâneos; o ensaio complementar abaixo cobre esse ponto com Request/Response WebAPI. Permanecem sem medição: latência de atualização do projetor, expiração/reconexão em massa dos streams, aula de duração prolongada, custos/quotas de produção, dois processos de aplicação separados, desempenho no deploy ou Wi-Fi escolar. O teste do adaptador possui um listener real e seu cancelamento, mas esse fato não substitui o ensaio completo de transporte.

Antes de anunciar capacidade: medir cenários progressivos com conexões reais e duas instâncias HTTP, localizar o custo das leituras/transações e da contenção, testar rajada ao final da rodada com relógio real e selecionar um limite com margem somente depois de cumprir latência e integridade. Nenhuma mudança de plano Firebase, dependência npm, carga ou escrita de produção foi feita nesta tarefa.


## Ensaio progressivo dedicado — uma resposta por aluno

Após a conclusão do build e sem outra suíte/lint/build simultânea informada pela coordenação, foi executado `tests/integration/revisao_progressivo_emulador.test.js` com níveis sequenciais de 25, 50 e 100 participantes. Cada nível usa um projeto demo próprio (`demo-revisao-unicos-25`, `demo-revisao-unicos-50`, `demo-revisao-unicos-100`) no mesmo emulador; cem alunos não reutilizam os documentos dos níveis menores. Duas instâncias de serviço e dois clientes Admin operam em cada nível. O relógio de prazo permanece controlado, como no ensaio de estresse.

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8788 npx vitest run ../tests/integration/revisao_progressivo_emulador.test.js --maxWorkers=1
```

| Alunos / respostas únicas | Recibos | Total da rajada | p95 | Máximo | Meta p95 ≤ 2 s |
| --- | ---: | ---: | ---: | ---: | --- |
| 25 | 25 | 110 ms | 110 ms | 110 ms | Aprovada localmente |
| 50 | 50 | 197 ms | 197 ms | 197 ms | Aprovada localmente |
| 100 | 100 | 317 ms | 317 ms | 317 ms | Aprovada localmente |

Os três testes passaram em 5,75 s, incluindo preparação e limpeza. Todos os alunos responderam corretamente; cada nível persistiu exatamente um recibo por aluno e total de `alunos × 1.000` pontos. As métricas de respostas individuais foram obtidas com `performance.now()` na chamada completa ao serviço; os valores arredondados iguais de p95/total/máximo refletem a conclusão concentrada da rajada, não amostragem de uma única operação.

**Maior nível que cumpriu o critério medido: cem participantes.** Isso sustenta manter **cem como teto de piloto local condicionado**, com margem de latência no cenário de respostas únicas. Esse ensaio de serviço, isoladamente, não demonstra cem conexões SSE/HTTP, dois processos servidores, duração de aula ou Wi-Fi escolar; o teste complementar abaixo acrescenta o BFF e cem streams locais. O estresse com duplicatas continua sendo evidência de robustez/idempotência, e sua latência elevada não deve ser omitida. Não há garantia de cem participantes em produção até os portões de transporte e rede descritos acima.


## Transporte complementar — cem streams e POSTs autenticados

`tests/integration/revisao_transporte_100_emulador.test.js` executa dois `criarHandlerRevisao`, dois serviços e dois clientes Firestore independentes, no projeto isolado `demo-revisao-sse-100`. Os handlers são chamados por `Request`/`Response`/`ReadableStream` WebAPI no mesmo processo: **não há servidor TCP, navegador, proxy, Vercel ou Wi-Fi nesse teste**. A autenticação usa `criarAcessoRevisao` e cem cookies reais assinados por `signSessionToken`, com `loginKey` de 64 dígitos hexadecimais. Somente a dependência Firebase Auth docente é falsa; os handlers usados pelos alunos verificam os cookies reais e os vínculos persistidos.

Depois da entrada dos cem alunos e abertura da pergunta, o teste abre cem streams simultâneos e aguarda um estado inicial válido em cada um. Com todos os streams já ativos, envia cem POSTs concorrentes pelo handler; cada aluno responde uma vez. Aguarda confirmação individual tanto na resposta POST quanto no SSE e compara os IDs dos recibos nas duas vias.

```sh
FIRESTORE_EMULATOR_HOST=127.0.0.1:8788 npx vitest run ../tests/integration/revisao_transporte_100_emulador.test.js --maxWorkers=1
```

Execução dedicada após a suíte geral terminar, sem build/lint concorrente informado. Um teste aprovado em 5,75 s, incluindo configuração e limpeza. Timeout de 60 s acomoda inicialização do SDK/emulador e cem streams; há prazo interno de 45 s para evitar espera indefinida.

| Medida | Resultado |
| --- | ---: |
| Streams ativos antes dos POSTs | 100 |
| Tempo até todos receberem estado inicial | 547 ms |
| POSTs confirmados / recibos únicos | 100 / 100 |
| Confirmações individuais por SSE | 100 |
| p95 POST, até leitura da confirmação JSON | 279 ms |
| Maior latência POST | 280 ms |
| p95 SSE, desde início do POST até recibo no stream | 379 ms |
| Maior latência SSE | 379 ms |
| Tempo total da rajada e verificações de persistência | 393 ms |
| Pontuação total | 100.000 |

Ambos os p95 ficaram abaixo de 2.000 ms neste ambiente. Todas as cem confirmações SSE corresponderam aos respectivos recibos POST, e o Firestore persistiu cem respostas únicas. Frames iniciais e subsequentes não continham gabarito ou comentários antecipados; o estado discente não expunha participação coletiva. Os streams responderam com `private, no-store` e `text/event-stream`. Ao final, todos os AbortControllers foram abortados, os leitores cancelados e os documentos sintéticos removidos, encerrando os listeners/timers do handler.

O resultado amplia a evidência local para o piloto de cem participantes, sem transformar esse número em capacidade homologada de produção. Ainda faltam rede/TCP, dois processos servidores separados, transporte do deploy, latência do projetor, renovação de conexões de 240 s, revalidação periódica e reconexão em massa durante uma aula completa. O ensaio utiliza relógio de prazo controlado, assim como os anteriores; não substitui a rajada com prazo real. Nenhuma chave, cookie ou token foi impresso nas métricas.
