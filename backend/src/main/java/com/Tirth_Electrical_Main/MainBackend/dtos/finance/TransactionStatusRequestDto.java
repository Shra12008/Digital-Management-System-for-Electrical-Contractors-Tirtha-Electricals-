package com.Tirth_Electrical_Main.MainBackend.dtos.finance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransactionStatusRequestDto {

    @NotBlank(message = "Status is required.")
    @Pattern(regexp = "(?i)completed|pending", message = "Status must be Completed or Pending.")
    private String status;
}
