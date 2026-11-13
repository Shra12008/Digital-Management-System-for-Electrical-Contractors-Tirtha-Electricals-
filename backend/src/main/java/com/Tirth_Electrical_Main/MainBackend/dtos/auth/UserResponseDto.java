package com.Tirth_Electrical_Main.MainBackend.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserResponseDto {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String role;
}
