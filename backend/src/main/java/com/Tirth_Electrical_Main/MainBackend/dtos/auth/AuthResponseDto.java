package com.Tirth_Electrical_Main.MainBackend.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponseDto {
    private String token;
    private Long userId;
    private String fullName;
    private String email;
    private String role;
}
