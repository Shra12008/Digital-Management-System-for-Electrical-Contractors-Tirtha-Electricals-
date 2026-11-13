package com.Tirth_Electrical_Main.MainBackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Plain WebSocket endpoint (no SockJS) - this app targets modern browsers
 * directly, and skipping the SockJS fallback avoids adding sockjs-client as
 * a new frontend dependency for a capability (long-polling fallback for
 * ancient browsers/corporate proxies) this internal ERP tool doesn't need.
 *
 * /topic and /queue are both enabled on the simple in-memory broker:
 * /queue is what's actually used (per-user notification delivery via
 * convertAndSendToUser, which routes through /user/queue/notifications
 * under the hood); /topic is enabled for future broadcast-style use
 * (e.g. a future "system-wide announcement" notification) even though
 * nothing publishes to it yet.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:3000");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
