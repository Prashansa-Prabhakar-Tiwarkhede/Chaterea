package com.chatapp.dto.chat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** One recipient's RSA-wrapped copy of the message's AES session key (E2EE fan-out). */
public record RecipientKeyDto(
        @NotNull UUID recipientId,
        @NotBlank String encryptedAesKey
) {}
