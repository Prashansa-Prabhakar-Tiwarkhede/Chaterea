package com.chatapp.dto.group;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record GroupResponse(
        UUID id,
        String name,
        String description,
        String avatarUrl,
        UUID chatId,
        List<GroupMemberResponse> members,
        Instant createdAt
) {}
