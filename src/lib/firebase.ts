import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import configData from '../../firebase-applet-config.json';

let app: FirebaseApp;
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

export const db: Firestore = getFirestore(app, configData.firestoreDatabaseId || undefined);
export const auth: Auth = getAuth(app);
export { app };
