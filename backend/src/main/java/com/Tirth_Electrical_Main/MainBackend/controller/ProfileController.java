package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.profile.PasswordChangeRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.profile.ProfileResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.profile.ProfileUpdateRequestDto;
import com.Tirth_Electrical_Main.MainBackend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * The logged-in user's own profile. Every call is resolved from the JWT
 * (authentication.getName() = the user's email), so nobody can read or edit
 * someone else's profile through these endpoints.
 */
@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ProfileResponseDto getProfile(Authentication authentication) {
        return profileService.getProfile(authentication.getName());
    }

    @PutMapping
    public ProfileResponseDto updateProfile(Authentication authentication,
                                            @Valid @RequestBody ProfileUpdateRequestDto dto) {
        return profileService.updateProfile(authentication.getName(), dto);
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(Authentication authentication,
                                               @Valid @RequestBody PasswordChangeRequestDto dto) {
        profileService.changePassword(authentication.getName(), dto);
        return ResponseEntity.noContent().build();
    }
}
