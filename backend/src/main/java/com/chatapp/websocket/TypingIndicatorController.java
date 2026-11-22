package com.chatapp.websocket;

import com.chatapp.dto.chat.TypingIndicatorMessage;
import com.chatapp.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

/**
 * Real-time, ephemeral signals that don't need to be persisted: typing
 * indicators. (Messages themselves, read receipts, and presence are
 * broadcast from ChatService / PresenceEventListener respectively, since
 * those need to touch the database first.)
 *
 * Client sends to:   /app/chats/{chatId}/typing
 * Server broadcasts: /topic/chats/{chatId}  (payload has a "typing" boolean)
 */
@Controller
@RequiredArgsConstructor
public class TypingIndicatorController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chats/{chatId}/typing")
    public void typing(@org.springframework.messaging.handler.annotation.DestinationVariable String chatId,
                        TypingBody body,
                        Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails principal)) {
            return;
        }

        TypingIndicatorMessage message = new TypingIndicatorMessage(
                java.util.UUID.fromString(chatId),
                principal.getId(),
                principal.getUser().getDisplayName(),
                body.typing()
        );

        messagingTemplate.convertAndSend("/topic/chats/" + chatId, message);
    }

    public record TypingBody(boolean typing) {}
}
