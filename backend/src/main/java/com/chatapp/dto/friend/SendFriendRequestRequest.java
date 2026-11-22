package com.chatapp.dto.friend;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SendFriendRequestRequest(
        @NotNull UUID receiverId
) {}
