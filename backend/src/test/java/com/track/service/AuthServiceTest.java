package com.track.service;

import com.track.domain.model.Company;
import com.track.domain.model.CompanyUser;
import com.track.domain.model.User;
import com.track.domain.repository.CompanyRepository;
import com.track.domain.repository.CompanyUserRepository;
import com.track.domain.repository.UserRepository;
import com.track.infrastructure.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private CompanyUserRepository companyUserRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtService jwtService;
    @Mock private EmailService emailService;
    @Mock private PlanService planService;

    @InjectMocks private AuthService authService;

    private UUID userId;
    private User activeUser;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        activeUser = new User();
        activeUser.setId(userId);
        activeUser.setEmail("test@example.com");
        activeUser.setPasswordHash("hashed_password");
        activeUser.setActive(true);
        activeUser.setFirstName("John");
    }

    // ── registerOwner ─────────────────────────────────────────────────────────

    @Test
    void registerOwner_emailAlreadyExists_throwsException() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThatThrownBy(() ->
            authService.registerOwner("test@example.com", "pass", "John", "Doe", null, "ACME"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Email already registered");
    }

    @Test
    void registerOwner_normalizeEmailToLowercase() {
        when(userRepository.existsByEmail("upper@example.com")).thenReturn(false);
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        Company company = new Company();
        company.setId(UUID.randomUUID());
        when(companyRepository.save(any())).thenReturn(company);
        when(companyUserRepository.save(any())).thenReturn(new CompanyUser());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        authService.registerOwner("UPPER@EXAMPLE.COM", "pass", "John", "Doe", null, "ACME");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getEmail()).isEqualTo("upper@example.com");
    }

    @Test
    void registerOwner_createsCompanyWithOwnerRole() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any())).thenReturn(savedUser);
        Company savedCompany = new Company();
        savedCompany.setId(UUID.randomUUID());
        when(companyRepository.save(any())).thenReturn(savedCompany);
        when(companyUserRepository.save(any())).thenReturn(new CompanyUser());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        authService.registerOwner("new@example.com", "pass", "John", null, null, "MyCompany");

        ArgumentCaptor<CompanyUser> cuCaptor = ArgumentCaptor.forClass(CompanyUser.class);
        verify(companyUserRepository).save(cuCaptor.capture());
        assertThat(cuCaptor.getValue().getRole()).isEqualTo(CompanyUser.CompanyRole.OWNER);
    }

    @Test
    void registerOwner_assignsFreePlanAndSendsVerificationEmail() {
        when(userRepository.existsByEmail(any())).thenReturn(false);
        User savedUser = new User();
        savedUser.setId(UUID.randomUUID());
        when(userRepository.save(any())).thenReturn(savedUser);
        Company savedCompany = new Company();
        UUID companyId = UUID.randomUUID();
        savedCompany.setId(companyId);
        when(companyRepository.save(any())).thenReturn(savedCompany);
        when(companyUserRepository.save(any())).thenReturn(new CompanyUser());
        when(passwordEncoder.encode(any())).thenReturn("hashed");

        authService.registerOwner("new@example.com", "pass", "John", null, null, "ACME");

        verify(planService).assignFreePlan(companyId);
        verify(emailService).sendVerificationEmail(eq("new@example.com"), anyString());
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_userNotFound_throwsBadCredentials() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("notfound@example.com", "pass"))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Invalid credentials");
    }

    @Test
    void login_blockedUser_throwsBadCredentials() {
        activeUser.setActive(false);
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.login("test@example.com", "pass"))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Account is blocked");
    }

    @Test
    void login_wrongPassword_throwsBadCredentials() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrong_pass", "hashed_password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login("test@example.com", "wrong_pass"))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Invalid credentials");
    }

    @Test
    void login_validCredentials_returnsToken() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct_pass", "hashed_password")).thenReturn(true);
        when(jwtService.generateToken(userId.toString(), "test@example.com")).thenReturn("jwt_token");

        String token = authService.login("test@example.com", "correct_pass");

        assertThat(token).isEqualTo("jwt_token");
    }

    @Test
    void login_normalizesEmailBeforeLookup() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);
        when(jwtService.generateToken(any(), any())).thenReturn("token");

        authService.login("  TEST@EXAMPLE.COM  ", "pass");

        verify(userRepository).findByEmail("test@example.com");
    }

    // ── verifyEmail ───────────────────────────────────────────────────────────

    @Test
    void verifyEmail_invalidToken_throwsException() {
        when(userRepository.findByEmailVerificationToken("bad_token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail("bad_token"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid or expired token");
    }

    @Test
    void verifyEmail_validToken_marksEmailVerifiedAndClearsToken() {
        activeUser.setEmailVerified(false);
        activeUser.setEmailVerificationToken("valid_token");
        when(userRepository.findByEmailVerificationToken("valid_token")).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any())).thenReturn(activeUser);

        authService.verifyEmail("valid_token");

        assertThat(activeUser.isEmailVerified()).isTrue();
        assertThat(activeUser.getEmailVerificationToken()).isNull();
        verify(userRepository).save(activeUser);
    }

    // ── forgotPassword ────────────────────────────────────────────────────────

    @Test
    void forgotPassword_userNotFound_doesNothing() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        assertThatCode(() -> authService.forgotPassword("unknown@example.com"))
            .doesNotThrowAnyException();

        verify(emailService, never()).sendPasswordResetEmail(any(), any());
    }

    @Test
    void forgotPassword_userExists_savesTokenAndSendsEmail() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(activeUser));
        when(userRepository.save(any())).thenReturn(activeUser);

        authService.forgotPassword("test@example.com");

        assertThat(activeUser.getPasswordResetToken()).isNotNull();
        assertThat(activeUser.getPasswordResetSentAt()).isNotNull();
        verify(emailService).sendPasswordResetEmail(eq("test@example.com"), anyString());
    }

    // ── validateResetToken ────────────────────────────────────────────────────

    @Test
    void validateResetToken_tokenNotFound_returnsFalse() {
        when(userRepository.findByPasswordResetToken("nonexistent")).thenReturn(Optional.empty());

        assertThat(authService.validateResetToken("nonexistent")).isFalse();
    }

    @Test
    void validateResetToken_tokenExpired_returnsFalse() {
        activeUser.setPasswordResetToken("old_token");
        activeUser.setPasswordResetSentAt(Instant.now().minusSeconds(7200)); // 2 hours ago
        when(userRepository.findByPasswordResetToken("old_token")).thenReturn(Optional.of(activeUser));

        assertThat(authService.validateResetToken("old_token")).isFalse();
    }

    @Test
    void validateResetToken_recentToken_returnsTrue() {
        activeUser.setPasswordResetToken("fresh_token");
        activeUser.setPasswordResetSentAt(Instant.now().minusSeconds(300)); // 5 minutes ago
        when(userRepository.findByPasswordResetToken("fresh_token")).thenReturn(Optional.of(activeUser));

        assertThat(authService.validateResetToken("fresh_token")).isTrue();
    }

    // ── resetPassword ─────────────────────────────────────────────────────────

    @Test
    void resetPassword_tokenNotFound_throwsException() {
        when(userRepository.findByPasswordResetToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.resetPassword("bad", "new_pass"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Invalid or expired token");
    }

    @Test
    void resetPassword_expiredToken_throwsException() {
        activeUser.setPasswordResetToken("expired");
        activeUser.setPasswordResetSentAt(Instant.now().minusSeconds(7200));
        when(userRepository.findByPasswordResetToken("expired")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authService.resetPassword("expired", "new_pass"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Token expired");
    }

    @Test
    void resetPassword_validToken_updatesPasswordAndClearsToken() {
        activeUser.setPasswordResetToken("valid");
        activeUser.setPasswordResetSentAt(Instant.now().minusSeconds(300));
        when(userRepository.findByPasswordResetToken("valid")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.encode("new_pass")).thenReturn("new_hashed");
        when(userRepository.save(any())).thenReturn(activeUser);

        authService.resetPassword("valid", "new_pass");

        assertThat(activeUser.getPasswordHash()).isEqualTo("new_hashed");
        assertThat(activeUser.getPasswordResetToken()).isNull();
        assertThat(activeUser.getPasswordResetSentAt()).isNull();
    }
}
