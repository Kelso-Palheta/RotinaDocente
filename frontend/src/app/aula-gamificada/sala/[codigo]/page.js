import { SalaDocenteView } from '@/components/aula-gamificada/SalaDocenteView';

export const metadata = {
  title: 'Sala ao Vivo — Aula Gamificada | Rotina Docente',
};

export default async function AulaGamificadaSalaPage({ params }) {
  const { codigo } = await params;
  return <SalaDocenteView codigo={codigo} />;
}
