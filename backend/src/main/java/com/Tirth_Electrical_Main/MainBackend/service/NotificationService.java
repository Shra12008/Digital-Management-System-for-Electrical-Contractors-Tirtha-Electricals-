package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.notification.NotificationResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.NotificationType;

import java.util.List;

/**
 * Deliberately generic/domain-agnostic (title+message+a loose related-entity
 * pointer) so any future feature (project assignment, task assignment,
 * billing, etc. - see Phase 3 restrictions list) can reuse it without a new
 * column or method. Role-Upgrade-Request-specific EMAIL templates live in
 * EmailService instead, called separately by RoleUpgradeRequestServiceImpl -
 * see that class for how the two are wired together per notification event.
 */
public interface NotificationService {

    /**
     * Persists the notification first, then makes a best-effort attempt at
     * real-time WebSocket delivery. A WebSocket delivery failure (e.g. the
     * user isn't currently connected) never rolls back or fails this call -
     * the notification is already durably saved and will show up next time
     * the recipient loads their notification list regardless.
     */
    NotificationResponseDto notifyUser(Long recipientUserId, NotificationType type, String title, String message,
                                        Long relatedEntityId, String relatedEntityType);

    List<NotificationResponseDto> getMyNotifications(String email);

    List<NotificationResponseDto> getMyUnreadNotifications(String email);

    long getUnreadCount(String email);

    NotificationResponseDto markAsRead(Long id, String email);

    void markAllAsRead(String email);
}
