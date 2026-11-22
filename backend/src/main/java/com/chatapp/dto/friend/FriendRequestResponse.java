package com.chatapp.dto.friend;

import java.time.Instant;
import java.util.UUID;

public record FriendRequestResponse(
        UUID requestId,
        UUID senderId,
        String senderDisplayName,
        UUID receiverId,
        String receiverDisplayName,
        String status,
        Instant createdAt
) {}
