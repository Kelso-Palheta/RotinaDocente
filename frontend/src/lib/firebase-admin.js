import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let cachedApp = null;
let cachedDb = null;

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT deve conter o JSON do service account.");
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }
  return null;
}

function getAdminApp() {
  if (cachedApp) return cachedApp;
  const credential = cert(getServiceAccount());
  cachedApp = getApps().length ? getApps()[0] : initializeApp({ credential });
  return cachedApp;
}

function getAdminDb() {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getAdminApp());
  return cachedDb;
}

export { getAdminApp, getAdminDb };