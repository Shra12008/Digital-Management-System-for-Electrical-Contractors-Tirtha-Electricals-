package com.Tirth_Electrical_Main.MainBackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/** Monthly spending limit for one expense category (primary key = category name). */
@Entity
@Table(name = "finance_budget")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FinanceBudget {

    @Id
    @Column(length = 60)
    private String category;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal monthlyLimit;
}
