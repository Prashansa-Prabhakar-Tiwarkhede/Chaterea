package com.chatapp.dto.user;

import java.time.Instant;
import java.util.UUID;

public record PresenceUpdate(
        UUID userId,
        boolean online,
        Instant lastSeenAt
) {}
