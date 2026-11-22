package com.chatapp.service;

import com.chatapp.entity.AuditLog;
import com.chatapp.entity.User;
import com.chatapp.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void log(User actor, String action, String targetType, UUID targetId,
                     HttpServletRequest request, Map<String, Object> metadata) {
        AuditLog entry = AuditLog.builder()
                .actor(actor)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .ipAddress(request != null ? extractClientIp(request) : null)
                .userAgent(request != null ? request.getHeader("User-Agent") : null)
                .metadata(metadata != null ? metadata : Map.of())
                .build();
        auditLogRepository.save(entry);
    }

    public void log(User actor, String action, HttpServletRequest request) {
        log(actor, action, null, null, request, Map.of());
    }

    /** Respects X-Forwarded-For when running behind a proxy/load balancer (Render, etc). */
    public static String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
