package com.chatapp.dto.chat;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDirectChatRequest(
        @NotNull UUID otherUserId
) {}
