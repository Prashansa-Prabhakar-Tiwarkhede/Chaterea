package com.chatapp.service;

import com.chatapp.dto.admin.AuditLogResponse;
import com.chatapp.dto.admin.BanUserRequest;
import com.chatapp.entity.AuditLog;
import com.chatapp.entity.Message;
import com.chatapp.entity.User;
import com.chatapp.enums.UserStatus;
import com.chatapp.exception.NotFoundException;
import com.chatapp.repository.AuditLogRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Actions available only to ADMIN / MODERATOR (enforced via @PreAuthorize on
 * AdminController, per Spring Security method-level authorization).
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final AuditLogRepository auditLogRepository;
    private final RefreshTokenService refreshTokenService;
    private final AuditLogService auditLogService;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void banUser(UUID targetUserId, User actingAdmin, BanUserRequest request, HttpServletRequest httpRequest) {
        User target = userRepository.findById(targetUserId).orElseThrow(() -> new NotFoundException("User not found"));

        target.setStatus(UserStatus.BANNED);
        target.setOnline(false);
        userRepository.save(target);

        refreshTokenService.revokeAllForUser(target);

        auditLogService.log(actingAdmin, "ADMIN_BAN_USER", "User", target.getId(), httpRequest,
                Map.of("reason", request.reason()));
    }

    @Transactional
    public void unbanUser(UUID targetUserId, User actingAdmin, HttpServletRequest httpRequest) {
        User target = userRepository.findById(targetUserId).orElseThrow(() -> new NotFoundException("User not found"));
        target.setStatus(UserStatus.ACTIVE);
        userRepository.save(target);

        auditLogService.log(actingAdmin, "ADMIN_UNBAN_USER", "User", target.getId(), httpRequest, Map.of());
    }

    @Transactional
    public void deleteAbusiveMessage(UUID messageId, User actingAdmin, HttpServletRequest httpRequest) {
        Message message = messageRepository.findById(messageId).orElseThrow(() -> new NotFoundException("Message not found"));

        message.setDeletedForEveryone(true);
        message.setDeletedAt(Instant.now());
        message.setCiphertext("");
        message.setSignature("");
        messageRepository.save(message);

        messagingTemplate.convertAndSend("/topic/chats/" + message.getChat().getId(),
                Map.of("type", "MESSAGE_DELETED", "messageId", message.getId().toString()));

        auditLogService.log(actingAdmin, "ADMIN_DELETE_MESSAGE", "Message", message.getId(), httpRequest, Map.of());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> listAuditLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable).map(this::toResponse);
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActor() != null ? log.getActor().getId() : null,
                log.getActor() != null ? log.getActor().getDisplayName() : "system",
                log.getAction(), log.getTargetType(), log.getTargetId(),
                log.getIpAddress(), log.getMetadata(), log.getCreatedAt());
    }
}
