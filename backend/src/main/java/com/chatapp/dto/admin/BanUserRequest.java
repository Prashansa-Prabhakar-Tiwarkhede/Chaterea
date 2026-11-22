package com.chatapp.dto.admin;

import jakarta.validation.constraints.NotBlank;

public record BanUserRequest(
        @NotBlank String reason
) {}
