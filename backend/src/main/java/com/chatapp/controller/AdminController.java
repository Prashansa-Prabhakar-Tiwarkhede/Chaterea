package com.chatapp.controller;

import com.chatapp.dto.admin.AuditLogResponse;
import com.chatapp.dto.admin.BanUserRequest;
import com.chatapp.security.CustomUserDetails;
import com.chatapp.service.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Every endpoint here requires ADMIN or MODERATOR, enforced at the method
 * level via @PreAuthorize (Spring Security method-level authorization),
 * independent of the coarser URL-pattern rule in SecurityConfig.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/users/{userId}/ban")
    public ResponseEntity<Void> banUser(@PathVariable UUID userId,
                                         @Valid @RequestBody BanUserRequest request,
                                         @AuthenticationPrincipal CustomUserDetails principal,
                                         HttpServletRequest httpRequest) {
        adminService.banUser(userId, principal.getUser(), request, httpRequest);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{userId}/unban")
    @PreAuthorize("hasRole('ADMIN')") // unban is admin-only, not moderator
    public ResponseEntity<Void> unbanUser(@PathVariable UUID userId,
                                           @AuthenticationPrincipal CustomUserDetails principal,
                                           HttpServletRequest httpRequest) {
        adminService.unbanUser(userId, principal.getUser(), httpRequest);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable UUID messageId,
                                               @AuthenticationPrincipal CustomUserDetails principal,
                                               HttpServletRequest httpRequest) {
        adminService.deleteAbusiveMessage(messageId, principal.getUser(), httpRequest);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<Page<AuditLogResponse>> listAuditLogs(Pageable pageable) {
        return ResponseEntity.ok(adminService.listAuditLogs(pageable));
    }
}
