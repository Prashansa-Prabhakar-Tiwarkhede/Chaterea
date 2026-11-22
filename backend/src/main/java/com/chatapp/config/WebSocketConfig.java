package com.chatapp.config;

import com.chatapp.websocket.WebSocketAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * STOMP over SockJS.
 *
 * Conventions used throughout the app:
 *  - Clients send to    /app/...                       (handled by @MessageMapping controllers)
 *  - Server broadcasts to a chat via /topic/chats/{chatId}          (messages, typing, read-receipts)
 *  - Server sends to a specific user via /user/queue/notifications  (per-user notification push)
 *  - Server sends to a specific user via /user/queue/presence       (friend online/offline updates)
 *
 * Authentication for the WebSocket handshake/session is done via the JWT
 * access token passed as a query param or STOMP CONNECT header and verified
 * in WebSocketAuthChannelInterceptor (see websocket package).
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor authChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // tightened via CORS at the HTTP layer; adjust for prod as needed
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}
