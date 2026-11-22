package com.chatapp.dto.friend;

import java.util.UUID;

public record UserSummaryResponse(
        UUID userId,
        String email,
        String displayName,
        String bio,
        String profilePictureUrl,
        boolean online,
        String lastSeenAt
) {}
