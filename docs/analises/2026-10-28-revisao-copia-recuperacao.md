# Revisão independente — cópia de recuperação RN-82

Data: 28/10/2026. Base Git: `8a73738`. Entrega recebida como alterações locais ainda não commitadas. **Resultado: não aprovada para publicação**, por três falhas adicionais reproduzidas. Nenhum código de produção ou teste recebido foi alterado nesta revisão.

## Validação executada

- Suíte recebida: `cd frontend && npm test` → **1.045 testes em 223 arquivos aprovados**, exit 0. Inclui 27 testes novos do DeepSeek em quatro arquivos; testes já versionados sem alterações no diff.
- Lint dos seis arquivos de produção desta entrega: exit 0, **zero erros e dois avisos preexistentes de `<img>`** no formulário.
- `NODE_USE_SYSTEM_CA=1 npm run build`: exit 0, compilação e geração de 37 páginas concluídas. Fontes e configuração preservadas.
- Novo arquivo independente `tests/unit/components/atividades/CopiarRecuperacaoRevisao.test.jsx`: **três testes, três falhas**, exit 1. Executado separadamente após a suíte recebida; não somar essas reproduções aos 1.045 aprovados nem declarar a suíte atual integralmente verde.
- Logs locais ignorados: `tmp/revisao-rn82-testes.log`, `revisao-rn82-lint.log`, `revisao-rn82-build.log`, `revisao-rn82-reproducoes.log`.
- Não houve teste no navegador, dado real, chamada paga de IA, deploy ou publicação desta implementação. Os problemas foram reproduzidos em testes de componente com dependências simuladas; a relação com a persistência foi conferida no código.

## O que está bem encaminhado

Prop própria `conteudoInicial` evita tratar origem como edição; caso de uso recarrega origem e destino; IDs da atividade e tokens do destino independentes; criação usa transação RN-81 existente. Os testes recebidos cobrem cópia, preservação, 4+6, concorrência sintética e retry no caso de uso. Extração de `CriacaoConjunto` permite reutilizar o fluxo existente. Essas evidências não cobrem os três desvios de integração abaixo.

## Bloqueios comprovados

### P1 — REV-R82-01: nova versão substitui a conferida, podendo mudar o semestre

`frontend/src/components/atividades/CopiarRecuperacaoModal.jsx:201`: após abrir revisão do destino versão 1/semestre 1, `salvarCopia` relê o destino, passa `versaoEsperada: null` e envia a versão nova ao callback. O teste muda destino para versão 2/semestre 2; o callback é chamado apesar de o formulário ainda informar semestre 1. O pai usa `destino.versao` e `montarAtividadeCopiada` deriva o semestre do destino relido, portanto as proteções da transação recebem a versão nova, sem detectar que ela não foi conferida.

Impacto: conteúdo confirmado para um semestre pode ser salvo em outro sem nova decisão docente. A transação protege mudanças posteriores à releitura, mas não protege o snapshot visto pelo professor.

Correção: preservar versão/contexto efetivamente conferidos e compará-los à leitura autoritativa no salvamento, recusando divergência com `RECUPERACAO_COPIA_DESTINO_OBSOLETO`. Permitir idempotência de operação já gravada idêntica sem confundir retry com nova autorização. Não simplesmente renovar versão e repetir escrita.

### P2 — REV-R82-02: pré-validação da tela impede retry idempotente após fechar 10

`CopiarRecuperacaoModal.jsx:204`: a tela valida saldo antes de chamar o caso de uso. Se a primeira criação confirmou no banco e a resposta se perdeu, o conjunto já consumiu os pontos. No teste, 6 existentes + cópia 4 fecham 10; repetir a operação recebe `RECUPERACAO_COPIA_SALDO_INSUFICIENTE`, sem chegar ao callback de idempotência.

O caso de uso tenta reconhecer gravação após exceção, o que reduz a ocorrência; porém, se a releitura de confirmação também falhar, o erro retorna à tela e a repetição fica bloqueada. O teste simula essa falha de confirmação pelo callback; não simula indisponibilidade de rede real.

Correção: mesma operação/ID precisa chegar à verificação de cópia existente e conteúdo idêntico antes de recusar saldo/versão por seu próprio commit. Não ignorar congelamento/versão para uma atividade nova nem sobrescrever cópia com conteúdo diferente. Manter snapshot/regras de REV-R82-01.

### P2 — REV-R82-03: destino é excluído antes de permitir revisar a pontuação

`frontend/src/dominio/atividades/copiarRecuperacao.js`, `avaliarDestinosCopia`, e `CopiarRecuperacaoModal.jsx:191`: elegibilidade e abertura de revisão exigem que os pontos originais caibam no saldo. Origem de 4 pontos e destino com saldo 3 fazem desaparecer “Revisar conteúdo e prazo”. Isso impede reduzir a parcela para 3 no formulário, possibilidade prevista na RN-82.

Correção: separar elegibilidade estrutural de validação da pontuação final. Destino próprio válido com saldo positivo pode abrir revisão com aviso de ajuste necessário. Bloquear salvamento até soma das questões/pontos caber no saldo revalidado. Destino sem saldo, cancelado, congelado ou inválido continua indisponível; não liberar excesso.

## Pendências adicionais da entrega

- Não foram entregues atualização do guia nem evidências de navegador 390/1440 px. Testes DOM de foco não substituem inspeção visual. Requerer após corrigir os bloqueios.
- Entrada “Novo prazo” usa texto livre com placeholder técnico; preferir seletor de data/hora e validação antes de abrir revisão. Não substituir prazo inválido por data padrão silenciosamente.
- Guardas de contexto/conta e acessibilidade completa permanecem sujeitas a conferência integrada. Não inferir homologação de leitor de tela por `aria-modal`.
- Os cinco achados anteriores de PDF/apresentação da RN-81 continuam independentes e pendentes.

## Prompt para DeepSeek/OpenCode

```text
Corrija a entrega RN-82 em /Users/kelsopalheta/Developer/RotinaDocente.
Leia AGENTS.md, specs/RULES.md (RN-81/RN-82), specs/TESTS_SPEC.md, docs/plans/2026-10-28-copiar-recuperacao-outra-turma.md e docs/analises/2026-10-28-revisao-copia-recuperacao.md.

Não altere/remova nenhum teste recebido ou da revisão. Preserve o novo arquivo local tests/unit/components/atividades/CopiarRecuperacaoRevisao.test.jsx e faça seus três testes passarem corrigindo produção.

1. REV-R82-01: no modal, preservar versão/contexto conferidos. Se o destino mudar durante revisão, recusar nova criação com RECUPERACAO_COPIA_DESTINO_OBSOLETO e pedir nova conferência. Não renovar silenciosamente a versão nem salvar em semestre diferente. Cobrir no caso de uso + UI, incluindo mudança de semestre/destinatários/saldo.
2. REV-R82-02: retry do mesmo ID/conteúdo após commit confirmado e resposta/checagem perdidas deve alcançar idempotência antes da recusa por saldo/versão do próprio commit. Testar 6+4 fechando 10, inclusive primeira tentativa com erro de confirmação. Nenhum novo token, ponto ou histórico duplicado. Não contornar proteção de novas operações ou editar cópia existente diferente.
3. REV-R82-03: permitir revisar origem 4 para destino com saldo 3, ajustando questões/pontuação antes de salvar. Separar elegibilidade estrutural da conferência final do orçamento. Manter saldo zero/cancelado/congelado/conta alheia indisponíveis. Continuar recusando excesso na transação.

Arquivos principais: CopiarRecuperacaoModal.jsx, dominio/atividades/copiarRecuperacao.js, aplicacao/atividades/copiarRecuperacao.js e integração em RecuperacaoSemestral.jsx. Cuidado para não usar initialData para criar cópia nem mudar fórmula/lançamento/autorização. Não mexer em imagens/armazenamento/plano Firebase ou nos achados PDF RN-81.

Usar campo de data/hora amigável, recusando prazo inválido em vez de trocar silenciosamente pela data padrão. Acrescentar testes novos para os caminhos faltantes, sem enfraquecer anteriores. Rodar reproduções, suíte completa, lint e build. Fazer ensaio sintético em navegador 390/1440, conferir foco/teclado e registrar evidências/limites. Atualizar guia/specs apenas com o realmente validado. Não usar dados reais ou chamada paga de IA. Não fazer deploy/push antes da nova revisão independente aqui. Entregar resumo dos arquivos, testes e resultados.
```

## Publicação desta revisão

Somente documentação desta avaliação pode ser commitada nesta rodada. Implementação recebida e teste independente permanecem locais para correção pelo DeepSeek. Nenhum teste anterior foi alterado para obter aprovação; o código ainda tem falhas conhecidas.
