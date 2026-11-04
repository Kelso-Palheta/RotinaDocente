# Identidade visual — petróleo e sálvia

Data: 04/11/2026. Base examinada: `17ade59`. Escolha aprovada pelo usuário: **Petróleo e sálvia**. Correção expressa de escopo: “não mexer no layout” significa preservar a estrutura; **todas as cores do layout entram na nova paleta, exceto as notas**.

## Escopo aprovado

Recolorir integralmente a interface própria do Rotina Docente: landing, entrada/autenticação, Hub, Diário, Portal do Aluno, atividades regulares/adaptadas, Agentes, Calendário, Horário, Redação e Analytics. Inclui fundos, gradientes, navegação, menus, cards, botões/hover/foco/disabled, textos, links, bordas, sombras, ícones decorativos, avisos e estados visuais. Não basta trocar botão rosa ou variáveis globais.

Preservar estrutura/DOM funcional, fontes Manrope/Inter, tamanhos, margens, espaçamentos, distribuição, alturas/larguras, responsividade, animações, fluxos, conteúdo, cálculo e dados. Alterar somente valores de cor e referências a tokens de cor. Estados e avisos mantêm texto, ícones e comportamento identificáveis.

**Exceção: notas.** Preservar vermelho abaixo da aprovação, azul aprovado, verde excelente e neutro sem nota; zero lançado continua válido. A exceção abrange números, badges, cards/resumos, legendas e gráficos quando a cor representa nota/classificação/desempenho de alunos, inclusive dados das competências de Redação, sem alterar 25/25/50, critérios ou limiares. Já a cor decorativa de um gráfico/cartão não vinculada às notas acompanha a marca.

Não recolorir fotos, figuras de livros, imagens geradas de atividades, conteúdo do usuário ou mudar cores salvas por ele em dados; não fazer migração. Em exportadores que compartilham a identidade, somente cores decorativas de marca, preservando cores das notas, dados, paginação, dimensões e margens.

## Paleta

| Papel | Cor |
|---|---|
| Primária, ações e seleção | `#0F766E` |
| Hover primário | `#0B5F59` |
| Títulos/texto forte/navegação escura | `#123C3A` |
| Fundo geral suave | `#F3F7F5` |
| Apoio/sálvia | `#DAEBE5` |
| Realce muito suave | `#F3F8F5` |
| Texto secundário | `#4F6B63` |
| Texto discreto legível | `#566F65` |
| Bordas claras | `#D5E3DC` |
| Superfícies brancas/texto sobre ação escura | `#FFFFFF` |

Gradientes e transparências devem ser derivados desses tons, mantendo posições, paradas e opacidades que afetam a composição. Novos tons não devem reintroduzir rosa, azul-marinho ou outra identidade. Variações tonais precisam ser explicitamente mapeadas e justificadas por legibilidade/estado.

Amostras de contraste calculadas sobre pares sólidos (não equivalem a homologação de todas as telas):

| Texto | Fundo | Contraste |
|---|---|---|
| `#FFFFFF` | `#0F766E` | 5.47:1 |
| `#FFFFFF` | `#0B5F59` | 7.51:1 |
| `#123C3A` | `#F3F7F5` | 11.21:1 |
| `#4F6B63` | `#F3F7F5` | 5.37:1 |
| `#566F65` | `#F3F7F5` | 5.04:1 |

## Integração e legado

A RN-50 ainda fixa a marca antiga rosa/navy no módulo de Redação. A escolha posterior explícita do usuário substitui essa parte da regra; atualizar apenas o trecho visual correspondente na execução, mantendo tipografia e exceções das notas. RN-18 e testes das notas permanecem inalterados.

Pode manter temporariamente nomes CSS legados (`--pink`, `--navy`, classes `btn-brand-*`) como aliases para tokens novos, evitando refatoração desnecessária. Os nomes não autorizam manter valores antigos. O comentário “SimuladoApp Brand Tokens” deve identificar Rotina Docente. Não alterar conteúdo/links comerciais por causa da troca de cor.

Há 97 arquivos com ao menos uma ocorrência do conjunto inicial de cores antigas. Isso é um inventário inicial, não uma lista de substituição cega: cada uso precisa ser classificado como marca, nota ou conteúdo/dado preservado. Buscar também cores Tailwind, gradientes e variações não abrangidas pelo padrão.

## Execução e publicação

Implementação visual delimitada adequada ao DeepSeek/OpenCode. Revisão final aqui, especialmente para assegurar que as cores das notas e a estrutura foram preservadas. Não iniciar tarefa externa automaticamente. Nesta etapa foram criados somente design/spec/plano/prompt; site ainda não foi recolorido.

O checkout tem logout de Atividades não aprovado. Implementar cores em checkout isolado da base publicada `17ade59` (ou base publicada posterior conferida), sem copiar o logout pendente. Não resetar ou publicar trabalho alheio. Antes de enviar, validar testes, lint dos alterados, build e amostras visuais dos módulos; revisão e commit/push somente do escopo aprovado.
