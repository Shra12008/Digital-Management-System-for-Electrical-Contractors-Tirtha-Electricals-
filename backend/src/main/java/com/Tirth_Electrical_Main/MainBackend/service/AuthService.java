package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.auth.AuthResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.LoginRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.SignupRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.UserResponseDto;

public interface AuthService {

    AuthResponseDto signup(SignupRequestDto requestDto);

    AuthResponseDto login(LoginRequestDto requestDto);

    UserResponseDto getCurrentUser(String email);
}
