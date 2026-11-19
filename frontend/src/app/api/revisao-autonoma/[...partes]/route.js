import { randomUUID } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { FirestoreStore } from '@/infraestrutura/aula-gamificada/FirestoreStore';
import { autenticarAulaGamificada } from '@/infraestrutura/aula-gamificada/acessoServidor';
import { criarHandlerRevisaoAutonoma } from '@/infraestrutura/revisao-autonoma/httpServidor';
import { RevisaoAutonomaService } from '@/aplicacao/revisao-autonoma/RevisaoAutonomaService';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
async function atender(request) {
  try {
    const service = new RevisaoAutonomaService({ store: new FirestoreStore(getAdminDb()), gerarId: randomUUID });
    return await criarHandlerRevisaoAutonoma({ service, autenticar: autenticarAulaGamificada })(request);
  } catch {
    return new Response(JSON.stringify({ error: 'Serviço indisponível.' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });
  }
}
export const GET = atender;
export const POST = atender;
