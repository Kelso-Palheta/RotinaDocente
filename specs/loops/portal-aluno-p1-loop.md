# RN-75 — ciclo de implementação

## Perceber
A auditoria do Portal do Aluno (27/10/2026) reproduziu cinco falhas de apresentação e confiabilidade: devolutiva de `multipla_escolha` sem resposta marcada, comprovante com data atual em vez da data da entrega, critério sem lançamento exibido como `0,00`, falha de seção do boletim apresentada como ausência de dados e instrução de acesso divergente da regra do login. Evidências originais permanecem em `docs/analises/evidencias-portal-aluno/`.

## Decidir
Especificar antes de codar. Regra em `specs/RULES.md` (RN-75), contrato de falhas em `specs/API_SPEC.md` e testes em `specs/TESTS_SPEC.md` (UT-44..UT-49). Corrigir apenas as camadas necessárias: domínio para data e tipo de questão, apresentação para cartões e comprovante, rota para falhas por seção. Sem mudar fórmula, autorização, projeções ou regras de aprovação.

## Agir
Testes novos escritos e observados falhando antes da implementação. Nenhum teste existente ou evidência histórica é alterado. A rota continua respondendo 200 com dados parciais; a tela passa a distinguir indisponibilidade de ausência.

## Verificar
826 → **828 testes em 174 arquivos** aprovados: 806 preexistentes preservados e 22 novos (UT-44..UT-49). Build de produção exit 0. Lint dos arquivos alterados sem novos problemas; o único erro reportado em `frontend/src/app/aluno/page.js:24` já existia no HEAD, confirmado por lint do arquivo original. `git diff --check` limpo. Zero lançado continua `0,00`; total bimestral inalterado; suíte anterior intacta.

## Limites
Homologação visual em dispositivos reais e leitura com leitor de tela seguem pendentes. A pendência de armazenamento das imagens de Atividades Adaptadas não é afetada por este ciclo.
