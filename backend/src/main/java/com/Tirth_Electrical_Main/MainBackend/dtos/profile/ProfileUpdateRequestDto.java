package com.Tirth_Electrical_Main.MainBackend.dtos.profile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProfileUpdateRequestDto {

    @NotBlank(message = "Display name cannot be empty.")
    @Size(max = 100, message = "Display name can be at most 100 characters.")
    private String fullName;

    @Pattern(regexp = "^$|^[+0-9][0-9 \\-]{6,29}$", message = "Please enter a valid phone number.")
    private String phone;

    @Size(max = 80, message = "Designation can be at most 80 characters.")
    private String designation;

    @Size(max = 120, message = "Location can be at most 120 characters.")
    private String location;

    /** ~300 KB of base64 is far more than a 256x256 JPEG ever needs. */
    @Size(max = 300000, message = "That photo is too large. Please choose a smaller image.")
    private String avatar;
}
