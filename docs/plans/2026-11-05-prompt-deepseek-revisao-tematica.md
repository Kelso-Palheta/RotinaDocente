# Pacote DeepSeek/OpenCode — classificação e aulas de revisão

Execute no projeto `/Users/kelsopalheta/Developer/RotinaDocente`. Leia `AGENTS.md`, `specs/RULES.md`, `specs/PRD.md`, `specs/TESTS_SPEC.md`, `specs/REVISAO_TEMATICA_SPEC.md` e `docs/plans/2026-11-05-revisao-tematica-design.md` antes de trabalhar. Design já aprovado pelo usuário; não pedir outra aprovação de design para o mesmo escopo.

## Objetivo

Converter o acervo parcial de 197 questões em aulas introdutórias completas por conteúdo específico, com vínculos pedagógicos explícitos. Selecionar Surrealismo não pode disponibilizar Impressionismo por estarem na mesma trilha. Introdução vem antes das questões e não antecipa o gabarito.

## Seus arquivos exclusivos

Criar somente:
- `content/revisao-enem/aulas/catalogo.json`
- `content/revisao-enem/aulas/vinculos.json`
- `content/revisao-enem/aulas/conteudos/*.json`
- `content/revisao-enem/aulas/imagens/*` (apenas recursos necessários e licença/fonte verificadas)
- `tests/contract/revisao_tematico_acervo.test.js` (novo)
- `docs/analises/2026-11-05-revisao-tematica-acervo.md`

Leia os JSONs de questões existentes, mas não altere JSONs, fontes, imagens ou status antigos. Não editar `src/`, specs, dependências, testes existentes, configuração ou arquivos do Antigravity. Não fazer commit/push/deploy. Outro agente trabalha na UI em paralelo; não reverta mudanças alheias.

## Execução

1. Escreva primeiro teste novo de contrato, rode e registre RED pela ausência de aulas/mapa. Dados, nomes e formatos EXATAMENTE conforme seção 2 de `REVISAO_TEMATICA_SPEC.md`.
2. Inspecione enunciado, alternativas, gabarito e fontes de cada uma das 197 questões; não classifique só pelo título. Diferencie trilha ampla de aula específica. Escolha granularidade coerente, sem prometer um número fixo de aulas.
3. Registre cada questão uma única vez no mapa. Vínculo deve indicar objetivos realmente ensinados naquela aula e justificativa específica; várias associações somente se cada aula cobrir a questão por inteiro. Relação vaga é pendência, não elegibilidade. IDs desconhecidos, duplicatas, objetivos não ensinados e referências quebradas falham.
4. Questões de interpretação de Português incidentalmente sobre música/arte não devem ser incluídas automaticamente num tema artístico. Se o conteúdo cobrado não for coberto por uma aula real, marque pendente/fora_escopo com motivo. Não apague a questão nem invente uma ligação para fechar contagem.
5. Pesquise fontes primárias confiáveis (museus, instituições culturais/educacionais, documentos oficiais) e redija texto ORIGINAL em português para Ensino Médio. Verifique datas, autoria, contexto e conceitos; não invente URLs, citações ou licença. Se faltar acesso a fonte, registre a lacuna com precisão.
6. Cada aula deve ensinar: objetivos, contexto, conceitos, exemplos comentados, comparações pertinentes, equívocos frequentes, estratégias ENEM e síntese. Normalmente 6–12 blocos, 10–20 minutos estimados; desenvolver mais quando preciso. Não basta uma frase por bloco ou repetir títulos. Não use extensão de texto como prova de qualidade.
7. Use imagens quando necessárias para compreender Arte, com fonte/licença, legenda correta, texto alternativo, legibilidade e leitura guiada. Prefira exemplos diferentes das questões; não transformar a introdução na resolução antecipada do desafio. Não reutilize indiscriminadamente recortes oficiais, pois o banco continua em conferência.
8. Mantenha tudo como `rascunho`; nenhum check automático de revisão humana. Faça auditoria técnica/semântica e relate incertezas separadamente. Não marcar material duvidoso como pronto.
9. Se o volume exigir lotes, conclua um conjunto coerente por vez e registre o restante, preservando contrato. Prossiga até entregar o escopo completo ou um bloqueio concreto, sem declarar que aulas ausentes foram feitas.

## Validação

A partir de `frontend/`:

```sh
npx vitest run ../tests/contract/revisao_tematico_acervo.test.js --maxWorkers=1
npx vitest run ../tests/contract/revisao_acervo.test.js ../tests/contract/revisao_acervo_servidor.test.js ../tests/integration/revisao_integridade_fontes.test.js --maxWorkers=1
```

Asserções novas: todos os IDs atuais mapeados ou justificados; nenhum ID/objetivo/arquivo inexistente; aulas com estrutura pedagógica, imagens válidas e fontes reais declaradas; tudo em rascunho; sem gabarito/campo de resposta nas aulas. Inspeção manual é indispensável para precisão e qualidade, não provada somente por esquema/regex.

Relatório: lista de aulas e objetivos, quantidade de vínculos/pendências, fontes consultadas, escolhas de classificação difíceis, recursos/licenças, exemplos revisados, comandos/resultados e trabalho pendente. Finalize sem commit/push e indique os arquivos alterados. Preserve todos os testes anteriores.
