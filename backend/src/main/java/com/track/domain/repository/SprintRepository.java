package com.track.domain.repository;

import com.track.domain.model.Sprint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SprintRepository extends JpaRepository<Sprint, UUID> {
    List<Sprint> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    List<Sprint> findByCompanyIdAndStatus(UUID companyId, Sprint.SprintStatus status);
}
