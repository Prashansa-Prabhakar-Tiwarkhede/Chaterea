package com.chatapp.websocket;

import com.chatapp.security.CustomUserDetailsService;
import com.chatapp.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

/**
 * Runs on every inbound STOMP frame. On CONNECT, extracts the JWT (sent as a
 * header: "Authorization: Bearer <token>") and, if valid, attaches a
 * Principal to the STOMP session so that:
 *  - @MessageMapping handlers can use Principal / Authentication as usual
 *  - SimpMessagingTemplate.convertAndSendToUser(...) can resolve "the user"
 *    for /user/queue/** destinations
 */
@Component
@RequiredArgsConstructor
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = firstHeader(accessor, "Authorization");
            String token = null;

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            } else {
                // Fallback: allow ?token=... on the SockJS handshake URL for
                // browser clients where setting a CONNECT header is awkward.
                token = firstHeader(accessor, "token");
            }

            if (token != null && jwtService.isTokenValid(token)) {
                UUID userId = jwtService.extractUserId(token);
                UserDetails userDetails = userDetailsService.loadUserById(userId);
                var authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                accessor.setUser(authentication);
            }
        }

        return message;
    }

    private String firstHeader(StompHeaderAccessor accessor, String name) {
        List<String> values = accessor.getNativeHeader(name);
        return (values == null || values.isEmpty()) ? null : values.get(0);
    }
}
