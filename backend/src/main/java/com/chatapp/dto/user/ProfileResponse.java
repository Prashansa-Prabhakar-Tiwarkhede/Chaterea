package com.chatapp.dto.user;

import java.time.Instant;
import java.util.UUID;

public record ProfileResponse(
        UUID id,
        String email,
        String displayName,
        String bio,
        String profilePictureUrl,
        String role,
        boolean online,
        Instant lastSeenAt,
        boolean emailVerified
) {}
