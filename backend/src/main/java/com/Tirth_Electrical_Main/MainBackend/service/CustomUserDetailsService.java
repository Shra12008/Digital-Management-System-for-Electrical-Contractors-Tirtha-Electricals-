package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Moved in from the landing/auth project (unchanged logic).
 *
 * Does NOT trim/normalize the incoming email itself - it trusts the caller
 * to have already done that (every current caller does: AuthServiceImpl
 * passes an already-trimmed email into the AuthenticationManager during
 * login, and JwtAuthFilter passes whatever's in the JWT subject, which is
 * always the stored - already-trimmed, exact-case - email to begin with).
 * Email matching in this app is exact-case (see User.java's email field
 * javadoc) - this class does no case-folding of its own, and shouldn't;
 * that would silently reintroduce case-insensitive login behind everyone's
 * back.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No account found for " + email));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPasswordHash())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())))
                .build();
    }
}
