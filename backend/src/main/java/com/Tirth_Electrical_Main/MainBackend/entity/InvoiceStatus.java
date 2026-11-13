package com.Tirth_Electrical_Main.MainBackend.entity;

/** Stored by name (PAID / UNPAID). "Overdue" is not stored - it is derived from dueDate on the client. */
public enum InvoiceStatus {
    PAID,
    UNPAID
}
