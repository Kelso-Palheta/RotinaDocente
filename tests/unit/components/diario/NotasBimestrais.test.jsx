import { render, screen, within } from '@testing-library/react';
import { MapaAnual } from '@/components/diario/MapaAnual';

test('Mapa Anual aplica cores bimestrais aos quatro bimestres de cada turma', () => {
  for (const id of ['101', '202']) {
    const turma = { id, alunos: [{ id: 'a1', nome: 'aluno teste' }], bimestres: {} };
    [4.99, 5, 7.99, 8].forEach((nota, i) => {
      turma.bimestres[String(i + 1)] = { atividades: [], notas: { a1: { simulado: nota } },
        config: { simuladoMaxLanca: 10, simuladoMaxFinal: 10, atividadesMaxFinal: 0 } };
    });
    const { unmount } = render(<MapaAnual turma={turma} onSetRecuperacao={() => {}} />);
    const row = screen.getByText('Aluno Teste').closest('tr');
    for (const [valor, cor] of [['4,99', 'red'], ['5,00', 'blue'], ['7,99', 'blue'], ['8,00', 'green']]) {
      expect(within(row).getByText(valor)).toHaveClass(`text-${cor}-600`);
    }
    unmount();
  }
});
