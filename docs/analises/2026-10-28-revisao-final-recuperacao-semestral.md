# Revisão técnica final — recuperação semestral RN-81

**Implementação examinada:** `75f5dd6a117565023368211faff6a11a2feb9469`.
**Resultado:** revisão técnica aprovada para os bloqueios reproduzidos nas três rodadas anteriores. A homologação em sessão real permanece separada e pendente.

## Evidência independente de 28/10/2026

- `cd frontend && npm test`: **1.018 testes em 219 arquivos aprovados**, exit 0. Inclui as reproduções das três revisões e os cenários adicionais de concorrência, congelamento, reservas, acesso, correção e lançamento.
- Lint dos arquivos JS/JSX de produção alterados desde `f582906`: **0 erros, 2 avisos preexistentes de `<img>`**, exit 0.
- `NODE_USE_SYSTEM_CA=1 npm run build`: **exit 0**, compilação e geração das páginas concluídas.
- Comparação de `tests/` desde `f582906`: apenas arquivos adicionados; nenhum teste anterior modificado ou removido.
- Nenhum código de produção, teste, nota ou dado real foi alterado nesta revisão. Esta entrega apenas registra evidências, atualiza contratos documentais e acrescenta o guia de uso.

## Fluxos conferidos

1. **Montagem 4+6:** primeira parcela permanece em rascunho e não aceita entrega; completar 10 libera ambas na mesma transação. Entrega congela composição; correção e lançamento seguem separados. Atividade única de 10 também é coberta.
2. **Atividade adaptada:** pode compor a distribuição sem criar bimestre falso; pontos da parcela são distribuídos nas questões e o período semestral é transportado no histórico.
3. **Concorrência:** orçamento, versão e composição são lidos/gravados transacionalmente. A entrega escreve o marcador de congelamento no documento lido pela edição. Os testes sintéticos exercitam ambas as ordens e retry.
4. **Preservação:** cancelamento repetido não apaga reserva de conjunto novo; mudanças após entrega são recusadas; recuperação diferente exige confirmação; idempotência não impede ajuste confirmado após edição manual. Snapshot da prévia inclui parcelas e estados.
5. **Notas:** recuperação continua em `rec1`/`rec2`, sem soma direta ao semestre, mantendo pesos 2/3 e aprovação 25/25/50. Sincronização bimestral não inclui recuperação.

## Limites da aprovação

- Testes de concorrência usam banco sintético; não houve execução em Firestore real/emulador nesta revisão.
- Não houve login no ambiente publicado, envio/correção com conta real, chamada real de IA, PDF renderizado ou homologação visual em 390/1440 px/leitor de tela nesta rodada. Testes de componentes não substituem essas verificações.
- A leitura legada sem `escalas` mantém compatibilidade declarada; grupos novos têm controle de montagem. Consultas legadas e clientes antigos durante a implantação continuam exigindo cuidado operacional.
- O commit `75f5dd6` já estava em `origin/master` ao iniciar a revisão. Isso confirma publicação do código no Git; não confirma deploy, versão servida pelo Vercel ou execução bem-sucedida no ambiente publicado.

Guia operacional: `docs/guias/recuperacao-semestral.md`. Próxima homologação: montar um conjunto de teste 4+6, verificar indisponibilidade antes de 10, entregar após liberação, corrigir manualmente/IA, conferir efeito, lançar somente no semestre escolhido e publicar; conferir Portal e PDF com os mesmos valores e feedback, sem usar alunos reais para ensaio.

Atualização posterior: deploy e homologação real executados em 28/10, com aprovação do fluxo manual/Portal e achados de PDF/apresentação. Ver [relatório da sessão real](2026-10-28-homologacao-real-recuperacao-semestral.md). Os limites acima descrevem a revisão técnica original.
