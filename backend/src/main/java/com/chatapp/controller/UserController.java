package com.chatapp.controller;

import com.chatapp.dto.user.ProfileResponse;
import com.chatapp.dto.user.UpdateProfileRequest;
import com.chatapp.security.CustomUserDetails;
import com.chatapp.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<ProfileResponse> me(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(userProfileService.getProfile(principal.getId()));
    }

    @PatchMapping("/me")
    public ResponseEntity<ProfileResponse> updateMe(@Valid @RequestBody UpdateProfileRequest request,
                                                      @AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(userProfileService.updateProfile(principal.getId(), request));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileResponse> get(@PathVariable UUID userId) {
        return ResponseEntity.ok(userProfileService.getProfile(userId));
    }
}
