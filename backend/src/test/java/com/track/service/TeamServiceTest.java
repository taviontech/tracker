package com.track.service;

import com.track.domain.model.CompanyUser;
import com.track.domain.repository.CompanyUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceTest {

    @Mock private CompanyUserRepository companyUserRepository;

    @InjectMocks private TeamService teamService;

    private UUID companyId;
    private UUID userId;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();
    }

    // ── getTeam ───────────────────────────────────────────────────────────────

    @Test
    void getTeam_delegatesToRepository() {
        List<CompanyUser> members = List.of(new CompanyUser(), new CompanyUser());
        when(companyUserRepository.findByCompanyId(companyId)).thenReturn(members);

        assertThat(teamService.getTeam(companyId)).isEqualTo(members);
    }

    @Test
    void getTeam_emptyCompany_returnsEmptyList() {
        when(companyUserRepository.findByCompanyId(companyId)).thenReturn(List.of());

        assertThat(teamService.getTeam(companyId)).isEmpty();
    }

    // ── deactivateMember ─────────────────────────────────────────────────────

    @Test
    void deactivateMember_memberNotFound_throwsException() {
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.deactivateMember(companyId, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Member not found");
    }

    @Test
    void deactivateMember_ownerCannotBeDeactivated() {
        CompanyUser cu = new CompanyUser();
        cu.setRole(CompanyUser.CompanyRole.OWNER);
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.of(cu));

        assertThatThrownBy(() -> teamService.deactivateMember(companyId, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Cannot remove the owner");
    }

    @Test
    void deactivateMember_manager_setsActiveToFalse() {
        CompanyUser cu = new CompanyUser();
        cu.setRole(CompanyUser.CompanyRole.MANAGER);
        cu.setActive(true);
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.of(cu));
        when(companyUserRepository.save(any())).thenReturn(cu);

        teamService.deactivateMember(companyId, userId);

        assertThat(cu.isActive()).isFalse();
        verify(companyUserRepository).save(cu);
    }

    @Test
    void deactivateMember_developer_setsActiveToFalse() {
        CompanyUser cu = new CompanyUser();
        cu.setRole(CompanyUser.CompanyRole.DEVELOPER);
        cu.setActive(true);
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.of(cu));
        when(companyUserRepository.save(any())).thenReturn(cu);

        teamService.deactivateMember(companyId, userId);

        assertThat(cu.isActive()).isFalse();
    }

    // ── activateMember ────────────────────────────────────────────────────────

    @Test
    void activateMember_memberNotFound_throwsException() {
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> teamService.activateMember(companyId, userId))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessage("Member not found");
    }

    @Test
    void activateMember_inactiveMember_setsActiveToTrue() {
        CompanyUser cu = new CompanyUser();
        cu.setRole(CompanyUser.CompanyRole.DEVELOPER);
        cu.setActive(false);
        when(companyUserRepository.findByCompanyIdAndUserId(companyId, userId))
            .thenReturn(Optional.of(cu));
        when(companyUserRepository.save(any())).thenReturn(cu);

        teamService.activateMember(companyId, userId);

        assertThat(cu.isActive()).isTrue();
        verify(companyUserRepository).save(cu);
    }
}
