# Acervo de Arte do ENEM — Revisão ao Vivo

**197 questões únicas, 124 imagens, 2009–2025. Nenhuma questão liberada para uso em sala.** Consulta técnica: 05/11/2026. O acervo continua **parcial**: representar todos os anos não demonstra levantamento de todas as questões de Arte.

## Cobertura catalogada

| Ano | Únicas | Regular | PPL | Reaplicação |
| --- | ---: | ---: | ---: | ---: |
| 2009 | 4 | 4 | 0 | 0 |
| 2010 | 9 | 5 | 4 | 4 |
| 2011 | 5 | 5 | 0 | 0 |
| 2012 | 8 | 4 | 4 | 4 |
| 2013 | 9 | 5 | 4 | 4 |
| 2014 | 17 | 7 | 5 | 5 |
| 2015 | 13 | 7 | 6 | 6 |
| 2016 | 18 | 6 | 5 | 7 |
| 2017 | 16 | 7 | 9 | 9 |
| 2018 | 14 | 5 | 9 | 9 |
| 2019 | 11 | 7 | 4 | 4 |
| 2020 | 8 | 6 | 2 | 2 |
| 2021 | 9 | 6 | 3 | 3 |
| 2022 | 11 | 6 | 5 | 5 |
| 2023 | 15 | 8 | 7 | 7 |
| 2024 | 14 | 8 | 6 | 6 |
| 2025 | 16 | 11 | 0 | 5 |

As colunas de aplicação não devem ser somadas: várias questões são compartilhadas. A identidade é única, com referências específicas por caderno, número impresso e página do PDF. Em 2017, nove questões do caderno PPL também aparecem no caderno azul da reaplicação, com numeração diferente; as referências foram associadas sem duplicar os registros.

Os seis IDs legados `enem-2025-reaplicacao-d3-*` pertencem à aplicação **regular regional de Belém/Ananindeua/Marituba**, identificada em `edicao`. Permanecem estáveis; não inferir modalidade pelo ID. A reaplicação nacional é D5.

## Revisão e imagens

Todas as questões permanecem `rascunho`, com `revisao.explicacoes: false`. Nenhuma conferência técnica foi convertida em revisão docente. A elegibilidade exige status `revisada` e as quatro verificações verdadeiras, com validação no servidor. Textos recuperados por OCR, transcrições e explicações exigem leitura docente antes do uso.

Figuras são recortes dos PDFs oficiais, sem recriação por IA. Foram corrigidos 55 recortes que confundiam CropBox com MediaBox. As figuras das alternativas visuais de 2010/102, 2016 PPL/111 e 2017/21 têm descrições que identificam as alternativas. A resolução do documento de origem limita a qualidade disponível; não houve reconstrução artificial de detalhes. Os arquivos continuam privados, fora de `public/`; o servidor deve autorizar sua entrega sem expor os gabaritos.

## Rastreabilidade

- `fontes.json`: 51 entradas, regular/PPL/reaplicação para cada ano; 46 catalogadas, 3 não localizadas e 2 pendentes. Catalogada não significa completa.
- `curadoria.json`: hashes SHA-256 de prova e gabarito de 34 cadernos, percurso técnico de 1.360 posições de Linguagens, correspondência dos gabaritos de cada referência catalogada, hashes das imagens e coordenadas dos 55 recortes corrigidos.
- Cada posição sem decisão individual permanece `curadoria_pendente`. Não foi marcada como exclusão apenas por não conter palavra-chave de Arte. `percursoIntegralDaProva: false` explicita o limite do levantamento.
- Antes de 2017, Linguagens está no segundo dia (96–135 no recorte principal); desde 2017, no primeiro dia (6–45). Questões já existentes de outras áreas e línguas estrangeiras foram preservadas.

A questão 41 do caderno azul regular de 2025 tinha gabarito D na entrega anterior. O gabarito oficial indica **B**; chave e comentários de B/D foram corrigidos. Os gabaritos de 2010 foram lidos nas marcações oficiais do próprio caderno, sem inventar uma tabela inexistente.

## Pendências exatas

1. Localizar o gabarito de 2011 Reaplicação/PPL. A prova está publicada; sem a chave correspondente, não foram criadas questões com respostas presumidas.
2. Investigar PPL/reaplicação de 2009 e PPL de 2025. Ausência de link não prova inexistência da modalidade.
3. Concluir a decisão editorial dos itens ainda pendentes, percorrer integralmente Ciências Humanas e demais áreas em busca de Arte interdisciplinar e conferir as questões de língua estrangeira. O rastro atual cobre posições de Linguagens, não a íntegra de cada prova.
4. Conferir transcrições, imagens, explicações e conteúdos preparatórios com o professor. Aplicações digitais continuam fora do lote.

## Fontes e validação

Entrada oficial: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos . As URLs específicas constam de cada questão e do inventário. IDs de caderno não substituem leitura da capa e da chave correspondente.

Os contratos verificam estrutura, referências locais, anos, inventário, modalidades compartilhadas e regressões de OCR/gabarito. Testes verdes não comprovam completude, qualidade pedagógica nem revisão humana. Contrato: `specs/REVISAO_AO_VIVO_SPEC.md`. Relatório: `docs/analises/2026-11-04-acervo-arte-enem-continuacao.md`.
