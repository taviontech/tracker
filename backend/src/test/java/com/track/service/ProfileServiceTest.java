package com.track.service;

import com.track.domain.model.Company;
import com.track.domain.model.CompanyUser;
import com.track.domain.model.User;
import com.track.domain.repository.CompanyRepository;
import com.track.domain.repository.CompanyUserRepository;
import com.track.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private CompanyUserRepository companyUserRepository;
    @Mock private PasswordEncoder passwordEncoder;

    @InjectMocks private ProfileService profileService;

    private UUID userId;
    private UUID companyId;
    private User user;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        companyId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setFirstName("John");
        user.setLastName("Doe");
        user.setPasswordHash("hashed_pass");
    }

    // ── getProfile ────────────────────────────────────────────────────────────

    @Test
    void getProfile_userNotFound_throwsException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.getProfile(userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User not found");
    }

    @Test
    void getProfile_found_returnsUser() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        User result = profileService.getProfile(userId);

        assertThat(result).isSameAs(user);
    }

    // ── updateProfile ─────────────────────────────────────────────────────────

    @Test
    void updateProfile_updatesNonNullFields() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        profileService.updateProfile(userId, "Alice", "Smith", "+1234", "http://avatar.com/img.png");

        assertThat(user.getFirstName()).isEqualTo("Alice");
        assertThat(user.getLastName()).isEqualTo("Smith");
        assertThat(user.getPhone()).isEqualTo("+1234");
        assertThat(user.getAvatarUrl()).isEqualTo("http://avatar.com/img.png");
    }

    @Test
    void updateProfile_nullFieldsNotOverwritten() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        profileService.updateProfile(userId, null, null, null, null);

        assertThat(user.getFirstName()).isEqualTo("John");
        assertThat(user.getLastName()).isEqualTo("Doe");
    }

    @Test
    void updateProfile_stripsWhitespace() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        profileService.updateProfile(userId, "  Alice  ", "  Smith  ", null, null);

        assertThat(user.getFirstName()).isEqualTo("Alice");
        assertThat(user.getLastName()).isEqualTo("Smith");
    }

    @Test
    void updateProfile_userNotFound_throwsException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.updateProfile(userId, "Alice", null, null, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User not found");
    }

    // ── updateCompanyName ─────────────────────────────────────────────────────

    @Test
    void updateCompanyName_blankName_throwsException() {
        assertThatThrownBy(() -> profileService.updateCompanyName(userId, companyId, "   "))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Company name cannot be blank");
    }

    @Test
    void updateCompanyName_nullName_throwsException() {
        assertThatThrownBy(() -> profileService.updateCompanyName(userId, companyId, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Company name cannot be blank");
    }

    @Test
    void updateCompanyName_notMember_throwsException() {
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.updateCompanyName(userId, companyId, "New Name"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Not a member of this company");
    }

    @Test
    void updateCompanyName_notOwner_throwsException() {
        CompanyUser cu = new CompanyUser();
        cu.setRole(CompanyUser.CompanyRole.MANAGER);
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.of(cu));

        assertThatThrownBy(() -> profileService.updateCompanyName(userId, companyId, "New Name"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Only OWNER can rename the company");
    }

    @Test
    void updateCompanyName_owner_updatesName() {
        CompanyUser cu = new CompanyUser();
        cu.setRole(CompanyUser.CompanyRole.OWNER);
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.of(cu));

        Company company = new Company();
        company.setId(companyId);
        company.setName("Old Name");
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(company));
        when(companyRepository.save(any())).thenReturn(company);

        profileService.updateCompanyName(userId, companyId, "  New Name  ");

        assertThat(company.getName()).isEqualTo("New Name");
        verify(companyRepository).save(company);
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    void changePassword_userNotFound_throwsException() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> profileService.changePassword(userId, "old", "new"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("User not found");
    }

    @Test
    void changePassword_wrongCurrentPassword_throwsException() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong_pass", "hashed_pass")).thenReturn(false);

        assertThatThrownBy(() -> profileService.changePassword(userId, "wrong_pass", "new_pass"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Current password is incorrect");
    }

    @Test
    void changePassword_correctCurrentPassword_updatesHash() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct_pass", "hashed_pass")).thenReturn(true);
        when(passwordEncoder.encode("new_pass")).thenReturn("new_hashed");
        when(userRepository.save(any())).thenReturn(user);

        profileService.changePassword(userId, "correct_pass", "new_pass");

        assertThat(user.getPasswordHash()).isEqualTo("new_hashed");
        verify(userRepository).save(user);
    }
}
