package com.Tirth_Electrical_Main.MainBackend.dtos.invoice;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceItemDto {

    @NotBlank(message = "Every line item needs a description.")
    @Size(max = 500, message = "A line item description can be at most 500 characters.")
    private String description;

    @NotNull(message = "Every line item needs a quantity.")
    @DecimalMin(value = "0.0", inclusive = false, message = "Quantity must be greater than 0.")
    private BigDecimal qty;

    @NotNull(message = "Every line item needs a rate.")
    @DecimalMin(value = "0.0", message = "Rate cannot be negative.")
    private BigDecimal rate;
}
