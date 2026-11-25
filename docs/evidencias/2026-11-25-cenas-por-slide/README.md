# Cenas por slide — validação em 25/11/2026

## Correção
304 blocos das 34 aulas com composição declarativa própria em `content/revisao-enem/aulas/cenas.json`. Seis layouts: abertura, obra, comparação, processo, conexões e síntese. A imagem deixa de ser a primeira foto fixa da aula. Cada bloco usa referência pertinente ou diagrama conceitual próprio; os destaques são expressões do texto original.

58 blocos usam exemplos fotográficos/artísticos selecionados; os demais trabalham os conceitos com diagramas. Sete recursos reais foram acrescentados ao catálogo (agora 46 arquivos): Luiz Gonzaga em 1957; Chico Science em turnê da Nação Zumbi; Lenine em 2018; viola caipira; teto de Ataíde; apresentação de marabaixo; Os Mutantes em 1969. Créditos, fontes, licenças e alterações estão no manifesto visual. Fotografias inspecionadas antes do uso; legendas descrevem o que efetivamente aparece. Zabé da Loca e exemplos sem fotografia confiável recebem diagrama correspondente ao trecho.

O bloco sobre manguebeat usa Chico Science, com conceitos de mistura rítmica e crítica social. O Violeiro fica nos blocos que analisam a obra. Os conceitos ativos correspondem às expressões presentes na frase corrente; podem ser vários ou nenhum. Regra verificada por regressão RED→GREEN.

Texto entra por unidades com destaque animado de palavras-chave. Leitores de tela recebem a frase contínua uma única vez; a camada visual fragmentada não é anunciada. Etapa/bloco são as chaves das animações; atualização de conexão não reinicia o texto. Movimento reduzido mantém todos os conteúdos estáticos e legíveis.

## Ensaio visual
Chrome/CDP em 1920 × 1080 e emulação móvel 390 × 844. Componentes reais de telão e aluno, conteúdo real do acervo e sala/conta sintéticas. Rota de demonstração criada somente na cópia temporária de validação e removida antes do build.

Oito capturas: baião, manguebeat, texto durante animação, etapa seguinte com desigualdade destacada, Lenine, abertura diagramada, aluno no celular e movimento reduzido. Foram observadas 18 animações CSS de unidades de texto, mudança de etapa, fotografia correta, conceito ativo da frase, ausência de overflow móvel e animações textuais desativadas com preferência de movimento reduzido. Ensaio não equivale a teste físico de iPhone.

## Revisão e preservação
Revisão independente de conformidade e qualidade aprovada após corrigir a ativação de conceito por índice. Nenhum teste existente foi alterado. Fonte das aulas, protocolo de comandos, notas, respostas e snapshots preservados. Alterações alheias presentes no workspace ficam fora do commit e da validação isolada.

## Validações finais
Suíte completa: 423 arquivos aprovados, 1.982 testes passaram; 10 testes opcionais ignorados. Lint sem erros, com 22 avisos preexistentes. Testes antigos preservados e comparação sem alterações alheias na cópia isolada. Build de produção executado após remoção da rota temporária de prévia.
