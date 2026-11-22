package com.chatapp.controller;

import com.chatapp.dto.notification.NotificationResponse;
import com.chatapp.security.CustomUserDetails;
import com.chatapp.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponse>> list(@AuthenticationPrincipal CustomUserDetails principal,
                                                             Pageable pageable) {
        return ResponseEntity.ok(notificationService.list(principal.getId(), pageable));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id,
                                            @AuthenticationPrincipal CustomUserDetails principal) {
        notificationService.markAsRead(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
