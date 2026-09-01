import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';
import { getAuth, Auth, inMemoryPersistence } from 'firebase/auth';
import configData from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

export function getClientFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined') return null;
  if (app) return app;

  try {
    if (!getApps().length) {
      app = initializeApp({
        projectId: configData.projectId,
        appId: configData.appId,
        apiKey: configData.apiKey,
        authDomain: configData.authDomain,
        storageBucket: configData.storageBucket,
        messagingSenderId: configData.messagingSenderId,
      });
    } else {
      app = getApp();
    }
    return app;
  } catch (e) {
    console.warn('Client Firebase app init notice:', e);
    return null;
  }
}

export function getClientFirestore(): Firestore | null {
  if (dbInstance) return dbInstance;
  const currentApp = getClientFirebaseApp();
  if (!currentApp) return null;

  try {
    // Use in-memory cache to prevent IndexedDB closing/lock errors in iframe previews
    dbInstance = initializeFirestore(currentApp, {
      localCache: memoryLocalCache(),
    }, configData.firestoreDatabaseId || undefined);
  } catch {
    try {
      dbInstance = getFirestore(currentApp, configData.firestoreDatabaseId || undefined);
    } catch (e) {
      console.warn('Client Firestore init notice:', e);
    }
  }
  return dbInstance;
}

export function getClientAuth(): Auth | null {
  if (authInstance) return authInstance;
  const currentApp = getClientFirebaseApp();
  if (!currentApp) return null;

  try {
    authInstance = getAuth(currentApp);
    authInstance.setPersistence(inMemoryPersistence).catch(() => {});
  } catch (e) {
    console.warn('Client Auth init notice:', e);
  }
  return authInstance;
}

export const db: Firestore | null = typeof window !== 'undefined' ? getClientFirestore() : null;
export const auth: Auth | null = typeof window !== 'undefined' ? getClientAuth() : null;
export { app };

