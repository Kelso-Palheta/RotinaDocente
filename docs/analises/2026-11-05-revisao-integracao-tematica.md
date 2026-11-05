# Revisão e integração temática — 05/11/2026

## Entregas recebidas

DeepSeek: 34 aulas em sete trilhas, 187 vínculos propostos, dez itens fora de escopo, duas imagens. Antigravity: preparação/conferência/bloco controlados e apresentação opcional temática nos três painéis. Nenhum teste recebido foi alterado. Não há aprovação pedagógica automática.

## Achados e correções

- Contexto de seleção: interface aceitava aula/turma desconhecida, questão selecionada fora do tema e `apta` truthy; quantidade fracionária virava cinco e durações órfãs eram ignoradas. Nova validação estrita bloqueia esses casos. A criação agora envia a seleção real ao controlador.
- Conferência: strings truthy podiam liberar a aprovação e URLs executáveis apareciam em links. Exigir booleanos verdadeiros e fontes HTTPS seguras; servidor repete os três checks e compara impressão da versão.
- Imagem: bloco sem referência resolvida usava a primeira figura ou caminho de arquivo privado. Resolução agora é somente pelo ID correto e URL autorizada; backend confina arquivos à pasta correta e verifica MIME. Não inventar figura substituta.
- Cobertura: arquitetura medieval/agropecuária (`enem-2024-ppl-arte-47`) estava vinculada a instituições/mercado da arte; comparação escultura arcaica/Modigliani (`enem-2024-regular-arte-36`) estava vinculada a Cubismo/Futurismo. As aulas não cobrem suficientemente esses recortes. Ambos foram marcados pendentes, com justificativas, em vez de oferecer questões externas ao conteúdo escolhido. Total atualizado: **185 vinculadas, duas pendentes, dez fora de escopo**. IDs/JSON/imagens originais das questões foram preservados.
- Retirado do mapa o enunciado repetido de que a classificação estaria comprovada pela análise das fontes. São propostas de associação para conferência docente; aprovação exige verificar cobertura integral. A página da aula passa a mostrar os assuntos das questões vinculadas para apoiar essa conferência.
- Pódio v2: posições 1–3 por pontuação acumulada/acertos, preservando posições compartilhadas em empate e classificação completa abaixo. Mil pontos por acerto; nenhum bônus de tempo.

## Integração

Servidor privado valida catálogo, mapas, referências, imagens e hash de aula + metadados + imagens + vínculos relevantes + fonte das questões. Aprovação de aula é por UID/versão; perguntas mantêm os quatro checks anteriores. Novas salas exigem contexto, quantidade exata de 1–20 questões, de uma a oito aulas e tempos inteiros de 10–600s. Não há criação legada que permita contornar a regra no runtime temático.

Aulas, sequência e tempos são congelados por sala. Professor conduz todos os blocos antes do desafio; próxima pergunta abre diretamente com seu próprio prazo. A introdução discente expõe só o bloco atual, sem pergunta, gabarito ou blocos futuros. Avanço/retorno usa CAS; reinício recupera estado/recibo no Firestore. Salas anteriores mantêm seu fluxo. Imagens de sala exigem vínculo/roster/propriedade, bloco corrente e fonte compatível com a versão congelada.

Regressões independentes novas reproduziram os problemas de UI, cobertura e confinamento de imagem em RED antes das correções. Serviço/HTTP/controle e adaptador privado receberam testes novos. Cenário v2 real no emulador demonstrou persistência entre dois clientes, conflito de comandos concorrentes, prazo individual e recibo recuperável. Regressões reais de 100 POSTs/100 SSE e duplicatas também repetidas, com limitações já documentadas no relatório de capacidade: ambiente local WebAPI, sem homologação da rede escolar.

## Limites pedagógicos e fontes

As aulas têm estrutura didática desenvolvida, mas continuam em rascunho. Somente duas contêm imagens; parte das fontes é a página institucional inicial, insuficiente para comprovar cada afirmação. A amostragem feita nesta revisão não equivale à conferência integral das 34 aulas e 185 vínculos. Complementar imagens pertinentes e referências diretas durante a revisão editorial. Não anunciar o material como totalmente homologado nem simular a leitura humana.

Fontes primárias verificadas para as duas imagens: The Met, Alfred Sisley, *The Road from Versailles to Louveciennes*, provavelmente 1879, https://www.metmuseum.org/art/collection/search/437685 ; Eadweard Muybridge, *Animal Locomotion*, volume IX, cavalos, 1887, https://www.metmuseum.org/art/collection/search/266439 . Ambas as páginas identificam domínio público. Não houve geração de imagem ou chamada de IA paga.

## Verificação

Comandos/evidências locais em `~/.codex/tmp/revisao-tematica/`: regressões RED/GREEN, suíte comum, lint, build, cenários serializados de emulador e inspeção NFT. O verificador de pacote cobre também os IDs das aulas nos chunks clientes, além dos arquivos privados e credenciais. Resultados finais devem ser confirmados antes de commit/push; validação de rede escolar e conferência docente permanecem externas ao teste automatizado.

Verificação final: suíte comum **1.446 aprovados / dez condicionais ignorados**, 316 arquivos; grupo serial de emulador **12 aprovados**, cobrindo os dez condicionais e repetindo dois comuns. **1.456 cenários distintos validados**. Lint exit 0, zero erros/onze avisos preexistentes; build exit 0. Pacote: 197 questões, 34 aulas, 362 arquivos privados no servidor, zero credenciais locais e zero IDs privados de questão/aula nos chunks clientes. Nenhum teste recebido ou anterior foi alterado.
