package com.track.service;

import com.track.domain.model.Company;
import com.track.domain.model.CompanyUser;
import com.track.domain.model.User;
import com.track.domain.repository.CompanyRepository;
import com.track.domain.repository.CompanyUserRepository;
import com.track.domain.repository.UserRepository;
import com.track.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final PlanService planService;

    @Transactional
    public User registerOwner(String email, String password, String firstName, String lastName,
                              String phone, String companyName) {
        String normalizedEmail = email.toLowerCase().strip();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
            .email(normalizedEmail)
            .passwordHash(passwordEncoder.encode(password))
            .firstName(firstName.strip())
            .lastName(lastName != null ? lastName.strip() : null)
            .phone(phone != null ? phone.strip() : null)
            .emailVerified(false)
            .emailVerificationToken(verificationToken)
            .emailVerificationSentAt(Instant.now())
            .build();
        user = userRepository.save(user);

        Company company = Company.builder()
            .name(companyName.strip())
            .ticketPrefix(derivePrefix(companyName.strip()))
            .build();
        company = companyRepository.save(company);

        CompanyUser companyUser = CompanyUser.builder()
            .company(company)
            .user(user)
            .role(CompanyUser.CompanyRole.OWNER)
            .build();
        companyUserRepository.save(companyUser);

        planService.assignFreePlan(company.getId());

        emailService.sendVerificationEmail(normalizedEmail, verificationToken);
        return user;
    }

    private String derivePrefix(String name) {
        String letters = name.replaceAll("[^A-Za-z]", "");
        if (letters.isEmpty()) return "TKT";
        return letters.substring(0, Math.min(3, letters.length())).toUpperCase();
    }

    @Transactional(readOnly = true)
    public String login(String email, String password) {
        User user = userRepository.findByEmail(email.toLowerCase().strip())
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isActive()) {
            throw new BadCredentialsException("Account is blocked");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        return jwtService.generateToken(user.getId().toString(), user.getEmail());
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));
        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(String email) {
        userRepository.findByEmail(email.toLowerCase().strip()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setPasswordResetToken(token);
            user.setPasswordResetSentAt(Instant.now());
            userRepository.save(user);
            emailService.sendPasswordResetEmail(user.getEmail(), token);
        });
    }

    @Transactional(readOnly = true)
    public boolean validateResetToken(String token) {
        return userRepository.findByPasswordResetToken(token)
            .map(u -> u.getPasswordResetSentAt() != null &&
                u.getPasswordResetSentAt().isAfter(Instant.now().minusSeconds(3600)))
            .orElse(false);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByPasswordResetToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        if (user.getPasswordResetSentAt() == null ||
            user.getPasswordResetSentAt().isBefore(Instant.now().minusSeconds(3600))) {
            throw new IllegalArgumentException("Token expired");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordResetToken(null);
        user.setPasswordResetSentAt(null);
        userRepository.save(user);
    }
}
