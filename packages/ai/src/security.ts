// Secure client-side encryption using Web Crypto API + IndexedDB.
// Keys are never exposed in localStorage. 
// A device-specific CryptoKey is stored in IndexedDB (non-exportable if possible, though IDB requires exportable for structured cloning, we rely on browser security boundaries).

const DB_NAME = 'coreM_AI_Security';
const STORE_NAME = 'key_vault';
const KEY_MATERIAL = 'device_key';
const ALGO = 'AES-GCM';

// Native IndexedDB Helper
function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbGet(key: string): Promise<any> {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

function idbSet(key: string, value: any): Promise<void> {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }));
}

function idbDelete(key: string): Promise<void> {
  return getDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  }));
}

async function getOrGenerateKey(): Promise<CryptoKey> {
  const storedKey = await idbGet(KEY_MATERIAL);
  if (storedKey) {
    return storedKey as CryptoKey;
  }
  const key = await crypto.subtle.generateKey(
    { name: ALGO, length: 256 },
    false, // non-exportable to script
    ['encrypt', 'decrypt']
  );
  await idbSet(KEY_MATERIAL, key);
  return key;
}

export async function encryptKey(rawKey: string): Promise<string> {
  if (!rawKey) return '';
  const key = await getOrGenerateKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(rawKey);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    data
  );
  
  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptKey(encryptedB64: string): Promise<string> {
  if (!encryptedB64) return '';
  try {
    const key = await getOrGenerateKey();
    const combined = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      data.buffer
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    // Deliberately hiding details in error logs for security
    throw new Error('Failed to decrypt API key. Key might be corrupted or missing.');
  }
}

export async function clearSecureStorage(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function storeEncryptedProviderKey(providerId: string, encryptedB64: string): Promise<void> {
  await idbSet(`provider_key_${providerId}`, encryptedB64);
}

export async function getEncryptedProviderKey(providerId: string): Promise<string | null> {
  const result = await idbGet(`provider_key_${providerId}`);
  return result ? String(result) : null;
}

export async function deleteProviderKey(providerId: string): Promise<void> {
  await idbDelete(`provider_key_${providerId}`);
}
