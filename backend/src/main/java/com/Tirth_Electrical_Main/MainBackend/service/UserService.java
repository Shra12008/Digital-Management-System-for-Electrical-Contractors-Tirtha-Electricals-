package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.auth.UserResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.Role;

import java.util.List;

/**
 * Admin user management (ADMIN-only, enforced in SecurityConfig on
 * /users/**). Reuses UserResponseDto from the auth module rather than
 * defining a second "user summary" DTO for the same entity.
 */
public interface UserService {

    List<UserResponseDto> getAllUsers();

    UserResponseDto getUserById(Long id);

    UserResponseDto updateRole(Long id, Role newRole, String actingAdminEmail);
}
