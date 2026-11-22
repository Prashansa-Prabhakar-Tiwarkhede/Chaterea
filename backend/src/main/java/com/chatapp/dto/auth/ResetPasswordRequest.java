package com.chatapp.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank String token,

        @NotBlank
        @Size(min = 8, max = 72)
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=\\-]).+$",
            message = "Password must contain an uppercase letter, a lowercase letter, a digit, and a special character"
        )
        String newPassword
) {}
