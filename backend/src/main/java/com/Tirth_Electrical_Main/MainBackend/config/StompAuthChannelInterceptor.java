package com.Tirth_Electrical_Main.MainBackend.config;

import com.Tirth_Electrical_Main.MainBackend.service.CustomUserDetailsService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;

/**
 * WebSocket handshakes over plain HTTP can't easily carry a custom
 * Authorization header from browser JS (the native WebSocket constructor
 * doesn't support custom headers at all), so JWT auth for this app's
 * WebSocket happens one layer up, at the STOMP protocol level instead: the
 * frontend's stomp.js client sends the JWT as a STOMP header on the CONNECT
 * frame (see NotificationContext.jsx - connectHeaders: { Authorization }),
 * and this interceptor validates it exactly the same way JwtAuthFilter does
 * for ordinary HTTP requests, then attaches the resulting Authentication to
 * the STOMP session (accessor.setUser(...)). That's what lets
 * SimpMessagingTemplate.convertAndSendToUser(email, ...) address this
 * specific session later - see NotificationServiceImpl.pushRealtime.
 *
 * The underlying HTTP handshake to /ws itself is left publicly reachable in
 * SecurityConfig (.requestMatchers("/ws/**").permitAll()) - it carries no
 * sensitive data on its own, and a connection that never sends a valid
 * CONNECT frame here is simply never associated with any user and can't
 * subscribe to anyone's notification queue.
 */
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing or malformed Authorization header on STOMP CONNECT.");
            }

            String token = authHeader.substring(7);
            try {
                String email = jwtUtil.extractEmail(token);
                if (email == null || !jwtUtil.isTokenValid(token, email)) {
                    throw new IllegalArgumentException("Invalid or expired token.");
                }

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                Authentication authentication =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                accessor.setUser(authentication);
            } catch (JwtException ex) {
                throw new IllegalArgumentException("Invalid or expired token.", ex);
            }
        }

        return message;
    }
}
