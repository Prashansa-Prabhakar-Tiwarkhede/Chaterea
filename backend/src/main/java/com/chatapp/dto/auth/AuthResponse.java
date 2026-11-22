package com.chatapp.dto.auth;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        long accessTokenExpiresInSeconds,
        UUID userId,
        String email,
        String displayName,
        String role
) {}
