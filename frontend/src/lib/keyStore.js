// Private keys NEVER leave the client and are never sent to the server.
// Stored in IndexedDB (not localStorage — bigger quota, structured storage,
// and slightly harder for a casual XSS payload to grep in one line).

import { DEMO_KEYS } from "./demoKeys.js";

const DB_NAME = "chatapp-keys";
const STORE_NAME = "private-keys";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveKeyPem(key, pem, userIdentifier = null) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    if (userIdentifier) {
      store.put(pem, `${key}_${userIdentifier}`);
    }
    store.put(pem, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadKeyPem(key, userIdentifier = null) {
  // Check demo keys if matching demo user
  if (userIdentifier && DEMO_KEYS[userIdentifier]) {
    const demo = DEMO_KEYS[userIdentifier];
    if (key === KEYS.ENCRYPTION_PRIVATE) return demo.encryptionPrivateKey;
    if (key === KEYS.SIGNING_PRIVATE) return demo.signingPrivateKey;
  }

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    if (userIdentifier) {
      const userReq = store.get(`${key}_${userIdentifier}`);
      userReq.onsuccess = () => {
        if (userReq.result) return resolve(userReq.result);
        const fallbackReq = store.get(key);
        fallbackReq.onsuccess = () => {
          if (fallbackReq.result) return resolve(fallbackReq.result);
          if (userIdentifier && DEMO_KEYS[userIdentifier]) {
            return resolve(key === KEYS.ENCRYPTION_PRIVATE ? DEMO_KEYS[userIdentifier].encryptionPrivateKey : DEMO_KEYS[userIdentifier].signingPrivateKey);
          }
          resolve(null);
        };
        fallbackReq.onerror = () => reject(fallbackReq.error);
      };
      userReq.onerror = () => reject(userReq.error);
    } else {
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }
  });
}

export const KEYS = {
  ENCRYPTION_PRIVATE: "encryptionPrivateKeyPem",
  SIGNING_PRIVATE: "signingPrivateKeyPem",
};
