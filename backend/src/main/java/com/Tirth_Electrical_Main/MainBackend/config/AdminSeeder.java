package com.Tirth_Electrical_Main.MainBackend.config;

import com.Tirth_Electrical_Main.MainBackend.entity.Role;
import com.Tirth_Electrical_Main.MainBackend.entity.User;
import com.Tirth_Electrical_Main.MainBackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Creates the first ADMIN account on startup, but only when BOTH of these
 * hold:
 *   1. No ADMIN account exists yet in app_user.
 *   2. app.admin-seed.password (ADMIN_SEED_PASSWORD env var) was actually
 *      set.
 *
 * No hardcoded password anywhere - if you don't set the env var, this
 * simply does nothing and logs how to set it (it does not fail startup;
 * the rest of the ERP must keep working either way).
 *
 * Usage (one-time, then unset it if you like - the "no ADMIN exists yet"
 * check means it won't run again):
 *   ADMIN_SEED_EMAIL=admin@yourcompany.com ADMIN_SEED_PASSWORD=<a real password> ./mvnw spring-boot:run
 *
 * After this account exists, use it to log in and PATCH /api/users/{id}/role
 * to promote/create further users - see UserController.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin-seed.email:admin@tirth-electrical.local}")
    private String seedEmail;

    @Value("${app.admin-seed.password:}")
    private String seedPassword;

    @Value("${app.admin-seed.full-name:Administrator}")
    private String seedFullName;

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.countByRole(Role.ADMIN) > 0) {
            return; // an ADMIN already exists - never touch it, never re-seed
        }

        if (seedPassword == null || seedPassword.isBlank()) {
            log.warn("""

                    ================================================================
                    No ADMIN account exists yet, and ADMIN_SEED_PASSWORD is not set,
                    so none was created. To create the first ADMIN, set both env vars
                    and restart:
                        ADMIN_SEED_EMAIL=admin@yourcompany.com
                        ADMIN_SEED_PASSWORD=<a real password, not this text>
                    ================================================================
                    """);
            return;
        }

        // Same exact-case policy as AuthServiceImpl.signup() - trimmed only,
        // never case-folded. Must still check the exact form we're about to
        // store, or a differently-formatted ADMIN_SEED_EMAIL could slip past
        // this check and crash on the database's unique constraint instead
        // of failing gracefully here.
        String normalizedEmail = seedEmail.trim();
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("ADMIN_SEED_PASSWORD was set, but {} is already taken by a non-admin account - "
                    + "pick a different ADMIN_SEED_EMAIL and restart.", normalizedEmail);
            return;
        }

        User admin = User.builder()
                .fullName(seedFullName)
                .email(normalizedEmail)
                .passwordHash(passwordEncoder.encode(seedPassword))
                .role(Role.ADMIN)
                .build();
        userRepository.save(admin);

        log.warn("Created the first ADMIN account ({}). You can log in with it now.", normalizedEmail);
    }
}
