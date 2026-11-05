import { IntegracaoDocente } from '@/components/revisao/IntegracaoDocente';
export const metadata = { title: 'Sala de revisão | Rotina Docente' };
export default async function RevisaoSalaPage({ params }) {
  const { codigo } = await params;
  return <IntegracaoDocente codigo={codigo} />;
}
