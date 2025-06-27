import type { Installation, InstallationStore } from '@slack/bolt';
import { initializeFirebaseServer } from '@/lib/firebase-server';
import { collection, doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

const { firestore } = initializeFirebaseServer();
const installationsCollection = collection(firestore, 'slack_installations');

export class FirestoreInstallationStore implements InstallationStore {
  public async storeInstallation(installation: Installation): Promise<void> {
    const id = installation.isEnterpriseInstall ? installation.enterprise!.id : installation.team!.id;

    if (!id) {
      throw new Error('Failed to store installation: missing team or enterprise ID.');
    }

    const docRef = doc(installationsCollection, id);
    await setDoc(docRef, { id, installation });
  }

  public async fetchInstallation(query: { teamId?: string; enterpriseId?: string }): Promise<Installation> {
    const id = query.enterpriseId || query.teamId;
    if (!id) {
      throw new Error('Failed to fetch installation: Enterprise ID or Team ID is required.');
    }
    const docRef = doc(installationsCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().installation;
    }

    throw new Error(`Installation not found for ID: ${id}`);
  }

  public async deleteInstallation(query: { teamId?: string; enterpriseId?: string }): Promise<void> {
    const id = query.enterpriseId || query.teamId;
    if (!id) {
      throw new Error('Failed to delete installation: Enterprise ID or Team ID is required.');
    }
    const docRef = doc(installationsCollection, id);
    await deleteDoc(docRef);
  }
}
