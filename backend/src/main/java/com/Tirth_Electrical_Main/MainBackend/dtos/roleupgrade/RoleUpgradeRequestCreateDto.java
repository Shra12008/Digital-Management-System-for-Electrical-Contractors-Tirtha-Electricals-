package com.Tirth_Electrical_Main.MainBackend.dtos.roleupgrade;

import com.Tirth_Electrical_Main.MainBackend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RoleUpgradeRequestCreateDto {

    @NotNull(message = "requestedRole is required")
    private Role requestedRole;

    @NotBlank(message = "A reason is required")
    @Size(max = 1000, message = "Reason must be 1000 characters or fewer")
    private String reason;

    @NotBlank(message = "Full name is required")
    @Size(max = 150, message = "Full name must be 150 characters or fewer")
    private String applicantFullName;

    @NotBlank(message = "Contact email is required")
    @Email(message = "Enter a valid email")
    private String contactEmail;

    @NotBlank(message = "Contact phone is required")
    @Size(max = 20, message = "Phone number looks too long")
    private String contactPhone;

    // Raw base64 (no "data:image/...;base64," prefix - the frontend strips
    // that before sending). Byte-size limit is enforced in the service, not
    // here, since a character-count annotation on the base64 string is a
    // poor proxy for the actual decoded image size.
    @NotBlank(message = "An ID proof image is required")
    private String idProofImageBase64;

    @NotBlank(message = "idProofImageContentType is required")
    private String idProofImageContentType;
}
