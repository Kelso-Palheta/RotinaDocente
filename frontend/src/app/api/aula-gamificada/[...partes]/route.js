import { getAulaGamificadaService } from '@/infraestrutura/aula-gamificada/runtimeServidor';
import { criarHandlerAulaGamificada } from '@/infraestrutura/aula-gamificada/httpServidor';
import { autenticarAulaGamificada } from '@/infraestrutura/aula-gamificada/acessoServidor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function atender(request, contexto) {
  try {
    const handler = criarHandlerAulaGamificada({
      service: getAulaGamificadaService(),
      autenticar: autenticarAulaGamificada,
    });
    return await handler(request, contexto);
  } catch {
    return new Response(
      JSON.stringify({
        error: 'Serviço temporariamente indisponível.',
        message: 'Serviço temporariamente indisponível.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    );
  }
}

export const GET = atender;
export const POST = atender;
