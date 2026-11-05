# Acervo de Arte do ENEM — Revisão ao Vivo

**Entrega parcial: 16 questões únicas, 13 imagens, nenhuma questão liberada para uso em sala.** Consulta e revisão técnica: 04/11/2026.

## Cobertura atual

| Ano | Aplicação | Questões únicas |
| --- | --- | --- |
| 2019 | Regular | 2 |
| 2023 | Regular | 3 |
| 2024 | Regular | 5 |
| 2024 | PPL e reaplicação, conteúdo compartilhado | 6 |

Os IDs das questões de 2024 compartilhadas continuam contendo `ppl` para preservar identidade; `aplicacoes` e `fontes` incluem também `reaplicacao`. Não são 12 questões diferentes. Cor do caderno não cria outra questão.

## Revisão e uso

Todas as questões permanecem `rascunho`, com `revisao.explicacoes: false`. As outras verificações registram a conferência declarada na entrega original; não equivalem a uma aprovação humana atribuída pelo sistema. Explicações são rascunhos de IA. Somente status `revisada` com as quatro verificações verdadeiras permite elegibilidade, a ser validada no servidor. Nenhuma questão deste lote está elegível.

Imagens foram extraídas de documentos oficiais, conforme a entrega original; não recriar obras com IA. As 13 figuras têm caminho, origem e descrição nos JSONs. O controlador deve produzir URLs autorizadas para a interface, sem expor o acervo privado com gabaritos.

## Inventário

`fontes.json` contém 51 entradas (2009–2025 × regular/PPL/reaplicação). Contagens atuais: 5 `conferida`, 39 `localizada`, 1 `nao_aplicavel`, 3 `nao_localizada`, 3 `pendente`. Os estados catalogada/conferida não significam que todas as questões de Arte daquela prova foram levantadas.

Na revisão independente, as referências históricas de Linguagens de 2009–2016 foram corrigidas para o segundo dia. Conjuntos Reaplicação/PPL são representados nas modalidades correspondentes sem duplicar questão. Ausência de caderno separado não prova modalidade inexistente; casos sem comprovação continuam como não localizados. Fontes antigas podem exigir leitura da capa, inclusive arquivo de 2013 cujo nome oficial contém D1_CD6 apesar de o gabarito corresponder ao segundo dia.

PPL 2010/2011 e a referência compartilhada de 2010 ainda têm gabarito pendente; PPL 2025 continua não localizado neste levantamento. Aplicação especial de 2025 em Belém/Ananindeua/Marituba consta das observações da fonte de 2025, sem questões catalogadas. Aplicações digitais não foram catalogadas. O restante do recorte 2009–2025 permanece pendente de extração, conferência e deduplicação.

## Fontes e testes

Ponto de entrada oficial: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos . Cada questão tem referência da prova/gabarito, caderno, número impresso e página do PDF separados.

`tests/contract/revisao_acervo.test.js` verifica estrutura, arquivos e coerência. `revisao_acervo_revisao.test.js` protege modalidades compartilhadas e o dia de Linguagens. Esses testes não verificam transcrição, qualidade pedagógica nem disponibilidade de URLs na rede.

Contrato: `specs/REVISAO_AO_VIVO_SPEC.md`. Relatório independente: `docs/analises/2026-11-04-revisao-entregas-aulao.md`. Não usar quantidade de registros ou testes verdes como prova de acervo completo.
