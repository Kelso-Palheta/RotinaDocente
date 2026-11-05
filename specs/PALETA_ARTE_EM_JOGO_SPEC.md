# Paleta global — "Arte em jogo" (roxo festival)

Data: 05/11/2026. Decisão aprovada pelo usuário nesta conversa, inspirada na imagem de referência
"Arte em jogo" (Telão da Turma, Celular do Aluno, Painel do Professor). Esta especificação
**substitui** a identidade petróleo/sálvia de `PALETA_PETROLEO_SALVIA_SPEC.md` para toda a
interface própria, com as preservações explicitadas abaixo. A exceção anterior do módulo
Revisão ao Vivo (`REVISAO_VISUAL_VIBRANTE_SPEC.md`) permanece e não é alterada por esta
migração: seus tokens próprios (#6334E3, #FFE14D, #FF4F9B, #B7F247, #FF8A3D, #54EEF8, família
família de lilás #8B5CF6/#A78BFA/#DDD6FE etc.) continuam válidos naquele módulo.

## Tokens aprovados

| Papel | Valor | Uso |
|---|---|---|
| Roxo principal | `#6315D9` | navegação, botões primários, links, ícones de marca |
| Roxo hover | `#5411B8` | estado hover do primário (≥4.5:1 com branco) |
| Roxo profundo / texto escuro | `#25104A` | superfícies escuras, texto principal, `--navy`/`--ink` |
| Hover profundo | `#180A30` | hover de superfícies profundas |
| Escurecido (overlay/gradiente) | `#160932` | overlays, gradiente final, Toast escuro |
| Gradiente profundo | `#3A1A73` | 2º passo dos gradientes que iam de `#123c3a` a `#1b4d48` |
| Fundo claro | `#FFFDF7` | fundo de página (antes `#ffffff`) |
| Superfície suave | `#F3EDFF` | fundos suaves e áreas de leitura secundárias |
| Chip claro | `#E7DBFD` | destaques/chips de leitura com texto profundo |
| Bordas | `#E2D9F7` | bordas de cards/formulários/glass |
| Texto secundário | `#5B4B86` | texto de apoio (≥6.5:1 nos fundos próprios) |
| Texto terciário/placeholder | `#6E5F94` | placeholders, rótulos discretos (≥4.9:1) |
| Rótulos semibold | `#4A3B7C` | títulos/labels semibold que usavam `#35594D` |
| Lavanda (marca em fundo escuro) | `#B9A6EF` | logo e destaques sobre `#25104A` (≥7:1) |
| Destaque ciano | `#00DDEB` | detalhes (jamais texto sobre fundo claro) |
| Destaque amarelo | `#FFE500` | detalhes (texto `#25104A` quando usada como fundo) |
| Destaque rosa | `#FF2D93` | detalhes (sem texto branco pequeno sobre rosa) |
| Destaque lima | `#B9EF00` | detalhes (texto `#25104A` quando usada como fundo) |

Contraste medido (WCAG 2.1): branco/`#FFFDF7` sobre `#6315D9` = 7,96/7,82; branco sobre
`#25104A` = 16,78; `#25104A` sobre `#FFFDF7`/`#F3EDFF`/`#E7DBFD` = 16,49/14,68/12,74;
`#5B4B86` sobre `#FFFDF7`/`#F3EDFF` = 7,39/6,57; `#6E5F94` sobre `#FFFDF7`/`#F3EDFF` =
5,54/4,93; `#4A3B7C` sobre `#FFFDF7`/`#F3EDFF` = 9,35/8,32; `#B9A6EF` sobre `#25104A` = 7,80;
`#25104A` sobre ciano/amarelo/lima = 10,02/13,15/12,31; branco sobre `#5411B8`/`#180A30`/`#160932` ≥ 9,7.
Todos os pares de texto acima de 4,5:1. As duas acentuações vibrantes só entram como fundo de
insígnia/detalhe com texto `#25104A`, nunca como texto sobre superfícies claras.

## Escopo e preservação

- **Só cores mudam.** Estrutura, tipografia (Manrope/Inter), dimensões, responsividade,
  animações, fluxos, dados, rotas, props e exports permanecem idênticos (PV-02 herdada).
- **Preservado integralmente:** cores de notas/classificação (`coresNota.js`, `dominio/
  analytics/analise.js`, rosas `#f60c49` de `DistribuicaoChart`/`ComparativoTurmasChart`),
  estados semânticos verde/vermelho/âmbar/slate, paleta de disciplinas do Horário Escolar
  (ex.: `#0d9488` Biologia, `#7c3aed` Física), imagens, alto contraste educacional, cores
  personalizadas salvas e marcas de terceiros.
- **Módulo Revisão ao Vivo:** tokens próprios mantidos (caráter festivo). A convergência
  cromática global não reescreve o módulo; o fundo profundo `#25104A` e o ciano `#00DDEB`
  já coincidem por construção.
- **Horário Escolar:** `horario.css` repete os tokens antigos; a migração aplica o mesmo
  mapa. `--danger/--success/--warning/--info` eram alias da cor de marca (comportamento
  pré-existente, sem vermelhos próprios): mantêm-se alias no valor novo; a revisão que
  separar estados semânticos reais é trabalho futuro fora desta entrega.
- **Estados:** hover/disabled/foco preservam as classes existentes; o anel de foco passa a
  usar o roxo `#6315D9`/`#E7DBFD` e continua visível em ambos os temas de superfície.

## Testes

- Novo (RED antes da implementação): `tests/unit/paleta_arte_em_jogo.test.js` — contrato de
  tokens em `globals.css`, ausência dos hexes antigos de marca no código de produção
  (com lista de exclusões autorizadas: módulo Revisão, paleta de disciplinas, cores de nota),
  preservação das cores de nota e cálculo independente de contraste para os pares da tabela.
- Com autorização explícita, atualizar somente expectativas cromáticas nos testes de
  tokens, superfícies escuras, redação e faixas decorativas dos PDFs. Manter verificações
  de fontes, margens, paginação, notas e dados. A varredura AJ-02 preserva a cor da
  nota final no PDF de redação e da média ativa do gráfico, nos usos específicos.
- Rigor herdado: PV-01..09 de `PALETA_PETROLEO_SALVIA_SPEC.md` continuam aplicáveis com os
  valores novos; `paleta_complemento.test.js`, `paleta_notas_preservadas.test.js` e os testes
  de contraste/visual da Revisão não podem falhar por causa desta migração.
