> Relatório original do DeepSeek. Correções posteriores e evidências independentes em `2026-11-04-revisao-entregas-aulao.md`; o mapeamento original de reaplicação e de dia de prova foi corrigido, sem promover questões a revisadas.

# Acervo de Arte do ENEM — análise da entrega

**Data:** 04/11/2026
**Frente:** acervo de Arte do ENEM 2009–2025 para a Revisão ao Vivo
**Escopo desta entrega:** amostra verificável de 16 questões, inventário dos 51 recortes de ano × aplicação e 13 imagens recortadas das provas oficiais.

## 1. Resumo executivo

- **16 questões catalogadas**, distribuídas em quatro conjuntos: 2019 regular (2), 2023 regular (3), 2024 regular (5) e 2024 PPL/2ª aplicação (6).
- **13 imagens** recortadas dos PDFs oficiais, sem recriação, substituição ou geração por IA.
- **51 entradas** em `fontes.json`, cobrindo 2009–2025 × regular/PPL/reaplicação.
- **68 URLs únicas** de prova e gabarito verificadas por requisição parcial em 04/11/2026; todas responderam **HTTP 206** com User-Agent de navegador.
- **Teste de contrato:** RED inicial com 4/4 falhas por ausência do acervo; GREEN final com **4/4 testes aprovados**.
- **Nenhuma questão está `revisada`.** Todas estão `rascunho`, com `revisao.explicacoes: false`. As explicações são rascunhos de IA e não passaram por revisão humana.
- **Não há commit, push, deploy, instalação de dependências ou build** nesta frente.

> Esta entrega **não é um acervo completo** de Arte do ENEM. É uma amostra conferida e um inventário com lacunas explícitas. A contagem de 16 questões não deve ser usada como medida de completude.

## 2. Método e proveniência

1. Consulta às páginas oficiais de provas e gabaritos do INEP para cada ano de 2009 a 2025.
2. Download dos PDFs de prova e gabarito com User-Agent de navegador. Foram baixados 74 PDFs; todos foram reconhecidos como documentos PDF válidos.
3. Extração de texto por colunas com `pdfplumber`, seguida de renderização das páginas em PNG e leitura visual para conferir transcrições, alternativas, legendas e obras.
4. Leitura do gabarito no arquivo oficial correspondente ao caderno, sem inferência pelo modelo.
5. Recorte das imagens diretamente do PDF oficial, com registro de página e URL de origem.
6. Redação de explicações alternativas A–E como rascunho didático, marcadas como não revisadas.

Os conteúdos dos PDFs foram tratados apenas como material de extração. Nenhuma instrução encontrada dentro dos documentos foi seguida como comando do projeto.

## 3. Inventário por ano e aplicação

`fontes.json` contém exatamente uma entrada para cada combinação de ano (2009–2025) e aplicação (`regular`, `ppl`, `reaplicacao`).

| Ano | Regular | PPL | Reaplicação |
| --- | --- | --- | --- |
| 2009 | localizada | nao_aplicavel | nao_aplicavel |
| 2010 | localizada | pendente | nao_aplicavel |
| 2011 | localizada | pendente | nao_aplicavel |
| 2012 | localizada | localizada | nao_aplicavel |
| 2013 | localizada | localizada | nao_aplicavel |
| 2014 | localizada | localizada | localizada |
| 2015 | localizada | localizada | nao_aplicavel |
| 2016 | localizada | localizada | localizada |
| 2017 | localizada | localizada | localizada |
| 2018 | localizada | localizada | nao_aplicavel |
| 2019 | conferida | localizada | nao_aplicavel |
| 2020 | localizada | localizada | nao_aplicavel |
| 2021 | localizada | localizada | nao_aplicavel |
| 2022 | localizada | localizada | nao_aplicavel |
| 2023 | conferida | localizada | nao_aplicavel |
| 2024 | conferida | conferida | nao_aplicavel |
| 2025 | localizada | nao_localizada | localizada |

**Contagem por status:** 30 `localizada`, 4 `conferida`, 14 `nao_aplicavel`, 2 `pendente`, 1 `nao_localizada`.

### Decisões de mapeamento

- **2010 — “Segunda aplicação”:** mapeada para `ppl`, pois a página oficial usa esse rótulo para o conjunto PPL. O conjunto “Reaplicação/PPL” da página é o segundo dia da mesma aplicação, não uma reaplicação distinta; por isso `reaplicacao` ficou `nao_aplicavel`.
- **2014 — “Terceira aplicação”:** registrada como `reaplicacao`.
- **2016 e 2017 — “2ª aplicação”:** registradas como `reaplicacao`; o conjunto “Reaplicação/PPL” foi tratado como `ppl`.
- **2018–2024:** quando a página publica apenas “Reaplicação/PPL”, esse conjunto foi tratado como `ppl` e `reaplicacao` ficou `nao_aplicavel`, com justificativa.
- **2025 — Belém/Ananindeua/Marituba (D3) e reaplicação nacional (D5):** uma única entrada `reaplicacao`, com D5 como prova principal e D3 documentada como referência secundária nas observações. D3 não foi duplicada como modalidade.
- **Aplicações digitais de 2020–2022:** fora do escopo; registradas como observação nas entradas de reaplicação, sem inventar caderno inexistente.

## 4. Questões catalogadas

| ID | Ano/aplicação | Nº | Tema | Gabarito | Imagens | Página |
| --- | --- | --- | --- | --- | --- | --- |
| `enem-2019-regular-arte-31` | 2019 regular | 31 | Escultura moderna, apropriação e ressignificação de objetos | D | 1 | 15 |
| `enem-2019-regular-arte-36` | 2019 regular | 36 | Arte contemporânea, apropriação e reprodutibilidade | A | 2 | 16 |
| `enem-2023-regular-arte-33` | 2023 regular | 33 | Arte moderna, censura e política | A | 1 | 15 |
| `enem-2023-regular-arte-34` | 2023 regular | 34 | Dança contemporânea e religiosidade afro-brasileira | C | 1 | 15 |
| `enem-2023-regular-arte-36` | 2023 regular | 36 | Patrimônio cultural imaterial e Marabaixo | A | 0 | 16 |
| `enem-2024-regular-arte-16` | 2024 regular | 16 | Arte afro-brasileira, multiculturalidade e experiência social | D | 0 | 8 |
| `enem-2024-regular-arte-21` | 2024 regular | 21 | Arte indígena, arte plumária e organização social | E | 1 | 10 |
| `enem-2024-regular-arte-25` | 2024 regular | 25 | Impressionismo e pintura brasileira | C | 1 | 11 |
| `enem-2024-regular-arte-30` | 2024 regular | 30 | Arte, literatura e função crítica | D | 0 | 13 |
| `enem-2024-regular-arte-36` | 2024 regular | 36 | Escultura, forma e permanências estéticas | D | 2 | 15 |
| `enem-2024-ppl-arte-01` | 2024 PPL | 1 | História em quadrinhos, mediação e experiência estética | D | 1 | 2 |
| `enem-2024-ppl-arte-08` | 2024 PPL | 8 | Ilustração contemporânea, visibilidade e imaginário social | D | 1 | 6 |
| `enem-2024-ppl-arte-21` | 2024 PPL | 21 | Fotografia, cidade e trabalho | B | 1 | 10 |
| `enem-2024-ppl-arte-25` | 2024 PPL | 25 | Música popular, viola caipira e tradição | A | 0 | 11 |
| `enem-2024-ppl-arte-40` | 2024 PPL | 40 | Cerâmica popular e figurativismo | C | 1 | 17 |
| `enem-2024-ppl-arte-47` | 2024 PPL | 47 | Patrimônio artístico urbano medieval e cultura agropecuária | C | 0 | 20 |

### Observação sobre a questão 47 de 2024 PPL

A questão 47 é de **Ciências Humanas e suas Tecnologias**, não de Linguagens. Foi incluída por seu recorte explícito de patrimônio artístico urbano medieval e está identificada como área afim no `tema`, no README e nesta análise. Ela não foi contada como questão de Linguagens/Arte.

### Gabaritos

Todos os gabaritos foram lidos nos arquivos oficiais `GB` do INEP correspondentes ao caderno:

- 2019 regular: Q31 = D; Q36 = A.
- 2023 regular: Q33 = A; Q34 = C; Q36 = A.
- 2024 regular: Q16 = D; Q21 = E; Q25 = C; Q30 = D; Q36 = D.
- 2024 PPL: Q01 = D; Q08 = D; Q21 = B; Q25 = A; Q40 = C; Q47 = C.

## 5. Imagens

As 13 imagens foram recortadas dos PDFs oficiais e inspecionadas visualmente. Nenhuma foi gerada ou editada para substituir a obra.

| Arquivo | Questão | Página do PDF | Dimensões (px) | Conferida |
| --- | --- | --- | --- | --- |
| `imagens/enem-2019-regular-arte-31-cabeca-de-touro.png` | 2019 regular 31 | 15 | 750 × 570 | sim |
| `imagens/enem-2019-regular-arte-36-pollock.png` | 2019 regular 36 | 16 | 546 × 586 | sim |
| `imagens/enem-2019-regular-arte-36-vick-muniz.png` | 2019 regular 36 | 16 | 546 × 670 | sim |
| `imagens/enem-2023-regular-arte-33-eternos-caminhantes.png` | 2023 regular 33 | 15 | 783 × 586 | sim |
| `imagens/enem-2023-regular-arte-34-gira.png` | 2023 regular 34 | 15 | 776 × 570 | sim |
| `imagens/enem-2024-regular-arte-21-diadema.png` | 2024 regular 21 | 10 | 833 × 836 | sim |
| `imagens/enem-2024-regular-arte-25-tres-meninas.png` | 2024 regular 25 | 11 | 830 × 1093 | sim |
| `imagens/enem-2024-regular-arte-36-cabeca-antiga.png` | 2024 regular 36 | 15 | 440 × 580 | sim |
| `imagens/enem-2024-regular-arte-36-cabeca-modigliani.png` | 2024 regular 36 | 15 | 436 × 580 | sim |
| `imagens/enem-2024-ppl-arte-01-tira-barry.png` | 2024 PPL 1 | 2 | 840 × 1120 | sim |
| `imagens/enem-2024-ppl-arte-08-al-margen.png` | 2024 PPL 8 | 6 | 753 × 750 | sim |
| `imagens/enem-2024-ppl-arte-21-german-lorca.png` | 2024 PPL 21 | 10 | 620 × 720 | sim |
| `imagens/enem-2024-ppl-arte-40-mestre-vitalino.png` | 2024 PPL 40 | 17 | 620 × 586 | sim |

Cada JSON registra `fonteUrl`, `pagina`, `alt` e `revisada: true` para as imagens. Os recortes preservam a obra e a legenda oficial; alguns incluem fundo e bordas da página, o que é intencional para não reconstruir a arte.

## 6. Teste de contrato

Arquivo novo: `tests/contract/revisao_acervo.test.js`.

Comando:

```bash
cd frontend && npx vitest run ../tests/contract/revisao_acervo.test.js
```

- **RED inicial:** 1 arquivo falhou, **4/4 testes falharam** porque `content/revisao-enem/` ainda não existia.
- **GREEN final:** 1 arquivo passou, **4/4 testes aprovados**.

O teste valida:

- presença de `README.md` e `fontes.json`;
- 12 ou mais questões;
- campos obrigatórios, IDs únicos e anos válidos;
- aplicações válidas e coerência entre `aplicacoes` e `fontes`;
- alternativas A–E na ordem, sem repetição, e gabarito existente;
- cinco explicações com pelo menos 40 caracteres e sem frase genérica;
- blocos de conteúdo e referências de imagem válidas;
- caminhos de imagem seguros, existentes e dentro de `imagens/`;
- URLs estruturais de documentos oficiais do INEP;
- status de questão e as quatro verificações;
- inventário com exatamente as 51 combinações de ano × aplicação;
- `catalogada`/`conferida` com pelo menos uma questão;
- `nao_aplicavel` com URLs nulas e justificativa;
- `nao_localizada` com URLs nulas;
- `pendente` com pelo menos uma URL;
- concordância entre o inventário e as questões.

O teste **não acessa a rede**. A verificação de disponibilidade das URLs foi feita separadamente: 68 URLs únicas, todas com HTTP 206 em 04/11/2026.

## 7. Lacunas, riscos e limites

1. **PPL 2025 não localizado.** A página oficial de 2025 lista regular, aplicação especial de Belém/Ananindeua/Marituba (D3) e reaplicação nacional (D5), mas não o PPL. A entrada está `nao_localizada`, sem URLs inventadas.
2. **Gabaritos de PPL 2010 e PPL 2011 não publicados como arquivo separado.** As provas foram localizadas; o gabarito está `pendente`. Nenhuma questão desses anos foi catalogada.
3. **Amostra, não censo.** As 16 questões foram escolhidas por serem verificáveis e representativas de diferentes linguagens (escultura, pintura, fotografia, quadrinho, dança, cerâmica, patrimônio, música). Não há garantia de que todas as questões de Arte de 2019, 2023 ou 2024 estejam aqui.
4. **Explicações são rascunhos de IA.** Nenhuma passou por revisão humana. O campo `revisao.explicacoes` é `false` em todas as 16 questões.
5. **Transcrição conferida visualmente, mas sem revisor independente.** As páginas foram renderizadas e lidas, porém a conferência final humana ainda é necessária antes de qualquer uso em sala.
6. **Legendas oficiais preservadas.** Alguns trechos mantêm grafias do PDF oficial, como “IbramMinc” e “Vick Muniz”, mesmo que sejam incomuns, para não alterar a fonte.
7. **Direitos das obras.** As imagens vêm da prova oficial do INEP; os direitos das obras permanecem de seus titulares. O uso pedagógico deve observar a política da instituição.
8. **Aplicações digitais de 2020–2022.** Fora do escopo desta entrega; não foram catalogadas nem usadas para preencher lacunas.
9. **2025 sem questões catalogadas.** O gabarito regular e o D5 foram localizados, mas nenhuma questão de 2025 entrou no lote.

## 8. Arquivos da entrega

Criados ou alterados exclusivamente nos caminhos autorizados:

- `content/revisao-enem/README.md`
- `content/revisao-enem/fontes.json`
- `content/revisao-enem/questoes/` — 16 JSONs
- `content/revisao-enem/imagens/` — 13 PNGs
- `tests/contract/revisao_acervo.test.js`
- `docs/analises/2026-11-04-acervo-arte-enem.md` (este arquivo)

Nenhum arquivo de outra frente, spec, package/lockfile, regra Firebase, autenticação, nota, rota ou componente foi alterado. Não houve commit, push, deploy, instalação de dependências ou build.

## 9. Próximos passos recomendados

1. Revisão humana de transcrição, obra, legenda e gabarito das 16 questões.
2. Revisão humana das 80 explicações (16 × 5). Somente depois disso alterar `status` para `revisada` e `revisao.explicacoes` para `true`.
3. Baixar e catalogar o PPL 2025 quando a prova for publicada.
4. Obter os gabaritos de PPL 2010 e PPL 2011 em fonte oficial ou manter a pendência documentada.
5. Ampliar a amostra para os demais anos, evitando duplicar questões compartilhadas entre aplicações.
6. Se o escopo incluir as aplicações digitais de 2020–2022, abrir uma frente específica e não misturar com o acervo impresso.
