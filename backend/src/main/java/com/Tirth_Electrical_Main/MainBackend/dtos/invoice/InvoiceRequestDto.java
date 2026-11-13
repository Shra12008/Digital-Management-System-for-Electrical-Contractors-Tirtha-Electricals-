package com.Tirth_Electrical_Main.MainBackend.dtos.invoice;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Create / full-update body. Note there is no "amount" or "code" here on
 * purpose: the server calculates the total and assigns the invoice number.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceRequestDto {

    @NotBlank(message = "Client name is required.")
    @Size(max = 255, message = "Client name is too long.")
    private String client;

    @NotBlank(message = "Project / work description is required.")
    @Size(max = 255, message = "Project description is too long.")
    private String title;

    @Size(max = 500, message = "Client address is too long.")
    private String clientAddress;

    @Size(max = 40, message = "Client phone is too long.")
    private String clientPhone;

    @Email(message = "Please enter a valid client email.")
    @Size(max = 150, message = "Client email is too long.")
    private String clientEmail;

    @Size(max = 30, message = "Client GSTIN is too long.")
    private String clientGstin;

    @NotNull(message = "Issue date is required.")
    private LocalDate issueDate;

    @NotNull(message = "Due date is required.")
    private LocalDate dueDate;

    /** Optional: the day payment was received. Only used when status is Paid; defaults to today. */
    private LocalDate paidDate;

    /** "Paid" or "Unpaid" (case-insensitive). Defaults to Unpaid. */
    @Pattern(regexp = "(?i)paid|unpaid", message = "Status must be Paid or Unpaid.")
    private String status;

    @DecimalMin(value = "0", message = "GST rate cannot be negative.")
    @DecimalMax(value = "100", message = "GST rate cannot be above 100%.")
    private BigDecimal gstRate;

    @DecimalMin(value = "0", message = "Discount cannot be negative.")
    private BigDecimal discount;

    @Size(max = 2000, message = "Notes can be at most 2000 characters.")
    private String notes;

    @NotEmpty(message = "Add at least one line item.")
    @Valid
    private List<InvoiceItemDto> items;
}
