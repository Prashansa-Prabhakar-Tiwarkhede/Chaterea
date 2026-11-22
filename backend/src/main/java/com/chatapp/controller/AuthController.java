package com.chatapp.controller;

import com.chatapp.dto.auth.*;
import com.chatapp.security.CustomUserDetails;
import com.chatapp.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<MessageResponse> register(@Valid @RequestBody RegisterRequest request,
                                                      HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.register(request, httpRequest));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authService.verifyEmail(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshRequest request,
                                                 HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.refresh(request, httpRequest));
    }

    @PostMapping("/logout")
    public ResponseEntity<MessageResponse> logout(@Valid @RequestBody LogoutRequest request,
                                                    @AuthenticationPrincipal CustomUserDetails principal,
                                                    HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.logout(request, principal.getUser(), httpRequest));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                                           HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.resetPassword(request, httpRequest));
    }

    @PostMapping("/unlock-account")
    public ResponseEntity<MessageResponse> unlockAccount(@Valid @RequestBody UnlockAccountRequest request,
                                                           HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.unlockAccount(request, httpRequest));
    }
}
