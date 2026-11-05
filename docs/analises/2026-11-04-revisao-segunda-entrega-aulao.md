# Aulão — revisão da segunda entrega

Data: 04/11/2026. Base: 24ce5f4. Escopo: preparação/conferência docente do Antigravity e continuação do acervo do DeepSeek. Visual vibrante é outra execução concorrente, com arquivos separados; não integra a aprovação deste lote.

## Estado real

- 48 questões únicas (32 novas), 36 imagens (23 novas), todas em rascunho e com explicações pendentes de revisão docente. Zero questões elegíveis para sala.
- Anos representados: 2019 (10), 2023 (11), 2024 (13), 2025 (14). O acervo 2009–2025 NÃO está completo. Não há cobertura de questões de 2009–2018 e 2020–2022, nem evidência de esgotamento dos anos representados.
- Relatório de continuação solicitado ao DeepSeek não encontrado no checkout durante a revisão. README/inventário foram atualizados pela coordenação, sem atribuir conferência humana ao modelo.
- `PrepararAulao` e `RevisarQuestao` são componentes controlados; não criam sala ou aprovam persistência por conta própria. Não há nova API/autenticação/transporte neste lote.

## Achados corrigidos

1. Preparação aceitava turma desconhecida, IDs duplicados e `apta: 'false'` como verdadeiro. Regras puras em `dominio/revisao/preparacao.js` validam turma/questão, unicidade e booleano estrito, sem remover rascunho silenciosamente.
2. `parseInt` truncava duração 10,5 para 10. Conversão agora preserva fração e a regra exige inteiro 10–600.
3. Conferência podia aprovar sem ID/enunciado, com fonte `{}` ou endereço de outro domínio, com confirmação textual truthy e com imagem de conteúdo sem referência. A validação exige estrutura e confirmação explícita; links arbitrários não são rotulados como fontes oficiais.
4. Fontes usam HTTPS, domínio oficial exato, sem credenciais embutidas/porta alternativa. Isso valida procedência estrutural, NÃO comprova conteúdo do PDF.
5. Seis questões D3 de 2025 foram catalogadas como reaplicação, mas o INEP as classifica como aplicação regular regional. Metadados/inventário corrigidos, IDs preservados e edição regional explícita. Referência: https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos/2025, seção Aplicação BELÉM, ANANINDEUA E MARITUBA. D5 permanece reaplicação.

Nenhuma questão foi promovida a revisada. Não foi feita releitura independente integral de 48 enunciados, 36 figuras e 240 justificativas nesta revisão; conferência editorial/docente permanece necessária. Casos interdisciplinares exigem curadoria do professor.

## Testes e evidências

Testes novos recebidos (20 casos) preservados integralmente; SHA-256 registrado antes das correções. Regressões próprias (12 de UI + 1 de classificação regional) falharam antes do ajuste: 13/13 RED. Após correções, conjunto direcionado de seis arquivos: 39/39 GREEN. Validação final da cópia isolada do índice: **1.254 testes/269 arquivos aprovados**, exit 0, com `--maxWorkers=2`. Lint dos dois componentes e do domínio exit 0. Build de produção com `--webpack` exit 0 (37 rotas existentes); opção usada por causa das dependências compartilhadas por symlink na cópia isolada. O webpack emitiu aviso de top-level await no Firebase preexistente, sem mudança nesse arquivo. Uma tentativa concorrente de testes/build teve timeouts em testes alheios e foi encerrada; nenhuma expectativa ou implementação alheia foi alterada, e a execução final limitada passou integralmente.

## Continuação

Visual vibrante: `specs/REVISAO_VISUAL_VIBRANTE_SPEC.md` e prompt próprio já entregue para execução separada. Preparação/conferência e domínio deste lote não devem ser sobrescritos por essa frente. Backend de salas, autorização efetiva, transporte, capacidade e homologação ponta a ponta permanecem pendentes.

## Conferência visual e isolamento

Os componentes reais da cópia isolada foram renderizados com React/Vite/Tailwind em harness local, fora do projeto. CUA confirmou largura interna/documento de 360/360px e 1440/1440px em ambas as telas; a figura carregou na conferência. Capturas móveis estão na pasta de evidências. Capturas desktop parciais do painel estreito foram descartadas; a medição de largura de 1440px foi feita no iframe, não se apresenta uma captura parcial como homologação visual completa do desktop.

Na conferência real do navegador, Aprovar permaneceu desabilitado com checkboxes vazios e habilitou somente após as quatro confirmações. Callback do harness é inerte; nenhuma questão foi aprovada no banco. Não houve autenticação discente, sala real ou teste de carga.

A cópia isolada contém somente os arquivos desta entrega e a base publicada; não inclui os três painéis e os testes/auxiliares do visual vibrante ainda em execução. Hashes confirmaram que fonte, testes e acervo do índice continuam iguais aos executados. A atualização de documentação/evidências depois das validações não altera código.
