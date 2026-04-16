package com.track.domain.repository;

import com.track.domain.model.CompanyUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompanyUserRepository extends JpaRepository<CompanyUser, UUID> {
    @Query("SELECT cu FROM CompanyUser cu JOIN FETCH cu.user WHERE cu.company.id = :companyId")
    List<CompanyUser> findByCompanyId(UUID companyId);
    List<CompanyUser> findByUserId(UUID userId);
    Optional<CompanyUser> findByCompanyIdAndUserId(UUID companyId, UUID userId);
    boolean existsByCompanyIdAndUserId(UUID companyId, UUID userId);

    @Query("SELECT cu FROM CompanyUser cu JOIN FETCH cu.user WHERE cu.company.id = :companyId AND cu.role = :role AND cu.active = true")
    List<CompanyUser> findActiveByCompanyIdAndRole(UUID companyId, CompanyUser.CompanyRole role);

    @Query("SELECT cu FROM CompanyUser cu JOIN FETCH cu.company WHERE cu.user.id = :userId AND cu.active = true")
    List<CompanyUser> findActiveByUserId(UUID userId);
}
