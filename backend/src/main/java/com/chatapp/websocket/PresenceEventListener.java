package com.chatapp.websocket;

import com.chatapp.dto.user.PresenceUpdate;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRelationshipRepository;
import com.chatapp.repository.UserRepository;
import com.chatapp.enums.RelationshipType;
import com.chatapp.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.Instant;

/**
 * A user is considered "online" while they have at least one active
 * WebSocket session. Presence changes are pushed only to that user's
 * friends (not broadcast globally), and blocked relationships never
 * receive presence updates in either direction.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PresenceEventListener {

    private final UserRepository userRepository;
    private final UserRelationshipRepository userRelationshipRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    @Transactional
    public void handleConnect(SessionConnectedEvent event) {
        CustomUserDetails principal = extractPrincipal(event);
        if (principal == null) return;

        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) return;

        user.setOnline(true);
        userRepository.save(user);

        broadcastPresenceToFriends(user, true);
    }

    @EventListener
    @Transactional
    public void handleDisconnect(SessionDisconnectEvent event) {
        CustomUserDetails principal = extractPrincipal(event);
        if (principal == null) return;

        User user = userRepository.findById(principal.getId()).orElse(null);
        if (user == null) return;

        user.setOnline(false);
        user.setLastSeenAt(Instant.now());
        userRepository.save(user);

        broadcastPresenceToFriends(user, false);
    }

    private void broadcastPresenceToFriends(User user, boolean online) {
        PresenceUpdate update = new PresenceUpdate(user.getId(), online, user.getLastSeenAt());

        userRelationshipRepository.findByUserIdAndRelationship(user.getId(), RelationshipType.FRIEND)
                .forEach(rel -> messagingTemplate.convertAndSendToUser(
                        rel.getOtherUser().getId().toString(), "/queue/presence", update));
    }

    private CustomUserDetails extractPrincipal(Object event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(
                event instanceof SessionConnectedEvent sce ? sce.getMessage() : ((SessionDisconnectEvent) event).getMessage());
        var user = accessor.getUser();
        if (user instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken token
                && token.getPrincipal() instanceof CustomUserDetails principal) {
            return principal;
        }
        return null;
    }
}
