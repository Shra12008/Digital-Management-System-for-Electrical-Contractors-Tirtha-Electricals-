package com.Tirth_Electrical_Main.MainBackend.dtos.invoice;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponseDto {

    private Long id;
    private String code;
    private String title;
    private String client;
    private String clientAddress;
    private String clientPhone;
    private String clientEmail;
    private String clientGstin;
    private LocalDate issueDate;
    private LocalDate dueDate;
    /** Day the payment was received (null while unpaid). Money-in on the finance page is dated by this. */
    private LocalDate paidDate;
    /** "Paid" or "Unpaid". The UI derives "Overdue" from dueDate. */
    private String status;
    private BigDecimal gstRate;
    private BigDecimal discount;
    /** Grand total, calculated by the server. */
    private BigDecimal amount;
    private String notes;
    private List<InvoiceItemDto> items;
    private Instant createdAt;
}
