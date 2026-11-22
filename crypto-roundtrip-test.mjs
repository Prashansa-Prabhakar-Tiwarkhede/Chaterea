// Encryption round-trip test: "client A" encrypts and signs a message,
// "client B" decrypts it and verifies the signature — using the exact same
// crypto.js module the React frontend uses (proving frontend and this test
// exercise identical code, not a re-implementation).
//
// Run with:  node crypto-roundtrip-test.mjs
// Requires:  Node 19+ (for global crypto.subtle) — or Node 15+ with
//            `node --experimental-global-webcrypto crypto-roundtrip-test.mjs`
//
// This intentionally has zero dependencies and does not talk to the backend
// or a browser — it isolates the cryptography itself so it can be verified
// on its own, independent of the network/DB layers.

import assert from "node:assert/strict";
import {
    generateEncryptionKeyPair,
    generateSigningKeyPair,
    prepareOutgoingMessage,
    decryptIncomingMessage,
    exportPublicKeyPem,
} from "./frontend/src/lib/crypto.js";

async function main() {
    console.log("Generating key pairs for client A and client B...");

    // --- Client A's keys (sender) ---
    const clientAEncryptionKeys = await generateEncryptionKeyPair();
    const clientASigningKeys = await generateSigningKeyPair();
    const clientASigningPublicKeyPem = await exportPublicKeyPem(clientASigningKeys.publicKey);

    // --- Client B's keys (recipient) ---
    const clientBEncryptionKeys = await generateEncryptionKeyPair();
    const clientBEncryptionPublicKeyPem = await exportPublicKeyPem(clientBEncryptionKeys.publicKey);

    const originalPlaintext = "Hey — meeting moved to 4pm, see you then!";

    console.log("Client A encrypting message:", JSON.stringify(originalPlaintext));

    // Client A prepares the outgoing message exactly as the chat UI would:
    // generate a fresh AES key, encrypt, sign, and wrap the AES key for
    // every recipient (just client B here).
    const outgoing = await prepareOutgoingMessage(
        originalPlaintext,
        [{ userId: "client-b-user-id", encryptionPublicKeyPem: clientBEncryptionPublicKeyPem }],
        clientASigningKeys.privateKey
    );

    console.log("Ciphertext (base64, truncated):", outgoing.ciphertext.slice(0, 40) + "...");
    console.log("IV (base64):", outgoing.iv);
    console.log("Signature (base64, truncated):", outgoing.signature.slice(0, 40) + "...");

    // This is exactly what would be stored in the `messages` and
    // `message_keys` tables server-side — ciphertext only, no plaintext.
    const messageAsStoredOnServer = {
        ciphertext: outgoing.ciphertext,
        iv: outgoing.iv,
        signature: outgoing.signature,
        // The server would return client B their own wrapped key when B
        // fetches this message, matching MessageResponse.encryptedAesKeyForMe.
        encryptedAesKeyForMe: outgoing.recipientKeys[0].encryptedAesKey,
    };

    console.log("\nClient B decrypting message...");

    const { plaintext, signatureValid } = await decryptIncomingMessage(
        messageAsStoredOnServer,
        clientBEncryptionKeys.privateKey,
        clientASigningPublicKeyPem
    );

    console.log("Decrypted plaintext:", JSON.stringify(plaintext));
    console.log("Signature valid:", signatureValid);

    assert.equal(plaintext, originalPlaintext, "Decrypted plaintext must match the original");
    assert.equal(signatureValid, true, "Signature must verify against sender's public signing key");

    // Negative check: tampering with the ciphertext must break verification.
    const tampered = { ...messageAsStoredOnServer, ciphertext: messageAsStoredOnServer.ciphertext.slice(0, -4) + "abcd" };
    let tamperedSignatureValid;
    try {
        const result = await decryptIncomingMessage(tampered, clientBEncryptionKeys.privateKey, clientASigningPublicKeyPem);
        tamperedSignatureValid = result.signatureValid;
    } catch {
        tamperedSignatureValid = false; // AES-GCM auth tag failure also throws — also a pass for this check
    }
    assert.equal(tamperedSignatureValid, false, "Tampered ciphertext must fail signature verification or decryption");

    console.log("\n✅ Round-trip PASSED: client A encrypted+signed, client B decrypted+verified correctly.");
    console.log("✅ Tamper check PASSED: modified ciphertext correctly failed verification.");
}

main().catch((err) => {
    console.error("\n❌ Round-trip test FAILED:", err);
    process.exit(1);
});
