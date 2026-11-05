# Paleta geral — petróleo e sálvia

> **Superssão (05/11/2026):** a decisão posterior do usuário aplica a paleta "Arte em jogo"
> (roxo festival: #6315D9 / #25104A / #FFFDF7 / #F3EDFF / acentos #00DDEB, #FFE500, #FF2D93,
> #B9EF00) a **todo o site**, substituindo a identidade petróleo/sálvia desta especificação.
> Contrato atual: `PALETA_ARTE_EM_JOGO_SPEC.md`. Esta página permanece como histórico e como
> fonte das preservações (cores de nota RN-18, disciplinas, imagens, terceiros) e das
> exigências de contraste/auditáveis que seguem herdadas. Testes que exigem os hexes
> petróleo/sálvia (`paleta_petroleo_salvia.test.js`, `padrao_visual_redacao.test.js`,
> `paleta_superficies_escuras.test.js`) ficam entregues para revisão explícita do usuário.

Exceção posterior expressa (04/11/2026): telas do novo aulão Revisão ao Vivo adotam identidade vibrante própria, conforme `REVISAO_VISUAL_VIBRANTE_SPEC.md`. Autorização não muda cores de notas nem os demais módulos. Não altera automaticamente testes globais; qualquer conflito deve ser revisado explicitamente.

Data: 04/11/2026. Escolha e escopo aprovados pelo usuário. Fonte de design: `docs/plans/2026-11-04-paleta-petroleo-salvia-design.md`.

## Aceite

- PV-01: todos os elementos da interface própria adotam os tons aprovados; não apenas ações ou tokens globais. Fundos/gradientes, menus, cards, textos, ícones, bordas, sombras e estados entram no escopo.
- PV-02: estrutura, tipografia, dimensões, responsividade, animações, fluxos e dados permanecem. Diff de produção limita-se a valores/referências de cor; nada de redesign.
- PV-03: as cores que significam nota/classificação permanecem iguais no Diário, Portal, Analytics, Redação e exportações. Preservar vermelho/azul/verde, ausência neutra, zero e critérios atuais. Não substituir cegamente toda classe `blue-*`, `green-*` ou `red-*`.
- PV-04: pares de texto/fundo de uso comum atingem contraste mínimo de 4,5:1. Verificar também hover, foco, disabled, superfícies claras e fundo escuro; não declarar acessibilidade integral apenas por testar pares sólidos.
- PV-05: as cores antigas de marca não permanecem em estados alternativos. Exceções encontradas devem ser listadas e classificadas como nota, conteúdo do usuário ou imagem; cores de dados não devem ser alteradas por busca/substituição global.
- PV-06: imagens didáticas, fotos, conteúdos/cores personalizados salvos e dados não são modificados. Nenhuma migração.
- PV-07: testes anteriores preservados, exceto as expectativas literais de cor expressamente autorizadas pelo usuário nesta continuação. Acrescentar teste novo de contrato/contraste dos tokens e exercitar os testes já existentes das notas. Executar suíte e build do pacote publicável e lint dos arquivos alterados.
- PV-08: evidência visual com componentes reais/dados sintéticos, mesma estrutura antes/depois, em 390/1440. Cobrir landing/Hub, Diário/Portal com notas vermelha/azul/verde/sem nota, Agentes com diálogo, Calendário/Horário, Redação e Adaptadas. Para exportadores alterados, renderizar amostra e conferir cores das notas/paginação.
- PV-09: não publicar nem editar para acomodar a paleta o logout ainda reprovado. A execução deve partir de checkout isolado publicado e entregar diff exclusivo de cores para revisão.

## Testes mapeados antes da implementação

- Novo: `tests/unit/paleta_petroleo_salvia.test.js`, com contrato de tokens e cálculo independente do contraste nos pares usados; RED antes de mudar produção.
- Existente: `tests/unit/nota_bimestral_cores.test.js` — limiares, configuração, zero e ausência permanecem.
- Existente: `tests/integration/boletim_faixa_bimestral.test.js` — cores bimestrais do boletim.
- Existente: `tests/unit/components/analytics/AnalyticsMediaCor.test.jsx` — média de notas mantém significado.
- Existente: `tests/contract/sabiazinho_payload.test.js` e demais testes de domínio/integração continuam intactos, pois não há mudança de provedor/negócio.

RN-50: a autorização posterior do usuário substitui somente os valores/identidade antigos do trecho visual de Redação. Atualizar o texto da regra na implementação sem alterar sua tipografia ou regras de negócio. RN-18 continua vigente.


## Continuação após limite do executor — 04/11/2026

Aceite complementar em `tests/unit/paleta_complemento.test.js`: nenhum gradiente rosa/azul nos planos da landing; conexão de IA usa somente a nova identidade em seus estados; exportadores não deixam cores RGB rosas antigas em faixas/pareceres. A auditoria estrutural compara código-base e entrega ignorando somente cor, sem ignorar geometria/comportamento. Três testes existentes tiveram expectativas literais de marca ajustadas pelo executor; o usuário autorizou expressamente esses ajustes, sem alterar outras verificações.


Autorização expressa recebida nesta continuação: ajustar somente expectativas de cor dos testes para a nova marca, preservando verificações de notas, dados, margens e paginação. O inventário de cores não deve proibir as exceções de notas: `critico` em DistribuicaoChart e legenda “Abaixo do mínimo” em ComparativoTurmasChart mantêm o rosa/vermelho original por representarem faixa de desempenho, não marca. Testes PV-13/PV-14 cobrem sua preservação.

PV-15: logotipo e destaques sobre superfícies petróleo usam sálvia clara (#B7D3C8), mantendo contraste; teste novo `paleta_superficies_escuras.test.js`. Na inspeção de telas escuras, não basta substituir o rosa pelo petróleo usado nos fundos claros.
