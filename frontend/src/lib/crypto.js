// E2EE crypto module built entirely on the Web Crypto API (SubtleCrypto).
// Works unmodified in the browser (window.crypto.subtle) and in Node 19+
// (globalThis.crypto.subtle) — this is what lets crypto-roundtrip-test.mjs
// import this exact file to prove client-A-encrypts / client-B-decrypts
// without needing a browser.
//
// Design (matches backend/README.md "How E2EE works end-to-end"):
//   - Each user has TWO RSA key pairs, generated client-side, private keys
//     never leaving the client:
//       1. RSA-OAEP 2048       -> encrypts/decrypts the per-message AES key
//       2. RSASSA-PKCS1-v1_5   -> signs/verifies message ciphertext
//     (Web Crypto forbids using one RSA key for both purposes.)
//   - Each message gets a fresh random AES-256-GCM key + IV.
//   - The AES key is wrapped (RSA-OAEP encrypted) once per recipient.
//   - The sender signs the ciphertext with their RSA-PKCS1 private key.
//   - The recipient unwraps the AES key with their own private key,
//     decrypts, then verifies the signature against the sender's stored
//     RSASSA public key.

const subtle = (globalThis.crypto && globalThis.crypto.subtle)
    ? globalThis.crypto.subtle
    : (() => { throw new Error("Web Crypto API (crypto.subtle) is not available in this environment"); })();

// ---------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------

export async function generateEncryptionKeyPair() {
    return subtle.generateKey(
        { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["encrypt", "decrypt"]
    );
}

export async function generateSigningKeyPair() {
    return subtle.generateKey(
        { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
        true,
        ["sign", "verify"]
    );
}

// ---------------------------------------------------------------------
// PEM <-> CryptoKey conversion (SPKI for public, PKCS8 for private)
// ---------------------------------------------------------------------

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

function base64ToArrayBuffer(base64) {
    const binary = typeof atob !== "undefined" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

function pemToDer(pem) {
    const b64 = pem
        .replace(/-----BEGIN [^-]+-----/, "")
        .replace(/-----END [^-]+-----/, "")
        .replace(/\s+/g, "");
    return base64ToArrayBuffer(b64);
}

function derToPem(der, label) {
    const b64 = arrayBufferToBase64(der);
    const lines = b64.match(/.{1,64}/g).join("\n");
    return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}

export async function exportPublicKeyPem(publicKey) {
    const der = await subtle.exportKey("spki", publicKey);
    return derToPem(der, "PUBLIC KEY");
}

export async function exportPrivateKeyPem(privateKey) {
    const der = await subtle.exportKey("pkcs8", privateKey);
    return derToPem(der, "PRIVATE KEY");
}

export async function importEncryptionPublicKey(pem) {
    return subtle.importKey("spki", pemToDer(pem), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["encrypt"]);
}

export async function importEncryptionPrivateKey(pem) {
    return subtle.importKey("pkcs8", pemToDer(pem), { name: "RSA-OAEP", hash: "SHA-256" }, true, ["decrypt"]);
}

export async function importSigningPublicKey(pem) {
    return subtle.importKey("spki", pemToDer(pem), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["verify"]);
}

export async function importSigningPrivateKey(pem) {
    return subtle.importKey("pkcs8", pemToDer(pem), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["sign"]);
}

// ---------------------------------------------------------------------
// Per-message AES-256-GCM content encryption
// ---------------------------------------------------------------------

export async function generateMessageAesKey() {
    return subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

/** Returns { ciphertextB64, ivB64 }. `plaintext` is a UTF-8 string. */
export async function encryptMessage(aesKey, plaintext) {
    const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);
    const ciphertextBuffer = await subtle.encrypt({ name: "AES-GCM", iv }, aesKey, encoded);
    return {
        ciphertextB64: arrayBufferToBase64(ciphertextBuffer),
        ivB64: arrayBufferToBase64(iv.buffer),
    };
}

/** Returns the decrypted UTF-8 plaintext string. */
export async function decryptMessage(aesKey, ciphertextB64, ivB64) {
    const ciphertext = base64ToArrayBuffer(ciphertextB64);
    const iv = new Uint8Array(base64ToArrayBuffer(ivB64));
    const plaintextBuffer = await subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
    return new TextDecoder().decode(plaintextBuffer);
}

// ---------------------------------------------------------------------
// Wrapping the AES key for each recipient (RSA-OAEP)
// ---------------------------------------------------------------------

/** Wraps a raw AES-256-GCM CryptoKey with a recipient's RSA-OAEP public key. Returns base64. */
export async function wrapAesKeyForRecipient(aesKey, recipientEncryptionPublicKey) {
    const rawAesKey = await subtle.exportKey("raw", aesKey);
    const wrapped = await subtle.encrypt({ name: "RSA-OAEP" }, recipientEncryptionPublicKey, rawAesKey);
    return arrayBufferToBase64(wrapped);
}

/** Unwraps a base64 RSA-OAEP-encrypted AES key using your own private encryption key. Returns a usable AES-GCM CryptoKey. */
export async function unwrapAesKey(encryptedAesKeyB64, myEncryptionPrivateKey) {
    const wrapped = base64ToArrayBuffer(encryptedAesKeyB64);
    const rawAesKey = await subtle.decrypt({ name: "RSA-OAEP" }, myEncryptionPrivateKey, wrapped);
    return subtle.importKey("raw", rawAesKey, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

// ---------------------------------------------------------------------
// Digital signatures over the ciphertext
// ---------------------------------------------------------------------

/** Signs the base64 ciphertext string with the sender's RSASSA-PKCS1 private signing key. Returns base64 signature. */
export async function signCiphertext(ciphertextB64, mySigningPrivateKey) {
    const data = new TextEncoder().encode(ciphertextB64);
    const signature = await subtle.sign("RSASSA-PKCS1-v1_5", mySigningPrivateKey, data);
    return arrayBufferToBase64(signature);
}

/** Verifies a base64 signature over the base64 ciphertext against the sender's RSASSA-PKCS1 public signing key. */
export async function verifySignature(ciphertextB64, signatureB64, senderSigningPublicKey) {
    const data = new TextEncoder().encode(ciphertextB64);
    const signature = base64ToArrayBuffer(signatureB64);
    return subtle.verify("RSASSA-PKCS1-v1_5", senderSigningPublicKey, signature, data);
}

// ---------------------------------------------------------------------
// High-level helpers used directly by the chat UI
// ---------------------------------------------------------------------

/**
 * Full send-side flow for one message to N recipients.
 * `recipients` is an array of { userId, encryptionPublicKeyPem }.
 * Returns the exact shape backend's POST /api/chats/messages expects
 * (minus chatId/messageType, which the caller adds).
 */
export async function prepareOutgoingMessage(plaintext, recipients, mySigningPrivateKey) {
    const aesKey = await generateMessageAesKey();
    const { ciphertextB64, ivB64 } = await encryptMessage(aesKey, plaintext);
    const signatureB64 = await signCiphertext(ciphertextB64, mySigningPrivateKey);

    const recipientKeys = [];
    for (const r of recipients) {
        const publicKey = await importEncryptionPublicKey(r.encryptionPublicKeyPem);
        const encryptedAesKey = await wrapAesKeyForRecipient(aesKey, publicKey);
        recipientKeys.push({ recipientId: r.userId, encryptedAesKey });
    }

    return {
        ciphertext: ciphertextB64,
        iv: ivB64,
        signature: signatureB64,
        recipientKeys,
    };
}

/**
 * Full receive-side flow. `message` is a MessageResponse from the backend
 * (must include encryptedAesKeyForMe, populated server-side for the
 * requesting user). Returns { plaintext, signatureValid }.
 */
export async function decryptIncomingMessage(message, myEncryptionPrivateKey, senderSigningPublicKeyPem) {
    const aesKey = await unwrapAesKey(message.encryptedAesKeyForMe, myEncryptionPrivateKey);
    const plaintext = await decryptMessage(aesKey, message.ciphertext, message.iv);

    const senderSigningPublicKey = await importSigningPublicKey(senderSigningPublicKeyPem);
    const signatureValid = await verifySignature(message.ciphertext, message.signature, senderSigningPublicKey);

    return { plaintext, signatureValid };
}
