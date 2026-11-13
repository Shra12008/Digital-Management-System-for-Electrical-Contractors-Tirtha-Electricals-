package com.Tirth_Electrical_Main.MainBackend.dtos.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PasswordChangeRequestDto {

    @NotBlank(message = "Current password is required.")
    private String currentPassword;

    @NotBlank(message = "New password is required.")
    @Size(min = 8, max = 100, message = "New password must be 8 to 100 characters.")
    private String newPassword;
}
