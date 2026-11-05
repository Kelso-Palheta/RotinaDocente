import { IntegracaoDocente } from '@/components/revisao/IntegracaoDocente';
export const metadata = { title: 'Projeção do aulão | Rotina Docente' };
export default async function RevisaoProjecaoPage({ params }) {
  const { codigo } = await params;
  return <IntegracaoDocente codigo={codigo} projecao />;
}
