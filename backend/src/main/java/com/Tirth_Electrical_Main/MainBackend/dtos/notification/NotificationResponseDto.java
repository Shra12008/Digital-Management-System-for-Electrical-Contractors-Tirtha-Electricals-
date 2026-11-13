package com.Tirth_Electrical_Main.MainBackend.dtos.notification;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.Instant;

@Data
@AllArgsConstructor
public class NotificationResponseDto {
    private Long id;
    private String type;
    private String title;
    private String message;
    private Long relatedEntityId;
    private String relatedEntityType;
    private boolean read;
    private Instant createdAt;
    private Instant readAt;
}
