package com.track.api.controller;

import com.track.api.dto.*;
import com.track.service.AuthService;
import com.track.domain.model.User;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final com.track.domain.repository.UserRepository userRepository;
    private final com.track.domain.repository.CompanyUserRepository companyUserRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req, HttpServletResponse response) {
        User user = authService.registerOwner(
            req.email(), req.password(), req.firstName(), req.lastName(), req.phone(), req.companyName()
        );
        String token = authService.login(req.email(), req.password());
        addTokenCookie(response, token);
        var memberships = companyUserRepository.findActiveByUserId(user.getId());
        return ResponseEntity.ok(Map.of(
            "user", UserResponse.from(user),
            "memberships", memberships.stream().map(cu -> Map.of(
                "companyId", cu.getCompany().getId(),
                "companyName", cu.getCompany().getName(),
                "role", cu.getRole().name()
            )).toList()
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req, HttpServletResponse response) {
        String token = authService.login(req.email(), req.password());
        addTokenCookie(response, token);
        User user = userRepository.findByEmail(req.email().toLowerCase()).orElseThrow();
        var memberships = companyUserRepository.findActiveByUserId(user.getId());
        return ResponseEntity.ok(Map.of(
            "user", UserResponse.from(user),
            "memberships", memberships.stream().map(cu -> Map.of(
                "companyId", cu.getCompany().getId(),
                "companyName", cu.getCompany().getName(),
                "role", cu.getRole().name()
            )).toList()
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        clearTokenCookie(response);
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails principal) {
        UUID userId = UUID.fromString(principal.getUsername());
        User user = userRepository.findById(userId).orElseThrow();
        var memberships = companyUserRepository.findActiveByUserId(userId);
        return ResponseEntity.ok(Map.of(
            "user", UserResponse.from(user),
            "memberships", memberships.stream().map(cu -> Map.of(
                "companyId", cu.getCompany().getId(),
                "companyName", cu.getCompany().getName(),
                "role", cu.getRole().name()
            )).toList()
        ));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(Map.of("message", "Email verified"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
        return ResponseEntity.ok(Map.of("message", "If the email exists, a reset link was sent"));
    }

    @GetMapping("/validate-reset-token")
    public ResponseEntity<?> validateResetToken(@RequestParam String token) {
        boolean valid = authService.validateResetToken(token);
        return ResponseEntity.ok(Map.of("valid", valid));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req.token(), req.password());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    private void addTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("token", token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(86400);
        response.addCookie(cookie);
    }

    private void clearTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("token", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
