package com.Tirth_Electrical_Main.MainBackend.service.impl;

/**
 * The React app talks in friendly labels ("Paid", "Income", "Completed") while
 * the database stores enum names (PAID, INCOME, COMPLETED). These two helpers
 * convert between them in one place.
 */
final class Labels {

    private Labels() {
    }

    /** PAID -> "Paid". */
    static String pretty(Enum<?> value) {
        String name = value.name();
        return name.charAt(0) + name.substring(1).toLowerCase();
    }

    /** "paid" / "Paid" / "PAID" -> PAID; blank or null -> fallback. */
    static <E extends Enum<E>> E parse(Class<E> type, String value, E fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid value: " + value);
        }
    }

    /** Trims; blank becomes null so the database stores NULL instead of empty strings. */
    static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
