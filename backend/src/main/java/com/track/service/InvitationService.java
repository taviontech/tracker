package com.track.service;

import com.track.domain.model.*;
import com.track.domain.repository.*;
import com.track.infrastructure.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private static final long INVITATION_TTL_DAYS = 7;

    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CompanyUserRepository companyUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Transactional
    public void invite(UUID companyId, UUID invitedByUserId, String email, CompanyUser.CompanyRole role) {
        Company company = companyRepository.findById(companyId)
            .orElseThrow(() -> new IllegalArgumentException("Company not found"));

        User invitedBy = userRepository.findById(invitedByUserId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (invitationRepository.existsByEmailAndCompanyIdAndUsedFalse(email, companyId)) {
            throw new IllegalArgumentException("Invitation already sent to this email");
        }

        String token = UUID.randomUUID().toString();
        Invitation invitation = Invitation.builder()
            .company(company)
            .invitedBy(invitedBy)
            .email(email.toLowerCase().strip())
            .role(role)
            .token(token)
            .expiresAt(Instant.now().plusSeconds(INVITATION_TTL_DAYS * 86400))
            .build();
        invitationRepository.save(invitation);

        emailService.sendInvitationEmail(email, company.getName(), role.name(), token);
    }

    @Transactional(readOnly = true)
    public Invitation validateToken(String token) {
        Invitation inv = invitationRepository.findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));
        if (inv.isUsed()) throw new IllegalArgumentException("Invitation already used");
        if (inv.getExpiresAt().isBefore(Instant.now())) throw new IllegalArgumentException("Invitation expired");
        return inv;
    }

    @Transactional
    public String accept(String token, String firstName, String lastName, String password) {
        Invitation inv = validateToken(token);

        String email = inv.getEmail();
        User user;

        if (userRepository.existsByEmail(email)) {
            user = userRepository.findByEmail(email).orElseThrow();
        } else {
            user = User.builder()
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .firstName(firstName.strip())
                .lastName(lastName.strip())
                .emailVerified(true)
                .build();
            user = userRepository.save(user);
        }

        if (!companyUserRepository.existsByCompanyIdAndUserId(inv.getCompany().getId(), user.getId())) {
            CompanyUser cu = CompanyUser.builder()
                .company(inv.getCompany())
                .user(user)
                .role(inv.getRole())
                .invitedBy(inv.getInvitedBy())
                .build();
            companyUserRepository.save(cu);
        }

        inv.setUsed(true);
        invitationRepository.save(inv);

        return jwtService.generateToken(user.getId().toString(), user.getEmail());
    }
}
