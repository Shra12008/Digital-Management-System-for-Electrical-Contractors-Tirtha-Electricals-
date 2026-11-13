package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * A user's request to change their own role, and its review outcome.
 *
 * Follows this codebase's existing convention (Project/Labour/etc.) of flat
 * columns rather than @ManyToOne relations - requesterId/reviewerId are
 * plain foreign keys, resolved to names/emails in the service layer via
 * UserRepository, the same way AuthServiceImpl already does user lookups.
 *
 * currentRole is captured as a snapshot at submission time (not read live
 * from the User row) so a request's history stays meaningful even if the
 * requester's actual role changes later some other way.
 *
 * applicantFullName/contactEmail/contactPhone/idProofImage* are declared
 * identity info collected WITH the request (separate from the requester's
 * account profile) so a reviewer can manually verify who's actually asking
 * before granting a more privileged role.
 *
 * IMPORTANT - idProofImageBase64 is expected to hold a government ID photo
 * (e.g. Aadhaar) in this project's intended use. That is sensitive personal
 * data - in India specifically, Aadhaar data handling has legal
 * restrictions under the Aadhaar Act, 2016 (storage/processing is
 * restricted to UIDAI-authorized entities in many contexts). This
 * implementation does NOT add encryption-at-rest or any compliance
 * controls beyond restricting read access to the requester and authorized
 * reviewers (enforced in RoleUpgradeRequestServiceImpl, not here) - get
 * real legal/compliance guidance before storing real users' real ID
 * documents with this.
 *
 * New columns below are deliberately nullable at the DB level even though
 * the DTO requires them for new submissions - existing rows created before
 * this change have no value for them, and a NOT NULL column added to a
 * table that may already have rows fails the migration outright.
 */
@Entity
@Table(name = "role_upgrade_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleUpgradeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long requesterId;

    @Column
    private String applicantFullName;

    @Column
    private String contactEmail;

    @Column
    private String contactPhone;

    /** Base64-encoded image bytes. See class javadoc re: sensitivity of what this is expected to hold. */
    @Column(columnDefinition = "TEXT")
    private String idProofImageBase64;

    /** e.g. "image/jpeg" - needed to reconstruct a displayable data URI on the frontend. */
    @Column
    private String idProofImageContentType;

    @Enumerated(EnumType.STRING)
    // "current_role" is a reserved SQL keyword in PostgreSQL (the special
    // CURRENT_ROLE expression, same category as CURRENT_USER) - Hibernate's
    // default naming strategy would generate that exact column name from
    // this field and Postgres rejects it as a syntax error. Explicit
    // @Column name avoids the collision entirely.
    @Column(name = "requester_current_role", nullable = false)
    private Role currentRole;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role requestedRole;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @Column
    private Long reviewerId;

    @Column(length = 1000)
    private String reviewerComment;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column
    private Instant reviewedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
