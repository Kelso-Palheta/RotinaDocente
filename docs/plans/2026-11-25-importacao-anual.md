# Importação do currículo anual

Objetivo aprovado: importar PDF/DOCX/TXT ou texto, organizar conteúdos anuais por bimestre com IA e revisão docente; salvar como raiz do fluxo integrado existente.

1. Contrato puro e testes RED de entrada, conteúdos literais, quatro períodos e descarte de metadados externos.
2. Endpoint no handler docente existente, serviço sem persistência e adaptador BYOK atual; testes de autenticação, origem, chave/modelo e no-store.
3. Interface usando extrator compartilhado, revisão do texto e prévia antes de abrir editor. Rascunho não salvo protegido; descarte explícito e troca de conta cancelam aplicação tardia.
4. Testes focados, capturas desktop/celular com extração real de documento sintético e IA simulada; suíte completa, lint e build em cópia isolada.
5. Relatório e publicação apenas do escopo validado.
