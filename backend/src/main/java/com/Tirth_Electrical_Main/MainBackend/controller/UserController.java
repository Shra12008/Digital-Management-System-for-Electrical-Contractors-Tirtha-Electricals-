package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.auth.UserResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.user.RoleUpdateRequestDto;
import com.Tirth_Electrical_Main.MainBackend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin user management - was an empty stub. ADMIN-only, enforced in
 * SecurityConfig (.requestMatchers("/users/**").hasRole("ADMIN")), not just
 * here - this class has no @PreAuthorize of its own on purpose, matching
 * how every other controller in this app relies on SecurityConfig alone.
 *
 * This is the minimum viable version needed to test all six roles per the
 * integration request: list users, and change a user's role. It does not
 * yet do create/disable-user (the User entity has no "active"/"enabled"
 * flag - adding one is a separate decision, not something to invent here).
 */
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponseDto>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponseDto> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<UserResponseDto> updateRole(
            @PathVariable Long id, @Valid @RequestBody RoleUpdateRequestDto request, Authentication authentication) {
        return ResponseEntity.ok(userService.updateRole(id, request.getRole(), authentication.getName()));
    }
}
