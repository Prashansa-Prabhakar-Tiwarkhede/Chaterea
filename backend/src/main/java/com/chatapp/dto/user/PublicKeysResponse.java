package com.chatapp.dto.user;

import java.util.UUID;

public record PublicKeysResponse(
        UUID userId,
        String encryptionPublicKey,
        String signingPublicKey
) {}
