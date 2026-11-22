package com.chatapp.dto.notification;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        String type,
        Map<String, Object> payload,
        boolean read,
        Instant createdAt
) {}
