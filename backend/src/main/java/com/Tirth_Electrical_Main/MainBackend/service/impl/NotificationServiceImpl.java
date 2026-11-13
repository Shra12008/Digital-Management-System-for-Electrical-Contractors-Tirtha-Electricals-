package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.notification.NotificationResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.Notification;
import com.Tirth_Electrical_Main.MainBackend.entity.NotificationType;
import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.NotificationRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import com.Tirth_Electrical_Main.MainBackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public NotificationResponseDto notifyUser(Long recipientUserId, NotificationType type, String title, String message,
                                               Long relatedEntityId, String relatedEntityType) {
        Notification entity = Notification.builder()
                .recipientId(recipientUserId)
                .type(type)
                .title(title)
                .message(message)
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .read(false)
                .build();

        // DB persistence happens first and unconditionally, per the Phase 3
        // requirement - everything below this line is best-effort delivery
        // on top of an already-durable record.
        entity = notificationRepository.save(entity);
        NotificationResponseDto dto = toDto(entity);

        pushRealtime(recipientUserId, dto);

        return dto;
    }

    /**
     * Best-effort WebSocket push. Deliberately swallows and logs any failure
     * (recipient not connected, broker hiccup, etc.) rather than letting it
     * propagate - the caller's business operation (e.g. approving a role
     * request) must succeed regardless of whether real-time delivery works.
     */
    private void pushRealtime(Long recipientUserId, NotificationResponseDto dto) {
        try {
            User recipient = userRepository.findById(recipientUserId).orElse(null);
            if (recipient == null) {
                return; // nothing to push to - the DB row is still saved either way
            }
            // Addressed by email, matching this app's existing convention of
            // using email as the principal name everywhere else (JWT subject,
            // Authentication.getName(), etc.) - see StompAuthChannelInterceptor
            // for where the STOMP session gets that same identity attached.
            messagingTemplate.convertAndSendToUser(recipient.getEmail(), "/queue/notifications", dto);
        } catch (Exception ex) {
            log.warn("Real-time delivery failed for notification {} - it is still saved and will show up on next load.", dto.getId(), ex);
        }
    }

    @Override
    public List<NotificationResponseDto> getMyNotifications(String email) {
        User user = findUserByEmail(email);
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toDto).toList();
    }

    @Override
    public List<NotificationResponseDto> getMyUnreadNotifications(String email) {
        User user = findUserByEmail(email);
        return notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toDto).toList();
    }

    @Override
    public long getUnreadCount(String email) {
        User user = findUserByEmail(email);
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    @Override
    public NotificationResponseDto markAsRead(Long id, String email) {
        User user = findUserByEmail(email);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found."));

        if (!notification.getRecipientId().equals(user.getId())) {
            // Deliberately the same message as "not found" - confirming a
            // notification ID exists but belongs to someone else is itself
            // a (minor) information leak, same reasoning as 404-vs-403 for
            // other people's resources elsewhere in this app.
            throw new ResourceNotFoundException("Notification not found.");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return toDto(notification);
    }

    @Override
    public void markAllAsRead(String email) {
        User user = findUserByEmail(email);
        List<Notification> unread = notificationRepository.findByRecipientIdAndReadFalseOrderByCreatedAtDesc(user.getId());
        Instant now = Instant.now();
        for (Notification n : unread) {
            n.setRead(true);
            n.setReadAt(now);
        }
        notificationRepository.saveAll(unread);
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found."));
    }

    private NotificationResponseDto toDto(Notification n) {
        return new NotificationResponseDto(
                n.getId(),
                n.getType().name(),
                n.getTitle(),
                n.getMessage(),
                n.getRelatedEntityId(),
                n.getRelatedEntityType(),
                n.isRead(),
                n.getCreatedAt(),
                n.getReadAt()
        );
    }
}
