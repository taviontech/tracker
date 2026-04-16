package com.track.domain.repository;

import com.track.domain.model.Invitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvitationRepository extends JpaRepository<Invitation, UUID> {
    Optional<Invitation> findByToken(String token);
    boolean existsByEmailAndCompanyIdAndUsedFalse(String email, UUID companyId);
    List<Invitation> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
}
