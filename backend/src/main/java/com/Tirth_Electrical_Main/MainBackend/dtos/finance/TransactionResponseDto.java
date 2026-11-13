package com.Tirth_Electrical_Main.MainBackend.dtos.finance;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponseDto {

    private Long id;
    private LocalDate date;
    private String description;
    /** "Income" or "Expense". */
    private String type;
    private String category;
    private String party;
    private String method;
    private String reference;
    private BigDecimal amount;
    /** "Completed" or "Pending". */
    private String status;
    private String notes;
}
