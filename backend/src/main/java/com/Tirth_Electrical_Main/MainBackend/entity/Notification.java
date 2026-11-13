package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Flat-column entity (no @ManyToOne), matching this codebase's existing
 * convention - recipientId is a plain foreign key, resolved to a User only
 * where actually needed (nothing here currently needs the recipient's own
 * details echoed back, unlike RoleUpgradeRequest's requester/reviewer).
 *
 * relatedEntityId/relatedEntityType are a generic, loosely-typed link back
 * to whatever triggered the notification (e.g. a RoleUpgradeRequest id and
 * the literal string "ROLE_UPGRADE_REQUEST") - deliberately generic so this
 * entity doesn't need a new column every time a future feature (project
 * assignment, task assignment, billing, etc.) wants to send notifications
 * too.
 *
 * "is_read" is used instead of the bare word "read" as the actual column
 * name - not because "read" is reserved in Postgres (it isn't), but because
 * the entity field is a primitive boolean named `read`, and Lombok's
 * boolean getter naming (isRead()) reads oddly paired with a same-named
 * "read" column; an explicit name avoids any ambiguity. (See
 * RoleUpgradeRequest's currentRole/CURRENT_ROLE incident for why column
 * names get this much scrutiny in this codebase now.)
 */
@Entity
@Table(name = "notification")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long recipientId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    @Column
    private Long relatedEntityId;

    @Column
    private String relatedEntityType;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private Instant readAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
