package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.notification.NotificationResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.notification.UnreadCountResponseDto;
import com.Tirth_Electrical_Main.MainBackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Every method resolves "which user" from the JWT (Authentication.getName())
 * rather than a client-supplied id - same pattern as every other controller
 * in this app. There is no endpoint here that lets anyone create a
 * notification for someone else; notifications are only ever created
 * server-side by other services (see RoleUpgradeRequestServiceImpl) calling
 * NotificationService directly, never via this HTTP surface.
 */
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponseDto>> getMine(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getMyNotifications(authentication.getName()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponseDto>> getUnread(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getMyUnreadNotifications(authentication.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponseDto> getUnreadCount(Authentication authentication) {
        return ResponseEntity.ok(new UnreadCountResponseDto(notificationService.getUnreadCount(authentication.getName())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponseDto> markAsRead(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.markAsRead(id, authentication.getName()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
