package com.chatapp.util;

/** Key-algorithm labels stored in public_keys.key_algorithm. Keep in sync with frontend/src/lib/crypto.js. */
public final class CryptoAlgorithms {
    public static final String RSA_OAEP_2048 = "RSA-OAEP-2048";       // encryption key
    public static final String RSASSA_PKCS1_2048 = "RSASSA-PKCS1-2048"; // signing key

    private CryptoAlgorithms() {}
}
