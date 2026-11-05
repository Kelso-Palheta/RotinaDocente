import {lerImagemConteudo} from '@/infraestrutura/revisao/acervoTematicoServidor';
import { getRevisaoService } from '@/infraestrutura/revisao/runtimeServidor';
import { criarHandlerRevisao } from '@/infraestrutura/revisao/httpServidor';
import { autenticarRevisao, autorizarMidiaRevisao, emitirCookieMidiaRevisao } from '@/infraestrutura/revisao/acessoServidor';
import { lerImagemAcervo } from '@/infraestrutura/revisao/acervoServidor';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function atender(request, contexto) {
  try {
    const handler = criarHandlerRevisao({
      service: await getRevisaoService(), autenticar: autenticarRevisao,
      autorizarMidia: autorizarMidiaRevisao, emitirCookieMidia: emitirCookieMidiaRevisao, lerImagemAcervo, lerImagemConteudo,
    });
    return await handler(request, contexto);
  } catch {
    return new Response(JSON.stringify({ error: 'Serviço temporariamente indisponível.' }), {
      status: 503, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  }
}

export const GET = atender;
export const POST = atender;
