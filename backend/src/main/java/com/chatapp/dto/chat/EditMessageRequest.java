package com.chatapp.dto.chat;

import jakarta.validation.constraints.NotBlank;

public record EditMessageRequest(
        @NotBlank String ciphertext,
        @NotBlank String iv,
        @NotBlank String signature
) {}
