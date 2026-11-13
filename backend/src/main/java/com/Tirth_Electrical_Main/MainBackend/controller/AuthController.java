package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.auth.AuthResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.LoginRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.SignupRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.UserResponseDto;
import com.Tirth_Electrical_Main.MainBackend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Moved in from the landing/auth project.
 *
 * NOTE: mapped to "/auth" (not "/api/auth") because this app already sets
 * server.servlet.context-path=/api, matching the convention used by every
 * other controller in this codebase (ProjectController -> "/projects",
 * etc). The landing project mapped this as "/api/auth" because it had no
 * context-path of its own - keeping that literally would have resolved to
 * /api/api/auth here.
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponseDto> signup(@Valid @RequestBody SignupRequestDto request) {
        return ResponseEntity.ok(authService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@Valid @RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** Returns the logged-in user, resolved from the JWT set by JwtAuthFilter. Requires Authorization: Bearer <token>. */
    @GetMapping("/me")
    public ResponseEntity<UserResponseDto> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }
}
