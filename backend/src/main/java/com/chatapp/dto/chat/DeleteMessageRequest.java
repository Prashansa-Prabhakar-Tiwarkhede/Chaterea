package com.chatapp.dto.chat;

import jakarta.validation.constraints.NotNull;

public record DeleteMessageRequest(
        @NotNull DeleteScope scope
) {
    public enum DeleteScope { FOR_ME, FOR_EVERYONE }
}
