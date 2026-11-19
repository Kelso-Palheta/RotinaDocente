// @vitest-environment jsdom
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CatalogoModalidades } from '@/components/aula-gamificada/CatalogoModalidades';
import { PrepararSala } from '@/components/aula-gamificada/PrepararSala';
import { MODALIDADES_PADRAO } from '@/components/aula-gamificada/constantes';

const PUBLIC_ROOT = path.resolve(process.cwd(), 'public');

describe('DISPUTA-05 — Capas no catálogo e seletores de disputa em PrepararSala', () => {
  afterEach(() => {
    cleanup();
  });

  it('exibe 7 capas SVG 16:9 próprias existentes em public/, badges de disputa, texto atualizado e preserva ações', () => {
    const onSala = vi.fn();
    const onGerar = vi.fn();
    const onManual = vi.fn();

    const { container } = render(
      <CatalogoModalidades
        modalidadesServidor={MODALIDADES_PADRAO}
        onSelecionarParaSala={onSala}
        onSelecionarParaGerar={onGerar}
        onCriarManual={onManual}
      />,
    );

    expect(screen.queryByText(/Sem alterar notas/i)).toBeNull();
    expect(screen.getByText(/Revisão ou Avaliativa/i)).toBeTruthy();

    const capas = container.querySelectorAll('img[src^="/aula-gamificada/catalogo/"]');
    expect(capas).toHaveLength(9);
    const srcs = new Set();
    for (const img of capas) {
      const src = img.getAttribute('src');
      srcs.add(src);
      expect(fs.existsSync(path.join(PUBLIC_ROOT, src.replace(/^\//, '')))).toBe(true);
      expect(img.className).toContain('aspect-video');
    }
    expect(srcs.size).toBe(9);

    // Sem GIFs simultâneos no catálogo
    expect(container.querySelectorAll('img[src$=".gif"]')).toHaveLength(0);

    fireEvent.click(screen.getAllByRole('button', { name: /Preparar sala/i })[0]);
    expect(onSala).toHaveBeenCalled();
  });

  it('PrepararSala exibe miniatura, formatos compatíveis, seletor de duelo e modo de resposta do grupo', () => {
    const turmas = [
      {
        id: 't1',
        nome: '8º A',
        anoEscolar: '8º ano',
        alunos: [
          { id: 'a1', nome: 'Ana' },
          { id: 'a2', nome: 'Beto' },
          { id: 'a3', nome: 'Caio' },
          { id: 'a4', nome: 'Duda' },
        ],
      },
    ];
    const questoes = [
      {
        id: 'q1',
        disciplina: 'Arte',
        anoEscolar: '8º ano',
        conteudo: 'Arte Moderna',
        dificuldade: 'medio',
        tipo: 'multipla_escolha',
        status: 'revisada',
        enunciado: 'Questão?',
        alternativas: [
          { id: 'A', texto: 'Alt A' },
          { id: 'B', texto: 'Alt B' },
        ],
      },
    ];

    const { container } = render(
      <PrepararSala
        modalidadeInicial="quiz"
        turmas={turmas}
        questoes={questoes}
        salas={[]}
        onCriarSala={async () => {}}
        onAbrirSala={() => {}}
      />,
    );

    expect(container.querySelector('img[src="/aula-gamificada/catalogo/quiz.svg"]')).toBeTruthy();

    // Seleciona Duelo 1x1
    const btnDuelo = screen.getByRole('button', { name: /Duelo 1×1/i });
    fireEvent.click(btnDuelo);
    expect(screen.getByText(/Adversário 1/i)).toBeTruthy();
    expect(screen.getByText(/Adversário 2/i)).toBeTruthy();

    // Seleciona Grupos -> modo compartilhado
    const btnGrupos = screen.getByRole('button', { name: /^Grupos$/i });
    fireEvent.click(btnGrupos);
    expect(screen.getByText(/Forma de resposta dos grupos/i)).toBeTruthy();
    const btnCompartilhada = screen.getByRole('button', { name: /Resposta compartilhada/i });
    fireEvent.click(btnCompartilhada);
    expect(screen.getAllByText(/Representante/i).length).toBeGreaterThan(0);
  });
});
