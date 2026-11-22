package com.chatapp.dto.chat;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID chatId,
        UUID senderId,
        String senderDisplayName,
        String messageType,
        String ciphertext,
        String iv,
        String signature,
        /** The AES key wrapped specifically for the user requesting this message. */
        String encryptedAesKeyForMe,
        String mediaUrl,
        String mediaMimeType,
        Long mediaSizeBytes,
        String thumbnailUrl,
        boolean edited,
        boolean deletedForEveryone,
        UUID replyToMessageId,
        Instant createdAt
) {}
