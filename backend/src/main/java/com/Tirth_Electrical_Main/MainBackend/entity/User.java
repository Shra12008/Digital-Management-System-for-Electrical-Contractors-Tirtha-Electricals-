package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Moved in from the landing/auth project (com.tirth.electrical.model.User).
 * Table name and columns are unchanged so existing rows in the shared
 * MainDatabase are preserved.
 */
@Entity
@Table(name = "app_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    /**
     * EMAIL POLICY (exact-case matching, per explicit product decision):
     * only whitespace is trimmed on write and on lookup - the case the user
     * actually typed at signup is preserved and IS part of their identity.
     * "Lewis@x.com" and "lewis@x.com" are two different accounts if both
     * are registered. This is an unusual choice (most systems fold email
     * case) but is deliberate here, not an oversight - see chat history for
     * the reasoning and tradeoffs discussed before this was chosen.
     * Enforced consistently in AuthServiceImpl (signup/login) and
     * AdminSeeder - all three trim but never lowercase. The database's
     * plain @Column(unique) below already gives exact-match uniqueness
     * correctly on its own; no functional/case-folded index is used (a
     * prior version of this codebase briefly added one enforcing
     * case-INsensitive uniqueness - see
     * backend/sql/drop-case-insensitive-email-index.sql for why it was
     * reverted).
     */
    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String phone;

    @Column(nullable = false)
    private String passwordHash;

    /**
     * Self-signup always gets the lowest-privilege role (LABOUR).
     * Promotion to any other role happens later through an admin action
     * (see UserController), not through the public signup form.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.LABOUR;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }
}
