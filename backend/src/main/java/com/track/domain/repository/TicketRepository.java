package com.track.domain.repository;

import com.track.domain.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
    List<Ticket> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    List<Ticket> findBySprintIdOrderByCreatedAtDesc(UUID sprintId);

    @Query("SELECT t FROM Ticket t WHERE t.company.id = :companyId AND t.sprint IS NULL ORDER BY t.createdAt DESC")
    List<Ticket> findBacklogByCompanyId(@Param("companyId") UUID companyId);

    List<Ticket> findByCompanyIdAndStatusOrderByCreatedAtDesc(UUID companyId, String status);

    @Query("SELECT COALESCE(MAX(t.ticketNumber), 0) FROM Ticket t WHERE t.company.id = :companyId")
    int findMaxTicketNumberByCompanyId(@Param("companyId") UUID companyId);
}
