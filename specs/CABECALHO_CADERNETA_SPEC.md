# Cabeçalho da caderneta PDF — correção de nomes longos

04/11/2026. Base publicada e validada: `1a95f58` (1.170 testes/258 arquivos). Escopo autorizado: corrigir a sobreposição dos metadados do cabeçalho de `generateCadernetaPDF`.

## Diagnóstico

`frontend/src/lib/diario/caderneta-export.js` imprime turma, total de alunos, professor e emissão em y=21, nas posições margin, margin+65, margin+125 e margin+200. O tamanho real dos textos não participa do cálculo. Fundo de 32 mm e início da tabela em y=38 também são fixos. A amostra longa reproduz a colisão em `docs/evidencias/2026-11-04-paleta-petroleo-salvia/pdfs/depois/caderneta-pagina-1.png`.

## Aceite

- CAB-01: turma, contagem de alunos, professor e emissão permanecem completos, legíveis e separados. Quebrar linhas e aumentar o cabeçalho conforme o conteúdo. Não truncar, usar reticências, ocultar campos ou reduzir a fonte para disfarçar a colisão.
- CAB-02: medir e quebrar com a mesma fonte efetivamente impressa (Helvética normal 9 nos metadados; título bold 16). Manter A4 paisagem e margens laterais de 12 mm. Cada linha cabe entre x=12 e largura da página−12; tolerância de medição até 0,2 mm. Referência de largura aproximada: 273 mm, obtida da página real.
- CAB-03: o fundo petróleo contém título/metadados; a faixa decorativa começa pelo menos 4 mm abaixo da última linha de base dos metadados. A tabela inicia pelo menos 6 mm abaixo do fim da faixa. Nada se sobrepõe, inclusive emissão.
- CAB-04: a altura do cabeçalho determina o início da tabela. Quebras de página mantêm linhas inteiras, cabeçalho da tabela nas continuações e assinaturas separadas da última linha. A paginação pode aumentar por necessidade real de espaço; não fixar número de páginas no teste.
- CAB-05: preservar todas as notas, fórmulas 25/25/50, rótulos e cores de situação, ordem/número dos alunos e colunas/larguras da tabela. Ausência continua distinta de zero. Não alterar o truncamento já existente dos nomes dos alunos nas linhas da tabela nesta tarefa.
- CAB-06: turma vazia e professor omitido continuam exportáveis; argumentos não sofrem mutação. API `generateCadernetaPDF(turma, professorNome)` preservada. CSV e exportador bimestral intocados.

## Direção de implementação

Preferir metadados em fluxo vertical, com linhas completas dentro da largura útil. Calcular linhas, baselines, faixa, fundo e cursor inicial antes de desenhar. Reutilizar a ideia de medição existente em boletim/ficha, sem refatorar esses exportadores. A correção limita-se ao cabeçalho e aos deslocamentos verticais indispensáveis.

## Testes e evidências

Novo `tests/integration/caderneta_cabecalho.test.js`: registrar página, fonte/tamanho reais, textos, larguras e retângulos com jsPDF real instrumentado. Cobrir CAB-01..06: campos curtos; turma/professor longos (incluindo ~300 caracteres); emissão/faixa/tabela separadas; 45 alunos para paginação e assinaturas; ausência versus zero; turma vazia e imutabilidade. Assertions geométricas devem observar a saída, não copiar a fórmula da implementação. Testes anteriores são intocáveis.

Observar RED de colisão/limite antes da mudança de produção. Depois, executar testes novos e regressões PDF, suíte completa, lint do arquivo alterado e build. Renderizar PDFs reais com dados sintéticos: curto, longo e multipágina; conferir todas as páginas e guardar PNGs/texto/resumo em `docs/evidencias/2026-11-04-caderneta-cabecalho/`. Sem contas reais, Firebase, IA paga, dependências novas ou migrações.
