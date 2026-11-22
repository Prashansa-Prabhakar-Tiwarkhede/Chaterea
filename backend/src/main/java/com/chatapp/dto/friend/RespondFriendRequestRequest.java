package com.chatapp.dto.friend;

import jakarta.validation.constraints.NotNull;

public record RespondFriendRequestRequest(
        @NotNull Boolean accept
) {}
