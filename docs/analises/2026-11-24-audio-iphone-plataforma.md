# Áudio da plataforma no iPhone

## Diagnóstico
Relato: jogo de plataforma sem som no iPhone. Não foi possível reproduzir em aparelho físico nesta estação.

Falhas reproduzidas por regressões do motor: o estado `interrupted` não era retomado pelo gesto; reprodução MP3 aguardava `resume()` antes de chamar `play()`; interrupções posteriores não atualizavam a opção de ativar o som. O pedido de tela cheia também precedia o desbloqueio de áudio, podendo consumir a ativação do usuário.

## Correção
- Desbloqueio de áudio precede o pedido de tela cheia.
- `resume()` e início da trilha são solicitados no mesmo gesto, antes de qualquer espera.
- Estados `suspended` e `interrupted` são tratados; falha de retomada mantém o aviso de ativação.
- Mudança do estado do contexto atualiza o controle; contexto e trilha continuam únicos, com limpeza no encerramento e respeito ao mute/volume salvos.
- Nenhuma mudança em notas, pontos, permissões ou sessões.

Referência: [WebKit: AudioContext interrupted no iPhone/iPad](https://bugs.webkit.org/show_bug.cgi?id=273511). A referência confirma o estado específico do navegador; não prova a causa exata no aparelho do usuário.

## Verificação
Quatro novas regressões em `tests/unit/audio_mobile_desbloqueio.test.js` (três falhavam antes da correção). Conjunto direcionado: 57 testes aprovados. Cópia publicável isolada: suíte integral com 1.898 testes aprovados e 10 ignorados (402 arquivos aprovados, quatro ignorados); lint com zero erros e 22 avisos existentes; build Next.js aprovado. A primeira tentativa de isolamento com dependências por link simbólico foi descartada por incompatibilidade do Turbopack; validação final usou cópia independente das dependências.

Pendente: confirmar reprodução audível em iPhone físico, incluindo sair/voltar ao navegador e tocar para reativar; conferir volume de mídia e modo silencioso. Testes simulados não comprovam saída física de áudio.
