# Validação independente final — correções de homologação RN-81

Data: 29/10/2026. Entrega DeepSeek baseada no código `bb89f83`, após revisão documental `a532f8f`. **Resultado: aprovado o escopo das cinco correções e dos dois bloqueios reproduzidos.** Esta rodada não alterou código de produção nem testes recebidos; validou a implementação e atualizou o registro de conclusão.

## Verificações executadas nesta rodada

- `cd frontend && npm test`: **1.087 testes em 236 arquivos aprovados**, exit 0. Inclui `REV-H81-01/02`, sem edição das reproduções, e quatro testes novos de cabeçalho curto/longo e fonte efetiva.
- Lint dos sete arquivos de produção alterados: exit 0, **zero erros e zero avisos**.
- `NODE_USE_SYSTEM_CA=1 npm run build`: exit 0. Fontes/configuração de build preservadas.
- `git diff --check`: sem erros. Nenhum teste já versionado alterado ou removido; apenas oito arquivos novos, totalizando 27 testes em relação à base com 1.060.
- Logs locais ignorados: `tmp/revisao-final-20261029-{testes,lint,build,pdfs}.log`.

## Correções conferidas

1. Boletim reutiliza `faixaNotaBimestral`, com os critérios recebidos do Portal. Situação abaixo da média vermelha, na média azul e excelente verde; ausência distinta de zero. A cor aplica-se ao rótulo de situação; os números bimestrais mantêm navy. Metas 25/25/50 preservadas.
2. Ficha mede cada bloco com a fonte/estilo/tamanho usados na impressão, inclusive estudante bold 9,5. Identificação longa permanece dentro da margem. Cabeçalhos medem aluno/turma/professor com as respectivas fontes efetivas. Emissão mantém 4 mm antes da faixa; tabelas acompanham a altura calculada.
3. Sem registros, exportação mostra indisponibilidade e não apresenta 100%/regularidade. Com quatro aulas e nenhuma presença, mostra 0% e estado crítico. Indicadores de disponibilidade são usados pelo exportador, preservando o contrato numérico legado e a apuração bruta existente.
4. Professor e Portal usam o mesmo interpretador/formatador para ISO, Timestamp, epoch e Date. Ausência/inválido não inventa prazo.
5. Barra de ações permite quebra de linha e preserva nomes acessíveis/funções. Testes DOM/teclado aprovados; capturas recebidas em 390/1440 px inspecionadas na revisão anterior. Não houve nova sessão de navegador nesta rodada.

## PDFs regenerados independentemente

Foi inspecionado e executado o gerador local `tmp/rn81-correcoes/run.mjs`, que chama os dois exportadores reais com dados exclusivamente sintéticos. Três documentos regenerados: `boletim.pdf`, `ficha-sem-registros.pdf` e `ficha-zero-presenca.pdf`, todos em `tmp/rn81-correcoes/`, ignorados pelo Git. Renderização independente com Poppler em `tmp/revisao-final-20261029-pdf/`.

As três primeiras páginas foram inspecionadas visualmente: emissão separada da faixa, identificação e seções dentro das margens, situações/faixas coerentes e totais S1=32, S2=25 e anual=57 preservados. A segunda página traz atividade regular por bimestre e recuperação do 1º semestre com devolutiva completa. Os três PNGs da página 2 são byte a byte idênticos (mesmos dados de feedback); foi inspecionada a renderização representativa e confirmada a igualdade SHA-256 `7d9b7c38783dfe47847ab00bf8d7420003dd323d021e578680786817fc4db0fa`.

Evidências recebidas e descrição dos cenários: `docs/evidencias/2026-10-28-rn81-correcoes/README.md`. Os PDFs são saídas intermediárias de validação com dados fictícios, não boletins de alunos reais.

## Limites e pendências separadas

Aprovação técnica e visual local do escopo; não substitui exportação em sessão de produção nem auditoria de acessibilidade. Sem Firestore real, chamada real de IA, novo teste de leitor de tela ou estresse concorrente. Nenhuma fórmula, nota real, persistência, destinatário, autorização ou sincronização foi alterada nesta revisão. Não houve mudança de plano Firebase.

O logout da barra lateral de Atividades e a conclusão do armazenamento de imagens de Atividades Adaptadas continuam pendentes, fora deste escopo. Manter lembrete de retomar imagens ao final das tarefas, respeitando decisão de não ativar Blaze. Publicação Git autorizada após estas validações; status de deploy será conferido separadamente.
