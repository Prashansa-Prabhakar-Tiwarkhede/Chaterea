package com.chatapp.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,

        @NotBlank
        @Size(min = 8, max = 72, message = "Password must be between 8 and 72 characters")
        @Pattern(
            regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_+=\\-]).+$",
            message = "Password must contain an uppercase letter, a lowercase letter, a digit, and a special character"
        )
        String password,

        @NotBlank @Size(min = 2, max = 100) String displayName,

        /** PEM-encoded RSA-OAEP public key (SPKI) — used to wrap AES message keys for this user. */
        @NotBlank String encryptionPublicKey,

        /** PEM-encoded RSASSA-PKCS1-v1_5 public key (SPKI) — used to verify this user's message signatures. */
        @NotBlank String signingPublicKey
) {}
