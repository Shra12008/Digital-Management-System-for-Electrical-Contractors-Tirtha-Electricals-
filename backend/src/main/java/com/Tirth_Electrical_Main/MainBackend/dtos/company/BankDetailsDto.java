package com.Tirth_Electrical_Main.MainBackend.dtos.company;

import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BankDetailsDto {

    @Size(max = 255, message = "Bank account name is too long.")
    private String accountName;

    @Size(max = 255, message = "Bank name is too long.")
    private String bankName;

    @Size(max = 40, message = "Account number is too long.")
    private String accountNumber;

    @Size(max = 20, message = "IFSC is too long.")
    private String ifsc;

    @Size(max = 80, message = "UPI ID is too long.")
    private String upi;
}
