import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getEmulatorDomains } from './utils';

// This file is for server-side Firebase initialization.
// It re-uses the logic from the client-side setup to ensure
// it connects to the correct emulators in the development environment.

export function initializeFirebaseServer() {
  if (!getApps().length) {
    if (process.env.NODE_ENV === 'production') {
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
      const emulatorDomains = getEmulatorDomains();

      connectFirestoreEmulator(firestore, emulatorDomains.firestoreDomain.domain, emulatorDomains.firestoreDomain.port);
      connectAuthEmulator(auth, `${emulatorDomains.authDomain.domain}:${emulatorDomains.authDomain.port}`);
      return { firebaseApp, auth, firestore };
    }
  }

  const firebaseApp = getApp();
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  return { firebaseApp, auth, firestore };
}
