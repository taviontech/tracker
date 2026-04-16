package com.track.domain.repository;

import com.track.domain.model.CompanyUserDevRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CompanyUserDevRoleRepository extends JpaRepository<CompanyUserDevRole, UUID> {
    List<CompanyUserDevRole> findByCompanyUserId(UUID companyUserId);
    void deleteByCompanyUserIdAndDevRole(UUID companyUserId, CompanyUserDevRole.DevRole devRole);
}
