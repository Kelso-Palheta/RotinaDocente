# Arte em jogo nas rotas reais

Capturas do build local em 1280×800 e 390×844. Os arquivos do painel docente, da atividade e do boletim usam respostas de API sintéticas injetadas no navegador. Nenhuma entrega ou nota foi gravada.

| Rota | Estados capturados |
| --- | --- |
| `/` | Página pública e painel docente |
| `/aluno` | Acesso ao portal |
| `/aluno/atividade/arte-demo` | Abertura, envio confirmado e devolutiva |
| `/aluno/notas` | Boletim |

O teste da atividade percorreu o preenchimento e o envio na interface real. A rota de prévia respondeu 404 no build de produção. As capturas antigas da prévia ficam separadas destas evidências.

Pendentes de conferência visual autenticada: interior dos módulos docentes. Também falta validar a impressão e os PDFs no navegador. Os testes direcionados de boletim e atividade passaram.
