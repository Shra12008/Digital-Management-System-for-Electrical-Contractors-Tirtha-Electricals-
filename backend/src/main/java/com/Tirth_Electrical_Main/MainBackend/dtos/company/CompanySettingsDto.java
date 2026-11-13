package com.Tirth_Electrical_Main.MainBackend.dtos.company;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

/** Same shape the React app already uses for its company object, plus the invoice/finance defaults. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanySettingsDto {

    @NotBlank(message = "Company name is required.")
    @Size(max = 255, message = "Company name is too long.")
    private String name;

    @Size(max = 255, message = "Tagline is too long.")
    private String tagline;

    @Size(max = 255, message = "Address is too long.")
    private String addressLine;

    @Size(max = 40, message = "Phone is too long.")
    private String phone;

    @Email(message = "Please enter a valid company email.")
    @Size(max = 150, message = "Company email is too long.")
    private String email;

    @Size(max = 30, message = "GSTIN is too long.")
    private String gstin;

    @Valid
    private BankDetailsDto bank;

    @Size(max = 20, message = "Add at most 20 terms.")
    private List<@Size(max = 300, message = "A term can be at most 300 characters.") String> terms;

    @Min(value = 0, message = "Default GST cannot be negative.")
    @Max(value = 100, message = "Default GST cannot be above 100%.")
    private Integer defaultGst;

    @Min(value = 0, message = "Payment due days cannot be negative.")
    @Max(value = 365, message = "Payment due days cannot be above 365.")
    private Integer dueDays;

    @DecimalMin(value = "0", message = "Opening balance cannot be negative.")
    @Digits(integer = 12, fraction = 2, message = "Opening balance can have at most 2 decimal places.")
    private BigDecimal openingBalance;
}
