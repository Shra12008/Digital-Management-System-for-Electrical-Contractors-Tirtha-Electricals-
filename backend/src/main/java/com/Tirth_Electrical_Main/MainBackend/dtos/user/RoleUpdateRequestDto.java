package com.Tirth_Electrical_Main.MainBackend.dtos.user;

import com.Tirth_Electrical_Main.MainBackend.entity.Role;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RoleUpdateRequestDto {

    @NotNull(message = "role is required")
    private Role role;
}
