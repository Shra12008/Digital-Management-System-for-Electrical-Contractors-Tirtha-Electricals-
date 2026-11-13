package com.Tirth_Electrical_Main.MainBackend.entity;

/**
 * ERP roles.
 *
 * Moved in from the landing/auth project's Role enum and extended with
 * ACCOUNTANT and CLIENT, and renamed LABOUR_MANAGER -> LABOUR_MANAGER and
 * WORKER -> LABOUR to match the agreed RBAC design.
 *
 * IMPORTANT: this enum is persisted with @Enumerated(EnumType.STRING), so
 * renaming values requires a one-time data migration for any existing rows.
 * See backend/sql/fix-role-constraint.sql for the exact migration and why
 * it's needed (Hibernate does not alter existing CHECK constraints on
 * ddl-auto=update, so a Java-side rename alone is not enough).
 *
 * Role alone does not grant project-level access - see ProjectAssignment
 * (not implemented yet - see SecurityConfig javadoc).
 */
public enum Role {
    ADMIN,
    PROJECT_MANAGER,
    LABOUR_MANAGER,
    LABOUR,
    ACCOUNTANT,
    CLIENT
}
