# Revisão da plataforma imersiva V2 — 24/11/2026

Commit revisado: `fe7976c`, confirmado no remoto e com deployment Vercel concluído. Preservados os cinco arquivos paralelos de revisão ENEM/autenticação. Reexecutei testes direcionados: 10 arquivos/58 testes e 3 arquivos/54 testes aprovados (112 no total, incluindo 24 anteriores e 88 do incremento V2). Suíte integral, lint e build constam no relatório do Antigravity; não foram reexecutados nesta revisão econômica.

## P2 — classificação audiovisual não corresponde ao resultado real de jogos existentes

Local principal: `frontend/src/components/aula-gamificada/audiovisual/ProvedorAudiovisualSala.jsx`, função `derivarContextoAudiovisual`. A projeção real de `frontend/src/dominio/aula-gamificada/sala.js` só adiciona `recibo.correta` para múltipla escolha em Natação e Acerte ou Perde. Quiz, Equipes e Tabuleiro recebem resposta/pontos, mas não esse booleano.

O helper atual trata qualquer pontuação positiva sem booleano como `parcial` e zero sem booleano como `sem_resposta`. Resultado reproduzido após a revelação:
- Quiz, Equipes e Tabuleiro: resposta correta/1000 pontos → `parcial`, em vez de `acerto`.
- Mesmas modalidades: alternativa errada enviada/0 pontos → `sem_resposta`, em vez de `erro`.
- Acerte aberto com recibo enviado e correção pendente → `sem_resposta` no contexto audiovisual. A interface nova tem uma proteção local que já mostra a mensagem de correção pendente, mas o contexto de áudio continua incorreto; não confundir este achado com ausência daquela mensagem visual.

Isso impede a celebração correta solicitada e confunde erro com ausência de participação. Não é erro no cálculo de notas: corrigir classificação/feedback sem mudar pontuação persistida ou resultados pedagógicos.

## Regressões independentes preserváveis

`tests/unit/revisao_v2_feedback_resultado_real.test.js`: sete casos RED, executando a cadeia real `projetarEstado → normalizarEstadoSala → derivarContextoAudiovisual`, sem inventar `recibo.correta` no mock. Log local: `/tmp/rd-v2-feedback-red.log`. Todos falham pelos resultados acima, não por ambiente/importação.

## Correção solicitada ao Antigravity

1. Derivar o resultado apenas após revelação/resultado confirmado. Usar o contrato real de recibo, tipo da questão e gabarito já público; não antecipar acerto, não classificar qualquer ponto positivo como acerto e não inventar booleanos só nos testes.
2. Distinguir explicitamente acerto integral, parcial real, erro respondido, sem resposta e correção manual pendente. Cobrir também Memória, Associação, Ordenação, Heróis, Natação e Acerte: parciais devem continuar parciais, pending não deve disparar efeito de erro/ausência e telão deve preservar feedback coletivo neutro quando apropriado.
3. Preservar idempotência audiovisual em polling/reconexão/retry/StrictMode e preferências de áudio/movimento. Não enfraquecer testes existentes nem alterar os sete casos recebidos para aprovar.
4. Rodar direcionados incluindo esta regressão, depois suíte integral/lint/build em cópia isolada; atualizar relatório com evidências e hash. Publicar a correção apenas após validações aprovadas, sem incluir alterações paralelas alheias.

Os testes existentes da nova jornada/controles/áudio passaram. Esta pendência específica impede declarar toda a atualização de feedback dos nove jogos aprovada.
