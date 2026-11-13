package com.Tirth_Electrical_Main.MainBackend.config;

import com.Tirth_Electrical_Main.MainBackend.exception.ErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Moved in from the landing/auth project. Adapted to return the same
 * ErrorResponse shape used by GlobalExceptionHandler elsewhere in the app,
 * instead of the landing project's separate ApiError DTO, so every 4xx/5xx
 * response from this API has one consistent shape.
 */
@Component
public class CustomAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);

        ErrorResponse error = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message("Please log in to continue.")
                .path(request.getRequestURI())
                .build();

        response.getWriter().write(mapper.writeValueAsString(error));
    }
}
