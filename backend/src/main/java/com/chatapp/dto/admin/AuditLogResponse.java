package com.chatapp.dto.admin;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        String actorDisplayName,
        String action,
        String targetType,
        UUID targetId,
        String ipAddress,
        Map<String, Object> metadata,
        Instant createdAt
) {}
