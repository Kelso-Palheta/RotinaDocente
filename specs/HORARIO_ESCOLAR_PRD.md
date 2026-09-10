# 📄 Product Requirements Document – Horário Escolar Module

## Visão geral

Este módulo traz a funcionalidade **"Meu Horário Escolar"** para dentro do ecossistema **Gestão Docente**. Ele permite que professores criem, editem e visualizem a grade semanal de aulas, configure turnos, faça backup/restore em JSON e persista os dados no **Firestore**.

## Personas
- **Professor** – precisa organizar rapidamente sua agenda semanal e ter acesso a ela em qualquer dispositivo.
- **Coordenador** – pode exportar a grade de toda a escola.

## Requisitos funcionais
1. **CRUD de Aulas** – criar, atualizar, remover aulas (campos: disciplina, turma, sala, horário, cor, observações).
2. **Persistência** – salvar/retrair a agenda em Firestore (coleção `horario_escolar`). Deve haver fallback para `localStorage` caso o usuário não esteja autenticado.
3. **Backup/Restore** – exportar a agenda completa como JSON e importar de volta.
4. **Internacionalização** – UI disponível em **Português (pt‑BR)** e **Espanhol (es‑ES)**.
5. **UI** – manter o CSS original (`style.css`) sem alterações; apenas incluir o arquivo na página.
6. **Segurança** – regras Firestore permitem leitura/escrita apenas por usuários autenticados.

## Requisitos não‑funcionais
- **Performance** – LCP < 2 s em dispositivos móveis.
- **Acessibilidade** – contraste ≥ 4.5:1, navegação por teclado.
- **Escalabilidade** – suportar até 10.000 aulas por usuário.

## Dependências externas
- `firebase@^10`
- `uuid`
- `date-fns`
- `i18next` + `react-i18next` (ou `next-i18next`)
- `vitest`, `@playwright/test`

## Métricas de sucesso
- 95 % dos usuários conseguem salvar a agenda sem erros.
- 100 % das strings têm traduções em pt‑BR e es‑ES.
- Testes cobrem 100 % das linhas de código da camada de domínio e 90 % da camada de aplicação.
