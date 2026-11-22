package com.chatapp.dto.chat;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record SendMessageRequest(
        @NotNull UUID chatId,

        @NotNull String messageType, // TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT

        @NotBlank String ciphertext,
        @NotBlank String iv,
        @NotBlank String signature,

        /** One entry per chat participant (other than the sender), each with their own wrapped AES key. */
        @NotEmpty @Valid List<RecipientKeyDto> recipientKeys,

        String mediaUrl,
        String mediaMimeType,
        Long mediaSizeBytes,
        String thumbnailUrl,

        UUID replyToMessageId
) {}
