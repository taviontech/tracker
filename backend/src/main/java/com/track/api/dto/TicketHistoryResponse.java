package com.track.api.dto;

import com.track.domain.model.TicketHistory;
import java.time.Instant;
import java.util.UUID;

public record TicketHistoryResponse(
    UUID id,
    UserSummary user,
    String action,
    String field,
    String oldValue,
    String newValue,
    Instant createdAt
) {
    public record UserSummary(UUID id, String firstName, String lastName, String avatarUrl) {}

    public static TicketHistoryResponse from(TicketHistory h) {
        UserSummary user = h.getUser() == null ? null : new UserSummary(
            h.getUser().getId(),
            h.getUser().getFirstName(),
            h.getUser().getLastName(),
            h.getUser().getAvatarUrl()
        );
        return new TicketHistoryResponse(
            h.getId(), user, h.getAction(), h.getField(), h.getOldValue(), h.getNewValue(), h.getCreatedAt()
        );
    }
}
