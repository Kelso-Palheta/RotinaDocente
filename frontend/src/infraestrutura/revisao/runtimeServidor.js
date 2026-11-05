import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import { FirestoreRevisaoStore } from "./FirestoreStore";
import * as acervo from "./acervoServidor";
import { RevisaoService } from "@/aplicacao/revisao/RevisaoService";
import * as acervoTematico from './acervoTematicoServidor';
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Instâncias não guardam autoridade: documentos/transações são sempre persistentes. */
export function getRevisaoService() {
  return new RevisaoService({
    store: new FirestoreRevisaoStore(getAdminDb()),
    acervo,
    acervoTematico,
    gerarCodigo: () =>
      [...randomBytes(8)].map((b) => ALFABETO[b % ALFABETO.length]).join(""),
    gerarId: () => randomUUID(),
    idParticipante: (turmaId, alunoId) =>
      createHash("sha256")
        .update(JSON.stringify([turmaId, alunoId]))
        .digest("hex"),
  });
}
