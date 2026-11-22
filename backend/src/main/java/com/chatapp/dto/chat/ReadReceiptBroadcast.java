package com.chatapp.dto.chat;

import java.time.Instant;
import java.util.UUID;

public record ReadReceiptBroadcast(
        UUID chatId,
        UUID messageId,
        UUID readByUserId,
        Instant seenAt
) {}
