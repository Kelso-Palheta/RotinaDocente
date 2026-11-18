import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { getAdminDb } from '@/lib/firebase-admin';
import { AulaGamificadaService } from '@/aplicacao/aula-gamificada/AulaGamificadaService';
import { callAI } from '@/lib/ai-provider-central';
import { extrairJsonIA } from '@/utils/extrairJsonIA';
import { FirestoreStore } from './FirestoreStore';

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Adaptador de IA sob demanda (BYOK). A chave chega apenas no header da
 * requisição e nunca é persistida nem devolvida.
 */
const ia = {
  async gerar({ systemPrompt, prompt, userConfig }) {
    const texto = await callAI({
      systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      maxTokens: 8000,
      userConfig,
    });
    return extrairJsonIA(texto);
  },
};

/** Instâncias não guardam autoridade: estado real vive em documentos/transações. */
export function getAulaGamificadaService() {
  return new AulaGamificadaService({
    store: new FirestoreStore(getAdminDb()),
    ia,
    gerarCodigo: () =>
      [...randomBytes(8)].map((b) => ALFABETO[b % ALFABETO.length]).join(''),
    gerarId: () => randomUUID(),
    idParticipante: (turmaId, alunoId) =>
      createHash('sha256')
        .update(JSON.stringify([turmaId, alunoId]))
        .digest('hex'),
  });
}
