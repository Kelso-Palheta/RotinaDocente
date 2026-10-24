# Corrigir conflito de publicação

1. Reproduzir gravações sucessivas com retorno do banco reordenando chaves e cache equivalente em ordem diferente.
2. Criar comparação semântica pura, ignorando ordem de mapas e preservando arrays/valores.
3. Aplicar no repositório, recuperação da fila e aviso de sessão anterior.
4. Revalidar nuvem antes de permitir repetição de conflito antigo; manter bloqueios quando revisão/conteúdo/origem mudam.
5. Executar regressões anteriores, suíte completa, build e lint. Sem alterar dados de produção ou remover rascunhos.
