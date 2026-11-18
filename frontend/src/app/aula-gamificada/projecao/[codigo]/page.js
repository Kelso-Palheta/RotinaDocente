import { SalaDocenteView } from '@/components/aula-gamificada/SalaDocenteView';

export const metadata = {
  title: 'Projeção — Aula Gamificada | Rotina Docente',
};

export default async function AulaGamificadaProjecaoPage({ params }) {
  const { codigo } = await params;
  return <SalaDocenteView codigo={codigo} projecao />;
}
