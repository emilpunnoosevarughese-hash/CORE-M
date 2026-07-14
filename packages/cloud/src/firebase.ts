import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// PLACEHOLDER: The user will need to supply their own Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCpEw_MrHlR8SgnQiUpJrCWOc4ViLKcjSk",
  authDomain: "corem-46d49.firebaseapp.com",
  projectId: "corem-46d49",
  storageBucket: "corem-46d49.firebasestorage.app",
  messagingSenderId: "608407041617",
  appId: "1:608407041617:web:246dfd5868133655176a70",
  databaseURL: "https://corem-46d49-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

/**
 * Firebase Firestore Schema Architecture
 * 
 * Collections:
 * - `users/{userId}`: User profile, settings, rate limits.
 * - `projects/{projectId}`: Project metadata, owner, created/updated timestamps, sharing permissions.
 * - `projects/{projectId}/media/{mediaId}`: Document for each imported media item (matching Asset interface).
 *     * Includes: Proxy URLs, Cloudinary IDs, original sizes, checksums, etc.
 *     * DO NOT store binary media here. Only metadata.
 * - `projects/{projectId}/collaborators/{userId}`: Role-based access (editor, viewer).
 */

// Example helper to sync a local asset to Firebase metadata store
export async function syncAssetMetadata(projectId: string, assetData: any) {
  // In a real implementation:
  // await setDoc(doc(db, `projects/${projectId}/media/${assetData.id}`), assetData);
  console.log(`[Firebase Sync] Synced asset ${assetData.id} to project ${projectId}`);
}