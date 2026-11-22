package com.chatapp.dto.chat;

import java.time.Instant;
import java.util.UUID;

public record ChatSummaryResponse(
        UUID chatId,
        String type, // DIRECT or GROUP
        UUID otherUserId,        // populated for DIRECT chats
        String otherDisplayName, // populated for DIRECT chats
        UUID groupId,            // populated for GROUP chats
        String groupName,        // populated for GROUP chats
        Instant lastMessageAt
) {}
