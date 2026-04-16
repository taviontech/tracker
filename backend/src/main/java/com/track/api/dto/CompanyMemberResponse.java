package com.track.api.dto;

import com.track.domain.model.CompanyUser;
import com.track.domain.model.CompanyUserDevRole;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CompanyMemberResponse(
    UUID userId,
    String email,
    String firstName,
    String lastName,
    String avatarUrl,
    String role,
    List<String> devRoles,
    boolean active,
    Instant joinedAt,
    String invitedByEmail,
    String invitedByFirstName,
    String invitedByLastName
) {
    public static CompanyMemberResponse from(CompanyUser cu) {
        String invitedByEmail = null;
        String invitedByFirst = null;
        String invitedByLast = null;
        try {
            if (cu.getInvitedBy() != null) {
                invitedByEmail = cu.getInvitedBy().getEmail();
                invitedByFirst = cu.getInvitedBy().getFirstName();
                invitedByLast = cu.getInvitedBy().getLastName();
            }
        } catch (Exception ignored) {}

        List<String> devRoles = cu.getDevRoles().stream()
            .map(dr -> dr.getDevRole().name())
            .toList();

        return new CompanyMemberResponse(
            cu.getUser().getId(),
            cu.getUser().getEmail(),
            cu.getUser().getFirstName(),
            cu.getUser().getLastName(),
            cu.getUser().getAvatarUrl(),
            cu.getRole().name(),
            devRoles,
            cu.isActive(),
            cu.getJoinedAt(),
            invitedByEmail,
            invitedByFirst,
            invitedByLast
        );
    }
}
