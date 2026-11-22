package com.chatapp.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UnlockAccountRequest(
        @NotBlank @Email String email,
        @NotBlank String otp
) {}
