package com.track.domain.repository;

import com.track.domain.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, UUID> {
}
