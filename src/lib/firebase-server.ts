import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// This file is for server-side Firebase initialization.
// It re-uses the logic from the client-side setup to ensure
// it connects to the correct emulators in the development environment.

export function initializeFirebaseServer() {
  if (!getApps().length) {
    if (process.env.NODE_ENV === "production") {
      let firebaseApp;
      try {
        firebaseApp = initializeApp();
      } catch (e) {
        console.info('Automatic initialization failed. Falling back to firebase config object.', e);
        firebaseApp = initializeApp(firebaseConfig);
      }
      const auth = getAuth(firebaseApp);
      const firestore = getFirestore(firebaseApp);
      return { firebaseApp, auth, firestore };
    } else {
      const firebaseApp = initializeApp(firebaseConfig);
      const auth = getAuth(firebaseApp);
      const firestore = getFirestore(firebaseApp);
      const firestoreHost = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST!;
      connectFirestoreEmulator(firestore, firestoreHost, 443);
      const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST!;
      connectAuthEmulator(auth, `https://${authHost}:443`);
      return { firebaseApp, auth, firestore };
    }
  }

  const firebaseApp = getApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  return { firebaseApp, auth, firestore };
}
