package com.Tirth_Electrical_Main.MainBackend.dtos.finance;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRequestDto {

    @NotNull(message = "Transaction date is required.")
    private LocalDate date;

    @NotBlank(message = "Description is required.")
    @Size(max = 300, message = "Description can be at most 300 characters.")
    private String description;

    /**
     * Only "Expense" is accepted. Money in is generated from paid invoices, so
     * a manual income entry would double count - create an invoice instead.
     */
    @NotBlank(message = "Transaction type is required.")
    @Pattern(regexp = "(?i)expense",
            message = "Money in comes from invoices. Only money-out (Expense) entries can be added here.")
    private String type;

    @NotBlank(message = "Category is required.")
    @Size(max = 60, message = "Category is too long.")
    private String category;

    @Size(max = 150, message = "Party name is too long.")
    private String party;

    @Size(max = 40, message = "Payment method is too long.")
    private String method;

    @Size(max = 100, message = "Reference is too long.")
    private String reference;

    @NotNull(message = "Amount is required.")
    @DecimalMin(value = "0.0", inclusive = false, message = "Amount must be greater than 0.")
    @Digits(integer = 12, fraction = 2, message = "Amount can have at most 2 decimal places.")
    private BigDecimal amount;

    /** "Completed" or "Pending" (case-insensitive). Defaults to Completed. */
    @Pattern(regexp = "(?i)completed|pending", message = "Status must be Completed or Pending.")
    private String status;

    @Size(max = 500, message = "Notes can be at most 500 characters.")
    private String notes;
}
