package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.auth.UserResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.Role;
import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import com.Tirth_Electrical_Main.MainBackend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public List<UserResponseDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    public UserResponseDto getUserById(Long id) {
        return toDto(findOrThrow(id));
    }

    @Override
    public UserResponseDto updateRole(Long id, Role newRole, String actingAdminEmail) {
        User user = findOrThrow(id);

        // Self-demotion guard: block an ADMIN from changing their OWN role
        // away from ADMIN through this endpoint, even if other admins
        // exist. This is a deliberate safety rail on top of the
        // last-ADMIN check below (which only fires when they're the only
        // one left) - accidentally clicking your own name away from ADMIN
        // shouldn't be possible at all, regardless of how many other
        // admins exist.
        boolean isActingOnSelf = user.getEmail().equalsIgnoreCase(actingAdminEmail);
        if (isActingOnSelf && user.getRole() == Role.ADMIN && newRole != Role.ADMIN) {
            throw new IllegalArgumentException("You can't change your own role away from ADMIN.");
        }

        // Don't allow the last ADMIN account to be demoted - that would
        // lock everyone out of user management with no way back in short
        // of a manual database edit.
        if (user.getRole() == Role.ADMIN && newRole != Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new IllegalArgumentException("Can't change this user's role - they're the last remaining ADMIN.");
        }

        user.setRole(newRole);
        return toDto(userRepository.save(user));
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private UserResponseDto toDto(User user) {
        return new UserResponseDto(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getRole().name());
    }
}
