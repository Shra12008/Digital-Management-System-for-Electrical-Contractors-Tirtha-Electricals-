package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.profile.PasswordChangeRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.profile.ProfileResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.profile.ProfileUpdateRequestDto;

public interface ProfileService {

    ProfileResponseDto getProfile(String email);

    ProfileResponseDto updateProfile(String email, ProfileUpdateRequestDto dto);

    void changePassword(String email, PasswordChangeRequestDto dto);
}
