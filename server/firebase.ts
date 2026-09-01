import { initializeApp, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

let firestoreInstance: Firestore | null = null;
let firestoreDisabled = false;

export function getFirestoreDB(): Firestore | null {
  if (firestoreDisabled) return null;
  if (firestoreInstance) return firestoreInstance;

  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      firestoreDisabled = true;
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
    return firestoreInstance;
  } catch (err) {
    firestoreDisabled = true;
    return null;
  }
}

export function disableFirestoreFallback() {
  firestoreDisabled = true;
  firestoreInstance = null;
}

