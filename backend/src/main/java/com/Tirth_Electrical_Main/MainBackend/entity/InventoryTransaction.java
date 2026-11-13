package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "inventory_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transactionType;

    private Integer quantity;

    private LocalDate transactionDate;

    private String referenceNumber;

    @Column(length = 500)
    private String remarks;

    // NEW FIELD
    private String issuedBy;

    @ManyToOne
    @JoinColumn(name = "inventory_id")
    private Inventory inventory;
}