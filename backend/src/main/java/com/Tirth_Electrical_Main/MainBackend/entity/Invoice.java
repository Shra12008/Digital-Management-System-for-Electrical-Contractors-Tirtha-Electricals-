package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Billing & Invoicing module. The grand total (amount) is always calculated
 * on the server from the line items, discount and GST rate - the client never
 * decides what an invoice is worth.
 */
@Entity
@Table(name = "invoice")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** INV-0001, INV-0002 ... assigned by InvoiceServiceImpl. */
    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String client;

    @Column(length = 500)
    private String clientAddress;

    @Column(length = 40)
    private String clientPhone;

    @Column(length = 150)
    private String clientEmail;

    @Column(length = 30)
    private String clientGstin;

    @Column(nullable = false)
    private LocalDate issueDate;

    @Column(nullable = false)
    private LocalDate dueDate;

    /** The day the money was received. Set when the invoice becomes PAID, cleared when it goes back to UNPAID. */
    @Column
    private LocalDate paidDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InvoiceStatus status;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal gstRate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal discount;

    /** Grand total including GST, after discount. */
    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(length = 2000)
    private String notes;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("lineNo ASC")
    @BatchSize(size = 50)
    @Builder.Default
    private List<InvoiceItem> items = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }

    /** Keeps both sides of the Invoice <-> InvoiceItem relationship in sync. */
    public void addItem(InvoiceItem item) {
        item.setInvoice(this);
        this.items.add(item);
    }
}
