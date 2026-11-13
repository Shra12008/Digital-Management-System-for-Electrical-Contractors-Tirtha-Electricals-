package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.config.JwtUtil;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.AuthResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.LoginRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.SignupRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.auth.UserResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.Role;
import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import com.Tirth_Electrical_Main.MainBackend.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Moved in from the landing/auth project's AuthService (business logic
 * unchanged; adapted to this app's interface+impl service convention and
 * the renamed DTOs).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Override
    public AuthResponseDto signup(SignupRequestDto request) {
        // POLICY: exact-case matching (see User.java's email field javadoc).
        // Only whitespace is trimmed - the case the user actually typed is
        // preserved and IS part of their identity. Must still check the
        // exact same form we're about to store below, for the same reason
        // as before: checking a form that differs from what gets stored
        // would let a real duplicate slip past this check.
        String normalizedEmail = request.getEmail().trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("An account with this email already exists.");
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(normalizedEmail)
                .phone(request.getPhone())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.LABOUR)
                .build();

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            // Don't assume every DB-constraint failure here means a duplicate
            // email - re-check what actually happened instead of guessing, so
            // a genuinely different failure (e.g. a stale check constraint)
            // isn't misreported to the user as "email already exists".
            log.error("Signup insert failed for {}", user.getEmail(), ex);
            if (userRepository.existsByEmail(user.getEmail())) {
                throw new IllegalArgumentException("An account with this email already exists.");
            }
            throw new IllegalArgumentException("Signup failed. Please try again.");
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return new AuthResponseDto(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }

    @Override
    public AuthResponseDto login(LoginRequestDto request) {
        // Same exact-case policy as signup - trimmed only, never case-folded.
        // "lewisTEMp@gmail.com" is now a DIFFERENT identity from
        // "lewistemp@gmail.com" as far as this app is concerned, even if
        // only one of them has ever actually been registered.
        String normalizedEmail = request.getEmail().trim();

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword()));
        } catch (BadCredentialsException ex) {
            throw new IllegalArgumentException("Incorrect email or password.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("Incorrect email or password."));

        String token = jwtUtil.generateToken(user.getEmail(), user.getId(), user.getRole().name());
        return new AuthResponseDto(token, user.getId(), user.getFullName(), user.getEmail(), user.getRole().name());
    }

    @Override
    public UserResponseDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Account not found."));

        return new UserResponseDto(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole().name());
    }
}
