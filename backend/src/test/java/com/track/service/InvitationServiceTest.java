package com.track.service;

import com.track.domain.model.*;
import com.track.domain.repository.*;
import com.track.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvitationServiceTest {

    @Mock private InvitationRepository invitationRepository;
    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private CompanyUserRepository companyUserRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private EmailService emailService;

    @InjectMocks private InvitationService invitationService;

    private UUID companyId;
    private UUID invitedById;
    private Company company;
    private User invitedBy;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        invitedById = UUID.randomUUID();

        company = new Company();
        company.setId(companyId);
        company.setName("ACME Corp");

        invitedBy = new User();
        invitedBy.setId(invitedById);
    }

    // ── invite ────────────────────────────────────────────────────────────────

    @Test
    void invite_companyNotFound_throwsException() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            invitationService.invite(companyId, invitedById, "new@example.com", CompanyUser.CompanyRole.DEVELOPER))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Company not found");
    }

    @Test
    void invite_userNotFound_throwsException() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(invitedById)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            invitationService.invite(companyId, invitedById, "new@example.com", CompanyUser.CompanyRole.DEVELOPER))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User not found");
    }

    @Test
    void invite_duplicateInvitation_throwsException() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(invitedById)).thenReturn(Optional.of(invitedBy));
        when(invitationRepository.existsByEmailAndCompanyIdAndUsedFalse("new@example.com", companyId))
            .thenReturn(true);

        assertThatThrownBy(() ->
            invitationService.invite(companyId, invitedById, "new@example.com", CompanyUser.CompanyRole.DEVELOPER))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invitation already sent to this email");
    }

    @Test
    void invite_valid_savesInvitationAndSendsEmail() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(invitedById)).thenReturn(Optional.of(invitedBy));
        when(invitationRepository.existsByEmailAndCompanyIdAndUsedFalse(any(), any())).thenReturn(false);
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        invitationService.invite(companyId, invitedById, "new@example.com", CompanyUser.CompanyRole.MANAGER);

        ArgumentCaptor<Invitation> captor = ArgumentCaptor.forClass(Invitation.class);
        verify(invitationRepository).save(captor.capture());
        Invitation saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("new@example.com");
        assertThat(saved.getRole()).isEqualTo(CompanyUser.CompanyRole.MANAGER);
        assertThat(saved.getToken()).isNotNull();
        assertThat(saved.getExpiresAt()).isAfter(Instant.now());

        verify(emailService).sendInvitationEmail(eq("new@example.com"), eq("ACME Corp"), eq("MANAGER"), anyString());
    }

    @Test
    void invite_normalizesEmailToLowercase() {
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(userRepository.findById(invitedById)).thenReturn(Optional.of(invitedBy));
        when(invitationRepository.existsByEmailAndCompanyIdAndUsedFalse(any(), any())).thenReturn(false);
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        invitationService.invite(companyId, invitedById, "UPPER@EXAMPLE.COM", CompanyUser.CompanyRole.DEVELOPER);

        ArgumentCaptor<Invitation> captor = ArgumentCaptor.forClass(Invitation.class);
        verify(invitationRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("upper@example.com");
    }

    // ── validateToken ─────────────────────────────────────────────────────────

    @Test
    void validateToken_tokenNotFound_throwsException() {
        when(invitationRepository.findByToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> invitationService.validateToken("bad"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid invitation token");
    }

    @Test
    void validateToken_alreadyUsed_throwsException() {
        Invitation inv = buildInvitation(false, Instant.now().plusSeconds(3600));
        inv.setUsed(true);
        when(invitationRepository.findByToken("used_token")).thenReturn(Optional.of(inv));

        assertThatThrownBy(() -> invitationService.validateToken("used_token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invitation already used");
    }

    @Test
    void validateToken_expired_throwsException() {
        Invitation inv = buildInvitation(false, Instant.now().minusSeconds(1));
        when(invitationRepository.findByToken("expired")).thenReturn(Optional.of(inv));

        assertThatThrownBy(() -> invitationService.validateToken("expired"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invitation expired");
    }

    @Test
    void validateToken_valid_returnsInvitation() {
        Invitation inv = buildInvitation(false, Instant.now().plusSeconds(3600));
        when(invitationRepository.findByToken("valid")).thenReturn(Optional.of(inv));

        Invitation result = invitationService.validateToken("valid");

        assertThat(result).isSameAs(inv);
    }

    // ── accept ────────────────────────────────────────────────────────────────

    @Test
    void accept_newUser_createsUserAndAddsToCompany() {
        Invitation inv = buildInvitation(false, Instant.now().plusSeconds(3600));
        inv.setEmail("newbie@example.com");
        inv.setRole(CompanyUser.CompanyRole.DEVELOPER);
        inv.setCompany(company);
        inv.setInvitedBy(invitedBy);
        when(invitationRepository.findByToken("valid")).thenReturn(Optional.of(inv));

        when(userRepository.existsByEmail("newbie@example.com")).thenReturn(false);
        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        savedUser.setEmail("newbie@example.com");
        when(userRepository.save(any())).thenReturn(savedUser);
        when(passwordEncoder.encode("pass")).thenReturn("hashed");
        when(companyUserRepository.existsByCompanyIdAndUserId(companyId, savedUser.getId())).thenReturn(false);
        when(companyUserRepository.save(any())).thenReturn(new CompanyUser());
        when(invitationRepository.save(any())).thenReturn(inv);
        when(jwtService.generateToken(any(), any())).thenReturn("jwt");

        String token = invitationService.accept("valid", "Alice", "Smith", "pass");

        assertThat(token).isEqualTo("jwt");
        verify(userRepository).save(any(User.class));
        verify(companyUserRepository).save(any(CompanyUser.class));
        assertThat(inv.isUsed()).isTrue();
    }

    @Test
    void accept_existingUser_doesNotCreateNewUser() {
        Invitation inv = buildInvitation(false, Instant.now().plusSeconds(3600));
        inv.setEmail("existing@example.com");
        inv.setRole(CompanyUser.CompanyRole.MANAGER);
        inv.setCompany(company);
        inv.setInvitedBy(invitedBy);
        when(invitationRepository.findByToken("valid")).thenReturn(Optional.of(inv));

        User existingUser = new User();
        existingUser.setId(UUID.randomUUID());
        existingUser.setEmail("existing@example.com");
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);
        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(existingUser));
        when(companyUserRepository.existsByCompanyIdAndUserId(companyId, existingUser.getId())).thenReturn(true);
        when(invitationRepository.save(any())).thenReturn(inv);
        when(jwtService.generateToken(any(), any())).thenReturn("jwt");

        invitationService.accept("valid", "Alice", "Smith", "pass");

        verify(userRepository, never()).save(any(User.class));
        verify(companyUserRepository, never()).save(any(CompanyUser.class));
    }

    @Test
    void accept_newUserEmailVerifiedByDefault() {
        Invitation inv = buildInvitation(false, Instant.now().plusSeconds(3600));
        inv.setEmail("new@example.com");
        inv.setRole(CompanyUser.CompanyRole.DEVELOPER);
        inv.setCompany(company);
        inv.setInvitedBy(invitedBy);
        when(invitationRepository.findByToken("valid")).thenReturn(Optional.of(inv));
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any())).thenAnswer(call -> {
            User u = call.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(passwordEncoder.encode(any())).thenReturn("hashed");
        when(companyUserRepository.existsByCompanyIdAndUserId(any(), any())).thenReturn(false);
        when(companyUserRepository.save(any())).thenReturn(new CompanyUser());
        when(invitationRepository.save(any())).thenReturn(inv);
        when(jwtService.generateToken(any(), any())).thenReturn("jwt");

        invitationService.accept("valid", "Alice", "Smith", "pass");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().isEmailVerified()).isTrue();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private Invitation buildInvitation(boolean used, Instant expiresAt) {
        Invitation inv = new Invitation();
        inv.setUsed(used);
        inv.setExpiresAt(expiresAt);
        return inv;
    }
}
