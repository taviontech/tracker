package com.track.api.dto;

import com.track.domain.model.User;
import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    String phone,
    String avatarUrl,
    String systemRole,
    boolean active,
    boolean emailVerified,
    Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getPhone(),
            user.getAvatarUrl(),
            user.getSystemRole().name(),
            user.isActive(),
            user.isEmailVerified(),
            user.getCreatedAt()
        );
    }
}
