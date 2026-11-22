package com.chatapp.service;

import com.chatapp.dto.notification.NotificationResponse;
import com.chatapp.entity.Notification;
import com.chatapp.entity.User;
import com.chatapp.enums.NotificationType;
import com.chatapp.repository.NotificationRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void notify(UUID userId, NotificationType type, Map<String, Object> payload) {
        User user = userRepository.getReferenceById(userId);

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .payload(payload)
                .read(false)
                .build();
        notification = notificationRepository.save(notification);

        NotificationResponse response = toResponse(notification);

        // Push in real time to the recipient if they have an active WebSocket
        // session; if not connected, it's still sitting in the DB for them to
        // fetch via GET /api/notifications on next login.
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications", response);
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> list(UUID userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public void markAsRead(UUID notificationId, UUID userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser().getId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(), n.getType().name(), n.getPayload(), n.isRead(), n.getCreatedAt());
    }
}
