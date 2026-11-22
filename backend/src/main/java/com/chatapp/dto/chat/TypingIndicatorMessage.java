package com.chatapp.dto.chat;

import java.util.UUID;

public record TypingIndicatorMessage(
        UUID chatId,
        UUID userId,
        String displayName,
        boolean typing
) {}
