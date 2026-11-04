# Paleta geral — petróleo e sálvia

Data: 04/11/2026. Escolha e escopo aprovados pelo usuário. Fonte de design: `docs/plans/2026-11-04-paleta-petroleo-salvia-design.md`.

## Aceite

- PV-01: todos os elementos da interface própria adotam os tons aprovados; não apenas ações ou tokens globais. Fundos/gradientes, menus, cards, textos, ícones, bordas, sombras e estados entram no escopo.
- PV-02: estrutura, tipografia, dimensões, responsividade, animações, fluxos e dados permanecem. Diff de produção limita-se a valores/referências de cor; nada de redesign.
- PV-03: as cores que significam nota/classificação permanecem iguais no Diário, Portal, Analytics, Redação e exportações. Preservar vermelho/azul/verde, ausência neutra, zero e critérios atuais. Não substituir cegamente toda classe `blue-*`, `green-*` ou `red-*`.
- PV-04: pares de texto/fundo de uso comum atingem contraste mínimo de 4,5:1. Verificar também hover, foco, disabled, superfícies claras e fundo escuro; não declarar acessibilidade integral apenas por testar pares sólidos.
- PV-05: as cores antigas de marca não permanecem em estados alternativos. Exceções encontradas devem ser listadas e classificadas como nota, conteúdo do usuário ou imagem; cores de dados não devem ser alteradas por busca/substituição global.
- PV-06: imagens didáticas, fotos, conteúdos/cores personalizados salvos e dados não são modificados. Nenhuma migração.
- PV-07: testes anteriores intocáveis. Acrescentar teste novo de contrato/contraste dos tokens e exercitar os testes já existentes das notas. Executar suíte e build do pacote publicável e lint dos arquivos alterados.
- PV-08: evidência visual com componentes reais/dados sintéticos, mesma estrutura antes/depois, em 390/1440. Cobrir landing/Hub, Diário/Portal com notas vermelha/azul/verde/sem nota, Agentes com diálogo, Calendário/Horário, Redação e Adaptadas. Para exportadores alterados, renderizar amostra e conferir cores das notas/paginação.
- PV-09: não publicar nem editar para acomodar a paleta o logout ainda reprovado. A execução deve partir de checkout isolado publicado e entregar diff exclusivo de cores para revisão.

## Testes mapeados antes da implementação

- Novo: `tests/unit/paleta_petroleo_salvia.test.js`, com contrato de tokens e cálculo independente do contraste nos pares usados; RED antes de mudar produção.
- Existente: `tests/unit/nota_bimestral_cores.test.js` — limiares, configuração, zero e ausência permanecem.
- Existente: `tests/integration/boletim_faixa_bimestral.test.js` — cores bimestrais do boletim.
- Existente: `tests/unit/components/analytics/AnalyticsMediaCor.test.jsx` — média de notas mantém significado.
- Existente: `tests/contract/sabiazinho_payload.test.js` e demais testes de domínio/integração continuam intactos, pois não há mudança de provedor/negócio.

RN-50: a autorização posterior do usuário substitui somente os valores/identidade antigos do trecho visual de Redação. Atualizar o texto da regra na implementação sem alterar sua tipografia ou regras de negócio. RN-18 continua vigente.
