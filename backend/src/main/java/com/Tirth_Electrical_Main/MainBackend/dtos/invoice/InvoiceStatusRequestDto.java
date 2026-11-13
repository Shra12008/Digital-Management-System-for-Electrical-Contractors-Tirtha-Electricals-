package com.Tirth_Electrical_Main.MainBackend.dtos.invoice;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceStatusRequestDto {

    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "(?i)paid|unpaid", message = "Status must be Paid or Unpaid.")
    private String status;

    /** Optional: day the money was received (only used when marking Paid). Defaults to today. */
    private LocalDate paidDate;
}
