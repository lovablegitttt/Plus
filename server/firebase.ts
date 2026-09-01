import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let firestoreInstance: Firestore | null = null;

export function getFirestoreDB(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    let app: App;
    const existingApps = getApps();
    if (!existingApps || existingApps.length === 0) {
      app = initializeApp({
        projectId: configData.projectId,
      });
    } else {
      app = getApp();
    }

    if (configData.firestoreDatabaseId) {
      firestoreInstance = getFirestore(app, configData.firestoreDatabaseId);
    } else {
      firestoreInstance = getFirestore(app);
    }
    console.log('✅ Firebase Firestore connected successfully (Project:', configData.projectId, ', Database:', configData.firestoreDatabaseId || '(default)', ')');
    return firestoreInstance;
  } catch (err) {
    console.warn('Firebase Firestore initialization notice (will use fallback local memory):', err);
    return null;
  }
}
