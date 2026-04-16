package com.track.service;

import com.track.domain.model.CompanyUser;
import com.track.domain.model.CompanyUserDevRole;
import com.track.domain.repository.CompanyUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final CompanyUserRepository companyUserRepository;

    @Transactional(readOnly = true)
    public List<CompanyUser> getTeam(UUID companyId) {
        return companyUserRepository.findByCompanyId(companyId);
    }

    @Transactional
    public void deactivateMember(UUID companyId, UUID userId) {
        CompanyUser cu = companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        if (cu.getRole() == CompanyUser.CompanyRole.OWNER) {
            throw new IllegalArgumentException("Cannot remove the owner");
        }
        cu.setActive(false);
        companyUserRepository.save(cu);
    }

    @Transactional
    public void activateMember(UUID companyId, UUID userId) {
        CompanyUser cu = companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));
        cu.setActive(true);
        companyUserRepository.save(cu);
    }

    @Transactional
    public void updateDevRoles(UUID companyId, UUID userId, List<String> devRoleNames) {
        CompanyUser cu = companyUserRepository.findByCompanyIdAndUserId(companyId, userId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        cu.getDevRoles().clear();
        companyUserRepository.save(cu);

        for (String roleName : devRoleNames) {
            CompanyUserDevRole devRole = CompanyUserDevRole.builder()
                .companyUser(cu)
                .devRole(CompanyUserDevRole.DevRole.valueOf(roleName.toUpperCase()))
                .build();
            cu.getDevRoles().add(devRole);
        }
        companyUserRepository.save(cu);
    }
}
