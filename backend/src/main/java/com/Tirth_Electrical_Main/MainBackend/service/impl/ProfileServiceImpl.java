package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.profile.PasswordChangeRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.profile.ProfileResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.profile.ProfileUpdateRequestDto;
import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.entity.UserProfile;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.UserProfileRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import com.Tirth_Electrical_Main.MainBackend.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileServiceImpl implements ProfileService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public ProfileResponseDto getProfile(String email) {
        User user = findUser(email);
        UserProfile profile = profileRepository.findById(user.getId()).orElse(null);
        return mapToResponse(user, profile);
    }

    @Override
    @Transactional
    public ProfileResponseDto updateProfile(String email, ProfileUpdateRequestDto dto) {
        User user = findUser(email);
        user.setFullName(dto.getFullName().trim());
        user.setPhone(Labels.clean(dto.getPhone()));
        userRepository.save(user);

        UserProfile profile = profileRepository.findById(user.getId())
                .orElseGet(() -> UserProfile.builder().userId(user.getId()).build());
        profile.setDesignation(Labels.clean(dto.getDesignation()));
        profile.setLocation(Labels.clean(dto.getLocation()));
        profile.setAvatar(Labels.clean(dto.getAvatar()));
        profileRepository.save(profile);

        return mapToResponse(user, profile);
    }

    @Override
    @Transactional
    public void changePassword(String email, PasswordChangeRequestDto dto) {
        User user = findUser(email);

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Your current password is incorrect.");
        }
        if (passwordEncoder.matches(dto.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Choose a new password that is different from the current one.");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
    }

    private ProfileResponseDto mapToResponse(User user, UserProfile profile) {
        return ProfileResponseDto.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .phone(user.getPhone())
                .designation(profile == null ? null : profile.getDesignation())
                .location(profile == null ? null : profile.getLocation())
                .avatar(profile == null ? null : profile.getAvatar())
                .build();
    }
}
