package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Single-row table (id is always 1): company details printed on invoices,
 * invoice defaults and the opening cash balance used by the finance charts.
 */
@Entity
@Table(name = "company_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanySettings {

    public static final Long SINGLETON_ID = 1L;

    @Id
    private Long id;

    private String name;
    private String tagline;
    private String addressLine;

    @Column(length = 40)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(length = 30)
    private String gstin;

    private String bankAccountName;
    private String bankName;

    @Column(length = 40)
    private String bankAccountNumber;

    @Column(length = 20)
    private String bankIfsc;

    @Column(length = 80)
    private String bankUpi;

    /** One term per line. */
    @Column(columnDefinition = "TEXT")
    private String terms;

    private Integer defaultGst;

    private Integer dueDays;

    @Column(precision = 14, scale = 2)
    private BigDecimal openingBalance;
}
