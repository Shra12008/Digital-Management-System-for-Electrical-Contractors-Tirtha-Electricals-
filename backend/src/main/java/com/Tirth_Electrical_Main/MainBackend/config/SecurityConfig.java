package com.Tirth_Electrical_Main.MainBackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Moved in from the landing/auth project and adapted for the merged app.
 *
 * Role-based rules below are coarse (role-level only) - there is no
 * project-level scoping yet (e.g. a LABOUR_MANAGER can currently read/act on
 * every project's daily work, not just projects they're assigned to).
 * That requires a ProjectAssignment entity that doesn't exist in this
 * codebase yet, and is a deliberately separate, later piece of work.
 *
 * Billing (/invoices), Finance (/finance), /company-settings and /profile are
 * now real modules too - see the matchers below. ACCOUNTANT still doesn't get
 * Projects/Labour/DailyWork/Inventory access (by design - per the agreed
 * module table). /users/** (UserController) is real and ADMIN-only.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CustomAuthEntryPoint authEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider(
            com.Tirth_Electrical_Main.MainBackend.service.CustomUserDetailsService uds, PasswordEncoder encoder) {
        // Spring Security 7: DaoAuthenticationProvider's UserDetailsService is now a
        // final field, set only through the constructor - the old no-arg constructor
        // + setUserDetailsService(...) pattern was removed. setPasswordEncoder(...) is
        // still a valid setter, so only the construction line changes.
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(uds);
        provider.setPasswordEncoder(encoder);
        return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(eh -> eh
                        .authenticationEntryPoint(authEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/signup", "/auth/login").permitAll()
                        .requestMatchers("/public/**").permitAll()
                        // STOMP CONNECT does its own JWT check (see
                        // StompAuthChannelInterceptor) - the HTTP handshake
                        // itself carries no sensitive data and an
                        // unauthenticated connection can't subscribe to
                        // anyone's notification queue.
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/auth/me").authenticated()

                        // ---- /projects ----
                        // Read: everyone with a real ERP role. Write: PM/Admin only.
                        // (Project-level scoping for LABOUR_MANAGER/LABOUR/CLIENT is not
                        // implemented yet - see class javadoc.)
                        .requestMatchers(HttpMethod.GET, "/projects/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER", "LABOUR", "CLIENT")
                        .requestMatchers(HttpMethod.POST, "/projects/**", "/projects")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/projects/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/projects/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER")

                        // ---- /labours (HR-facing; LABOUR should NOT access "Labour
                        // management" per the agreed module table - no read either) ----
                        .requestMatchers(HttpMethod.GET, "/labours/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/labours/**", "/labours")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/labours/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/labours/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")

                        // ---- /daily-work (workers log their own site activity) ----
                        .requestMatchers(HttpMethod.GET, "/daily-work/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER", "LABOUR")
                        .requestMatchers(HttpMethod.POST, "/daily-work/**", "/daily-work")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER", "LABOUR")
                        .requestMatchers(HttpMethod.PUT, "/daily-work/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER", "LABOUR")
                        .requestMatchers(HttpMethod.DELETE, "/daily-work/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")

                        // ---- /inventory + /inventory-transaction ----
                        // Per the agreed module table, only ADMIN/PROJECT_MANAGER/
                        // LABOUR_MANAGER can access Inventory at all - ACCOUNTANT and
                        // LABOUR are both explicitly excluded now.
                        .requestMatchers(HttpMethod.GET, "/inventory/**", "/inventory-transaction/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")
                        .requestMatchers(HttpMethod.POST, "/inventory/**", "/inventory", "/inventory-transaction/**", "/inventory-transaction")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")
                        .requestMatchers(HttpMethod.PUT, "/inventory/**", "/inventory-transaction/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")
                        .requestMatchers(HttpMethod.DELETE, "/inventory/**", "/inventory-transaction/**")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER", "LABOUR_MANAGER")

                        // ---- /users (admin user management - see UserController) ----
                        .requestMatchers("/users/**").hasRole("ADMIN")

                        // ---- /role-requests (Phase 2 - Role Upgrade Requests) ----
                        // ADMIN can't submit (they're already top role - enforced here
                        // AND in the service, since it's true regardless of caller).
                        // Fine-grained rules a path matcher can't express (self-approval,
                        // PROJECT_MANAGER's per-request review scope, request ownership
                        // for GET /{id}) live in RoleUpgradeRequestServiceImpl instead.
                        .requestMatchers(HttpMethod.POST, "/role-requests")
                            .hasAnyRole("PROJECT_MANAGER", "LABOUR_MANAGER", "LABOUR", "ACCOUNTANT", "CLIENT")
                        .requestMatchers(HttpMethod.GET, "/role-requests/mine").authenticated()
                        .requestMatchers(HttpMethod.GET, "/role-requests/pending").hasAnyRole("ADMIN", "PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.PATCH, "/role-requests/*/approve", "/role-requests/*/reject")
                            .hasAnyRole("ADMIN", "PROJECT_MANAGER")
                        .requestMatchers(HttpMethod.GET, "/role-requests/*").authenticated()

                        // ---- /invoices (Billing & Invoicing) ----
                        // Read: ADMIN/ACCOUNTANT/CLIENT (same roles as the /invoice page).
                        // Write: ADMIN/ACCOUNTANT only. Like /projects, this is role-level:
                        // a CLIENT can read every invoice, not just their own, because there
                        // is no invoice -> client-user link in the data model yet.
                        .requestMatchers(HttpMethod.GET, "/invoices", "/invoices/**")
                            .hasAnyRole("ADMIN", "ACCOUNTANT", "CLIENT")
                        .requestMatchers(HttpMethod.POST, "/invoices", "/invoices/**")
                            .hasAnyRole("ADMIN", "ACCOUNTANT")
                        .requestMatchers(HttpMethod.PUT, "/invoices/**")
                            .hasAnyRole("ADMIN", "ACCOUNTANT")
                        .requestMatchers(HttpMethod.PATCH, "/invoices/**")
                            .hasAnyRole("ADMIN", "ACCOUNTANT")
                        .requestMatchers(HttpMethod.DELETE, "/invoices/**")
                            .hasAnyRole("ADMIN", "ACCOUNTANT")

                        // ---- /finance (Accounts & Finance ledger + budgets) ----
                        .requestMatchers("/finance/**").hasAnyRole("ADMIN", "ACCOUNTANT")

                        // ---- /company-settings (invoice header details, defaults) ----
                        .requestMatchers(HttpMethod.GET, "/company-settings")
                            .hasAnyRole("ADMIN", "ACCOUNTANT", "CLIENT")
                        .requestMatchers(HttpMethod.PUT, "/company-settings")
                            .hasAnyRole("ADMIN", "ACCOUNTANT")

                        // ---- /profile (the caller's own profile; resolved from the JWT) ----
                        .requestMatchers("/profile", "/profile/**").authenticated()

                        // ---- /notifications (Phase 3) ----
                        // Ownership (which notifications a user can see/mark
                        // read) is enforced in NotificationServiceImpl, not
                        // expressible via a path matcher.
                        .requestMatchers("/notifications/**").authenticated()

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Add your deployed frontend origin(s) here in production
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:3000"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
